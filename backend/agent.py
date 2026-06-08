import os
import json
from typing import TypedDict, Annotated, Optional, Literal
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from dotenv import load_dotenv

load_dotenv()

from db import get_schema_ddl, execute_sql
from policy_retriever import retrieve_policy

# ── LLM via OpenRouter ────────────────────────────────────────────────────────

llm = ChatOpenAI(
    model="minimax/minimax-m3",
    openai_api_key=os.environ["OPENROUTER_API_KEY"],
    openai_api_base="https://openrouter.ai/api/v1",
    temperature=0.1,
    default_headers={
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "MOEI HR Companion",
    },
)


# ── Agent State ───────────────────────────────────────────────────────────────

class HRAgentState(TypedDict):
    messages: Annotated[list, add_messages]
    query: str
    query_type: str          # "data" | "policy" | "general"
    sql: Optional[str]
    sql_results: Optional[list]
    sql_error: Optional[str]
    repair_attempts: int
    policy_context: Optional[str]
    final_answer: str


# ── Nodes ─────────────────────────────────────────────────────────────────────

def classify_query(state: HRAgentState) -> HRAgentState:
    """Classify the incoming query as data / policy / general."""
    messages = state.get("messages", [])
    human_messages = [m for m in messages if isinstance(m, HumanMessage)]
    query = human_messages[-1].content if human_messages else state.get("query", "")

    resp = llm.invoke([
        SystemMessage(content=(
            "You are a query classifier for an HR management system.\n"
            "Classify the user's query into exactly ONE of:\n"
            "  data    – about employees, performance, training, leave, salaries, promotions, departments\n"
            "  policy  – about HR laws, rules, regulations, leave entitlements, promotion criteria\n"
            "  general – greetings, navigation requests, or anything that needs neither data nor policy\n\n"
            "Reply with ONLY the single word: data, policy, or general"
        )),
        HumanMessage(content=query),
    ])

    query_type = resp.content.strip().lower()
    if query_type not in ("data", "policy", "general"):
        query_type = "data"

    return {**state, "query": query, "query_type": query_type, "repair_attempts": 0}


def generate_sql(state: HRAgentState) -> HRAgentState:
    """Generate a SQLite query from natural language."""
    schema = get_schema_ddl()
    query = state["query"]

    resp = llm.invoke([
        SystemMessage(content=(
            f"You are an expert SQLite query writer.\n\n"
            f"{schema}\n\n"
            "Rules:\n"
            "1. Output ONLY valid SQLite SQL — no explanation, no markdown fences.\n"
            "2. Always include full_name when returning individual employee rows.\n"
            "3. Use LIMIT 100 unless the question explicitly asks for all records.\n"
            "4. Use 'leave_data' as the leave table name (NOT 'leave').\n"
            "5. Use julianday() for date arithmetic.\n"
            "6. TODAY ≈ 2026-06-08.\n\n"
            "Generate ONE valid SQL query for the user's question."
        )),
        HumanMessage(content=query),
    ])

    sql = resp.content.strip()
    # Strip any accidental markdown fences
    if "```" in sql:
        parts = sql.split("```")
        sql = parts[1].lstrip("sql").strip() if len(parts) > 1 else sql

    return {**state, "sql": sql}


def execute_sql_node(state: HRAgentState) -> HRAgentState:
    """Run the SQL query against the SQLite DB."""
    try:
        results = execute_sql(state["sql"])
        return {**state, "sql_results": results, "sql_error": None}
    except Exception as exc:
        return {**state, "sql_results": None, "sql_error": str(exc)}


def repair_sql(state: HRAgentState) -> HRAgentState:
    """Fix a failing SQL query (max 2 attempts)."""
    schema = get_schema_ddl()

    resp = llm.invoke([
        SystemMessage(content=(
            f"You are an SQLite expert fixing a broken query.\n\n"
            f"{schema}\n\n"
            f"The query below failed with error:\n{state['sql_error']}\n\n"
            f"Broken query:\n{state['sql']}\n\n"
            "Output ONLY the corrected SQL — no explanation, no fences."
        )),
    ])

    fixed = resp.content.strip()
    if "```" in fixed:
        parts = fixed.split("```")
        fixed = parts[1].lstrip("sql").strip() if len(parts) > 1 else fixed

    return {
        **state,
        "sql": fixed,
        "repair_attempts": state.get("repair_attempts", 0) + 1,
    }


