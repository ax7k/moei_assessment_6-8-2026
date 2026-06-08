"use client";

import { useEffect, useState, useCallback } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "@/lib/api";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { DeptKPIs, Employee, BreakdownData } from "@/lib/types";

interface DepartmentsPageProps {
  selectedDept: string | null;
  onSelectDept: (dept: string) => void;
  onOpenEmployee: (id: string) => void;
  onBreakdown: (data: BreakdownData) => void;
}

const RATING_COLOR: Record<string, string> = {
  "Exceeds Expectations": "var(--success)",
  "Meets Expectations": "var(--blue)",
  "Partially Meets": "var(--medium)",
  "Unsatisfactory": "var(--critical)",
};

export function DepartmentsPage({ selectedDept, onSelectDept, onOpenEmployee, onBreakdown }: DepartmentsPageProps) {
  const [depts, setDepts] = useState<{ department: string; headcount: number }[]>([]);
  const [kpis, setKpis] = useState<DeptKPIs | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Load department list
  useEffect(() => {
    api.departments()
      .then((d) => {
        const list = d as { department: string; headcount: number }[];
        setDepts(list);
        if (!selectedDept && list.length > 0) onSelectDept(list[0].department);
      })
      .catch(() => setLoading(false));
  }, [selectedDept, onSelectDept]);

  // Load dept data when selection changes
  useEffect(() => {
    if (!selectedDept) return;
    setLoading(true);
    Promise.all([api.deptKPIs(selectedDept), api.deptEmployees(selectedDept)])
      .then(([k, e]) => {
        setKpis(k as DeptKPIs);
        setEmployees(e as Employee[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedDept]);

  const perf2025 = kpis?.performance_trend?.find((p) => p.cycle_year === 2025)?.avg_score;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Department Tabs */}
      <div className="dept-tabs-wrap">
        <div className="dept-tabs">
          {depts.map((d) => (
            <button
              key={d.department}
              className={`tab${selectedDept === d.department ? " active" : ""}`}
              onClick={() => onSelectDept(d.department)}
              style={{ background: "none", border: "none", fontFamily: "var(--font)", cursor: "pointer" }}
            >
              {d.department}
              <span style={{ marginLeft: 6, fontSize: 11, color: "var(--text-muted)" }}>({d.headcount})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dept Body */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>
      ) : kpis && (
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
          {/* KPI Strip */}
          <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
            <KPICard label="Headcount" value={kpis.headcount} accent="blue" />
            <KPICard label="Avg Salary" value={`${(kpis.avg_salary / 1000).toFixed(1)}K`} sub="AED / month" accent="gold" />
            <KPICard label="Avg Engagement" value={kpis.avg_engagement} accent="blue" />
            <KPICard label="Perf Score 2025" value={perf2025 ?? "—"} accent="success" />
            <KPICard
              label="Flight Risks"
              value={kpis.flight_risks}
              accent={kpis.flight_risks > 0 ? "critical" : "success"}
              onClick={kpis.flight_risks > 0 ? () => onBreakdown({ title: `Flight Risks – ${selectedDept}`, employees: employees.filter(e => e.status === "FLIGHT_RISK") }) : undefined}
            />
            <KPICard
              label="Promotion Due"
              value={kpis.promotion_due}
              accent={kpis.promotion_due > 0 ? "gold" : "success"}
              onClick={kpis.promotion_due > 0 ? () => onBreakdown({ title: `Promotion Due – ${selectedDept}`, employees: employees.filter(e => e.status === "PROMOTION_DUE") }) : undefined}
            />
            <KPICard label="Emirati %" value={`${kpis.emirati_pct}%`} accent="gold" />
            <KPICard label="Female %" value={`${kpis.female_pct}%`} accent="blue" />
            <KPICard label="Training Hours" value={kpis.total_hours} sub="Completed" accent="success" />
            <KPICard label="Cold Courses" value={kpis.cold_courses} accent={kpis.cold_courses > 5 ? "critical" : "blue"} />
          </div>

          {/* Charts Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            {/* Performance Trend */}
            <div className="chart-card">
              <div className="chart-card-title">Performance Trend (2023 → 2025)</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={kpis.performance_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="cycle_year" tick={{ fontSize: 12 }} />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ fontSize: 12, border: "1px solid var(--border)", borderRadius: 4 }} />
                  <Line type="monotone" dataKey="avg_score" stroke="var(--blue)" strokeWidth={2} dot={{ r: 4, fill: "var(--blue)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Rating Distribution */}
            <div className="chart-card">
              <div className="chart-card-title">2025 Rating Distribution</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={kpis.rating_distribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="rating_band" type="category" width={130} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, border: "1px solid var(--border)", borderRadius: 4 }} />
                  <Bar dataKey="count" fill="var(--blue)" radius={[0, 2, 2, 0]}>
                    {kpis.rating_distribution.map((entry, index) => (
                      <rect key={index} fill={RATING_COLOR[entry.rating_band] ?? "var(--blue)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grade Distribution */}
          <div className="chart-card" style={{ marginBottom: 24 }}>
            <div className="chart-card-title">Grade Distribution</div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              {kpis.grade_distribution.map((g) => {
                const maxCount = Math.max(...kpis.grade_distribution.map((d) => d.count));
                const height = Math.max(20, (g.count / maxCount) * 80);
                return (
                  <div key={g.grade} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: "var(--text-primary)" }}>{g.count}</div>
                    <div style={{ height, background: "var(--blue)", borderRadius: "2px 2px 0 0", transition: "height 0.3s" }} />
                    <div style={{ fontSize: 11, marginTop: 4, color: "var(--text-muted)" }}>G{g.grade}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Employee Table */}
          <div className="section">
            <div className="section-header">
              <div className="section-title">Employees in {selectedDept}</div>
              <span className="badge badge-blue">{employees.length} total</span>
            </div>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Job Title</th>
                    <th>Grade</th>
                    <th>Status</th>
                    <th>Score 2025</th>
                    <th>Engagement</th>
                    <th>Years Since Promo</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.employee_id} onClick={() => onOpenEmployee(emp.employee_id)}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{emp.full_name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{emp.uae_national === "Yes" ? "🇦🇪 " : ""}{emp.employment_type}</div>
                      </td>
                      <td className="muted">{emp.job_title}</td>
                      <td className="muted">Grade {emp.grade}</td>
                      <td><StatusBadge status={emp.status} /></td>
                      <td>
                        {emp.perf_2025 != null ? (
                          <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)", color: emp.perf_2025 >= 80 ? "var(--success)" : emp.perf_2025 >= 65 ? "var(--blue)" : "var(--critical)" }}>
                            {emp.perf_2025}
                          </span>
                        ) : "—"}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="engagement-bar-wrap">
                            <div className="engagement-bar-fill" style={{ width: `${emp.engagement_score}%` }} />
                          </div>
                          <span style={{ fontSize: 12, fontFamily: "var(--font-mono)" }}>{emp.engagement_score}</span>
                        </div>
                      </td>
                      <td className="muted">{emp.years_since_promotion?.toFixed(1)}y</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
