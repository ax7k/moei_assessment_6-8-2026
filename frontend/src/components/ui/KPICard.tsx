"use client";

interface KPICardProps {
  label: string;
  labelAr?: string;
  value: string | number;
  sub?: string;
  accent?: "blue" | "gold" | "critical" | "success";
  onClick?: () => void;
}

export function KPICard({ label, labelAr, value, sub, accent = "blue", onClick }: KPICardProps) {
  const accentClass = {
    blue: "kpi-card-accent",
    gold: "kpi-card-accent-gold",
    critical: "kpi-card-accent-critical",
    success: "kpi-card-accent-success",
  }[accent];

  return (
    <div
      className={`kpi-card ${accentClass}${onClick ? " clickable" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <div className="kpi-card-label">{label}{labelAr && <span style={{ opacity: 0.6, marginLeft: 4 }}>· {labelAr}</span>}</div>
      <div className="kpi-card-value">{value}</div>
      {sub && <div className="kpi-card-sub">{sub}</div>}
    </div>
  );
}
