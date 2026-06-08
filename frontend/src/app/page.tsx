"use client";

import { useState, useEffect, useCallback } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { useCopilotAction } from "@copilotkit/react-core";

import { Sidebar } from "@/components/layout/Sidebar";
import { ChatPanel } from "@/components/layout/ChatPanel";
import { OverviewPage } from "@/components/pages/OverviewPage";
import { DepartmentsPage } from "@/components/pages/DepartmentsPage";
import { PeoplePage } from "@/components/pages/PeoplePage";
import { SkillsPage } from "@/components/pages/SkillsPage";
import { BreakdownModal } from "@/components/ui/BreakdownModal";
import { EmployeeProfileDrawer } from "@/components/ui/EmployeeProfileDrawer";

import type { Page, BreakdownData } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const LAST_DEPT_KEY = "moei_last_dept";

// ── Page meta ─────────────────────────────────────────────────────────────
const PAGE_META: Record<Page, { title: string; subtitle: string }> = {
  overview: { title: "Executive Overview", subtitle: "Org-wide workforce intelligence · نظرة عامة على القوى العاملة" },
  departments: { title: "Departments", subtitle: "Department-level analytics and employee breakdown · تحليلات الأقسام" },
  people: { title: "People Directory", subtitle: "All 260 employees · search, filter, and drill down · دليل الموظفين" },
  skills: { title: "Skills & Training", subtitle: "Training heatmap, learner leaderboard, and cold enrollments · المهارات والتدريب" },
};

// ── Root: wraps with CopilotKit provider ────────────────────────────────
export default function Home() {
  return (
    <CopilotKit runtimeUrl={`${API_URL}/copilotkit`} agent="hr_agent" showDevConsole={false}>
      <Dashboard />
    </CopilotKit>
  );
}

// ── Inner Dashboard (can use CopilotKit hooks) ───────────────────────────
function Dashboard() {
  // Restore last visited page/dept from localStorage
  const [activePage, setActivePage] = useState<Page>("overview");
  const [selectedDept, setSelectedDept] = useState<string | null>(() => {
    if (typeof window !== "undefined") return localStorage.getItem(LAST_DEPT_KEY);
    return null;
  });
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [breakdownData, setBreakdownData] = useState<BreakdownData | null>(null);

  // Persist last visited department
  const handleSelectDept = useCallback((dept: string) => {
    setSelectedDept(dept);
    localStorage.setItem(LAST_DEPT_KEY, dept);
  }, []);

  // ── AI Navigation Action ───────────────────────────────────────────────
  useCopilotAction({
    name: "navigateTo",
    description: "Navigate the MOEI HR dashboard to a specific page, department, or employee profile.",
    parameters: [
      {
        name: "page",
        type: "string",
        description: "Page to navigate to. One of: overview, departments, people, skills.",
        required: false,
      },
      {
        name: "department",
        type: "string",
        description: "Department name to select on the Departments page.",
        required: false,
      },
      {
        name: "employeeId",
        type: "string",
        description: "Employee ID (e.g. MOEI-10001) to open the profile drawer for.",
        required: false,
      },
    ],
    handler: ({ page, department, employeeId }) => {
      if (page) setActivePage(page as Page);
      if (department) {
        handleSelectDept(department);
        setActivePage("departments");
      }
      if (employeeId) {
        setSelectedEmployeeId(employeeId);
      }
      const where = department ?? page ?? (employeeId ? `employee ${employeeId}` : "dashboard");
      return `Navigated to ${where}.`;
    },
  });

  const meta = PAGE_META[activePage];

  return (
    <div className="app-shell">
      {/* Left Sidebar */}
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      {/* Main Content */}
      <div className="main-content">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-row">
            <h1 className="page-header-title">{meta.title}</h1>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", paddingBottom: 12 }}>{meta.subtitle}</div>
        </div>

        {/* Page Body */}
        {activePage === "overview" && (
          <OverviewPage onBreakdown={setBreakdownData} />
        )}
        {activePage === "departments" && (
          <DepartmentsPage
            selectedDept={selectedDept}
            onSelectDept={handleSelectDept}
            onOpenEmployee={setSelectedEmployeeId}
            onBreakdown={setBreakdownData}
          />
        )}
        {activePage === "people" && (
          <PeoplePage onOpenEmployee={setSelectedEmployeeId} />
        )}
        {activePage === "skills" && (
          <SkillsPage onBreakdown={setBreakdownData} />
        )}
      </div>

      {/* Right Chat Panel */}
      <ChatPanel />

      {/* Overlays */}
      {breakdownData && (
        <BreakdownModal
          data={breakdownData}
          onClose={() => setBreakdownData(null)}
          onOpenEmployee={(id) => { setSelectedEmployeeId(id); setBreakdownData(null); }}
        />
      )}
      {selectedEmployeeId && (
        <EmployeeProfileDrawer
          employeeId={selectedEmployeeId}
          onClose={() => setSelectedEmployeeId(null)}
        />
      )}
    </div>
  );
}
