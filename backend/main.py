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

from copilotkit import LangGraphAGUIAgent
from ag_ui_langgraph import add_langgraph_fastapi_endpoint


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[LOAD] Starting MOEI HR Companion backend...")
    load_csv_to_sqlite()
    # Note: policy index is lazy-loaded when the retriever is first called
    print("[OK] Backend ready!")
    yield
    print("[INFO] Shutting down...")


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

hr_agent = LangGraphAGUIAgent(
    name="hr_agent",
    description=(
        "MOEI HR management AI assistant. "
        "Answers natural-language questions about the 260-employee workforce: "
        "performance, training, leave, promotions, flight risks, and HR policies. "
        "Works in both English and Arabic."
    ),
    graph=hr_graph,
)

from fastapi import Request
from fastapi.responses import JSONResponse, StreamingResponse
from ag_ui.core.types import RunAgentInput
from ag_ui.encoder import EventEncoder

@app.post("/copilotkit")
async def custom_copilotkit_endpoint(request: Request):
    body = await request.json()
    
    if isinstance(body, dict):
        method = body.get("method")
        
        # 1. Handle info request (discovery of agents and actions)
        if method == "info":
            return JSONResponse(content={
                "actions": [],
                "agents": {
                    hr_agent.name: {
                        "name": hr_agent.name,
                        "description": hr_agent.description,
                        "type": "langgraph_agui"
                    }
                },
                "sdkVersion": "0.1.94"
            })
            
        # 2. Handle agent/connect handshake request
        elif method == "agent/connect":
            accept_header = request.headers.get("accept")
            encoder = EventEncoder(accept=accept_header)
            async def empty_generator():
                if False:
                    yield
            return StreamingResponse(
                empty_generator(),
                media_type=encoder.get_content_type()
            )
            
        # 3. Handle agent/stop request
        elif method == "agent/stop":
            return JSONResponse(content={"status": "ok"})
            
        # 4. Handle agent/run request
        elif method == "agent/run":
            input_data_dict = body.get("body", {})
            input_data = RunAgentInput(**input_data_dict)
        else:
            # Fallback for other methods or direct RunAgentInput
            try:
                input_data = RunAgentInput(**body)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Unsupported method or invalid body: {e}")
    else:
        # Fallback if body is not a dict
        input_data = RunAgentInput(**body)
        
    accept_header = request.headers.get("accept")
    encoder = EventEncoder(accept=accept_header)
    
    request_agent = hr_agent.clone()
    
    async def event_generator():
        async for event in request_agent.run(input_data):
            yield encoder.encode(event)
            
    return StreamingResponse(
        event_generator(),
        media_type=encoder.get_content_type()
    )

@app.get("/copilotkit/health")
def copilotkit_health():
    return {
        "status": "ok",
        "agent": {
            "name": hr_agent.name,
        }
    }


# ── Dev runner ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
