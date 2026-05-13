"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isOpen } = useSidebarStore();
  const { setAuth, isAuthenticated } = useAuthStore();

  const { data, isError, isLoading } = useDashboard();

  useEffect(() => {
    if (data) {
      setAuth({
        user: data.user,
        email: data.email,
        roles: data.roles,
        employee_id: data.employee_id,
        can_allocate: data.can_allocate,
        is_high_level: data.is_high_level,
        default_company: data.default_company,
        permitted_doctypes: data.permitted_doctypes,
      });
    }
  }, [data, setAuth]);

  useEffect(() => {
    // Redirect if API explicitly fails or if we are done loading and have no auth/data
    if (isError || (!isLoading && !data && !isAuthenticated)) {
      const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      
      // Avoid redirect loops
      if (pathname !== "/login" && pathname !== "/") {
        router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      } else {
        router.push("/login");
      }
    }
  }, [isError, isLoading, data, isAuthenticated, router, pathname, searchParams]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          "flex flex-col min-h-screen transition-all duration-200",
          isOpen ? "lg:ml-[240px]" : "lg:ml-0"
        )}
      >
        <Topbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
