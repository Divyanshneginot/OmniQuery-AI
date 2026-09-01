# 🎬 OmniQuery AI — The Film Studio Analytics Command Center

> **Your AI-powered command center for real-time film analytics. Ask questions in plain English, get instant insights from box office revenue, streaming metrics, and audience sentiment — powered by Google Cloud Vertex AI and ClickHouse.**

```
   ██████╗ ███╗   ███╗███╗   ██╗██╗ ██████╗ ██╗   ██╗███████╗██████╗ ██╗   ██╗
  ██╔═══██╗████╗ ████║████╗  ██║██║██╔═══██╗██║   ██║██╔════╝██╔══██╗╚██╗ ██╔╝
  ██║   ██║██╔████╔██║██╔██╗ ██║██║██║   ██║██║   ██║█████╗  ██████╔╝ ╚████╔╝ 
  ██║   ██║██║╚██╔╝██║██║╚██╗██║██║██║▄▄ ██║██║   ██║██╔══╝  ██╔══██╗  ╚██╔╝  
  ╚██████╔╝██║ ╚═╝ ██║██║ ╚████║██║╚██████╔╝╚██████╔╝███████╗██║  ██║   ██║   
   ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝ ╚══▀▀═╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝   ╚═╝   
                  ─── FILM STUDIO ANALYTICS COMMAND CENTER ───
```

---

