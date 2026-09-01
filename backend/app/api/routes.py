import json
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.db.clickhouse_engine import db_engine
from app.agent.orchestrator import agent_orchestrator

router = APIRouter()

class QueryRequest(BaseModel):
    query: str

class RawSqlRequest(BaseModel):
    sql: str

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "OmniQuery AI Backend",
        "database_mode": db_engine.mode,
        "is_cloud_clickhouse": db_engine.is_cloud_clickhouse,
        "gemini_active": agent_orchestrator.client_initialized,
        "model": agent_orchestrator.model_name
    }

@router.get("/schema")
def get_database_schema():
    try:
        return db_engine.get_schema_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query/stream")
async def stream_query(req: QueryRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    async def event_generator():
        async for event in agent_orchestrator.run_pipeline(req.query):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/sql/raw")
def execute_raw_sql(req: RawSqlRequest):
    if not req.sql.strip():
        raise HTTPException(status_code=400, detail="SQL cannot be empty")
    try:
        return db_engine.execute_query(req.sql)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/dataset/upload")
async def upload_dataset(file: UploadFile = File(...)):
    import io
    import pandas as pd
    
    filename = file.filename or "custom_dataset.csv"
    table_name = filename.rsplit('.', 1)[0]
    
    try:
        contents = await file.read()
        if filename.endswith(".csv") or filename.endswith(".txt"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith(".parquet"):
            df = pd.read_parquet(io.BytesIO(contents))
        elif filename.endswith(".json"):
            df = pd.read_json(io.BytesIO(contents))
        else:
            df = pd.read_csv(io.BytesIO(contents))
            
        res = db_engine.register_uploaded_dataset(table_name, df)
        return {
            "success": True,
            "message": f"Successfully ingested {res['row_count']} rows into ClickHouse table '{res['table_name']}'",
            "dataset": res
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse and ingest dataset: {str(e)}")
