import sqlite3
import pandas as pd
import os
from datetime import datetime
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# Paths can be overridden via environment variables (useful in Docker)
DB_PATH = os.environ.get(
    "DB_PATH",
    os.path.join(os.path.dirname(__file__), "hr_data.db")
)
CSV_DIR = os.environ.get(
    "CSV_DIR",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "MOEI_HR_Employee_Dataset_CSV"))
)


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def load_csv_to_sqlite():
    """Load all 5 CSV files into SQLite and create performance indexes."""
    print(f"Loading CSVs from: {CSV_DIR}")
    conn = sqlite3.connect(DB_PATH)

    tables = {
        "employees": "Employees.csv",
        "performance": "Performance.csv",
        "training": "Training.csv",
        "leave_data": "Leave.csv",       # 'leave' is a reserved keyword in SQL
        "movement": "Movement.csv",
    }

    for table_name, filename in tables.items():
        filepath = os.path.join(CSV_DIR, filename)
        df = pd.read_csv(filepath)
        df.to_sql(table_name, conn, if_exists="replace", index=False)
        print(f"  [OK] Loaded {len(df)} rows into '{table_name}'")

    # Create indexes for join performance
    conn.execute("CREATE INDEX IF NOT EXISTS idx_emp_dept ON employees(department)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_perf_emp ON performance(employee_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_training_emp ON training(employee_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_leave_emp ON leave_data(employee_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_movement_emp ON movement(employee_id)")
    conn.commit()
    conn.close()
    print("[OK] Database ready!")


def execute_sql(sql: str, max_rows: int = 500) -> list:
    """Execute a SQL query and return results as a list of dicts."""
    conn = get_connection()
    try:
        cursor = conn.execute(sql)
        columns = [d[0] for d in cursor.description]
        rows = cursor.fetchmany(max_rows)
        return [dict(zip(columns, row)) for row in rows]
    finally:
        conn.close()


def get_schema_ddl() -> str:
    """Return the full schema description used to prompt the SQL generator."""
    return """
DATABASE SCHEMA (SQLite — use SQLite-compatible syntax only):

TABLE employees:
  employee_id TEXT PRIMARY KEY          -- e.g. 'MOEI-10001'
  full_name TEXT
  gender TEXT                           -- 'M' or 'F'
  nationality TEXT
  uae_national TEXT                     -- 'Yes' or 'No'
  department TEXT                       -- e.g. 'Energy & Clean Energy', 'Human Resources', 'Finance',
                                        --      'Petroleum, Gas & Mineral Resources', 'Water & Electricity', etc.
  job_title TEXT
  grade INTEGER                         -- 1 (junior) to 8 (very senior)
  employment_type TEXT                  -- 'Permanent' or 'Contract'
  work_location TEXT                    -- city e.g. 'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'
  date_of_birth TEXT                    -- YYYY-MM-DD
  hire_date TEXT                        -- YYYY-MM-DD
  last_promotion_date TEXT              -- YYYY-MM-DD
  monthly_salary_aed REAL              -- in AED
  engagement_score INTEGER              -- 0 to 100
  manager_id TEXT                       -- FK to employees.employee_id
  email TEXT

TABLE performance:
  record_id TEXT PRIMARY KEY
  employee_id TEXT                      -- FK to employees.employee_id
  cycle_year INTEGER                    -- 2023, 2024, or 2025
  score INTEGER                         -- 0 to 100
  rating_band TEXT                      -- 'Exceeds Expectations', 'Meets Expectations',
                                        --  'Partially Meets', 'Unsatisfactory'
  objectives_met_pct INTEGER            -- 0 to 100
  reviewer_id TEXT

TABLE training:
  record_id TEXT PRIMARY KEY
  employee_id TEXT                      -- FK to employees.employee_id
  course_name TEXT
  category TEXT                         -- 'Digital & AI', 'Leadership', 'Project Management',
                                        --  'Language & Communication', 'Technical', etc.
  provider TEXT
  completion_date TEXT                  -- YYYY-MM-DD
  hours INTEGER
  status TEXT                           -- 'Completed', 'In Progress', 'Cold'
  result TEXT                           -- 'Passed', 'Failed', or NULL

TABLE leave_data:       ← USE 'leave_data' (NOT 'leave', which is a reserved SQL keyword)
  employee_id TEXT                      -- FK to employees.employee_id
  leave_type TEXT                       -- 'Annual', 'Sick'
  year INTEGER
  entitled_days INTEGER
  taken_days INTEGER
  balance_days INTEGER

TABLE movement:
  record_id TEXT PRIMARY KEY
  employee_id TEXT                      -- FK to employees.employee_id
  event_type TEXT                       -- 'Hire', 'Promotion', 'Transfer'
  effective_date TEXT                   -- YYYY-MM-DD
  from_grade INTEGER                    -- NULL for 'Hire' events
  to_grade INTEGER
  from_department TEXT                  -- NULL for 'Hire' events
  to_department TEXT

KEY DATE ARITHMETIC (SQLite):
  - Use julianday('now') - julianday(date_col) to get difference in days
  - Divide by 365.25 for years
  - Use strftime('%Y', date_col) to extract year
  - TODAY is approximately 2026-06-08

COMMON DERIVED METRICS:
  - Years since promotion: (julianday('now') - julianday(last_promotion_date)) / 365.25
  - Flight risk: engagement_score < 60 AND years_since_promotion >= 3
  - Promotion overdue: years_since_promotion >= 3 AND latest 2025 perf score >= 75
  - Consecutive underperformer: rating_band IN ('Partially Meets','Unsatisfactory') in both 2024 AND 2025

ALWAYS: Use LIMIT 100 unless user requests all records. Always include full_name when returning employee rows.
"""


