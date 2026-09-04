import json
from typing import Dict, Any

def get_sql_generation_prompt(schema_info: Dict[str, Any], user_query: str) -> str:
    schema_str = json.dumps(schema_info, indent=2, default=str)
    return f"""You are an elite ClickHouse & SQL Architect for 'OmniQuery AI', an autonomous analytical agent.
Your mission is to translate user natural language questions into precise, high-performance ClickHouse SQL queries.

### DATABASE SCHEMAS AVAILABLE:
{schema_str}

### CLICKHOUSE DIALECT & RULES:
1. Always generate valid ClickHouse SQL.
2. Use proper aggregation functions:
   - For distinct count: `uniqExact(column_name)` or `count(DISTINCT column_name)`.
   - For percentiles: `quantileExact(0.95)(latency_ms)` or `quantile(0.95)(latency_ms)`. NEVER use `quantile_cont` or `percentile_cont` as those are DuckDB/Postgres functions and will throw DB::Exception in ClickHouse.
   - For date intervals: `toStartOfDay(release_date)`, `toStartOfHour(event_time)`, `toStartOfMonth(release_date)`.
   - For string searches: `ILIKE '%keyword%'` or `position(lower(comment), 'keyword') > 0`.
   - For Vector Similarity / Semantic Search on `audience_reviews`: 
     `SELECT comment, sentiment, rating, genre FROM audience_reviews WHERE topic_cluster = 'pacing_complaint' LIMIT 10` or use `cosineDistance(embedding, target_vector)`.
3. Support Hybrid Analytical Joins:
   - You can JOIN `box_office_revenue` with `audience_reviews` on `genre` or correlate `streaming_platform_metrics` latency with viewer drop-off patterns.
4. Filter out non-matching records cleanly (e.g. `WHERE release_window = 'Theatrical'` if looking for theatrical-only revenue).
5. Always order by meaningful metric (e.g. `ORDER BY gross_revenue DESC` or `ORDER BY event_time ASC`).
6. Comparative & Top Rankings: If the user asks for 'top', 'highest', 'leading', 'best', or 'lowest' (e.g. 'Which movie genre yielded highest net profit...', 'Top streaming service by error rate...'):
   - ALWAYS return the top 5 to 10 ranked records (e.g. `LIMIT 6` or `LIMIT 10`) ordered descending by that metric rather than `LIMIT 1`. This provides crucial comparative context and prevents single-item data drop-offs. Only use `LIMIT 1` if the user explicitly writes 'only 1' or 'single result'.
7. Cap queries without explicit limits with `LIMIT 50` to prevent payload bloat.
8. Only return a single clean SQL query inside a markdown ```sql ... ``` code block. Do NOT include extraneous conversational filler.

### USER QUERY:
"{user_query}"

Generate the optimal SQL query:"""

def get_self_healing_prompt(schema_info: Dict[str, Any], failed_sql: str, error_message: str, user_query: str) -> str:
    schema_str = json.dumps(schema_info, indent=2, default=str)
    return f"""You are the Self-Healing SQL Repair Agent for 'OmniQuery AI'.
A previously generated ClickHouse SQL query failed with a database runtime error. You must analyze the error, diagnose the root cause, and produce a fixed, working SQL query.

### DATABASE SCHEMAS:
{schema_str}

### ORIGINAL USER INTENT:
"{user_query}"

### FAILED SQL:
```sql
{failed_sql}
```

### DATABASE ERROR STACK TRACE:
"{error_message}"

### INSTRUCTIONS:
1. Identify the exact issue (e.g., misspelled column, incompatible data type, missing GROUP BY key, invalid ClickHouse function).
2. Fix the query to satisfy the original user intent while strictly adhering to the schema.
3. CLICKHOUSE SYNTAX RULES (CRITICAL):
   - In ClickHouse, NEVER use DuckDB/Postgres functions like `quantile_cont` or `percentile_cont`.
   - ALWAYS use `quantileExact(0.95)(column)` or `quantile(0.95)(column)` for percentiles (e.g. `quantileExact(0.95)(latency_ms)`).
   - For distinct count: use `uniqExact(column)` or `count(DISTINCT column)`.
   - For vector distance: use `cosineDistance(embedding, target_vector)`.
4. Return ONLY the repaired SQL query inside a ```sql ... ``` markdown code block.

Repaired SQL:"""

def get_chart_and_insight_prompt(user_query: str, sql_query: str, data_sample: list, total_rows: int, execution_time_ms: float) -> str:
    data_str = json.dumps(data_sample[:15], indent=2, default=str)
    return f"""You are an Executive Data Visualizer and Business Intelligence Analyst.
Analyze the executed query results and output a structured JSON specification for the frontend chart engine and executive brief.

### USER QUESTION:
"{user_query}"

### EXECUTED SQL:
```sql
{sql_query}
```

### EXECUTION METRICS:
- Total Rows: {total_rows}
- Execution Latency: {execution_time_ms} ms

### RETURNED DATA SAMPLE (First 15 rows):
{data_str}

### VISUALIZATION RULES:
1. Chart Type Selection:
   - If total_rows == 1 or data has only 1 row: MUST use "metric_cards" (NOT "bar"). Single-bar charts are uninformative.
   - For 2 to 12 categories: use "bar".
   - For time series (dates, hours, months): use "line" or "area".
   - For proportions of a whole (<= 6 categories): use "pie".
2. Always provide 3 crisp "key_metrics":
   - Metric 1: The direct answer or top winner (e.g. "Leading Genre", "Animation", positive).
   - Metric 2: The primary quantitative figure with formatted currency/units (e.g. "$1.49B Net Profit").
   - Metric 3: Comparative or volume stat (e.g. "Market Margin: 38.2%" or "Total Scanned: 30k").
3. Executive Summary: Crisp, high-signal 2 sentences giving the bottom-line insight immediately.

### REQUIRED OUTPUT FORMAT:
Output MUST be a valid JSON object matching this exact schema:
{{
  "title": "Clear descriptive chart title",
  "chart_type": "bar" | "line" | "area" | "pie" | "metric_cards" | "table",
  "x_axis_key": "column_name_for_x_axis",
  "y_axis_keys": ["column_name_1", "column_name_2"],
  "series_names": ["Series 1 Label", "Series 2 Label"],
  "color_palette": ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
  "executive_summary": "2-3 crisp sentences summarizing the direct business answer, key trend, or anomaly discovered in the data.",
  "key_metrics": [
    {{"label": "Metric Name", "value": "Formatted Value (e.g. $1.49B or 99.4%)", "trend": "positive" | "negative" | "neutral"}},
    {{"label": "Metric 2", "value": "Value 2", "trend": "positive" | "negative" | "neutral"}},
    {{"label": "Metric 3", "value": "Value 3", "trend": "positive" | "negative" | "neutral"}}
  ],
  "suggested_followups": [
    "Suggested follow-up natural language query 1",
    "Suggested follow-up natural language query 2",
    "Suggested follow-up natural language query 3"
  ]
}}

Return ONLY valid raw JSON with NO surrounding text or conversational markdown.
"""
