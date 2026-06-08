# MOEI HR Companion
### Executive HR Intelligence Dashboard · لوحة قيادة الموارد البشرية

AI-powered workforce analytics platform for the Ministry of Energy & Infrastructure (MOEI). Built for senior managers and HR executives to understand their 260-employee workforce through natural language queries, interactive charts, and policy retrieval.

---

## What it does

| Feature | Description |
|---|---|
| **Overview Dashboard** | Org-wide KPIs, action-required alert board, workforce composition charts |
| **Department Analytics** | Per-department KPIs, performance trends, rating distribution, grade breakdown |
| **People Directory** | Full 260-employee table with search, filter by department/grade/status, sortable columns |
| **Skills & Training** | Heatmap of training hours (dept × category), top learner leaderboard, cold enrollments |
| **Employee Profiles** | Full profile drawer: performance history, leave status, training log, career timeline |
| **AI Chat Assistant** | Natural language queries in **English or Arabic** — data questions, policy lookups, and dashboard navigation |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Browser (port 3000)                    │
│   Next.js 15 · IBM Plex Sans · Dubai Design System      │
│   CopilotKit UI · Recharts · Tailwind CSS v4             │
└──────────────────────┬──────────────────────────────────┘
                       │ REST + CopilotKit AG-UI
┌──────────────────────▼──────────────────────────────────┐
│                  Backend (port 8000)                     │
│   FastAPI · CopilotKit Runtime · LangGraph               │
│                                                          │
│   LangGraph Agent:                                       │
│   classify → SQL gen → execute → repair(×2) → answer    │
│                                                          │
│   MiniMax-M3 via OpenRouter                              │
└────────┬────────────────────────┬───────────────────────┘
         │                        │
┌────────▼────────┐    ┌──────────▼────────────┐
│  SQLite DB      │    │  BM25 Policy Index    │
│  (from 5 CSVs)  │    │  (24 MOEI HR PDFs)    │
└─────────────────┘    └───────────────────────┘
```

---

## Prerequisites

| Tool | Minimum Version | Check |
|---|---|---|
| Docker Desktop | Latest | `docker --version` |
| GNU Make | Any | `make --version` |
| Python + uv | Python 3.11+, uv latest | `uv --version` |
| Node.js | 20+ | `node --version` |

> **Windows note:** `make` requires Git Bash, WSL, or Chocolatey (`choco install make`). Without it, use `docker compose` commands directly — see below.

---

## Quick Start (Docker — Recommended)

### 1. Clone / open the project

```powershell
cd D:\moei\moei_assessment
```

### 2. Add your API key

The `.env` file already exists with the key. If you need to reset it:

```powershell
# backend/.env
OPENROUTER_API_KEY=sk-or-v1-...your-key-here...
```

### 3. Start Docker Desktop

Open **Docker Desktop** from the Start menu and wait for the whale icon in the system tray to stop animating ("Docker Desktop is running").

### 4. Spin everything up

```powershell
make up
# or without make:
docker compose up --build
```

First run takes **3–5 minutes** (downloads base images, installs dependencies). Subsequent runs are much faster.

### 5. Open the dashboard

| Service | URL |
|---|---|
| Dashboard | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

---

## Local Development (Without Docker)

Run the backend and frontend in separate terminals.

### Backend

```powershell
cd D:\moei\moei_assessment\backend

# Install dependencies (first time only)
uv sync

# Start the API server
uv run uvicorn main:app --reload --port 8000
```

The backend will:
1. Load all 5 CSVs → SQLite on first run (~5 seconds)
2. Index the MOEI HR policy PDFs with BM25
3. Expose REST endpoints + CopilotKit at `http://localhost:8000`

### Frontend

```powershell
cd D:\moei\moei_assessment\frontend

# Install dependencies (first time only)
npm install

# Start the dev server
npm run dev
```

Open http://localhost:3000.

---

## Makefile Commands

```powershell
make up            # Build images + start both containers (foreground)
make up-d          # Same but detached (background)
make down          # Stop all containers
make restart       # down + up
make logs          # Tail logs from both services
make logs-backend  # Backend logs only
make logs-frontend # Frontend logs only
make shell-backend # Open bash in backend container
make status        # Show running container status
make clean         # Remove containers + volumes (nuclear reset)
```

---

## Project Structure