def compute_status(emp: dict) -> str:
    years = emp.get("years_since_promotion") or 0
    engagement = emp.get("engagement_score") or 100
    score = emp.get("perf_2025") or 0
    rating = emp.get("rating_band") or ""

    if engagement < 60 and years >= 3:
        return "FLIGHT_RISK"
    if years >= 3 and score >= 75:
        return "PROMOTION_DUE"
    if rating in ("Partially Meets", "Unsatisfactory"):
        return "NEEDS_ATTENTION"
    return "ON_TRACK"


# ── Overview ─────────────────────────────────────────────────────────────────

def get_overview_kpis() -> dict:
    conn = get_connection()
    kpis: dict = {}

    kpis["total_employees"] = conn.execute(
        "SELECT COUNT(*) FROM employees"
    ).fetchone()[0]

    kpis["emirati_pct"] = conn.execute(
        "SELECT ROUND(100.0*SUM(CASE WHEN uae_national='Yes' THEN 1 ELSE 0 END)/COUNT(*),1) FROM employees"
    ).fetchone()[0]

    kpis["avg_engagement"] = conn.execute(
        "SELECT ROUND(AVG(engagement_score),1) FROM employees"
    ).fetchone()[0]

    kpis["avg_performance_2025"] = conn.execute(
        "SELECT ROUND(AVG(score),1) FROM performance WHERE cycle_year=2025"
    ).fetchone()[0]

    rows = conn.execute(
        "SELECT employment_type, COUNT(*) as c FROM employees GROUP BY employment_type"
    ).fetchall()
    kpis["employment_breakdown"] = {r["employment_type"]: r["c"] for r in rows}

    rows = conn.execute(
        "SELECT gender, COUNT(*) as c FROM employees GROUP BY gender"
    ).fetchall()
    kpis["gender_breakdown"] = {r["gender"]: r["c"] for r in rows}

    kpis["promotions_2025"] = conn.execute(
        "SELECT COUNT(*) FROM movement WHERE event_type='Promotion' AND strftime('%Y',effective_date)='2025'"
    ).fetchone()[0]

    kpis["new_joiners_2025"] = conn.execute(
        "SELECT COUNT(*) FROM employees WHERE strftime('%Y',hire_date)='2025'"
    ).fetchone()[0]

    conn.close()
    return kpis


