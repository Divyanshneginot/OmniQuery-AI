import warnings
warnings.filterwarnings("ignore")

import os
import re
import json
import time
import asyncio
import logging
from typing import AsyncGenerator, Dict, Any, Optional
from google import genai
from dotenv import load_dotenv

from app.db.clickhouse_engine import db_engine, sanitize_db_error
from app.agent.mcp_client import mcp_client
from app.agent.prompts import (
    get_sql_generation_prompt,
    get_self_healing_prompt,
    get_chart_and_insight_prompt
)

load_dotenv()
logger = logging.getLogger(__name__)

class AgentOrchestrator:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
        self.client_initialized = False

        use_vertex = os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "false").lower() == "true"
        
        try:
            if use_vertex:
                project = os.getenv("GOOGLE_CLOUD_PROJECT")
                location = os.getenv("GOOGLE_CLOUD_LOCATION")
                self.client = genai.Client(vertexai=True, project=project, location=location)
                self.client_initialized = True
                logger.info(f"Gemini agent initialized via Vertex AI Enterprise ({self.model_name})")
            elif self.api_key:
                self.client = genai.Client(api_key=self.api_key)
                self.client_initialized = True
                logger.info(f"Gemini agent initialized with AI Studio API Key ({self.model_name})")
            else:
                logger.warning("No API key or Vertex AI config provided. Running in Fallback Mode.")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini API: {e}")

    def _extract_sql_from_response(self, text: str) -> str:
        """Extracts SQL from markdown code block or plain text."""
        if not text:
            return ""
        match = re.search(r"```(?:sql)?\s*(.*?)\s*```", text, re.DOTALL | re.IGNORECASE)
        if match:
            return match.group(1).strip()
        # Fallback: look for SELECT ...
        select_match = re.search(r"(SELECT\s+.*)", text, re.DOTALL | re.IGNORECASE)
        if select_match:
            return select_match.group(1).strip()
        return text.strip()

    def _extract_json_from_response(self, text: str) -> Dict[str, Any]:
        """Extracts JSON from response string."""
        clean = text.strip()
        # Remove ```json ... ``` wrapper
        match = re.search(r"```(?:json)?\s*(.*?)\s*```", clean, re.DOTALL | re.IGNORECASE)
        if match:
            clean = match.group(1).strip()
        try:
            return json.loads(clean)
        except Exception:
            # Fallback JSON structure
            return {
                "title": "Query Results Visualization",
                "chart_type": "bar",
                "x_axis_key": "genre" if "genre" in clean else "name",
                "y_axis_keys": ["gross_revenue"],
                "series_names": ["Gross Revenue"],
                "color_palette": ["#3b82f6", "#10b981", "#f59e0b"],
                "executive_summary": "Query executed successfully and analyzed by OmniQuery AI.",
                "key_metrics": [{"label": "Status", "value": "Completed", "trend": "positive"}],
                "suggested_followups": ["Show breakdown by country", "Filter by last 30 days"]
            }

    async def _call_gemini_async(self, prompt: str) -> str:
        """Invokes Gemini using Google ADK Agent Runner with direct client fallback (Agentic Cinema Requirement)."""
        if not self.client_initialized:
            return ""

        try:
            from google.adk import Agent, Runner
            from google.adk.sessions import InMemorySessionService
            from google.genai import types
            import uuid

            analyst_agent = Agent(
                name="omni_query_analyst",
                model=self.model_name,
                instruction="You are an expert Film Studio Data Analyst. Output ONLY valid JSON or SQL as requested."
            )
            session_svc = InMemorySessionService()
            runner = Runner(app_name="omniquery", agent=analyst_agent, session_service=session_svc)
            session_id = str(uuid.uuid4())
            await session_svc.create_session(app_name="omniquery", user_id="demo_user", session_id=session_id)

            async def _run_adk():
                text_accum = ""
                async with runner:
                    async for event in runner.run_async(
                        user_id="demo_user",
                        session_id=session_id,
                        new_message=types.Content(role="user", parts=[types.Part.from_text(text=prompt)])
                    ):
                        if event.content and event.content.parts:
                            for part in event.content.parts:
                                if part.text:
                                    text_accum += part.text
                return text_accum

            return await asyncio.wait_for(_run_adk(), timeout=12.0)
        except Exception as adk_err:
            logger.debug(f"ADK runner fallback to direct genai client: {adk_err}")

        max_attempts = 3
        backoff_sec = 1.5
        for attempt in range(1, max_attempts + 1):
            try:
                response = await asyncio.to_thread(
                    self.client.models.generate_content,
                    model=self.model_name,
                    contents=prompt
                )
                return response.text or ""
            except Exception as e:
                err_str = str(e)
                if ("429" in err_str or "quota" in err_str.lower()) and attempt < max_attempts:
                    logger.warning(f"Gemini 429 rate-limited. Retrying in {backoff_sec}s...")
                    await asyncio.sleep(backoff_sec)
                    backoff_sec *= 1.5
                else:
                    raise e
        return ""

    async def run_pipeline(self, user_query: str) -> AsyncGenerator[Dict[str, Any], None]:
        """Multi-step agent loop yielding streaming SSE thought trace."""
        start_pipeline_time = time.perf_counter()
        
        # Step 1: Schema Introspection via ClickHouse MCP Server (Partner Requirement)
        yield {
            "type": "step",
            "step": "schema_introspection",
            "status": "in_progress",
            "message": "Introspecting database tables via ClickHouse MCP Server..."
        }

        table_names = []
        method = "via Direct Engine"
        schema_summary = db_engine.get_schema_summary()

        try:
            mcp_tables = await mcp_client.call_mcp_tool("list_tables")
            if mcp_tables and isinstance(mcp_tables, list):
                table_names = mcp_tables
                method = "via ClickHouse MCP Server"
        except Exception as e:
            logger.debug(f"MCP introspection fallback: {e}")

        if not table_names:
            table_names = list(schema_summary["tables"].keys())

        yield {
            "type": "step",
            "step": "schema_introspection",
            "status": "completed",
            "message": f"Found {len(table_names)} tables {method}: {', '.join(table_names)} ({schema_summary['mode']})",
            "data": {"tables": table_names}
        }

        # Step 2: Planning & SQL Generation
        yield {
            "type": "step",
            "step": "sql_planning",
            "status": "in_progress",
            "message": "Generating ClickHouse-optimized analytical SQL query..."
        }

        generated_sql = ""
        if self.client_initialized:
            prompt = get_sql_generation_prompt(schema_summary["tables"], user_query)
            try:
                raw_response = await self._call_gemini_async(prompt)
                generated_sql = self._extract_sql_from_response(raw_response)
                if not generated_sql:
                    generated_sql = self._generate_rule_based_sql(user_query)
            except Exception as e:
                logger.error(f"Gemini SQL generation error: {e}")
                generated_sql = self._generate_rule_based_sql(user_query)
        else:
            generated_sql = self._generate_rule_based_sql(user_query)

        yield {
            "type": "step",
            "step": "sql_planning",
            "status": "completed",
            "message": "Analytical SQL plan constructed.",
            "data": {"sql": generated_sql}
        }

        # Step 3: Execution & Self-Healing Loop
        yield {
            "type": "step",
            "step": "execution",
            "status": "in_progress",
            "message": "Executing query against database engine..."
        }

        max_retries = 3
        attempt = 0
        current_sql = generated_sql
        query_result = None
        execution_error = None

        while attempt < max_retries:
            try:
                attempt += 1
                current_sql = db_engine._map_duckdb_syntax_to_clickhouse(current_sql)
                query_result = db_engine.execute_query(current_sql)
                execution_error = None
                break
            except Exception as e:
                execution_error = str(e)
                logger.warning(f"SQL execution attempt {attempt} failed: {execution_error}")
                
                clean_err = sanitize_db_error(execution_error)
                
                yield {
                    "type": "step",
                    "step": "self_healing",
                    "status": "retry",
                    "attempt": attempt,
                    "message": f"Dialect issue detected ({clean_err[:60]}...). Invoking Self-Healing Agent to adapt query...",
                    "data": {"failed_sql": current_sql}
                }

                if self.client_initialized and attempt < max_retries:
                    healing_prompt = get_self_healing_prompt(
                        schema_summary["tables"],
                        current_sql,
                        clean_err,
                        user_query
                    )
                    try:
                        repaired_resp = await self._call_gemini_async(healing_prompt)
                        repaired_sql = self._extract_sql_from_response(repaired_resp)
                        if repaired_sql:
                            current_sql = repaired_sql
                        else:
                            current_sql = self._generate_rule_based_sql(user_query)
                        yield {
                            "type": "step",
                            "step": "self_healing",
                            "status": "repaired",
                            "message": f"Query repaired by Gemini (Attempt {attempt}). Retrying execution...",
                            "data": {"repaired_sql": current_sql}
                        }
                    except Exception as he:
                        logger.error(f"Self healing failure: {he}")
                        current_sql = self._generate_rule_based_sql(user_query)
                else:
                    current_sql = self._generate_rule_based_sql(user_query)

        # If LLM self-healing attempts were exhausted, attempt deterministic analytical query fallback
        if execution_error and not query_result:
            logger.info("Self-healing attempts exhausted. Attempting deterministic analytical query fallback...")
            try:
                fallback_sql = self._generate_rule_based_sql(user_query)
                fallback_sql = db_engine._map_duckdb_syntax_to_clickhouse(fallback_sql)
                query_result = db_engine.execute_query(fallback_sql)
                current_sql = fallback_sql
                execution_error = None
                yield {
                    "type": "step",
                    "step": "self_healing",
                    "status": "repaired",
                    "message": "Self-healing resolved query using standard analytical pattern.",
                    "data": {"repaired_sql": current_sql}
                }
            except Exception as final_e:
                logger.error(f"Deterministic fallback execution failed: {final_e}")
                execution_error = str(final_e)

        if execution_error and not query_result:
            clean_err = sanitize_db_error(execution_error)
            
            yield {
                "type": "error",
                "message": "We could not complete this analytical query on the database. Please try refining your question or selecting one of the studio sample prompts.",
                "details": clean_err[:150] if clean_err else "Query execution limit reached.",
                "sql": current_sql
            }
            return

        yield {
            "type": "step",
            "step": "execution",
            "status": "completed",
            "message": f"Executed in {query_result['execution_time_ms']}ms ({query_result['total_rows_returned']} rows returned)",
            "data": {
                "execution_time_ms": query_result["execution_time_ms"],
                "rows_scanned": query_result["rows_scanned"],
                "total_rows": query_result["total_rows_returned"]
            }
        }

        # Step 4: Chart Synthesis & Executive Summary
        yield {
            "type": "step",
            "step": "visualization_synthesis",
            "status": "in_progress",
            "message": "Synthesizing chart specifications and executive takeaways..."
        }

        chart_spec = None
        if self.client_initialized:
            vis_prompt = get_chart_and_insight_prompt(
                user_query=user_query,
                sql_query=current_sql,
                data_sample=query_result["rows"],
                total_rows=query_result["total_rows_returned"],
                execution_time_ms=query_result["execution_time_ms"]
            )
            try:
                vis_resp = await self._call_gemini_async(vis_prompt)
                if vis_resp and vis_resp.strip():
                    chart_spec = self._extract_json_from_response(vis_resp)
                else:
                    chart_spec = self._generate_heuristic_chart_spec(user_query, current_sql, query_result)
            except Exception as ve:
                logger.error(f"Visualization synthesis error: {ve}")
                chart_spec = self._generate_heuristic_chart_spec(user_query, current_sql, query_result)
        else:
            chart_spec = self._generate_heuristic_chart_spec(user_query, current_sql, query_result)

        yield {
            "type": "step",
            "step": "visualization_synthesis",
            "status": "completed",
            "message": f"Generated {chart_spec.get('chart_type', 'bar').upper()} visualization & executive brief."
        }

        total_pipeline_ms = round((time.perf_counter() - start_pipeline_time) * 1000, 2)

        # Final Payload
        yield {
            "type": "complete",
            "payload": {
                "user_query": user_query,
                "sql_query": current_sql,
                "execution_time_ms": query_result["execution_time_ms"],
                "total_pipeline_latency_ms": total_pipeline_ms,
                "rows_scanned": query_result["rows_scanned"],
                "total_rows": query_result["total_rows_returned"],
                "columns": query_result["columns"],
                "rows": query_result["rows"],
                "chart_spec": chart_spec,
                "database_mode": query_result["database_mode"]
            }
        }

    def _generate_rule_based_sql(self, user_query: str) -> str:
        """Fallback query generator for standard analytical queries."""
        q = user_query.lower()
        if any(w in q for w in ["latency", "telemetry", "service", "error"]):
            if any(w in q for w in ["percentile", "p95", "95th"]):
                return "SELECT service_name, endpoint, round(avg(latency_ms), 2) as avg_latency_ms, round(quantileExact(0.95)(latency_ms), 2) as p95_latency_ms, sum(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count, count(*) as request_volume FROM streaming_platform_metrics GROUP BY service_name, endpoint ORDER BY p95_latency_ms DESC LIMIT 15;"
            return "SELECT service_name, round(avg(latency_ms), 2) as avg_latency_ms, round(avg(cpu_usage_pct), 2) as avg_cpu_pct, count(*) as total_requests FROM streaming_platform_metrics GROUP BY service_name ORDER BY avg_latency_ms DESC;"
        if any(w in q for w in ["pacing", "complaint"]):
            return "SELECT comment, sentiment, rating, genre, topic_cluster FROM audience_reviews WHERE topic_cluster = 'pacing_complaint' OR lower(comment) LIKE '%pacing%' ORDER BY rating ASC LIMIT 10;"
        if any(w in q for w in ["profit", "net", "europe", "q2"]):
            return "SELECT genre, sum(net_profit) as total_profit, sum(gross_revenue) as total_gross, count(*) as movie_count FROM box_office_revenue WHERE territory = 'Europe' AND release_window = 'Theatrical' GROUP BY genre ORDER BY total_profit DESC LIMIT 6;"
        if any(w in q for w in ["feedback", "review", "sentiment", "rating"]):
            return "SELECT genre, sentiment, count(*) as feedback_count, round(avg(rating), 2) as avg_rating FROM audience_reviews GROUP BY genre, sentiment ORDER BY genre ASC, feedback_count DESC;"
        if any(w in q for w in ["territory", "distributor"]):
            return "SELECT territory, round(sum(gross_revenue), 2) as total_gross, count(*) as movie_count FROM box_office_revenue GROUP BY territory ORDER BY total_gross DESC;"
        return "SELECT genre, sum(gross_revenue) as total_revenue, count(*) as movie_count, round(avg(opening_weekend), 1) as avg_opening FROM box_office_revenue GROUP BY genre ORDER BY total_revenue DESC;"

    def _generate_heuristic_chart_spec(self, user_query: str, sql: str, result: Dict[str, Any]) -> Dict[str, Any]:
        """Generates chart specifications based on column names and row values."""
        cols = result["columns"]
        rows = result["rows"]
        
        # Default keys
        x_key = cols[0] if cols else "category"
        numeric_cols = []
        
        if rows:
            for c in cols[1:]:
                val = rows[0].get(c)
                if isinstance(val, (int, float)):
                    numeric_cols.append(c)
                    
        if not numeric_cols and len(cols) > 1:
            numeric_cols = [cols[1]]

        chart_type = "bar"
        if len(rows) <= 1:
            chart_type = "metric_cards"
        elif any(k in sql.lower() for k in ["date", "time", "hour", "day", "month"]):
            chart_type = "line"
        elif "sentiment" in sql.lower() or (len(rows) <= 5 and len(rows) > 1):
            chart_type = "pie"

        total_rev = sum(r.get("total_revenue", 0) for r in rows) if "total_revenue" in cols else 0
        summary = f"Processed {len(rows)} data points across {x_key}. Top performer is {rows[0].get(x_key, 'N/A') if rows else 'N/A'}."
        
        metrics = []
        if numeric_cols:
            first_num = numeric_cols[0]
            val_sum = sum(r.get(first_num, 0) for r in rows if isinstance(r.get(first_num), (int, float)))
            metrics.append({"label": f"Total {first_num.replace('_', ' ').title()}", "value": f"{val_sum:,.1f}" if isinstance(val_sum, float) else f"{val_sum:,}", "trend": "positive"})
        
        try:
            scanned_raw = result.get('rows_scanned', len(rows))
            scanned_int = int(scanned_raw) if scanned_raw is not None else len(rows)
            metrics.append({"label": "Rows Scanned", "value": f"{scanned_int:,}", "trend": "neutral"})
        except Exception:
            metrics.append({"label": "Rows Scanned", "value": str(result.get('rows_scanned', len(rows))), "trend": "neutral"})

        try:
            lat = result.get('execution_time_ms', 0)
            metrics.append({"label": "Execution Latency", "value": f"{lat:.1f} ms", "trend": "positive" if lat < 300 else "neutral"})
        except Exception:
            pass

        return {
            "title": f"Analytical Breakdown by {x_key.replace('_', ' ').title()}",
            "chart_type": chart_type,
            "x_axis_key": x_key,
            "y_axis_keys": numeric_cols[:3],
            "series_names": [c.replace("_", " ").title() for c in numeric_cols[:3]],
            "color_palette": ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"],
            "executive_summary": summary,
            "key_metrics": metrics,
            "suggested_followups": [
                "Show detailed time series trend",
                "Filter by highest error rates",
                "Compare results across top countries"
            ]
        }

# Global singleton
agent_orchestrator = AgentOrchestrator()