### 🏆 Built For
[![Agentic Cinema Hackathon](https://img.shields.io/badge/Hackathon-Agentic%20Cinema%202026-ff0055?style=for-the-badge&logo=filmstrip&logoColor=white)](https://github.com)
[![ClickHouse Track](https://img.shields.io/badge/Track-ClickHouse%20Track-F3EA00?style=for-the-badge&logo=clickhouse&logoColor=black)](https://clickhouse.com/)
[![Official ClickHouse MCP](https://img.shields.io/badge/MCP-mcp--clickhouse-F3EA00?style=for-the-badge&logo=clickhouse&logoColor=black)](https://github.com/ClickHouse/mcp-clickhouse)
[![Google Cloud + Vertex AI](https://img.shields.io/badge/AI-Google%20Cloud%20Vertex%20AI%20%2B%20Gemini-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)](https://cloud.google.com/vertex-ai)
[![Google ADK Agent Platform](https://img.shields.io/badge/Agent_Platform-Google_ADK-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://cloud.google.com/vertex-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-00c853?style=for-the-badge)](LICENSE)

---

## 🎯 The Problem

Film studios, distributors, and production houses drown in fragmented, high-velocity data across:
- **Box Office POS Systems:** Opening weekend receipts, regional distributor splits, and territory sales.
- **Streaming Platforms (OTT):** Bitrate telemetry, player drop-off rates, buffer times, and viewer retention curves.
- **Audience Feedback Aggregators:** Unstructured social commentary, critical reviews, and sentiment shifts.

Executive decision-makers and studio heads need **instant, actionable answers** to greenlight campaigns and allocate marketing budgets — not tickets filed with data engineering teams waiting days for SQL queries.

---

## 💡 The Solution

**OmniQuery AI** is an autonomous analytical command center designed for entertainment executives. It converts natural language business inquiries into ultra-optimized ClickHouse SQL, executes complex aggregations over millions of rows in milliseconds, autonomously self-heals syntax or schema errors, and renders rich interactive charts and executive briefings — all streamed live via Server-Sent Events (SSE).

---

## 🏛️ System Architecture

```
                                  Studio Executive / Analyst
                                              │
                                              │ (Natural Language Prompt)
                                              ▼
                             ┌─────────────────────────────────┐
                             │  FastAPI Event-Stream Gateway   │
                             └────────────────┬────────────────┘
                                              │
                                              ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 │               Google ADK Agent Platform + Google Vertex AI (Gemini 2.5 Flash)           │
 │                                                                                         │
 │   ┌─────────────────────────┐         ┌─────────────────────────┐                       │
 │   │ 1. Schema Introspector  │ ──────> │ 2. SQL & Vector Planner │                       │
 │   │ (via MCP: list_tables)  │         │ (ClickHouse OLAP Dialect)│                       │
 │   └─────────────────────────┘         └────────────┬────────────┘                       │
 │                                                    │                                    │
 │                                                    ▼                                    │
 │   ┌─────────────────────────┐         ┌─────────────────────────┐                       │
 │   │ 4. Self-Healing Loop    │ <────── │ 3. Execution & Validation│                       │
 │   │ (Auto-Repairs Errors)   │ (Retry) │ (via MCP: run_query)    │                       │
 │   └─────────────────────────┘         └────────────┬────────────┘                       │
 │                                                    │ (Result Data)                      │
 │                                                    ▼                                    │
 │                                       ┌─────────────────────────┐                       │
 │                                       │ 5. Chart & Brief Synth  │                       │
 │                                       │ (Recharts Spec + Brief) │                       │
 │                                       └─────────────────────────┘                       │
 └────────────────────────────────────────────┬────────────────────────────────────────────┘
                                              │
                                              │ JSON-RPC 2.0 (MCP Protocol)
                                              ▼
                     ┌─────────────────────────────────────────────────┐
                     │     Official ClickHouse MCP Server              │
                     │           (`mcp-clickhouse`)                    │
                     │  ┌───────────────────────────────────────────┐  │
                     │  │ • Tool 1: list_tables (Catalog Discovery) │  │
                     │  │ • Tool 2: run_query (OLAP SQL Execution)  │  │
                     │  └─────────────────────┬─────────────────────┘  │
                     └────────────────────────┼────────────────────────┘
                                              │
                                              ▼
                     ┌─────────────────────────────────────────────────┐
                     │          ClickHouse Cloud (Hosted on GCP)       │
                     │   ┌─────────────────────────────────────────┐   │
                     │   │ • 140,000+ Box Office & Streaming Logs  │   │
                     │   │ • 16-Dim Audience Sentiment Embeddings  │   │
                     │   │ • Dual Engine: ClickHouse Cloud / DuckDB│   │
                     │   └─────────────────────────────────────────┘   │
                     └────────────────────────┬────────────────────────┘
                                              │
                                              │ Real-Time SSE Event Stream
                                              ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 │                         OmniQuery AI React 19 Command Center                            │
 │                                                                                         │
 │  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐  │
 │  │ Agent Reasoning Stream  │  │ Live ClickHouse SQL     │  │ Dynamic Visualizations  │  │
 │  │ (Step-by-step thinking) │  │ (Monaco / Syntax view)  │  │ (Bar, Line, Area, Pie)  │  │
 │  │  + MCP Tool Call Trace  │  │                         │  │ (Recharts Responsive)   │  │
 │  └─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘  │
 │  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐  │
 │  │ Executive Summary       │  │ Semantic Search Tool    │  │ Telemetry Live Monitor  │  │
 │  │ (Actionable Briefings)  │  │ (Vector sentiment drill)│  │ (Latency P95/P99 & Logs)│  │
 │  └─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘  │
 └─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Key Features

| Feature | Description |
| :--- | :--- |
| 🔌 **Official `mcp-clickhouse` Integration** | Actively connects at runtime to the official ClickHouse Model Context Protocol server, executing `list_tables` for zero-shot schema discovery and `run_query` for analytical data retrieval. |
| 🧠 **Google ADK Agent Platform** | Multi-agent autonomous pipeline powered by Google Agent Development Kit (`google-adk`) and Gemini 2.5 Flash for chain-of-thought orchestration. |
| 🛡️ **Self-Healing SQL** | Closed feedback loop that intercepts database execution errors (syntax mismatches, missing group keys), analyzes stack traces, and auto-repairs queries with zero user disruption. |
| ⚡ **Dual Engine (Cloud & Embedded)** | Connect seamlessly to live **ClickHouse Cloud** on GCP or instantly boot the zero-config embedded OLAP engine seeded with **140,000+ realistic entertainment records**. |
| 🔍 **Vector Semantic Search** | Cosine similarity search over 16-dimensional review embeddings to surface audience sentiment, identify pacing complaints, and pinpoint plot reactions. |
| 📁 **Dynamic Dataset Upload** | Drag-and-drop studio datasets (CSV, Parquet, JSON) with automatic schema inference and immediate natural language query capabilities. |
| 📡 **Live Telemetry Monitor** | Real-time monitoring of streaming infrastructure, tracking P95/P99 server latency, status codes (200, 500, 504), CPU/memory load, and connection pools. |
| 🔒 **Query Guardrails & Safety** | Built-in query validation, dialect linting, automated row limiting (`LIMIT 100`), and non-destructive execution protections. |

---

## 🎬 Sample Studio Queries

Test OmniQuery AI with realistic entertainment analytics scenarios:

### 1. Box Office Performance & Revenue Splits
> **Executive Prompt:** *"Which film genre generated the highest opening weekend revenue in Q2, and what was the average net profit margin?"*
```sql
SELECT 
    genre,
    SUM(gross_revenue) AS total_gross_revenue,
    SUM(opening_weekend) AS total_opening_weekend,
    AVG(net_profit) AS avg_net_profit,
    count(*) AS total_releases
FROM box_office_revenue
WHERE release_date >= '2026-04-01' AND release_date <= '2026-06-30'
GROUP BY genre
ORDER BY total_gross_revenue DESC
LIMIT 10;
```
*Visual Output:* Bar Chart comparing gross box office revenue and opening weekend totals by genre.

---

### 2. Audience Review Semantic Search & Sentiment Analysis
> **Executive Prompt:** *"Find audience reviews complaining about pacing issues or runtime using semantic search."*
```sql
SELECT 
    comment, 
    sentiment, 
    rating, 
    genre,
    topic_cluster
FROM audience_reviews 
WHERE topic_cluster IN ('pacing_complaint', 'plot_complaint')
   OR ILIKE(comment, '%slow%') 
   OR ILIKE(comment, '%pacing%')
ORDER BY rating ASC 
LIMIT 10;
```
*Visual Output:* Sentiment Distribution Pie Chart + Ranked Sentiment Feedback Table.

---

### 3. OTT Streaming Telemetry & Viewer Drop-off
> **Executive Prompt:** *"Show me streaming viewer drop-off rates, server latency spikes, and 500-series errors by microservice platform."*
```sql
SELECT 
    service_name,
    COUNT(*) AS total_requests,
    quantile(0.95)(latency_ms) AS p95_latency_ms,
    quantile(0.99)(latency_ms) AS p99_latency_ms,
    countIf(status_code >= 500) AS total_server_errors
FROM streaming_platform_metrics
GROUP BY service_name
ORDER BY total_server_errors DESC;
```
*Visual Output:* Multi-line telemetry chart tracking P95 latency spikes during peak weekend hours.

---

## 🔌 Official ClickHouse MCP Server (`mcp-clickhouse`) Integration

OmniQuery AI is built to strictly adhere to the [Agentic Cinema Hackathon ClickHouse Requirements](https://agentic-cinema.devpost.com/details/clickhouse-resources), actively communicating at runtime with the official **ClickHouse Model Context Protocol Server (`mcp-clickhouse`)**.

### Why MCP?
The Model Context Protocol (MCP) standardizes how LLM agents discover data structures and execute queries without brittle database connections. OmniQuery AI integrates official MCP tool endpoints to enable zero-shot autonomous data exploration:

```
                  ┌───────────────────────────────┐
                  │ Google ADK & Gemini 2.5 Flash │
                  └──────────────┬────────────────┘
                                 │
                 JSON-RPC 2.0 Request / Responses
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │  mcp-clickhouse Server Engine │
                  │                               │
                  │  ├── list_tables              │
                  │  └── run_query                │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │   ClickHouse Cloud Database   │
                  │  (140K+ Film Analytics Logs)  │
                  └───────────────────────────────┘
```

### Supported MCP Tools

#### 1. `list_tables`
- **Purpose**: Autonomous catalog & schema discovery.
- **Invocation Flow**: Called during Step 1 (Schema Introspection) so the agent discovers table names, partition structures, and data types without hardcoded schema prompts.
- **JSON-RPC Request Example**:
```json
{
  "jsonrpc": "2.0",
  "method": "call_tool",
  "params": {
    "name": "list_tables",
    "arguments": {}
  },
  "id": 1
}
```
- **Response**: Returns list of available tables: `["box_office_revenue", "streaming_platform_metrics", "audience_reviews"]`.

#### 2. `run_query`
- **Purpose**: High-speed analytical SQL execution with safety guardrails.
- **Invocation Flow**: Called during Step 3 (Execution) to run the generated and validated ClickHouse OLAP query.
- **JSON-RPC Request Example**:
```json
{
  "jsonrpc": "2.0",
  "method": "call_tool",
  "params": {
    "name": "run_query",
    "arguments": {
      "query": "SELECT genre, SUM(gross_revenue) AS total_gross FROM box_office_revenue GROUP BY genre ORDER BY total_gross DESC LIMIT 5;"
    }
  },
  "id": 2
}
```
- **Response**: Returns structured column metadata, row records, and execution metrics (latency in ms, rows scanned).

---

## 🧰 Tech Stack

### Backend & AI
- **Runtime:** Python 3.11+
- **Agent Platform:** Google Agent Development Kit (`google-adk`)
- **AI Brain:** Google Cloud Vertex AI & Google Gemini 2.5 Flash (`google-genai`)
- **Protocol Server:** Official ClickHouse MCP Server (`mcp-clickhouse`) via JSON-RPC 2.0
- **Primary Database:** ClickHouse Cloud (Columnar OLAP on GCP)
- **Embedded Engine:** DuckDB (Zero-configuration local analytical engine fallback)
- **Framework:** FastAPI (Asynchronous Server-Sent Events SSE streaming)
- **Data Science:** NumPy, Pandas, Pydantic, HTTPX

### Frontend & Command Center
- **Core Framework:** React 19 (TypeScript)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4 + Custom Dark Cinematic Theme
- **Data Visualizations:** Recharts (Dynamic Bar, Line, Area, and Pie charts)
- **UI Components:** Lucide Icons, Custom Terminal Streamer, Monaco SQL Viewer

---

## 🚀 Quick Start Guide

### Prerequisites
- [Python 3.10+](https://www.python.org/)
- [Node.js 18+](https://nodejs.org/) & `npm`
- *(Optional)* [Google Gemini API Key](https://aistudio.google.com/) or Vertex AI credentials

---

### 1. Clone & Configure Environment

```bash
# Clone the repository
git clone https://github.com/your-username/omniquery-ai.git
cd omniquery-ai

# Copy backend environment template
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your API keys:
```env
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Optional: Live ClickHouse Cloud connection (Leave empty to use Embedded Engine)
CLICKHOUSE_HOST=
CLICKHOUSE_PORT=8443
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
CLICKHOUSE_SECURE=true
```

---

### 2. Install Dependencies

```bash
# Install Python backend dependencies
cd backend
pip install -r requirements.txt

# Install React frontend dependencies
cd ../frontend
npm install
```

---

### 3. One-Click Launch (Windows)

Simply run the batch launcher:
```bat
start_all.bat
```

Or start the services individually:

**Terminal 1 (Backend):**
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Open your browser at **[http://localhost:5173](http://localhost:5173)** to access the command center!

---

## 📂 Repository Structure

```
omniquery-ai/
├── backend/
│   ├── app/
│   │   ├── agent/
│   │   │   ├── orchestrator.py        # Multi-agent state machine & SSE pipeline
│   │   │   └── prompts.py             # ClickHouse SQL few-shots & self-healing prompts
│   │   ├── db/
│   │   │   ├── clickhouse_engine.py   # Dual-mode ClickHouse Cloud & OLAP connector
│   │   │   └── seed_data.py           # 140,000+ record entertainment dataset generator
│   │   ├── api/
│   │   │   └── routes.py              # Streaming SSE, SQL runner & dataset endpoints
│   │   └── main.py                    # FastAPI entrypoint & CORS middleware
│   ├── tests/
│   │   └── test_engine.py             # Engine & SQL self-healing test suite
│   ├── requirements.txt               # Backend Python dependencies
│   └── .env.example                   # Environment configuration template
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LiveMonitor.tsx        # Real-time infrastructure & telemetry stats
│   │   │   ├── ResultsWorkbench.tsx   # Query result tables & CSV export
│   │   │   ├── SemanticSearchWidget.tsx # Vector search for audience reviews
│   │   │   ├── SqlPlayground.tsx      # Interactive SQL sandbox
│   │   │   └── UploadDatasetModal.tsx # Drag-and-drop CSV/Parquet dataset loader
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript data definitions
│   │   ├── App.tsx                    # Command Center primary layout
│   │   └── index.css                  # Dark mode styling & cinematic accents
│   ├── package.json                   # Frontend dependencies
│   └── vite.config.ts                 # Vite bundler config
├── start_all.bat                      # Windows launcher (Backend + Frontend)
├── start_backend.bat                  # Backend-only launcher
├── start_frontend.bat                 # Frontend-only launcher
└── README.md                          # Project Documentation
```

---

## 🧪 Testing & Verification

Execute the backend engine test suite to verify database connectivity, SQL generation, and autonomous self-healing:

```bash
cd backend
python tests/test_engine.py
```

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <b>Built with 🎬 for the Agentic Cinema Hackathon • ClickHouse Track • Powered by Google Cloud & Vertex AI</b>
</p>
