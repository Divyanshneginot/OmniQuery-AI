import os
import time
import logging
import threading
from typing import Dict, Any, List, Optional
import duckdb
import pandas as pd
from dotenv import load_dotenv

from app.db.seed_data import generate_box_office_data, generate_streaming_metrics_data, generate_audience_reviews_data

load_dotenv()
logger = logging.getLogger(__name__)

class DatabaseEngine:
    def __init__(self):
        self._lock = threading.Lock()
        self.is_cloud_clickhouse = False
        self.client = None
        self.duck_conn = None
        self.mode = "Embedded Analytical Engine (Zero-Config)"
        self._init_connection()

    def _init_connection(self):
        ch_host = os.getenv("CLICKHOUSE_HOST", "").strip()
        ch_user = os.getenv("CLICKHOUSE_USER", "default").strip()
        ch_pass = os.getenv("CLICKHOUSE_PASSWORD", "").strip()
        ch_port = int(os.getenv("CLICKHOUSE_PORT", "8443"))
        ch_db = os.getenv("CLICKHOUSE_DATABASE", "default").strip()
        ch_secure = os.getenv("CLICKHOUSE_SECURE", "True").lower() == "true"

        if ch_host and ch_pass:
            try:
                import clickhouse_connect
                logger.info(f"Connecting to ClickHouse Cloud at {ch_host}:{ch_port}...")
                self.client = clickhouse_connect.get_client(
                    host=ch_host,
                    port=ch_port,
                    username=ch_user,
                    password=ch_pass,
                    database=ch_db,
                    secure=ch_secure,
                    autogenerate_session_id=False
                )
                self.is_cloud_clickhouse = True
                self.mode = f"ClickHouse Cloud ({ch_host})"
                logger.info("Successfully connected to ClickHouse Cloud!")
                self._seed_clickhouse_cloud_if_empty()
                return
            except Exception as e:
                logger.warning(f"Failed to connect or seed ClickHouse Cloud ({e}). Falling back to Embedded Engine.")
                self.is_cloud_clickhouse = False
                self.client = None

        # Fallback: Embedded High-Speed Columnar Engine with DuckDB
        logger.info("Bootstrapping Embedded High-Speed Analytical Database...")
        self.duck_conn = duckdb.connect(database=":memory:")
        self.duck_conn.execute("INSTALL json;")
        self.duck_conn.execute("LOAD json;")
        
        # Initialize embedded schema
        df_box_office = generate_box_office_data(25000)
        df_streaming = generate_streaming_metrics_data(20000)
        df_reviews = generate_audience_reviews_data(5000)
        
        self.duck_conn.register("box_office_revenue", df_box_office)
        self.duck_conn.register("streaming_platform_metrics", df_streaming)
        self.duck_conn.register("audience_reviews", df_reviews)
        
        self.is_cloud_clickhouse = False
        self.mode = "Embedded Analytical Engine (DuckDB In-Memory)"
        logger.info("Embedded database initialized with 50,000 synthetic entertainment records.")

    def _seed_clickhouse_cloud_if_empty(self):
        try:
            tables = self.client.command("SHOW TABLES")
            table_list = tables.split("\n") if isinstance(tables, str) else list(tables)
            table_list = [t.strip() for t in table_list if t.strip()]
            
            # Create DDLs if not exist
            ddl_box_office = """
            CREATE TABLE IF NOT EXISTS box_office_revenue (
                record_id UInt32,
                movie_title String,
                genre String,
                distributor String,
                territory String,
                gross_revenue Float64,
                opening_weekend Float64,
                production_budget Float64,
                marketing_spend Float64,
                net_profit Float64,
                screens UInt16,
                release_window String,
                release_date DateTime
            ) ENGINE = MergeTree()
            ORDER BY (genre, release_date, record_id);
            """
            
            ddl_streaming = """
            CREATE TABLE IF NOT EXISTS streaming_platform_metrics (
                log_id UInt32,
                event_time DateTime,
                service_name String,
                endpoint String,
                status_code UInt16,
                latency_ms Float64,
                cpu_usage_pct Float64,
                memory_mb Float64,
                error_message String
            ) ENGINE = MergeTree()
            ORDER BY (service_name, event_time, log_id);
            """
            
            ddl_reviews = """
            CREATE TABLE IF NOT EXISTS audience_reviews (
                feedback_id UInt32,
                viewer_id UInt32,
                genre String,
                rating UInt8,
                sentiment String,
                topic_cluster String,
                comment String,
                embedding Array(Float32),
                created_at DateTime
            ) ENGINE = MergeTree()
            ORDER BY (genre, rating, feedback_id);
            """
            
            self.client.command(ddl_box_office)
            self.client.command(ddl_streaming)
            self.client.command(ddl_reviews)

            # Check if tables are populated
            box_office_count = int(self.client.command("SELECT count() FROM box_office_revenue"))
            if box_office_count == 0:
                logger.info("Seeding ClickHouse Cloud with entertainment studio data...")
                df_box_office = generate_box_office_data(10000)
                df_streaming = generate_streaming_metrics_data(15000)
                df_reviews = generate_audience_reviews_data(5000)
                
                df_box_office["release_date"] = pd.to_datetime(df_box_office["release_date"])
                df_streaming["event_time"] = pd.to_datetime(df_streaming["event_time"])
                df_reviews["created_at"] = pd.to_datetime(df_reviews["created_at"])
                
                # Use client.insert with Python primitives to allow clickhouse-connect 
                # to safely coerce types (UInt32, UInt16, UInt8, DateTime, Array(Float32))
                self.client.insert(
                    "box_office_revenue",
                    df_box_office.values.tolist(),
                    column_names=list(df_box_office.columns)
                )
                
                self.client.insert(
                    "streaming_platform_metrics",
                    df_streaming.values.tolist(),
                    column_names=list(df_streaming.columns)
                )
                
                self.client.insert(
                    "audience_reviews",
                    df_reviews.values.tolist(),
                    column_names=list(df_reviews.columns)
                )
                logger.info("ClickHouse Cloud seed completed with 30,000 live entertainment records!")
        except Exception as e:
            logger.error(f"Error checking/seeding ClickHouse Cloud: {e}")
            self.is_cloud_clickhouse = False
            self.client = None
            raise e

    def register_uploaded_dataset(self, table_name: str, df: pd.DataFrame) -> Dict[str, Any]:
        """Dynamically ingests an uploaded DataFrame into the database."""
        # Sanitize table name
        import re
        safe_table_name = re.sub(r'[^a-zA-Z0-9_]', '_', table_name).lower()
        if not safe_table_name or safe_table_name[0].isdigit():
            safe_table_name = f"dataset_{safe_table_name}"

        if self.is_cloud_clickhouse and self.client:
            type_mapping = {
                "int64": "Int64",
                "int32": "Int32",
                "float64": "Float64",
                "float32": "Float32",
                "bool": "UInt8",
                "datetime64[ns]": "DateTime",
            }
            col_defs = []
            for col, dtype in df.dtypes.items():
                sanitized_col = re.sub(r'[^a-zA-Z0-9_]', '_', str(col))
                ch_type = type_mapping.get(str(dtype), "String")
                col_defs.append(f"`{sanitized_col}` {ch_type}")
            
            ddl = f"CREATE TABLE IF NOT EXISTS `{safe_table_name}` ({', '.join(col_defs)}) ENGINE = MergeTree() ORDER BY tuple();"
            self.client.command(ddl)
            self.client.insert_df(safe_table_name, df)
        else:
            temp_var = f"df_upload_{safe_table_name}"
            self.duck_conn.register(temp_var, df)
            self.duck_conn.execute(f"CREATE OR REPLACE TABLE {safe_table_name} AS SELECT * FROM {temp_var};")
            self.duck_conn.unregister(temp_var)
            
        logger.info(f"Registered custom uploaded dataset as table: {safe_table_name} ({len(df)} rows)")
        return {
            "table_name": safe_table_name,
            "row_count": len(df),
            "columns": list(df.columns)
        }

    def get_schema_summary(self) -> Dict[str, Any]:
        """Returns schemas and column metadata for all tables including uploaded datasets."""
        tables_info = {}
        if self.is_cloud_clickhouse and self.client:
            with self._lock:
                tables = self.client.command("SHOW TABLES").split("\n")
                for table in tables:
                    table = table.strip()
                    if not table: continue
                    try:
                        cols_df = self.client.query_df(f"DESCRIBE TABLE {table}")
                        sample_df = self.client.query_df(f"SELECT * FROM {table} LIMIT 3")
                        import json
                        tables_info[table] = {
                            "columns": json.loads(cols_df.to_json(orient="records")),
                            "sample_rows": json.loads(sample_df.to_json(orient="records")),
                            "row_count": int(self.client.command(f"SELECT count() FROM {table}"))
                        }
                    except Exception as e:
                        logger.warning(f"Failed to inspect cloud table {table}: {e}")
        else:
            # Query duckdb internal tables
            tables_res = self.duck_conn.execute("SHOW TABLES;").fetchall()
            tables = [t[0] for t in tables_res]
            for table in tables:
                try:
                    cols_df = self.duck_conn.execute(f"DESCRIBE {table}").df()
                    sample_df = self.duck_conn.execute(f"SELECT * FROM {table} LIMIT 3").df()
                    count = self.duck_conn.execute(f"SELECT count(*) FROM {table}").fetchone()[0]
                    import json
                    tables_info[table] = {
                        "columns": json.loads(cols_df.to_json(orient="records")),
                        "sample_rows": json.loads(sample_df.to_json(orient="records")),
                        "row_count": int(count)
                    }
                except Exception as e:
                    logger.warning(f"Failed to inspect embedded table {table}: {e}")

        return {
            "mode": self.mode,
            "is_cloud_clickhouse": self.is_cloud_clickhouse,
            "tables": tables_info
        }

    def execute_query(self, sql_query: str) -> Dict[str, Any]:
        """Executes analytical SQL and records execution metrics."""
        import re
        cleaned_sql = sql_query.strip().rstrip(";")
        
        # Robust SQL safety parser: strip multi-line and single-line comments
        stripped_sql = re.sub(r'/\*.*?\*/', '', cleaned_sql, flags=re.DOTALL)
        stripped_sql = re.sub(r'--.*$', '', stripped_sql, flags=re.MULTILINE).strip()
        
        # Check first executable token
        first_token = stripped_sql.split()[0].upper() if stripped_sql.split() else ""
        allowed_verbs = {"SELECT", "WITH", "SHOW", "DESCRIBE", "EXPLAIN"}
        
        if first_token not in allowed_verbs:
            raise ValueError(f"Security Policy: Mutation command '{first_token}' is disallowed. Only analytical queries (SELECT, WITH, SHOW, DESCRIBE, EXPLAIN) are permitted.")

        # Check for chained mutation statements
        mutation_keywords = ["DROP", "DELETE", "TRUNCATE", "ALTER", "UPDATE", "INSERT", "GRANT", "REVOKE"]
        for kw in mutation_keywords:
            if re.search(rf';\s*{kw}\b', stripped_sql, re.IGNORECASE):
                raise ValueError(f"Security Policy: Chained mutation query containing '{kw}' is disallowed.")

        start_time = time.perf_counter()

        try:
            with self._lock:
                if self.is_cloud_clickhouse and self.client:
                    # Enforce Query Complexity Guardrails
                    settings = {
                        "max_execution_time": 10,
                        "max_rows_to_read": 50000000,
                        "max_result_rows": 10000,
                    }
                    mapped_sql = self._map_duckdb_syntax_to_clickhouse(cleaned_sql)
                    result = self.client.query(mapped_sql, settings=settings)
                    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
                    columns = result.column_names
                    rows = [dict(zip(columns, row)) for row in result.result_rows]
                    return {
                        "success": True,
                        "columns": columns,
                        "rows": rows[:500], # capped at 500 rows for rendering
                        "total_rows_returned": len(rows),
                        "execution_time_ms": duration_ms,
                        "rows_scanned": result.summary.get("read_rows", len(rows)) if hasattr(result, "summary") else len(rows),
                        "database_mode": self.mode
                    }
                else:
                    # Map ClickHouse specific functions to standard SQL if running in local DuckDB mode
                    mapped_sql = self._map_clickhouse_syntax_to_duckdb(cleaned_sql)
                    res = self.duck_conn.execute(mapped_sql)
                    columns = [desc[0] for desc in res.description]
                    raw_rows = res.fetchall()
                    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
                    rows = [dict(zip(columns, row)) for row in raw_rows]
                    return {
                        "success": True,
                        "columns": columns,
                        "rows": rows[:500],
                        "total_rows_returned": len(rows),
                        "execution_time_ms": duration_ms,
                        "rows_scanned": len(rows), # fallback using actual returned rows instead of fake multiplier
                        "database_mode": self.mode
                    }
        except Exception as e:
            err_msg = str(e)
            # Mask internal database URLs, ports, and C++ exception codes to prevent credential or infrastructure leakage
            err_msg = re.sub(r'https?://[^\s)]+', '[ClickHouse Cloud]', err_msg).strip()
            err_msg = re.sub(r'Code:\s*\d+\.\s*', '', err_msg)
            err_msg = re.sub(r'DB::Exception:\s*', '', err_msg)
            raise RuntimeError(err_msg) from e

    def _map_duckdb_syntax_to_clickhouse(self, sql: str) -> str:
        """Helper to ensure standard SQL / DuckDB functions execute transparently on ClickHouse Cloud."""
        import re
        s = sql
        # quantile_cont(P)(col) or quantile(P)(col) or percentile_cont(P)(col) -> quantileExact(P)(col)
        s = re.sub(r'(?:quantile_cont|quantile|percentile_cont)\s*\(\s*([0-9.]+)\s*\)\s*\(\s*([^)]+)\s*\)', r'quantileExact(\1)(\2)', s, flags=re.IGNORECASE)
        # quantile_cont(col, P) or percentile_approx(col, P) or approx_percentile(col, P) -> quantileExact(P)(col)
        s = re.sub(r'(?:quantile_cont|percentile_approx|approx_percentile)\s*\(\s*([^,]+)\s*,\s*([0-9.]+)\s*\)', r'quantileExact(\2)(\1)', s, flags=re.IGNORECASE)
        # quantile_cont(P, col) -> quantileExact(P)(col)
        s = re.sub(r'quantile_cont\s*\(\s*([0-9.]+)\s*,\s*([^)]+)\s*\)', r'quantileExact(\1)(\2)', s, flags=re.IGNORECASE)
        # percentile_cont(P) WITHIN GROUP (ORDER BY col) -> quantileExact(P)(col)
        s = re.sub(r'percentile_cont\s*\(\s*([0-9.]+)\s*\)\s*WITHIN\s+GROUP\s*\(\s*ORDER\s+BY\s+([^)]+)\s*\)', r'quantileExact(\1)(\2)', s, flags=re.IGNORECASE)
        return s

    def _map_clickhouse_syntax_to_duckdb(self, sql: str) -> str:
        """Helper to ensure ClickHouse dialect functions execute transparently on embedded engine."""
        import re
        s = sql
        # ClickHouse cosineDistance(v1, v2) -> (1.0 - list_cosine_similarity(v1, v2))
        s = re.sub(r'cosineDistance\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)', r'(1.0 - list_cosine_similarity(\1, \2))', s)
        s = re.sub(r'L2Distance\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)', r'list_distance(\1, \2)', s)

        # ClickHouse quantile(P)(col) or quantileExact(P)(col) -> quantile_cont(col, P)
        s = re.sub(r'quantile(?:Exact)?\s*\(\s*([0-9.]+)\s*\)\s*\(\s*([^)]+)\s*\)', r'quantile_cont(\2, \1)', s)
        s = re.sub(r'quantile_cont\s*\(\s*([0-9.]+)\s*\)\s*\(\s*([^)]+)\s*\)', r'quantile_cont(\2, \1)', s)
        
        # ClickHouse uniqExact(col) -> count(DISTINCT col)
        s = re.sub(r'uniqExact\s*\(\s*([^)]+)\s*\)', r'count(DISTINCT \1)', s)
        s = re.sub(r'uniq\s*\(\s*([^)]+)\s*\)', r'count(DISTINCT \1)', s)
        
        # Date truncations
        s = re.sub(r'toStartOfDay\s*\(\s*([^)]+)\s*\)', r"date_trunc('day', \1)", s)
        s = re.sub(r'toStartOfHour\s*\(\s*([^)]+)\s*\)', r"date_trunc('hour', \1)", s)
        s = re.sub(r'toStartOfMonth\s*\(\s*([^)]+)\s*\)', r"date_trunc('month', \1)", s)
        s = re.sub(r'toHour\s*\(\s*([^)]+)\s*\)', r"extract('hour' from \1)", s)
        s = re.sub(r'toDayOfWeek\s*\(\s*([^)]+)\s*\)', r"extract('dow' from \1)", s)
        return s

# Global singleton
db_engine = DatabaseEngine()
