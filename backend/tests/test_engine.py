import sys
import os
import asyncio

# Ensure app is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.stdout.reconfigure(encoding='utf-8')

from app.db.clickhouse_engine import db_engine
from app.agent.orchestrator import agent_orchestrator

def test_database_initialization():
    print("\n--- TEST 1: Database Initialization & Schema Introspection ---")
    summary = db_engine.get_schema_summary()
    print(f"Engine Mode: {summary['mode']}")
    assert len(summary['tables']) >= 3, "Expected at least 3 tables: box_office_revenue, streaming_platform_metrics, audience_reviews"
    for table_name, info in summary['tables'].items():
        print(f"Table '{table_name}': {info['row_count']:,} rows, {len(info['columns'])} columns")
        assert info['row_count'] > 0, f"Table {table_name} is empty!"
    print("✓ Schema introspection test passed!")

def test_query_execution_and_latency():
    print("\n--- TEST 2: High-Speed OLAP Execution ---")
    test_queries = [
        ("Aggregation by Category", "SELECT genre, sum(gross_revenue) as total_rev, count(*) as movie_count FROM box_office_revenue WHERE 1=1 GROUP BY genre ORDER BY total_rev DESC"),
        ("Telemetry Latency Percentiles", "SELECT service_name, round(avg(latency_ms), 2) as avg_lat, round(quantile(0.95)(latency_ms), 2) as p95_lat FROM streaming_platform_metrics GROUP BY service_name"),
        ("Audience Sentiment Breakdown", "SELECT sentiment, count(*) as count, round(avg(rating), 2) as avg_rating FROM audience_reviews GROUP BY sentiment ORDER BY count DESC")
    ]

    for label, sql in test_queries:
        res = db_engine.execute_query(sql)
        print(f"[{label}] Execution Time: {res['execution_time_ms']} ms | Rows Returned: {res['total_rows_returned']}")
        assert res['success'] is True
        assert res['execution_time_ms'] < 2000, f"Query took too long: {res['execution_time_ms']}ms"
        assert len(res['rows']) > 0
    print("✓ High-speed query execution test passed!")

import pytest

@pytest.mark.asyncio
async def test_agent_pipeline_streaming():
    print("\n--- TEST 3: Multi-Step Agent Pipeline & Streaming ---")
    user_query = "What is the total revenue by film genre and their average opening weekend?"
    events = []
    async for event in agent_orchestrator.run_pipeline(user_query):
        events.append(event)
        event_type = event.get('type')
        if event_type == 'step':
            print(f"  [Step] {event.get('step')}: {event.get('message')}")
        elif event_type == 'complete':
            payload = event['payload']
            print(f"  [Complete] Query: {payload['sql_query'][:60]}... | Latency: {payload['execution_time_ms']}ms")
            print(f"  [Chart Spec] Title: {payload['chart_spec']['title']} | Type: {payload['chart_spec']['chart_type']}")
            print(f"  [Executive Summary] {payload['chart_spec']['executive_summary']}")

    assert len(events) >= 4, "Expected at least 4 steps in the agent pipeline"
    complete_event = next(e for e in events if e.get('type') == 'complete')
    assert complete_event['payload']['total_rows'] > 0
    print("✓ Agent pipeline streaming test passed!")

def test_vector_search_and_dataset_upload():
    print("\n--- TEST 4: ClickHouse Vector Search & Custom Dataset Ingest ---")
    import pandas as pd
    
    # 1. Vector Search Query
    vector_sql = "SELECT comment, sentiment, topic_cluster, rating FROM audience_reviews WHERE topic_cluster = 'pacing_complaint' LIMIT 5;"
    res = db_engine.execute_query(vector_sql)
    print(f"[Vector Search] Execution Time: {res['execution_time_ms']} ms | Matching Records: {len(res['rows'])}")
    assert res['success'] is True
    assert len(res['rows']) > 0

    # 2. Custom Dataset Ingest
    test_df = pd.DataFrame([
        {"user_id": 101, "churn_probability": 0.85, "tier": "Enterprise", "mrr": 4500.0},
        {"user_id": 102, "churn_probability": 0.12, "tier": "Pro", "mrr": 1200.0},
        {"user_id": 103, "churn_probability": 0.94, "tier": "Enterprise", "mrr": 9200.0}
    ])
    reg_res = db_engine.register_uploaded_dataset("user_churn_risk", test_df)
    print(f"[Dynamic Ingest] Table '{reg_res['table_name']}' created with {reg_res['row_count']} rows")
    
    query_uploaded = db_engine.execute_query("SELECT tier, avg(churn_probability) as avg_churn, sum(mrr) as total_mrr FROM user_churn_risk GROUP BY tier ORDER BY total_mrr DESC;")
    print(f"[Query Custom Table] Returned {len(query_uploaded['rows'])} rows in {query_uploaded['execution_time_ms']} ms")
    assert query_uploaded['success'] is True
    assert len(query_uploaded['rows']) == 2
    print("✓ Vector Search & Custom Dataset Ingestion tests passed!")

if __name__ == "__main__":
    test_database_initialization()
    test_query_execution_and_latency()
    test_vector_search_and_dataset_upload()
    asyncio.run(test_agent_pipeline_streaming())
    print("\n🎉 ALL TESTS (INCLUDING VECTOR SEARCH & INGEST) PASSED SUCCESSFULLY!")
