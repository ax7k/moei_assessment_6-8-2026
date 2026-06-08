import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from db import (
    load_csv_to_sqlite,
    get_overview_kpis,
    get_alerts,
    get_departments,
    get_department_kpis,
    get_department_employees,
    get_all_employees,
    get_employee_profile,
    get_skills_heatmap,
)
from agent import create_graph
from policy_retriever import _load_policy_index

from copilotkit import CopilotKitSDK, LangGraphAgent
from copilotkit.integrations.fastapi import add_fastapi_endpoint


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("⟳  Starting MOEI HR Companion backend …")
    load_csv_to_sqlite()
    _load_policy_index()
    print("✓  Backend ready!")
    yield
    print("⟳  Shutting down …")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="MOEI HR Companion API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://frontend:3000",     # Docker service name
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok"}


# ── Overview ──────────────────────────────────────────────────────────────────

@app.get("/api/overview/kpis")
async def overview_kpis():
    return get_overview_kpis()


@app.get("/api/overview/alerts")
async def overview_alerts():
    return get_alerts()


# ── Departments ───────────────────────────────────────────────────────────────

@app.get("/api/departments")
async def departments():
    return get_departments()


@app.get("/api/departments/{department}/kpis")
async def department_kpis(department: str):
    return get_department_kpis(department)


@app.get("/api/departments/{department}/employees")
async def department_employees(department: str):
    return get_department_employees(department)


# ── People ────────────────────────────────────────────────────────────────────

@app.get("/api/employees")
async def all_employees():
    return get_all_employees()


@app.get("/api/employees/{employee_id}")
async def employee_profile(employee_id: str):
    profile = get_employee_profile(employee_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Employee not found")
    return profile


# ── Skills & Training ─────────────────────────────────────────────────────────

@app.get("/api/skills")
async def skills_heatmap():
    return get_skills_heatmap()


# ── CopilotKit ────────────────────────────────────────────────────────────────

hr_graph = create_graph()

sdk = CopilotKitSDK(
    agents=[
        LangGraphAgent(
            name="hr_agent",
            description=(
                "MOEI HR management AI assistant. "
                "Answers natural-language questions about the 260-employee workforce: "
                "performance, training, leave, promotions, flight risks, and HR policies. "
                "Works in both English and Arabic."
            ),
            graph=hr_graph,
        )
    ]
)

add_fastapi_endpoint(app, sdk, "/copilotkit")


# ── Dev runner ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
