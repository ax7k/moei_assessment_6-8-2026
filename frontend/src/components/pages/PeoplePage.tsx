"use client";

import { useEffect, useState, useMemo } from "react";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Employee, EmployeeStatus } from "@/lib/types";

interface PeoplePageProps {
  onOpenEmployee: (id: string) => void;
}

const STATUS_LABELS: Record<EmployeeStatus, string> = {
  FLIGHT_RISK: "Flight Risk",
  PROMOTION_DUE: "Promotion Due",
  NEEDS_ATTENTION: "Needs Attention",
  ON_TRACK: "On Track",
};

export function PeoplePage({ onOpenEmployee }: PeoplePageProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterGrade, setFilterGrade] = useState("all");
  const [sortBy, setSortBy] = useState<"full_name" | "perf_2025" | "engagement_score" | "grade">("full_name");

  useEffect(() => {
    api.allEmployees()
      .then((d) => { setEmployees(d as Employee[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const depts = useMemo(() => [...new Set(employees.map((e) => e.department))].sort(), [employees]);
  const grades = useMemo(() => [...new Set(employees.map((e) => e.grade))].sort((a, b) => a - b), [employees]);

  const filtered = useMemo(() => {
    return employees
      .filter((e) => {
        if (search && !e.full_name.toLowerCase().includes(search.toLowerCase()) && !e.job_title.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterDept !== "all" && e.department !== filterDept) return false;
        if (filterStatus !== "all" && e.status !== filterStatus) return false;
        if (filterGrade !== "all" && String(e.grade) !== filterGrade) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "perf_2025") return (b.perf_2025 ?? 0) - (a.perf_2025 ?? 0);
        if (sortBy === "engagement_score") return b.engagement_score - a.engagement_score;
        if (sortBy === "grade") return b.grade - a.grade;
        return a.full_name.localeCompare(b.full_name);
      });
  }, [employees, search, filterDept, filterStatus, filterGrade, sortBy]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    employees.forEach((e) => { c[e.status] = (c[e.status] ?? 0) + 1; });
    return c;
  }, [employees]);

  if (loading) return <div className="page-body" style={{ color: "var(--text-muted)" }}>Loading employees…</div>;

  return (
    <div className="page-body">
      {/* Status Summary Pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {(Object.keys(STATUS_LABELS) as EmployeeStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 2,
              border: "1px solid var(--border)",
              background: filterStatus === s ? "var(--navy)" : "var(--white)",
              color: filterStatus === s ? "white" : "var(--text-secondary)",
              fontSize: 12, fontWeight: 500, cursor: "pointer",
              fontFamily: "var(--font)",
            }}
          >
            <StatusBadge status={s} />
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{statusCounts[s] ?? 0}</span>
          </button>
        ))}
        {filterStatus !== "all" && (
          <button
            onClick={() => setFilterStatus("all")}
            style={{ padding: "5px 10px", fontSize: 12, color: "var(--text-muted)", background: "none", border: "1px dashed var(--border)", borderRadius: 2, cursor: "pointer", fontFamily: "var(--font)" }}
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="search-bar">
        <div className="search-input-wrap">
          <Search size={14} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search by name or job title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
          <option value="all">All Departments</option>
          {depts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="filter-select" value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} style={{ minWidth: 110 }}>
          <option value="all">All Grades</option>
          {grades.map((g) => <option key={g} value={String(g)}>Grade {g}</option>)}
        </select>
        <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as "full_name" | "perf_2025" | "engagement_score" | "grade")} style={{ minWidth: 130 }}>
          <option value="full_name">Sort: Name</option>
          <option value="perf_2025">Sort: Performance</option>
          <option value="engagement_score">Sort: Engagement</option>
          <option value="grade">Sort: Grade</option>
        </select>
      </div>

      {/* Count */}
      <div style={{ marginBottom: 12, fontSize: 12, color: "var(--text-muted)" }}>
        Showing <strong>{filtered.length}</strong> of {employees.length} employees
      </div>

      {/* Table */}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Department</th>
              <th>Job Title</th>
              <th>Grade</th>
              <th>Status</th>
              <th>Score 2025</th>
              <th>Engagement</th>
              <th>Promo Yrs</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => (
              <tr key={emp.employee_id} onClick={() => onOpenEmployee(emp.employee_id)}>
                <td>
                  <div style={{ fontWeight: 500 }}>{emp.full_name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{emp.uae_national === "Yes" && "🇦🇪 "}{emp.employee_id}</div>
                </td>
                <td className="muted" style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.department}</td>
                <td className="muted">{emp.job_title}</td>
                <td className="muted" style={{ fontFamily: "var(--font-mono)" }}>G{emp.grade}</td>
                <td><StatusBadge status={emp.status} /></td>
                <td>
                  {emp.perf_2025 != null ? (
                    <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)", color: emp.perf_2025 >= 80 ? "var(--success)" : emp.perf_2025 >= 65 ? "var(--blue)" : "var(--critical)" }}>
                      {emp.perf_2025}
                    </span>
                  ) : <span className="text-muted">—</span>}
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div className="engagement-bar-wrap"><div className="engagement-bar-fill" style={{ width: `${emp.engagement_score}%` }} /></div>
                    <span style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}>{emp.engagement_score}</span>
                  </div>
                </td>
                <td className="muted" style={{ fontFamily: "var(--font-mono)" }}>{emp.years_since_promotion?.toFixed(1)}y</td>
                <td className="muted">{emp.employment_type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
