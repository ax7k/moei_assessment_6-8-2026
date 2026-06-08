"use client";

import { useEffect, useState } from "react";
import { X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { EmployeeProfile } from "@/lib/types";

interface EmployeeProfileDrawerProps {
  employeeId: string;
  onClose: () => void;
}

function fmt(n: number) {
  return n?.toLocaleString("en-AE") ?? "—";
}

function fmtDate(s: string) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-AE", { year: "numeric", month: "short", day: "numeric" });
}

export function EmployeeProfileDrawer({ employeeId, onClose }: EmployeeProfileDrawerProps) {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.employee(employeeId)
      .then((d) => { setProfile(d as EmployeeProfile); setLoading(false); })
      .catch(() => setLoading(false));
  }, [employeeId]);

  const perfTrend = () => {
    if (!profile?.performance_history || profile.performance_history.length < 2) return null;
    const sorted = [...profile.performance_history].sort((a, b) => a.cycle_year - b.cycle_year);
    const delta = sorted[sorted.length - 1].score - sorted[sorted.length - 2].score;
    if (delta > 0) return <TrendingUp size={14} style={{ color: "var(--success)" }} />;
    if (delta < 0) return <TrendingDown size={14} style={{ color: "var(--critical)" }} />;
    return <Minus size={14} style={{ color: "var(--text-muted)" }} />;
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>
        ) : profile ? (
          <>
            {/* Header */}
            <div className="drawer-header">
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <div
                    style={{
                      width: 40, height: 40,
                      borderRadius: "50%",
                      background: "var(--navy)",
                      color: "white",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    {profile.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{profile.full_name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{profile.job_title} · {profile.employee_id}</div>
                  </div>
                </div>
                {profile.status && <StatusBadge status={profile.status} />}
              </div>
              <button className="drawer-close" onClick={onClose}><X size={16} /></button>
            </div>

            <div className="drawer-body">
              {/* Quick stats */}
              <div className="profile-stat-row">
                <div className="profile-stat">
                  <div className="profile-stat-label">Department</div>
                  <div className="profile-stat-value">{profile.department}</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-label">Grade</div>
                  <div className="profile-stat-value">Grade {profile.grade} · {profile.employment_type}</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-label">Salary</div>
                  <div className="profile-stat-value">{fmt(profile.monthly_salary_aed)} AED</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-label">Engagement</div>
                  <div className="profile-stat-value">{profile.engagement_score} / 100</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-label">Hire Date</div>
                  <div className="profile-stat-value" style={{ fontSize: 13 }}>{fmtDate(profile.hire_date)}</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-label">Last Promotion</div>
                  <div className="profile-stat-value" style={{ fontSize: 13 }}>
                    {fmtDate(profile.last_promotion_date)}
                    {profile.years_since_promotion > 0 && (
                      <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}>
                        ({profile.years_since_promotion}y ago)
                      </span>
                    )}
                  </div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-label">UAE National</div>
                  <div className="profile-stat-value">{profile.uae_national}</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-label">Training Hours</div>
                  <div className="profile-stat-value">{profile.total_training_hours}h total</div>
                </div>
              </div>

              <div className="divider" />

              {/* Performance History */}
              <div className="section">
                <div className="flex-between gap-8" style={{ marginBottom: 12 }}>
                  <h3>Performance History</h3>
                  {perfTrend()}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {profile.performance_history.map((p) => {
                    const color = p.score >= 85 ? "var(--success)" : p.score >= 70 ? "var(--blue)" : "var(--critical)";
                    return (
                      <div
                        key={p.cycle_year}
                        style={{
                          flex: 1, background: "var(--surface)", border: "1px solid var(--border)",
                          borderRadius: "var(--radius)", padding: "12px", textAlign: "center",
                          borderTop: `3px solid ${color}`,
                        }}
                      >
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{p.cycle_year}</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color, margin: "4px 0" }}>{p.score}</div>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{p.rating_band}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.objectives_met_pct}% objectives</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="divider" />

              {/* Leave Summary */}
              <div className="section">
                <h3 style={{ marginBottom: 12 }}>Leave Status</h3>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Year</th><th>Type</th><th>Entitled</th><th>Taken</th><th>Balance</th><th>Usage</th></tr></thead>
                    <tbody>
                      {profile.leave_summary.map((l, i) => {
                        const pct = l.entitled_days > 0 ? Math.round(100 * l.taken_days / l.entitled_days) : 0;
                        const color = pct >= 80 ? "var(--critical)" : pct >= 60 ? "var(--medium)" : "var(--success)";
                        return (
                          <tr key={i}>
                            <td className="muted">{l.year}</td>
                            <td>{l.leave_type}</td>
                            <td className="muted">{l.entitled_days}d</td>
                            <td style={{ fontWeight: 500 }}>{l.taken_days}d</td>
                            <td className="muted">{l.balance_days}d</td>
                            <td>
                              <span style={{ fontWeight: 600, color, fontFamily: "var(--font-mono)", fontSize: 12 }}>{pct}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="divider" />

              {/* Training Log */}
              <div className="section">
                <h3 style={{ marginBottom: 12 }}>Training Log</h3>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Course</th><th>Category</th><th>Hours</th><th>Status</th></tr></thead>
                    <tbody>
                      {profile.training_log.slice(0, 10).map((t, i) => (
                        <tr key={i}>
                          <td>
                            <div style={{ fontWeight: 500, fontSize: 12 }}>{t.course_name}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.provider}</div>
                          </td>
                          <td className="muted">{t.category}</td>
                          <td className="muted">{t.hours}h</td>
                          <td>
                            <span className={`badge ${t.status === "Completed" ? "badge-on-track" : t.status === "In Progress" ? "badge-blue" : "badge-needs-attention"}`}>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="divider" />

              {/* Career Timeline */}
              <div className="section">
                <h3 style={{ marginBottom: 16 }}>Career Timeline</h3>
                <ul className="timeline">
                  {profile.movement_history.map((m, i) => {
                    let desc = "";
                    if (m.event_type === "Hire") desc = `Joined MOEI → ${m.to_department} (Grade ${m.to_grade})`;
                    else if (m.event_type === "Promotion") desc = `Promoted Grade ${m.from_grade} → ${m.to_grade}`;
                    else if (m.event_type === "Transfer") desc = `Transferred: ${m.from_department} → ${m.to_department}`;
                    return (
                      <li key={i} className="timeline-item">
                        <div className={`timeline-dot ${m.event_type.toLowerCase()}`} />
                        <div className="timeline-content">
                          <div className="timeline-event">{desc}</div>
                          <div className="timeline-date">{fmtDate(m.effective_date)}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Employee not found</div>
        )}
      </div>
    </div>
  );
}
