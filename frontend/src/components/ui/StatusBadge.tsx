"use client";

import type { EmployeeStatus } from "@/lib/types";

const CONFIG: Record<EmployeeStatus, { label: string; labelAr: string; cls: string; dot: string }> = {
  FLIGHT_RISK:       { label: "Flight Risk",       labelAr: "خطر المغادرة",       cls: "badge-flight-risk",       dot: "var(--critical)" },
  PROMOTION_DUE:     { label: "Promotion Due",      labelAr: "ترقية متأخرة",        cls: "badge-promotion-due",     dot: "var(--high)" },
  NEEDS_ATTENTION:   { label: "Needs Attention",    labelAr: "يحتاج متابعة",       cls: "badge-needs-attention",   dot: "var(--medium)" },
  ON_TRACK:          { label: "On Track",           labelAr: "على المسار",          cls: "badge-on-track",          dot: "var(--success)" },
};

interface StatusBadgeProps {
  status: EmployeeStatus;
  showAr?: boolean;
}

export function StatusBadge({ status, showAr = false }: StatusBadgeProps) {
  const c = CONFIG[status];
  return (
    <span className={`badge ${c.cls}`}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
      {showAr ? c.labelAr : c.label}
    </span>
  );
}
