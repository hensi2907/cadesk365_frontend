"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { DynamicForm, type FieldConfig } from "@/components/shared/dynamic-form";
import * as z from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getEmployeeProfile, updateEmployeeProfile } from "@/lib/api/hrms";
import { useAuthStore } from "@/lib/stores/auth-store";
import { logoutUser } from "@/lib/api/dashboard";
import {
  User, Briefcase, Building, Wallet, CreditCard, Info,
  Settings, Shield, BarChart3, Lock, Bell, LogOut,
  Mail, Printer, Download, UploadCloud, CheckSquare, Database, Users, Calendar,
  UserPlus, Clock, GraduationCap, FileText, ClipboardList, MapPin, Award, Heart, 
  ShieldAlert, ListChecks, ArrowRightLeft, TrendingUp, Handshake, Zap, HelpCircle,
  FileCheck, ShieldCheck, PieChart, Activity, MessageSquare, Share2, Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { getListRoute } from "@/lib/utils/route";

const hrShortcuts = [
  { title: "Job Opening Template", doctype: "Job Opening Template", icon: UserPlus, category: "Recruitment" },
  { title: "Shift Schedule Assignment", doctype: "Shift Schedule Assignment", icon: Clock, category: "Attendance & Shifts" },
  { title: "Shift Schedule", doctype: "Shift Schedule", icon: Clock, category: "Attendance & Shifts" },
  { title: "Shift Location", doctype: "Shift Location", icon: MapPin, category: "Attendance & Shifts" },
  { title: "Shift Assignment Tool", doctype: "Shift Assignment Tool", icon: Zap, category: "Attendance & Shifts" },
  { title: "Job Offer Term Template", doctype: "Job Offer Term Template", icon: FileText, category: "Recruitment" },
  { title: "PWA Notification", doctype: "PWA Notification", icon: Bell, category: "Others" },
  { title: "Vehicle Service Item", doctype: "Vehicle Service Item", icon: Settings, category: "Others" },
  { title: "Employee Feedback Criteria", doctype: "Employee Feedback Criteria", icon: ListChecks, category: "Performance" },
  { title: "Employee Performance Feedback", doctype: "Employee Performance Feedback", icon: Activity, category: "Performance" },
  { title: "Job Requisition", doctype: "Job Requisition", icon: ClipboardList, category: "Recruitment" },
  { title: "Appraisal", doctype: "Appraisal", icon: Award, category: "Performance" },
  { title: "KRA", doctype: "KRA", icon: TrendingUp, category: "Performance" },
  { title: "Goal", doctype: "Goal", icon: Award, category: "Performance" },
  { title: "Appraisal Cycle", doctype: "Appraisal Cycle", icon: Calendar, category: "Performance" },
  { title: "Training Feedback", doctype: "Training Feedback", icon: GraduationCap, category: "Performance" },
  { title: "Employee Advance", doctype: "Employee Advance", icon: Wallet, category: "Others" },
  { title: "Exit Interview", doctype: "Exit Interview", icon: Handshake, category: "Lifecycle" },
  { title: "Full and Final Statement", doctype: "Full and Final Statement", icon: FileCheck, category: "Lifecycle" },
  { title: "Employee Grievance", doctype: "Employee Grievance", icon: ShieldAlert, category: "Others" },
  { title: "Grievance Type", doctype: "Grievance Type", icon: Settings, category: "Others" },
  { title: "Interview Feedback", doctype: "Interview Feedback", icon: MessageSquare, category: "Recruitment" },
  { title: "Interview", doctype: "Interview", icon: UserPlus, category: "Recruitment" },
  { title: "Interview Type", doctype: "Interview Type", icon: Settings, category: "Recruitment" },
  { title: "Interview Round", doctype: "Interview Round", icon: ListChecks, category: "Recruitment" },
  { title: "Employee Referral", doctype: "Employee Referral", icon: Users, category: "Recruitment" },
  { title: "Leave Policy Assignment", doctype: "Leave Policy Assignment", icon: FileText, category: "Leaves" },
  { title: "Appointment Letter", doctype: "Appointment Letter", icon: FileCheck, category: "Lifecycle" },
  { title: "Appointment Letter Template", doctype: "Appointment Letter Template", icon: FileText, category: "Lifecycle" },
  { title: "Employee Checkin", doctype: "Employee Checkin", icon: Clock, category: "Attendance & Shifts" },
  { title: "Leave Ledger Entry", doctype: "Leave Ledger Entry", icon: Database, category: "Leaves" },
  { title: "Employee Skill Map", doctype: "Employee Skill Map", icon: MapPin, category: "Lifecycle" },
  { title: "Skill", doctype: "Skill", icon: Award, category: "Lifecycle" },
  { title: "Job Applicant Source", doctype: "Job Applicant Source", icon: Share2, category: "Recruitment" },
  { title: "Identification Document Type", doctype: "Identification Document Type", icon: ShieldCheck, category: "Others" },
  { title: "Purpose of Travel", doctype: "Purpose of Travel", icon: MapPin, category: "Others" },
  { title: "Travel Request", doctype: "Travel Request", icon: Briefcase, category: "Others" },
  { title: "Employee Separation", doctype: "Employee Separation", icon: LogOut, category: "Lifecycle" },
  { title: "Employee Separation Template", doctype: "Employee Separation Template", icon: FileText, category: "Lifecycle" },
  { title: "Employee Onboarding Template", doctype: "Employee Onboarding Template", icon: FileText, category: "Lifecycle" },
  { title: "Employee Onboarding", doctype: "Employee Onboarding", icon: UserPlus, category: "Lifecycle" },
  { title: "Employee Promotion", doctype: "Employee Promotion", icon: TrendingUp, category: "Lifecycle" },
  { title: "Employee Transfer", doctype: "Employee Transfer", icon: ArrowRightLeft, category: "Lifecycle" },
  { title: "Staffing Plan", doctype: "Staffing Plan", icon: PieChart, category: "Others" },
  { title: "Shift Request", doctype: "Shift Request", icon: Clock, category: "Attendance & Shifts" },
  { title: "Shift Assignment", doctype: "Shift Assignment", icon: Briefcase, category: "Attendance & Shifts" },
  { title: "Shift Type", doctype: "Shift Type", icon: Settings, category: "Attendance & Shifts" },
  { title: "Employee Grade", doctype: "Employee Grade", icon: Award, category: "Others" },
  { title: "Leave Policy", doctype: "Leave Policy", icon: FileText, category: "Leaves" },
  { title: "Attendance Request", doctype: "Attendance Request", icon: CheckSquare, category: "Attendance & Shifts" },
  { title: "Leave Encashment", doctype: "Leave Encashment", icon: Wallet, category: "Leaves" },
  { title: "Leave Period", doctype: "Leave Period", icon: Calendar, category: "Leaves" },
  { title: "Compensatory Leave Request", doctype: "Compensatory Leave Request", icon: ClipboardList, category: "Leaves" },
  { title: "Daily Work Summary Group", doctype: "Daily Work Summary Group", icon: Users, category: "Others" },
  { title: "Training Program", doctype: "Training Program", icon: GraduationCap, category: "Performance" },
  { title: "Employee Health Insurance", doctype: "Employee Health Insurance", icon: Heart, category: "Lifecycle" },
  { title: "Daily Work Summary", doctype: "Daily Work Summary", icon: FileText, category: "Others" },
  { title: "Training Result", doctype: "Training Result", icon: Award, category: "Performance" },
  { title: "Vehicle Log", doctype: "Vehicle Log", icon: ClipboardList, category: "Others" },
  { title: "Training Event", doctype: "Training Event", icon: Calendar, category: "Performance" },
  { title: "Interest", doctype: "Interest", icon: Heart, category: "Lifecycle" },
  { title: "Employee Attendance Tool", doctype: "Employee Attendance Tool", icon: Zap, category: "Attendance & Shifts" },
  { title: "Offer Term", doctype: "Offer Term", icon: ListChecks, category: "Recruitment" },
  { title: "Job Offer", doctype: "Job Offer", icon: Handshake, category: "Recruitment" },
  { title: "HR Settings", doctype: "HR Settings", icon: Settings, category: "Others" },
  { title: "Leave Type", doctype: "Leave Type", icon: Settings, category: "Leaves" },
  { title: "Leave Allocation", doctype: "Leave Allocation", icon: Calendar, category: "Leaves" },
  { title: "Leave Application", doctype: "Leave Application", icon: Calendar, category: "Leaves" },
  { title: "Leave Block List", doctype: "Leave Block List", icon: ShieldAlert, category: "Leaves" },
  { title: "Job Applicant", doctype: "Job Applicant", icon: UserPlus, category: "Recruitment" },
  { title: "Upload Attendance", doctype: "Upload Attendance", icon: UploadCloud, category: "Attendance & Shifts" },
  { title: "Job Opening", doctype: "Job Opening", icon: Briefcase, category: "Recruitment" },
  { title: "Leave Control Panel", doctype: "Leave Control Panel", icon: Zap, category: "Leaves" },
  { title: "Expense Claim", doctype: "Expense Claim", icon: CreditCard, category: "Others" },
  { title: "Employment Type", doctype: "Employment Type", icon: Settings, category: "Others" },
  { title: "Attendance", doctype: "Attendance", icon: CheckSquare, category: "Attendance & Shifts" },
  { title: "Appraisal Template", doctype: "Appraisal Template", icon: FileText, category: "Performance" },
  { title: "Expense Claim Type", doctype: "Expense Claim Type", icon: Settings, category: "Others" },
];

const settingsSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  personal_email: z.string().email().optional().or(z.literal("")),
  cell_number: z.string().optional(),
  emergency_phone_number: z.string().optional(),
  current_address: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

// Action Card Component
function ActionCard({ icon: Icon, title, desc, href }: { icon: any, title: string, desc: string, href: string }) {
  const isExternal = href.startsWith("/app/") || href.startsWith("http") || href === "logout";

  const content = (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group cursor-pointer h-full">
      <div className="p-2 rounded-md bg-muted text-muted-foreground group-hover:text-primary transition-colors shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
    </div>
  );

  if (href === "logout") {
    const handleLogout = async () => {
      try {
        await logoutUser();
        useAuthStore.getState().clearAuth();
        window.location.href = "/login";
      } catch { /* silent */ }
    };
    return <div onClick={handleLogout} className="h-full">{content}</div>;
  }

  if (isExternal) {
    return <a href={href} className="block h-full">{content}</a>;
  }

  return <Link href={href} className="block h-full">{content}</Link>;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState("account");
  const [hrSearch, setHrSearch] = React.useState("");

  React.useEffect(() => {
    const savedTab = localStorage.getItem("cadesk365_settings_tab");
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    localStorage.setItem("cadesk365_settings_tab", tabId);
  };

  const { employeeId, isHighLevelUser, user, email, roles, defaultCompany } = useAuthStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["profile", employeeId],
    queryFn: () => getEmployeeProfile(employeeId || ""),
    enabled: !!employeeId,
  });

  const updateMutation = useMutation({
    mutationFn: async (values: SettingsFormValues) => {
      return updateEmployeeProfile(employeeId || "", values);
    },
    onSuccess: () => refetch(),
  });

  const baseTabs = [
    { id: "account", label: "Account Settings", icon: Settings },
  ];

  if (isHighLevelUser) {
    baseTabs.push({ id: "admin", label: "Admin Panel", icon: Shield });
  }

  const isHR = roles?.some(r => r.includes("HR") || ["System Manager", "Administrator"].includes(r));

  if (isHR) {
    baseTabs.push({ id: "hr", label: "HR Management", icon: Users });
  }

  const employeeTabs = data ? [
    { id: "personal", label: "Personal Information", icon: User },
    { id: "employment", label: "Employment Details", icon: Briefcase },
    { id: "bank", label: "Bank & Salary", icon: Wallet },
  ] : [];

  const tabs = [...baseTabs, ...employeeTabs];

  // If activeTab is personal but data failed to load, fallback to account
  React.useEffect(() => {
    if (!isLoading && !data && ["personal", "employment", "bank"].includes(activeTab)) {
      setActiveTab("account");
    }
  }, [data, isLoading, activeTab]);

  const fields: FieldConfig<SettingsFormValues>[] = [
    { name: "first_name", label: "First Name", type: "text" },
    { name: "last_name", label: "Last Name", type: "text" },
    { name: "personal_email", label: "Personal Email", type: "email" },
    { name: "cell_number", label: "Mobile Number", type: "text" },
    { name: "emergency_phone_number", label: "Emergency Contact", type: "text" },
    { name: "current_address", label: "Current Address", type: "textarea" },
  ];

  return (
    <div className="space-y-8 fluid-container">
      <PageHeader
        title="Settings & Profile"
        description="Manage your account preferences and personal information."
      />

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-[220px] shrink-0 space-y-0.5 bg-card border rounded-lg p-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">

          {/* 1. ACCOUNT SETTINGS */}
          {activeTab === "account" && (
            <div className="space-y-8 fade-in">
              {/* Account Header */}
              <div className="flex items-center gap-4 p-5 rounded-lg border bg-card">
                <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary shrink-0">
                  {(user || "U").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{user || "User"}</h3>
                  <p className="text-sm text-muted-foreground">{email} · {roles?.filter(r => !["All", "Guest"].includes(r))[0] || "User"}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-lg border bg-card p-5">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
                    <User className="h-5 w-5 text-muted-foreground" />
                    Account Info
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Full Name</div>
                      <div className="font-medium">{user || "User"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
                      <div className="font-medium">{email || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Roles</div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {roles?.filter(r => !["All", "Guest"].includes(r)).map(r => (
                          <span key={r} className="inline-flex items-center rounded-full bg-primary/50 px-2.5 py-0.5 text-xs font-semibold transition-colors">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-card p-5">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    System Info
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">User Type</div>
                      <div className="font-medium">System User</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Time Zone</div>
                      <div className="font-medium">Asia/Kolkata</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Access Level</div>
                      <div className="font-medium">{isHighLevelUser ? "Manager / Admin" : "Standard"}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-5">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  Security & Preferences
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ActionCard icon={Lock} title="Change Password" desc="Update your password" href="/update_password" />
                  {/* <ActionCard icon={Bell} title="Notifications" desc="Configure alerts" href="/app/notification-settings" /> */}
                  <ActionCard icon={LogOut} title="Logout" desc="Sign out of CADesk365" href="logout" />
                </div>
              </div>
            </div>
          )}

          {/* 2. ADMIN PANEL */}
          {activeTab === "admin" && isHighLevelUser && (
            <div className="space-y-8 fade-in">
              <div className="rounded-lg border bg-card p-5 border-t-4 border-t-primary">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    Reports & Analytics
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-primary/5 px-2.5 py-0.5 text-xs font-semibold text-primary/90 dark:bg-primary/20 dark:text-primary/80">
                    Manager+
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ActionCard icon={BarChart3} title="Employee Performance" desc="Team reports" href="/reports/performance" />
                  <ActionCard icon={BarChart3} title="Attendance" desc="Team reports" href="/reports/attendance" />
                  <ActionCard icon={BarChart3} title="Attendance Tool" desc="Team reports" href="/reports/attendance-tool" />
                  <ActionCard icon={BarChart3} title="HR Roster" desc="Team reports" href="/reports/hr-roster" />
                  <ActionCard icon={BarChart3} title="Leaves" desc="Team reports" href="/reports/leaves" />
                  <ActionCard icon={BarChart3} title="Work Hours" desc="Team reports" href="/reports/work-hours" />
                  {/* <ActionCard icon={BarChart3} title="Delayed Tasks" desc="Summary report" href="/app/query-report/Delayed%20Tasks%20Summary" />
                  <ActionCard icon={BarChart3} title="Attendance Sheet" desc="Monthly view" href="/app/query-report/Monthly%20Attendance%20Sheet" />
                  <ActionCard icon={BarChart3} title="Holiday Working" desc="Employees on holiday" href="/app/query-report/Employees%20working%20on%20a%20holiday" />
                  <ActionCard icon={BarChart3} title="Leave Balance" desc="Leave balances" href="/app/query-report/Employee%20Leave%20Balance" /> */}
                  <ActionCard icon={BarChart3} title="Payroll Summary" desc="Payroll analytics" href="/reports/payroll" />
                </div>
              </div>

              <div className="rounded-lg border bg-card p-5 border-t-4 border-t-blue-500">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    Firm Administration
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    Manager+
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ActionCard icon={Building} title="Company" desc="Manage accounts" href={`/cadesk365/company/${encodeURIComponent(defaultCompany)}`} />
                  <ActionCard icon={User} title="User Management" desc="Manage accounts" href="/cadesk365/user/view" />
                  <ActionCard icon={Building} title="Client Master" desc="Client records" href="/cadesk365/customer/view" />
                  <ActionCard icon={Shield} title="Compliance Master" desc="Items and rules" href="/compliance/list" />
                  <ActionCard icon={Briefcase} title="Employee Records" desc="HR data" href="/cadesk365/employee/view" />
                </div>
              </div>

              <div className="rounded-lg border bg-card p-5 border-t-4 border-t-purple-500">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    Advanced Admin
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                    Admin
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* <ActionCard icon={Mail} title="Email Accounts" desc="Email config" href="/cadesk365/email-account/view" />
                  <ActionCard icon={Printer} title="Print Format" desc="Templates" href="/cadesk365/print-format/view" />
                  <ActionCard icon={Download} title="Data Import" desc="CSV/Excel" href="/cadesk365/data-import/view" /> */}
                  <ActionCard icon={UploadCloud} title="Data Export" desc="Export CSV" href="/cadesk365/data-export" />
                  <ActionCard icon={Settings} title="Compliance Settings" desc="Global config" href="/cadesk365/compliance-settings/Compliance%20Settings" />
                  <ActionCard icon={CheckSquare} title="Compliance Tasks" desc="Default tasks" href="/cadesk365/compliance-tasks/view" />
                </div>
              </div>

              <div className="rounded-lg border bg-card p-5 border-t-4 border-t-indigo-500">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Database className="h-5 w-5 text-muted-foreground" />
                    Master Data
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                    Admin
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ActionCard icon={Database} title="Compliance" desc="Manage data" href="/compliance/list" />
                  <ActionCard icon={Database} title="Compliance Profile" desc="Manage data" href="/cadesk365/compliance-profile/view" />
                  <ActionCard icon={Database} title="Business Entity" desc="Manage data" href="/cadesk365/business-entity/view" />
                  <ActionCard icon={Database} title="Compliance Tasks" desc="Manage data" href="/cadesk365/compliance-tasks/view" />
                  <ActionCard icon={Database} title="Employee" desc="Manage data" href="/cadesk365/employee/view" />
                  <ActionCard icon={Database} title="Frequency" desc="Manage data" href="/cadesk365/frequency/view" />
                  <ActionCard icon={Database} title="Company" desc="Manage data" href="/cadesk365/company/view" />
                  <ActionCard icon={Database} title="Customer" desc="Manage data" href="/cadesk365/customer/view" />
                  <ActionCard icon={Database} title="Client Service" desc="Manage data" href="/cadesk365/client-service/view" />
                  <ActionCard icon={Database} title="Todo" desc="Manage data" href="/cadesk365/todo/view" />
                  <ActionCard icon={Database} title="Tasks" desc="Manage data" href="/cadesk365/tasks/view" />
                  <ActionCard icon={Database} title="Compliance Trackers" desc="Manage data" href="/cadesk365/compliance-trackers/view" />
                  <ActionCard icon={Database} title="Client Document" desc="Manage data" href="/cadesk365/client-document/view" />
                  <ActionCard icon={Database} title="Compliance Settings" desc="Manage data" href="/cadesk365/compliance-settings/Compliance%20Settings" />
                </div>
              </div>
            </div>
          )}

          {/* 2.5 HR PANEL */}
          {activeTab === "hr" && isHR && (
            <div className="space-y-8 fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search HR shortcuts..."
                    className="pl-10 h-10"
                    value={hrSearch}
                    onChange={(e) => setHrSearch(e.target.value)}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Showing {hrShortcuts.filter(s => s.title.toLowerCase().includes(hrSearch.toLowerCase())).length} shortcuts
                </div>
              </div>

              {(() => {
                const filtered = hrShortcuts.filter(s => 
                  s.title.toLowerCase().includes(hrSearch.toLowerCase()) ||
                  s.category.toLowerCase().includes(hrSearch.toLowerCase())
                );
                const categories = Array.from(new Set(filtered.map(s => s.category))).sort();

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/20">
                      <Search className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium text-muted-foreground">No results found</p>
                      <p className="text-sm text-muted-foreground mt-1">Try searching for a different term or category</p>
                    </div>
                  );
                }

                return categories.map(category => (
                  <div key={category} className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 px-1">
                      {category === "Recruitment" && <UserPlus className="h-4 w-4" />}
                      {category === "Attendance & Shifts" && <Clock className="h-4 w-4" />}
                      {category === "Lifecycle" && <ArrowRightLeft className="h-4 w-4" />}
                      {category === "Performance" && <Award className="h-4 w-4" />}
                      {category === "Leaves" && <Calendar className="h-4 w-4" />}
                      {category === "Others" && <Settings className="h-4 w-4" />}
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filtered
                        .filter(s => s.category === category)
                        .map(s => (
                          <ActionCard
                            key={s.title}
                            icon={s.icon}
                            title={s.title}
                            desc={`Manage ${s.title}`}
                            href={getListRoute(s.doctype)}
                          />
                        ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}

          {/* 3. PERSONAL */}
          {activeTab === "personal" && data && (
            <div className="space-y-6 fade-in">
              <div className="flex items-center gap-4 p-5 rounded-lg border bg-card">
                <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary">
                  {data.first_name[0]}{data.last_name?.[0] || ""}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{data.employee_name}</h3>
                  <p className="text-sm text-muted-foreground">{data.designation} · {data.department}</p>
                  <p className="text-xs font-mono mt-0.5 text-muted-foreground">{data.employee_id}</p>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-5">
                <h3 className="text-lg font-semibold mb-6">Edit Information</h3>
                <DynamicForm<SettingsFormValues>
                  schema={settingsSchema}
                  defaultValues={{
                    first_name: data.first_name || "",
                    last_name: data.last_name || "",
                    personal_email: data.personal_email || "",
                    cell_number: data.cell_number || "",
                    emergency_phone_number: data.emergency_phone_number || "",
                    current_address: data.current_address || "",
                  }}
                  fields={fields}
                  gridCols={2}
                  onSubmit={async (values) => { await updateMutation.mutateAsync(values); }}
                  submitLabel="Save Changes"
                  loadingLabel="Saving..."
                />
              </div>
            </div>
          )}

          {/* 4. EMPLOYMENT */}
          {activeTab === "employment" && data && (
            <div className="rounded-lg border bg-card p-5 space-y-8 fade-in">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building className="h-5 w-5 text-muted-foreground" />
                Company Details
              </h3>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Company Email</div>
                  <div className="font-medium">{data.company_email || "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Date of Joining</div>
                  <div className="font-medium">{data.date_of_joining || "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                  <div className="font-medium text-emerald-600 dark:text-emerald-400">{data.status}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Branch</div>
                  <div className="font-medium">{data.branch || "N/A"}</div>
                </div>
              </div>
            </div>
          )}

          {/* 5. BANK */}
          {activeTab === "bank" && data && (
            <div className="rounded-lg border bg-card p-5 space-y-8 fade-in">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                Salary & Bank Account
              </h3>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Salary Mode</div>
                  <div className="font-medium">{data.salary_mode || "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">CTC (Annual)</div>
                  <div className="font-medium">
                    {data.ctc ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(data.ctc) : "N/A"}
                  </div>
                </div>
                <div className="col-span-2 pt-4 border-t border-border/40">
                  <h4 className="font-medium mb-4">Bank Details</h4>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Bank Name</div>
                  <div className="font-medium">{data.bank_name || "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Account Number</div>
                  <div className="font-mono">{data.bank_ac_no || "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">IFSC Code</div>
                  <div className="font-mono">{data.ifsc_code || "N/A"}</div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground pt-4 flex items-center gap-2">
                <Info className="h-4 w-4" />
                To change bank details, please contact HR.
              </p>
            </div>
          )}

          {isLoading && !data && (
            <div className="space-y-6 animate-pulse">
              <div className="h-24 bg-muted/60 rounded-xl" />
              <div className="grid md:grid-cols-[1fr] gap-8">
                <div className="h-64 bg-muted/60 rounded-xl" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
