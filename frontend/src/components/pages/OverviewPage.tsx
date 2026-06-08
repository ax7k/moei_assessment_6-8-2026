"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { KPICard } from "@/components/ui/KPICard";
import type { Alert, BreakdownData, OverviewKPIs } from "@/lib/types";

interface OverviewPageProps {
  onBreakdown: (data: BreakdownData) => void;
}

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export function OverviewPage({ onBreakdown }: OverviewPageProps) {
  const [kpis, setKpis] = useState<OverviewKPIs | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.overviewKPIs(), api.alerts()])
      .then(([k, a]) => {
        setKpis(k as OverviewKPIs);
        setAlerts((a as Alert[]).sort((x, y) => SEVERITY_ORDER[x.severity] - SEVERITY_ORDER[y.severity]));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  const permanent = kpis?.employment_breakdown?.["Permanent"] ?? 0;
  const male = kpis?.gender_breakdown?.["M"] ?? 0;
  const female = kpis?.gender_breakdown?.["F"] ?? 0;
  const total = kpis?.total_employees ?? 1;

  return (
    <div className="page-body">
      {/* KPI Strip */}
      <div className="kpi-grid">
        <KPICard label="Total Employees" labelAr="إجمالي الموظفين" value={kpis?.total_employees ?? "—"} sub="Across all departments" accent="blue" />
        <KPICard label="Emirati Nationals" labelAr="مواطنون" value={`${kpis?.emirati_pct ?? "—"}%`} sub="Emiratisation rate" accent="gold" />
        <KPICard label="Avg. Engagement" labelAr="متوسط التفاعل" value={kpis?.avg_engagement ?? "—"} sub="Out of 100" accent="blue" />
        <KPICard label="Avg. Performance 2025" labelAr="متوسط الأداء" value={kpis?.avg_performance_2025 ?? "—"} sub="Latest cycle score" accent="success" />
        <KPICard label="Promotions in 2025" labelAr="ترقيات 2025" value={kpis?.promotions_2025 ?? "—"} sub="YTD this year" accent="success" />
        <KPICard label="New Joiners 2025" labelAr="موظفون جدد" value={kpis?.new_joiners_2025 ?? "—"} sub="Hired this year" accent="blue" />
      </div>

      {/* Alert Board */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">⚡ Action Required · يستدعي الاهتمام</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Click any card to see the employees</div>
        </div>
        <div className="alert-grid">
          {alerts.map((alert) => (
            <div
              key={alert.type}
              className={`alert-card severity-${alert.severity}`}
              onClick={() =>
                onBreakdown({
                  title: alert.label,
                  subtitle: alert.label_ar,
                  employees: alert.employees,
                })
              }
            >
              <div className="alert-count">{alert.count}</div>
              <div className="alert-label">{alert.label}</div>
              <div className="alert-label-ar">{alert.label_ar}</div>
              <div className="alert-cta">View employees →</div>
            </div>
          ))}
        </div>
      </div>

      {/* Org Composition */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">Workforce Composition</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <StatBlock label="Gender Split" labelAr="توزيع الجنس">
            <MiniBar label="Male · ذكور" value={male} total={total} color="var(--navy)" />
            <MiniBar label="Female · إناث" value={female} total={total} color="var(--blue)" />
          </StatBlock>
          <StatBlock label="Employment Type" labelAr="نوع التوظيف">
            <MiniBar label="Permanent · دائم" value={permanent} total={total} color="var(--success)" />
            <MiniBar label="Contract · عقد" value={total - permanent} total={total} color="var(--gold)" />
          </StatBlock>
          <StatBlock label="Nationality" labelAr="الجنسية">
            <MiniBar label={`UAE Nationals (${kpis?.emirati_pct}%)`} value={Math.round((kpis?.emirati_pct ?? 0) / 100 * total)} total={total} color="var(--gold)" />
            <MiniBar label="Non-UAE" value={total - Math.round((kpis?.emirati_pct ?? 0) / 100 * total)} total={total} color="var(--border-dark)" />
          </StatBlock>
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, labelAr, children }: { label: string; labelAr: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px 18px" }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 14, direction: "rtl", textAlign: "right" }}>{labelAr}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </div>
  );
}

function MiniBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: "var(--text-secondary)" }}>{label}</span>
        <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{value} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({pct}%)</span></span>
      </div>
      <div style={{ height: 5, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="page-body">
      <div className="kpi-grid">
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ height: 80, background: "var(--border)", borderRadius: "var(--radius)", animation: "pulse 1.5s infinite" }} />
        ))}
      </div>
    </div>
  );
}
