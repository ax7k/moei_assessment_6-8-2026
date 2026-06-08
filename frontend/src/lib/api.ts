const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

export const api = {
  // Overview
  overviewKPIs: () => get("/api/overview/kpis"),
  alerts: () => get("/api/overview/alerts"),

  // Departments
  departments: () => get("/api/departments"),
  deptKPIs: (dept: string) =>
    get(`/api/departments/${encodeURIComponent(dept)}/kpis`),
  deptEmployees: (dept: string) =>
    get(`/api/departments/${encodeURIComponent(dept)}/employees`),

  // People
  allEmployees: () => get("/api/employees"),
  employee: (id: string) => get(`/api/employees/${encodeURIComponent(id)}`),

  // Skills
  skills: () => get("/api/skills"),
};
