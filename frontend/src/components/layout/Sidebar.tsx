"use client";

import { LayoutDashboard, Building2, Users, GraduationCap, Zap } from "lucide-react";
import type { Page } from "@/lib/types";

const NAV_ITEMS: { id: Page; label: string; labelAr: string; icon: React.FC<{ size?: number }> }[] = [
  { id: "overview", label: "Overview", labelAr: "نظرة عامة", icon: LayoutDashboard },
  { id: "departments", label: "Departments", labelAr: "الأقسام", icon: Building2 },
  { id: "people", label: "People", labelAr: "الموظفون", icon: Users },
  { id: "skills", label: "Skills & Training", labelAr: "المهارات والتدريب", icon: GraduationCap },
];

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <div
            style={{
              width: 28, height: 28,
              background: "var(--blue)",
              borderRadius: "var(--radius)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Zap size={16} color="white" />
          </div>
          <div>
            <div className="sidebar-logo-title">MOEI</div>
          </div>
        </div>
        <div className="sidebar-logo-subtitle">HR Companion · وزارة الطاقة</div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div
          style={{
            padding: "8px 20px 4px",
            fontSize: "10px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item${activePage === item.id ? " active" : ""}`}
              onClick={() => onNavigate(item.id)}
              style={{ width: "100%", background: "none", border: "none", textAlign: "left" }}
            >
              <Icon size={16} className="nav-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-text">
          Ministry of Energy &amp; Infrastructure<br />
          وزارة الطاقة والبنية التحتية
        </div>
      </div>
    </aside>
  );
}