def get_alerts() -> list:
    conn = get_connection()
    alerts = []

    # 1. Promotion overdue
    rows = conn.execute("""
        SELECT e.employee_id, e.full_name, e.department, e.grade,
               e.last_promotion_date, e.engagement_score,
               p.score as perf_2025, p.rating_band,
               ROUND((julianday('now')-julianday(e.last_promotion_date))/365.25,1) as years_since_promotion
        FROM employees e
        JOIN performance p ON e.employee_id=p.employee_id AND p.cycle_year=2025
        WHERE (julianday('now')-julianday(e.last_promotion_date))/365.25 >= 3
          AND p.score >= 75
        ORDER BY years_since_promotion DESC
    """).fetchall()
    alerts.append({
        "type": "promotion_overdue",
        "label": "Promotion Overdue",
        "label_ar": "ترقية متأخرة",
        "severity": "high",
        "count": len(rows),
        "employees": [dict(r) for r in rows],
    })

    # 2. Flight risk
    rows = conn.execute("""
        SELECT e.employee_id, e.full_name, e.department, e.grade,
               e.engagement_score, e.last_promotion_date,
               ROUND((julianday('now')-julianday(e.last_promotion_date))/365.25,1) as years_since_promotion
        FROM employees e
        WHERE e.engagement_score < 60
          AND (julianday('now')-julianday(e.last_promotion_date))/365.25 >= 3
        ORDER BY e.engagement_score ASC
    """).fetchall()
    alerts.append({
        "type": "flight_risk",
        "label": "Flight Risk",
        "label_ar": "خطر المغادرة",
        "severity": "critical",
        "count": len(rows),
        "employees": [dict(r) for r in rows],
    })

    # 3. Consecutive underperformers (2024 AND 2025)
    rows = conn.execute("""
        SELECT e.employee_id, e.full_name, e.department, e.grade,
               p24.score as score_2024, p24.rating_band as rating_2024,
               p25.score as score_2025, p25.rating_band as rating_2025
        FROM employees e
        JOIN performance p24 ON e.employee_id=p24.employee_id AND p24.cycle_year=2024
        JOIN performance p25 ON e.employee_id=p25.employee_id AND p25.cycle_year=2025
        WHERE p24.rating_band IN ('Partially Meets','Unsatisfactory')
          AND p25.rating_band IN ('Partially Meets','Unsatisfactory')
        ORDER BY p25.score ASC
    """).fetchall()
    alerts.append({
        "type": "consecutive_underperformer",
        "label": "Consecutive Underperformers",
        "label_ar": "ضعف متكرر في الأداء",
        "severity": "high",
        "count": len(rows),
        "employees": [dict(r) for r in rows],
    })

    # 4. High sick-leave usage (≥ 80 % of entitlement, 2026)
    rows = conn.execute("""
        SELECT e.employee_id, e.full_name, e.department,
               l.taken_days, l.entitled_days,
               ROUND(100.0*l.taken_days/l.entitled_days,0) as sick_pct
        FROM employees e
        JOIN leave_data l ON e.employee_id=l.employee_id
        WHERE l.leave_type='Sick' AND l.year=2026
          AND l.entitled_days > 0
          AND l.taken_days >= 0.8*l.entitled_days
        ORDER BY sick_pct DESC
    """).fetchall()
    alerts.append({
        "type": "sick_leave_high",
        "label": "High Sick Leave Usage",
        "label_ar": "استخدام مرتفع للإجازة المرضية",
        "severity": "medium",
        "count": len(rows),
        "employees": [dict(r) for r in rows],
    })

    # 5. High performers with zero 2025 completed training
    rows = conn.execute("""
        SELECT e.employee_id, e.full_name, e.department, p.score as perf_2025
        FROM employees e
        JOIN performance p ON e.employee_id=p.employee_id AND p.cycle_year=2025
        WHERE p.score >= 80
          AND e.employee_id NOT IN (
            SELECT DISTINCT employee_id FROM training
            WHERE status='Completed' AND strftime('%Y',completion_date)='2025'
          )
        ORDER BY p.score DESC
    """).fetchall()
    alerts.append({
        "type": "high_performer_no_training",
        "label": "High Performers – No 2025 Training",
        "label_ar": "موظفون متميزون بدون تدريب 2025",
        "severity": "medium",
        "count": len(rows),
        "employees": [dict(r) for r in rows],
    })

    conn.close()
    return alerts


# ── Departments ───────────────────────────────────────────────────────────────