```
moei_assessment/
│
├── Makefile                        ← One-command Docker launcher
├── docker-compose.yml              ← Container orchestration (dev mode)
├── README.md
│
├── backend/
│   ├── main.py                     ← FastAPI app + CopilotKit endpoint
│   ├── agent.py                    ← LangGraph HR agent (MiniMax-M3)
│   ├── db.py                       ← CSV → SQLite loader + all REST data
│   ├── policy_retriever.py         ← BM25 search over MOEI PDF policies
│   ├── pyproject.toml              ← uv dependencies
│   ├── .env                        ← API key + path config (gitignored)
│   ├── .env.example                ← Template for new setups
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css         ← Full design system (Dubai DS + IBM Plex Sans)
│   │   │   ├── layout.tsx          ← Root layout + font loading
│   │   │   └── page.tsx            ← App shell + CopilotKit provider
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx     ← Dark navy nav (EN + AR labels)
│   │   │   │   └── ChatPanel.tsx   ← CopilotKit AI chat
│   │   │   ├── pages/
│   │   │   │   ├── OverviewPage.tsx
│   │   │   │   ├── DepartmentsPage.tsx
│   │   │   │   ├── PeoplePage.tsx
│   │   │   │   └── SkillsPage.tsx
│   │   │   └── ui/
│   │   │       ├── KPICard.tsx
│   │   │       ├── StatusBadge.tsx
│   │   │       ├── BreakdownModal.tsx
│   │   │       └── EmployeeProfileDrawer.tsx
│   │   └── lib/
│   │       ├── api.ts              ← REST API client
│   │       └── types.ts            ← Shared TypeScript types
│   ├── .env.local                  ← NEXT_PUBLIC_API_URL=http://localhost:8000
│   └── Dockerfile
│
└── MOEI_HR_Employee_Dataset_CSV/
    ├── Employees.csv
    ├── Performance.csv
    ├── Training.csv
    ├── Leave.csv
    └── Movement.csv
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | — | **Required.** Your OpenRouter API key |
| `CSV_DIR` | `../MOEI_HR_Employee_Dataset_CSV` | Path to the 5 employee CSVs |
| `POLICY_DIR` | `../../resources/HR_Knowledge_Base` | Path to MOEI HR PDF documents |
| `DB_PATH` | `./hr_data.db` | SQLite database file path |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API URL |

---

## AI Agent — How It Works

The chat panel connects to a **LangGraph** agent that:

1. **Classifies** your query → `data` / `policy` / `general`
2. **Data queries** → generates SQLite SQL → executes → auto-repairs on failure (up to 2x) → synthesises answer
3. **Policy queries** → BM25 searches 24 MOEI HR policy PDFs → synthesises answer
4. **Navigation** → AI can call `navigateTo` to switch dashboard pages and open employee profiles

**Try asking:**
- *"Who are our flight risk employees in the Energy department?"*
- *"Show me the top 5 performers in 2025"*
- *"What is the annual leave entitlement policy?"*
- *"كم عدد الموظفين الإماراتيين في قسم المالية؟"* (Arabic)
- *"Navigate to the Skills page"*

---

## Data Model

All data is loaded from the 5 CSVs into a local SQLite database on startup.

| Table | Key columns |
|---|---|
| `employees` | employee_id, full_name, department, grade, salary, engagement_score |
| `performance` | employee_id, cycle_year, score, rating_band, objectives_met_pct |
| `training` | employee_id, course_name, category, hours, status |
| `leave_data` | employee_id, leave_type, year, entitled_days, taken_days |
| `movement` | employee_id, event_type, effective_date, from_grade, to_grade |

Derived flags computed at load time: `flight_risk`, `promotion_due`, `needs_attention`.

---

## Troubleshooting

**Docker Desktop not running**
> `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`
→ Start Docker Desktop and wait for it to fully load before running `make up`.

**Backend fails to start (missing CSV files)**
> Check that `MOEI_HR_Employee_Dataset_CSV/` is in `D:\moei\moei_assessment\` and contains all 5 CSV files.

**Chat says "could not connect to agent"**
> The backend takes ~20 seconds to start (CSV load + PDF index). Wait a moment and refresh.

**Policy answers are empty**
> The `POLICY_DIR` path may not be mounted. Check `docker-compose.yml` volume paths and make sure your PDF folder exists at `D:\moei\resources\HR_Knowledge_Base`.
