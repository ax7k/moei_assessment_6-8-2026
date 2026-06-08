"use client";

import { useEffect, useState, useMemo, Fragment } from "react";
import { api } from "@/lib/api";
import type { SkillsData, BreakdownData } from "@/lib/types";

interface SkillsPageProps {
  onBreakdown: (data: BreakdownData) => void;
}

function heatColor(hours: number, max: number): string {
  if (max === 0 || hours === 0) return "#F8FAFC";
  const intensity = Math.min(hours / max, 1);
  const r = Math.round(0 + (1 - intensity) * 200);
  const g = Math.round(155 * intensity + (1 - intensity) * 230);
  const b = Math.round(216 * intensity + (1 - intensity) * 252);
  return `rgb(${r},${g},${b})`;
}

function textColor(hours: number, max: number): string {
  const intensity = max > 0 ? Math.min(hours / max, 1) : 0;
  return intensity > 0.5 ? "white" : "var(--text-secondary)";
}

export function SkillsPage({ onBreakdown }: SkillsPageProps) {
  const [data, setData] = useState<SkillsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"heatmap" | "leaderboard" | "cold">("heatmap");

  useEffect(() => {
    api.skills()
      .then((d) => { setData(d as SkillsData); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const heatmapLookup = useMemo(() => {
    if (!data) return {};
    const map: Record<string, Record<string, number>> = {};
    data.heatmap.forEach((h) => {
      if (!map[h.department]) map[h.department] = {};
      map[h.department][h.category] = h.completed_hours;
    });
    return map;
  }, [data]);

  const maxHours = useMemo(() => Math.max(...(data?.heatmap.map((h) => h.completed_hours) ?? [0])), [data]);

  if (loading) return <div className="page-body" style={{ color: "var(--text-muted)" }}>Loading skills data…</div>;
  if (!data) return null;

  return (
    <div className="page-body">
      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        {([["heatmap", "Training Heatmap"], ["leaderboard", "Top Learners"], ["cold", "Cold Enrollments"]] as const).map(([id, label]) => (
          <button
            key={id}
            className={`tab${tab === id ? " active" : ""}`}
            onClick={() => setTab(id)}
            style={{ background: "none", border: "none", fontFamily: "var(--font)", cursor: "pointer" }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "heatmap" && (
        <div>
          <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-secondary)" }}>
            Showing completed training hours per department × category. Darker = more hours completed.
          </div>
          <div className="heatmap-wrap">
            <div
              className="heatmap-grid"
              style={{
                gridTemplateColumns: `180px repeat(${data.categories.length}, minmax(90px, 1fr))`,
              }}
            >
              {/* Header row */}
              <div className="heatmap-header-cell">Department ↓ / Category →</div>
              {data.categories.map((cat) => (
                <div key={cat} className="heatmap-header-cell" title={cat}>
                  {cat.length > 12 ? cat.slice(0, 12) + "…" : cat}
                </div>
              ))}

              {/* Data rows */}
              {data.departments.map((dept) => (
                <Fragment key={dept}>
                  <div className="heatmap-row-label" title={dept}>
                    {dept.length > 20 ? dept.slice(0, 20) + "…" : dept}
                  </div>
                  {data.categories.map((cat) => {
                    const hours = heatmapLookup[dept]?.[cat] ?? 0;
                    return (
                      <div
                        key={`${dept}-${cat}`}
                        className="heatmap-cell"
                        style={{
                          background: heatColor(hours, maxHours),
                          color: textColor(hours, maxHours),
                        }}
                        title={`${dept} · ${cat}: ${hours}h completed`}
                        onClick={() => hours === 0 && onBreakdown({
                          title: `No ${cat} training in ${dept}`,
                          subtitle: "Employees without completed training in this category",
                          employees: [],
                        })}
                      >
                        {hours > 0 ? `${hours}h` : "—"}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
            <span>Low</span>
            <div style={{ display: "flex", gap: 2 }}>
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((i) => (
                <div key={i} style={{ width: 24, height: 14, background: heatColor(i * maxHours, maxHours), border: "1px solid var(--border)", borderRadius: 2 }} />
              ))}
            </div>
            <span>High</span>
          </div>
        </div>
      )}

      {tab === "leaderboard" && (
        <div>
          <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-secondary)" }}>
            Top 10 employees by completed training hours.
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Name</th><th>Department</th><th>Total Hours</th><th>Courses Completed</th></tr>
              </thead>
              <tbody>
                {data.leaderboard.map((emp, i) => (
                  <tr key={emp.employee_id}>
                    <td style={{ fontFamily: "var(--font-mono)", color: i < 3 ? "var(--gold)" : "var(--text-muted)", fontWeight: 700 }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </td>
                    <td style={{ fontWeight: 500 }}>{emp.full_name}</td>
                    <td className="muted">{emp.department}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 80, height: 6, background: "var(--border)", borderRadius: 3 }}>
                          <div style={{ width: `${Math.min((emp.total_hours / (data.leaderboard[0]?.total_hours || 1)) * 100, 100)}%`, height: "100%", background: "var(--blue)", borderRadius: 3 }} />
                        </div>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{emp.total_hours}h</span>
                      </div>
                    </td>
                    <td className="muted">{emp.completed_count} courses</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "cold" && (
        <div>
          <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-secondary)" }}>
            Enrollments that were started but abandoned (Cold status). These represent wasted learning budget.
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Employee</th><th>Department</th><th>Course</th><th>Category</th><th>Provider</th></tr>
              </thead>
              <tbody>
                {data.cold_enrollments.map((c, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{c.full_name}</td>
                    <td className="muted">{c.department}</td>
                    <td style={{ fontSize: 12 }}>{c.course_name}</td>
                    <td className="muted">{c.category}</td>
                    <td className="muted">{c.provider}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
