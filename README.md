# OmniQuery AI

**Autonomous natural language analytics for film studios, powered by Google ADK, Gemini, and the official ClickHouse MCP Server.**

OmniQuery AI translates natural language questions from studio executives and analysts into optimized ClickHouse SQL, executes queries across box office and streaming telemetry in sub-second time, self-heals syntax errors, and streams interactive visualizations directly to a React dashboard.

---

## Architecture

```
User Query (Natural Language)
          │
          ▼
FastAPI SSE Gateway
          │
          ▼
Google Agent Development Kit (ADK) + Gemini 3.6 Flash
  ├── 1. Schema Introspection (via MCP: list_tables)
  ├── 2. SQL Planning (ClickHouse OLAP dialect)
  ├── 3. Execution & Self-Healing Loop (via MCP: run_query)
  └── 4. Visualization & Brief Synthesis
          │
          ▼
Official ClickHouse MCP Server (mcp-clickhouse)
          │
          ▼
ClickHouse Cloud (GCP) ──[Fallback]──► In-Memory DuckDB
          │
          ▼
Live SSE Stream ──► React 19 Dashboard (Recharts + Tailwind)
```

### Key Technical Pillars

- **Official MCP Runtime Integration:** Uses the official `mcp-clickhouse` server package to run `list_tables` and `run_query` protocol tools at runtime.
- **Multi-Agent Orchestration:** Built with Google Agent Development Kit (`Agent`, `Runner`, `InMemorySessionService`) and Gemini 3.6 Flash.
- **Dual-Engine Analytical Backend:** Runs against ClickHouse Cloud on GCP with transparent fallback to in-memory DuckDB for zero-downtime development and offline demos.
- **Self-Healing SQL:** If a generated query encounters syntax or schema mismatch errors, the runner catches the database exception, diagnoses the error trace, and regenerates corrected SQL automatically (up to 3 retries).
- **Vector Semantic Search:** 16-dimensional normalized cosine similarity embeddings for clustering unstructured audience feedback without exact keyword matching.
- **Zero-Storage Uploads:** Drag-and-drop CSV ingestion dynamically registered into the analytical engine in real-time.

---

## Tables & Schema

The dataset models a modern film studio operating theatrical releases, streaming distribution, and audience feedback:

| Table | Engine | Rows | Description |
|---|---|---|---|
| `box_office_revenue` | `SharedMergeTree` | 25,000 | Global theatrical revenue, opening weekends, marketing budgets, net profit, and screen counts across distributors (A24, Warner Bros, Universal, Disney, Paramount). |
| `streaming_platform_metrics` | `SharedMergeTree` | 20,000 | Platform telemetry: player latency, error status codes, memory usage, and ingest event times. |
| `audience_reviews` | `SharedMergeTree` | 5,000 | Unstructured feedback, ratings (1-5), sentiment tags, topic clusters (`pacing_complaint`, `soundtrack_praise`), and 16-dim vector embeddings. |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- (Optional) ClickHouse Cloud account with cluster credentials

### 1. Clone & Setup Backend

```bash
git clone https://github.com/Divyanshneginot/OmniQuery-AI.git
cd OmniQuery-AI/backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate      # On Windows
# source venv/bin/activate # On Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
```

Edit `backend/.env` with your credentials:
```ini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.6-flash

# ClickHouse Cloud (leave blank to run in embedded DuckDB mode)
CLICKHOUSE_HOST=your-instance.clickhouse.cloud
CLICKHOUSE_PORT=8443
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=your_password
CLICKHOUSE_DATABASE=default
CLICKHOUSE_SECURE=True
```

### 2. Start the Backend Server

```bash
python -m app.main
```
The API server starts on `http://localhost:8000` (docs available at `/docs`).

### 3. Setup & Start Frontend

In a separate terminal:
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Example Queries

Executives and analysts can query in plain English:

#### Box Office Margins
```
"Which movie genre yielded the highest net profit across European screens in Q2?"
```
*Generated SQL:*
```sql
SELECT
    genre,
    sum(net_profit) AS total_profit,
    round(avg(gross_revenue), 2) AS avg_gross,
    count(*) AS releases
FROM box_office_revenue
WHERE territory = 'Europe'
GROUP BY genre
ORDER BY total_profit DESC;
```

#### Streaming Latency Spike Analysis
```
"Show me p95 latency and error counts by service endpoint over the last 30 days."
```
*Generated SQL:*
```sql
SELECT
    endpoint,
    round(quantile(0.95)(latency_ms), 2) AS p95_latency,
    countIf(status_code >= 400) AS errors,
    count(*) AS total_requests
FROM streaming_platform_metrics
GROUP BY endpoint
ORDER BY errors DESC;
```

#### Semantic Audience Feedback
```
"Find audience reviews complaining about movie pacing and plot issues."
```
*Generated SQL:*
```sql
SELECT
    movie_title,
    comment,
    rating,
    sentiment
FROM audience_reviews
WHERE topic_cluster IN ('pacing_complaint', 'plot_complaint')
ORDER BY rating ASC
LIMIT 10;
```

---

## Running Tests

The test suite covers API routes, SQL injection rejection, schema introspection, streaming pipelines, and vector search:

```bash
cd backend
python -m pytest tests/ -v
```

All 9 automated unit and integration tests validate:
- `GET /api/health` — Service readiness & engine mode detection
- `GET /api/schema` — Schema reflection across all tables
- `POST /api/sql/raw` — Parameterized execution
- Mutation rejection — Direct blocking of destructive statements (`DROP`, `DELETE`)
- Full streaming pipeline execution with Google ADK
- Dynamic Pandas DataFrame registration

Frontend TypeScript and production build verification:
```bash
cd frontend
npm run build
```

---

## Tech Stack

| Component | Technologies |
|---|---|
| **Agent Framework** | Google Agent Development Kit (`google-adk`), Gemini 3.6 Flash (`google-genai`) |
| **Model Context Protocol** | Official ClickHouse MCP Server (`mcp-clickhouse`) |
| **Databases** | ClickHouse Cloud (Primary OLAP), DuckDB (Embedded Fallback) |
| **API Backend** | FastAPI, Uvicorn, SSE Starlette, Pandas, Pydantic |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, Lucide Icons |

---

## License

Distributed under the MIT License. See `LICENSE` for details.