def get_departments() -> list:
    conn = get_connection()
    rows = conn.execute(
        "SELECT DISTINCT department, COUNT(*) as headcount FROM employees GROUP BY department ORDER BY headcount DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_department_kpis(department: str) -> dict:
    conn = get_connection()
    kpis: dict = {}

    row = conn.execute("""
        SELECT COUNT(*) as headcount,
               ROUND(AVG(monthly_salary_aed),0) as avg_salary,
               ROUND(AVG(engagement_score),1) as avg_engagement,
               SUM(CASE WHEN uae_national='Yes' THEN 1 ELSE 0 END) as emirati_count,
               SUM(CASE WHEN gender='F' THEN 1 ELSE 0 END) as female_count,
               SUM(CASE WHEN employment_type='Contract' THEN 1 ELSE 0 END) as contract_count
        FROM employees WHERE department=?
    """, (department,)).fetchone()
    kpis.update(dict(row))
    hc = kpis["headcount"] or 1
    kpis["emirati_pct"] = round(100 * kpis["emirati_count"] / hc, 1)
    kpis["female_pct"] = round(100 * kpis["female_count"] / hc, 1)

    rows = conn.execute("""
        SELECT p.cycle_year, ROUND(AVG(p.score),1) as avg_score
        FROM performance p JOIN employees e ON p.employee_id=e.employee_id
        WHERE e.department=? GROUP BY p.cycle_year ORDER BY p.cycle_year
    """, (department,)).fetchall()
    kpis["performance_trend"] = [dict(r) for r in rows]

    rows = conn.execute("""
        SELECT p.rating_band, COUNT(*) as count
        FROM performance p JOIN employees e ON p.employee_id=e.employee_id
        WHERE e.department=? AND p.cycle_year=2025 GROUP BY p.rating_band
    """, (department,)).fetchall()
    kpis["rating_distribution"] = [dict(r) for r in rows]

    row = conn.execute("""
        SELECT SUM(CASE WHEN t.status='Completed' THEN 1 ELSE 0 END) as completed_courses,
               SUM(CASE WHEN t.status='Cold' THEN 1 ELSE 0 END) as cold_courses,
               SUM(CASE WHEN t.status='In Progress' THEN 1 ELSE 0 END) as in_progress_courses,
               COALESCE(SUM(CASE WHEN t.status='Completed' THEN t.hours ELSE 0 END),0) as total_hours
        FROM training t JOIN employees e ON t.employee_id=e.employee_id
        WHERE e.department=?
    """, (department,)).fetchone()
    kpis.update(dict(row))

    kpis["flight_risks"] = conn.execute("""
        SELECT COUNT(*) FROM employees
        WHERE department=? AND engagement_score < 60
          AND (julianday('now')-julianday(last_promotion_date))/365.25 >= 3
    """, (department,)).fetchone()[0]

    kpis["promotion_due"] = conn.execute("""
        SELECT COUNT(*) FROM employees e
        JOIN performance p ON e.employee_id=p.employee_id AND p.cycle_year=2025
        WHERE e.department=?
          AND (julianday('now')-julianday(e.last_promotion_date))/365.25 >= 3
          AND p.score >= 75
    """, (department,)).fetchone()[0]

    rows = conn.execute(
        "SELECT grade, COUNT(*) as count FROM employees WHERE department=? GROUP BY grade ORDER BY grade",
        (department,)
    ).fetchall()
    kpis["grade_distribution"] = [dict(r) for r in rows]

    conn.close()
    return kpis


def get_department_employees(department: str) -> list:
    conn = get_connection()
    rows = conn.execute("""
        SELECT e.employee_id, e.full_name, e.gender, e.uae_national, e.job_title,
               e.grade, e.employment_type, e.hire_date, e.last_promotion_date,
               e.monthly_salary_aed, e.engagement_score,
               p.score as perf_2025, p.rating_band,
               ROUND((julianday('now')-julianday(e.last_promotion_date))/365.25,1) as years_since_promotion
        FROM employees e
        LEFT JOIN performance p ON e.employee_id=p.employee_id AND p.cycle_year=2025
        WHERE e.department=?
        ORDER BY e.grade DESC, p.score DESC
    """, (department,)).fetchall()
    employees = [dict(r) for r in rows]
    for emp in employees:
        emp["status"] = compute_status(emp)
    conn.close()
    return employees


# ── People ────────────────────────────────────────────────────────────────────

def get_all_employees() -> list:
    conn = get_connection()
    rows = conn.execute("""
        SELECT e.employee_id, e.full_name, e.gender, e.uae_national, e.department,
               e.job_title, e.grade, e.employment_type, e.hire_date,
               e.last_promotion_date, e.monthly_salary_aed, e.engagement_score,
               p.score as perf_2025, p.rating_band,
               ROUND((julianday('now')-julianday(e.last_promotion_date))/365.25,1) as years_since_promotion
        FROM employees e
        LEFT JOIN performance p ON e.employee_id=p.employee_id AND p.cycle_year=2025
        ORDER BY e.department, e.grade DESC
    """).fetchall()
    employees = [dict(r) for r in rows]
    for emp in employees:
        emp["status"] = compute_status(emp)
    conn.close()
    return employees


def get_employee_profile(employee_id: str) -> dict:
    conn = get_connection()

    emp = conn.execute("SELECT * FROM employees WHERE employee_id=?", (employee_id,)).fetchone()
    if not emp:
        conn.close()
        return {}
    profile = dict(emp)

    perf = conn.execute(
        "SELECT cycle_year, score, rating_band, objectives_met_pct FROM performance WHERE employee_id=? ORDER BY cycle_year",
        (employee_id,)
    ).fetchall()
    profile["performance_history"] = [dict(r) for r in perf]

    training = conn.execute(
        "SELECT course_name, category, provider, completion_date, hours, status, result FROM training WHERE employee_id=? ORDER BY completion_date DESC",
        (employee_id,)
    ).fetchall()
    profile["training_log"] = [dict(r) for r in training]
    profile["total_training_hours"] = sum(
        (t["hours"] or 0) for t in profile["training_log"] if t["status"] == "Completed"
    )

    leave = conn.execute(
        "SELECT leave_type, year, entitled_days, taken_days, balance_days FROM leave_data WHERE employee_id=? ORDER BY year DESC, leave_type",
        (employee_id,)
    ).fetchall()
    profile["leave_summary"] = [dict(r) for r in leave]

    movements = conn.execute(
        "SELECT event_type, effective_date, from_grade, to_grade, from_department, to_department FROM movement WHERE employee_id=? ORDER BY effective_date",
        (employee_id,)
    ).fetchall()
    profile["movement_history"] = [dict(r) for r in movements]

    # Compute derived fields for status badge
    latest_2025 = [p for p in profile["performance_history"] if p["cycle_year"] == 2025]
    profile["perf_2025"] = latest_2025[0]["score"] if latest_2025 else None
    profile["rating_band"] = latest_2025[0]["rating_band"] if latest_2025 else None
    if profile.get("last_promotion_date"):
        try:
            promo_date = datetime.strptime(profile["last_promotion_date"][:10], "%Y-%m-%d")
            profile["years_since_promotion"] = round((datetime.now() - promo_date).days / 365.25, 1)
        except Exception:
            profile["years_since_promotion"] = 0
    else:
        profile["years_since_promotion"] = 0
    profile["status"] = compute_status(profile)

    conn.close()
    return profile


# ── Skills & Training ─────────────────────────────────────────────────────────

def get_skills_heatmap() -> dict:
    conn = get_connection()

    rows = conn.execute("""
        SELECT e.department, t.category,
               SUM(CASE WHEN t.status='Completed' THEN t.hours ELSE 0 END) as completed_hours,
               COUNT(CASE WHEN t.status='Cold' THEN 1 END) as cold_count,
               COUNT(CASE WHEN t.status='Completed' THEN 1 END) as completed_count
        FROM training t JOIN employees e ON t.employee_id=e.employee_id
        GROUP BY e.department, t.category
        ORDER BY e.department, t.category
    """).fetchall()
    heatmap_data = [dict(r) for r in rows]

    depts = sorted(set(r["department"] for r in heatmap_data))
    cats = sorted(set(r["category"] for r in heatmap_data))

    leaders = conn.execute("""
        SELECT e.employee_id, e.full_name, e.department,
               SUM(CASE WHEN t.status='Completed' THEN t.hours ELSE 0 END) as total_hours,
               COUNT(CASE WHEN t.status='Completed' THEN 1 END) as completed_count
        FROM employees e
        LEFT JOIN training t ON e.employee_id=t.employee_id
        GROUP BY e.employee_id
        ORDER BY total_hours DESC LIMIT 10
    """).fetchall()

    cold = conn.execute("""
        SELECT e.full_name, e.department, e.employee_id,
               t.course_name, t.category, t.provider
        FROM training t JOIN employees e ON t.employee_id=e.employee_id
        WHERE t.status='Cold'
        ORDER BY e.department LIMIT 100
    """).fetchall()

    conn.close()
    return {
        "heatmap": heatmap_data,
        "departments": depts,
        "categories": cats,
        "leaderboard": [dict(r) for r in leaders],
        "cold_enrollments": [dict(r) for r in cold],
    }
