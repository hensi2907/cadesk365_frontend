import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Users,
  ShieldCheck,
  UserCog,
  Megaphone,
  Bell,
  FileText,
  UserPlus,
  Clock,
  Plane,
  Receipt,
  Wallet,
  LogIn,
  Settings,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  tab: string;
  /** If set, only visible to high-level roles */
  highLevelOnly?: boolean;
  /** If set, only visible when employee_id exists */
  employeeOnly?: boolean;
  children?: NavItem[];
}

export const NAVIGATION: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: LayoutDashboard,
    tab: "home",
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
    tab: "tasks",
    children: [
      { label: "My Tasks", href: "/tasks", icon: CheckSquare, tab: "tasks" },
      { label: "All Tasks", href: "/tasks/all", icon: CheckSquare, tab: "tasks-all" },
      { label: "Allotted by Me", href: "/tasks/assigned", icon: CheckSquare, tab: "tasks-by-me" },
      { label: "Completed", href: "/tasks/completed", icon: CheckSquare, tab: "tasks-completed" },
      { label: "Allocate", href: "/tasks/allocate", icon: CheckSquare, tab: "tasks-allocate", highLevelOnly: true },
    ],
  },
  {
    label: "Calendar",
    href: "/calendar",
    icon: Calendar,
    tab: "calendar",
  },
  {
    label: "Clients",
    href: "/clients",
    icon: Users,
    tab: "client",
    highLevelOnly: true,
  },
  {
    label: "Compliance",
    href: "/compliance",
    icon: ShieldCheck,
    tab: "compliance",
  },
  {
    label: "Employees",
    href: "/employees",
    icon: UserCog,
    tab: "employee",
    highLevelOnly: true,
  },
  {
    label: "Announcements",
    href: "/announcements",
    icon: Megaphone,
    tab: "announcements",
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
    tab: "notifications",
  },
  {
    label: "Documents",
    href: "/documents",
    icon: FileText,
    tab: "documents",
  },
  {
    label: "Onboard Client",
    href: "/clients/onboard",
    icon: UserPlus,
    tab: "onboard-client",
    highLevelOnly: true,
  },
  {
    label: "HRMS",
    href: "/hrms/attendance",
    icon: Clock,
    tab: "hrms",
    employeeOnly: true,
    children: [
      { label: "HR Dashboard", href: "/hrms/dashboard", icon: LayoutDashboard, tab: "hrms-dashboard", highLevelOnly: true },
      { label: "Attendance", href: "/hrms/attendance", icon: Clock, tab: "hrms-attendance" },
      { label: "Leaves", href: "/hrms/leaves", icon: Plane, tab: "hrms-leaves" },
      { label: "Expenses", href: "/hrms/expenses", icon: Receipt, tab: "hrms-expenses" },
      { label: "Salary", href: "/hrms/salary", icon: Wallet, tab: "hrms-salary" },
      { label: "Check In", href: "/hrms/checkin", icon: LogIn, tab: "hrms-checkin" },
    ],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    tab: "settings",
  },
];