def retrieve_policy_node(state: HRAgentState) -> HRAgentState:
    """BM25-search the MOEI policy PDF corpus."""
    context = retrieve_policy(state["query"])
    return {**state, "policy_context": context}


def generate_answer(state: HRAgentState) -> HRAgentState:
    """Synthesise the final answer from DB results or policy context."""
    query = state["query"]
    query_type = state.get("query_type", "general")

    if query_type == "data" and state.get("sql_results") is not None:
        rows = state["sql_results"]
        results_str = json.dumps(rows[:50], ensure_ascii=False, indent=2)
        if len(rows) > 50:
            results_str += f"\n… and {len(rows) - 50} more records."
        context = f"Database results ({len(rows)} rows):\n{results_str}"
    elif query_type == "policy" and state.get("policy_context"):
        context = f"Relevant policy excerpts:\n{state['policy_context']}"
    elif state.get("sql_error"):
        context = f"Note: the database query failed after repair attempts.\nError: {state['sql_error']}"
    else:
        context = ""

    resp = llm.invoke([
        SystemMessage(content=(
            "You are an intelligent HR management assistant for MOEI "
            "(Ministry of Energy & Infrastructure, UAE).\n\n"
            "You help senior managers and HR executives understand their workforce.\n\n"
            "Guidelines:\n"
            "- Be concise, professional, and data-driven.\n"
            "- If the user's message is in Arabic, reply entirely in Arabic.\n"
            "- When data is available, lead with key findings, then list details.\n"
            "- Format AED amounts with commas (e.g. 17,381 AED).\n"
            "- Never invent data — only use what is provided below.\n"
            "- Highlight actionable insights when relevant.\n\n"
            + context
        )),
        HumanMessage(content=query),
    ])

    answer = resp.content
    return {
        **state,
        "final_answer": answer,
        "messages": state["messages"] + [AIMessage(content=answer)],
    }


# ── Routing ───────────────────────────────────────────────────────────────────

def route_after_classify(state: HRAgentState) -> Literal["generate_sql", "retrieve_policy", "generate_answer"]:
    t = state.get("query_type", "general")
    if t == "data":
        return "generate_sql"
    if t == "policy":
        return "retrieve_policy"
    return "generate_answer"


def route_after_execute(state: HRAgentState) -> Literal["repair_sql", "generate_answer"]:
    if state.get("sql_error") and state.get("repair_attempts", 0) < 2:
        return "repair_sql"
    return "generate_answer"


# ── Graph ─────────────────────────────────────────────────────────────────────

def create_graph():
    g = StateGraph(HRAgentState)

    g.add_node("classify_query",    classify_query)
    g.add_node("generate_sql",      generate_sql)
    g.add_node("execute_sql",       execute_sql_node)
    g.add_node("repair_sql",        repair_sql)
    g.add_node("retrieve_policy",   retrieve_policy_node)
    g.add_node("generate_answer",   generate_answer)

    g.set_entry_point("classify_query")

    g.add_conditional_edges("classify_query", route_after_classify, {
        "generate_sql":   "generate_sql",
        "retrieve_policy": "retrieve_policy",
        "generate_answer": "generate_answer",
    })

    g.add_edge("generate_sql", "execute_sql")

    g.add_conditional_edges("execute_sql", route_after_execute, {
        "repair_sql":     "repair_sql",
        "generate_answer": "generate_answer",
    })

    g.add_edge("repair_sql",       "execute_sql")
    g.add_edge("retrieve_policy",  "generate_answer")
    g.add_edge("generate_answer",  END)

    return g.compile()
