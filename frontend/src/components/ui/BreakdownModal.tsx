"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { BreakdownData, EmployeeProfile } from "@/lib/types";

interface BreakdownModalProps {
  data: BreakdownData;
  onClose: () => void;
  onOpenEmployee: (id: string) => void;
}

export function BreakdownModal({ data, onClose, onOpenEmployee }: BreakdownModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>{data.title}</h2>
            {data.subtitle && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{data.subtitle}</div>
            )}
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
              {data.employees.length} employees
            </div>
          </div>
          <button className="drawer-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Grade</th>
                  <th>Status</th>
                  <th>Score 2025</th>
                </tr>
              </thead>
              <tbody>
                {data.employees.map((emp) => (
                  <tr key={emp.employee_id} onClick={() => { onOpenEmployee(emp.employee_id!); onClose(); }}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{emp.full_name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{emp.employee_id}</div>
                    </td>
                    <td className="muted">{emp.department}</td>
                    <td className="muted">Grade {emp.grade}</td>
                    <td>{emp.status && <StatusBadge status={emp.status} />}</td>
                    <td>
                      {emp.perf_2025 != null ? (
                        <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)" }}>{emp.perf_2025}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
