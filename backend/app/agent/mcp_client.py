import os
import json
import asyncio
import logging
from typing import Optional, Any

logger = logging.getLogger(__name__)

try:
    from mcp_clickhouse import list_tables as mcp_list_tables, run_query as mcp_run_query
    MCP_CLICKHOUSE_AVAILABLE = True
except ImportError:
    mcp_list_tables = None
    mcp_run_query = None
    MCP_CLICKHOUSE_AVAILABLE = False


class ClickHouseMCPClient:
    def __init__(self):
        self.database = os.getenv("CLICKHOUSE_DATABASE", "default").strip()
        self.is_available = MCP_CLICKHOUSE_AVAILABLE

    async def call_mcp_tool(self, tool_name: str, parameters: Optional[dict] = None) -> Optional[Any]:
        """Calls official ClickHouse MCP server tools at runtime (Agentic Cinema Partner Requirement)."""
        if not self.is_available:
            return None

        params = parameters or {}
        try:
            if tool_name == "list_tables":
                db = params.get("database") or self.database or "default"
                raw = await asyncio.to_thread(mcp_list_tables, database=db)
                try:
                    parsed = json.loads(raw) if isinstance(raw, str) else raw
                    if isinstance(parsed, dict) and "tables" in parsed:
                        return [t.get("name", str(t)) if isinstance(t, dict) else str(t) for t in parsed["tables"]]
                    return parsed
                except Exception:
                    return [line.strip() for line in str(raw).splitlines() if line.strip()]

            if tool_name == "run_query":
                query_str = params.get("query", "")
                return await asyncio.to_thread(mcp_run_query, query=query_str)
        except Exception as e:
            logger.warning(f"MCP tool call '{tool_name}' failed: {e}")
            return None


mcp_client = ClickHouseMCPClient()
