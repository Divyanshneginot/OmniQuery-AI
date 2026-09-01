import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

transport = ASGITransport(app=app)

@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "healthy"
        assert "database_mode" in data

@pytest.mark.asyncio
async def test_schema_endpoint():
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/schema")
        assert r.status_code == 200
        data = r.json()
        assert "tables" in data
        assert len(data["tables"]) >= 3

@pytest.mark.asyncio
async def test_raw_sql_valid_query():
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.post("/api/sql/raw", json={"sql": "SELECT count(*) as cnt FROM box_office_revenue"})
        assert r.status_code == 200

@pytest.mark.asyncio
async def test_raw_sql_rejects_drop():
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.post("/api/sql/raw", json={"sql": "DROP TABLE box_office_revenue"})
        assert r.status_code in [400, 403, 422, 500]

@pytest.mark.asyncio
async def test_raw_sql_rejects_delete():
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.post("/api/sql/raw", json={"sql": "DELETE FROM box_office_revenue WHERE 1=1"})
        assert r.status_code in [400, 403, 422, 500]
