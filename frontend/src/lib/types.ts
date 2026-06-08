export type Page = "overview" | "departments" | "people" | "skills";

export type EmployeeStatus =
  | "ON_TRACK"
  | "PROMOTION_DUE"
  | "FLIGHT_RISK"
  | "NEEDS_ATTENTION";

export type AlertSeverity = "critical" | "high" | "medium" | "low";

export interface Employee {
  employee_id: string;
  full_name: string;
  gender: string;
  uae_national: string;
  department: string;
  job_title: string;
  grade: number;
  employment_type: string;
  work_location?: string;
  hire_date: string;
  last_promotion_date: string;
  monthly_salary_aed: number;
  engagement_score: number;
  perf_2025: number | null;
  rating_band: string | null;
  years_since_promotion: number;
  status: EmployeeStatus;
  email?: string;
}

export interface EmployeeProfile extends Employee {
  date_of_birth?: string;
  performance_history: {
    cycle_year: number;
    score: number;
    rating_band: string;
    objectives_met_pct: number;
  }[];
  training_log: {
    course_name: string;
    category: string;
    provider: string;
    completion_date: string;
    hours: number;
    status: string;
    result: string | null;
  }[];
  leave_summary: {
    leave_type: string;
    year: number;
    entitled_days: number;
    taken_days: number;
    balance_days: number;
  }[];
  movement_history: {
    event_type: string;
    effective_date: string;
    from_grade: number | null;
    to_grade: number | null;
    from_department: string | null;
    to_department: string | null;
  }[];
  total_training_hours: number;
}

export interface Alert {
  type: string;
  label: string;
  label_ar: string;
  severity: AlertSeverity;
  count: number;
  employees: Partial<Employee>[];
}

export interface OverviewKPIs {
  total_employees: number;
  emirati_pct: number;
  avg_engagement: number;
  avg_performance_2025: number;
  employment_breakdown: Record<string, number>;
  gender_breakdown: Record<string, number>;
  promotions_2025: number;
  new_joiners_2025: number;
}

export interface DeptKPIs {
  headcount: number;
  avg_salary: number;
  avg_engagement: number;
  emirati_pct: number;
  female_pct: number;
  contract_count: number;
  performance_trend: { cycle_year: number; avg_score: number }[];
  rating_distribution: { rating_band: string; count: number }[];
  completed_courses: number;
  cold_courses: number;
  total_hours: number;
  flight_risks: number;
  promotion_due: number;
  grade_distribution: { grade: number; count: number }[];
}

export interface SkillsData {
  heatmap: {
    department: string;
    category: string;
    completed_hours: number;
    cold_count: number;
    completed_count: number;
  }[];
  departments: string[];
  categories: string[];
  leaderboard: {
    employee_id: string;
    full_name: string;
    department: string;
    total_hours: number;
    completed_count: number;
  }[];
  cold_enrollments: {
    full_name: string;
    department: string;
    employee_id: string;
    course_name: string;
    category: string;
    provider: string;
  }[];
}

export interface BreakdownData {
  title: string;
  subtitle?: string;
  employees: Partial<Employee>[];
}
