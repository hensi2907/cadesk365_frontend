"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAVIGATION, type NavItem } from "@/lib/constants/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getInitials } from "@/lib/utils/date";
import { logoutUser } from "@/lib/api/dashboard";
import { useDashboard } from "@/lib/hooks/use-dashboard";

export function Sidebar() {
  const pathname = usePathname();
  const { user, email, isHighLevelUser, employeeId, clearAuth } = useAuthStore();
  const { isOpen, isMobileOpen, close } = useSidebarStore();
  const [expandedGroup, setExpandedGroup] = useState<string | null>("Tasks");

  const { data: dashboardData } = useDashboard();

  const toggleGroup = (label: string) => {
    setExpandedGroup((prev) => (prev === label ? null : label));
  };

  const isActive = (item: NavItem) => {
    if (item.href === "/" && pathname === "/") return true;
    if (item.href === "/") return false;

    // Check if this item is the best match for the current pathname
    const isMatch = pathname === item.href || pathname.startsWith(item.href + "/");
    if (!isMatch) return false;

    // To prevent multiple active tabs, we check if there's a more specific (longer) match
    // in the entire navigation structure.
    const isMoreSpecificMatch = (navItems: NavItem[]): boolean => {
      return navItems.some((other) => {
        if (other === item) return false;
        
        const otherMatches = pathname === other.href || pathname.startsWith(other.href + "/");
        if (otherMatches && other.href.length > item.href.length) return true;
        
        if (other.children) return isMoreSpecificMatch(other.children);
        return false;
      });
    };

    return !isMoreSpecificMatch(NAVIGATION);
  };


  const shouldShow = (item: NavItem) => {
    if (item.highLevelOnly && !isHighLevelUser) return false;
    if (item.employeeOnly && !employeeId) return false;
    return true;
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      clearAuth();
      window.location.href = "/login";
    } catch { /* silent */ }
  };

  const renderNavItem = (item: NavItem, isChild = false) => {
    if (!shouldShow(item)) return null;
    const Icon = item.icon;
    const active = isActive(item);

    return (
      <Link
        key={item.tab}
        href={item.href}
        onClick={() => close()}
        className={cn(
          "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
          isChild && "ml-7 text-[13px]",
          active
            ? "bg-accent text-accent-foreground font-semibold"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground/70")} />
        <span className="truncate">{item.label}</span>
        {item.label === "Notifications" && (dashboardData?.unread_notifications || 0) > 0 && (
          <span className={cn(
            "ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
            active ? "bg-background text-foreground shadow-sm" : "bg-primary text-primary-foreground shadow-sm"
          )}>
            {dashboardData.unread_notifications}
          </span>
        )}
        {active && item.label !== "Notifications" && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
      </Link>
    );
  };

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-4 flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center p-1">
          <img src="/favicon.ico" alt="CADesk365 Logo" className="h-full w-full object-contain" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">CADesk365</span>
          <span className="text-[10px] text-muted-foreground">Practice Suite</span>
        </div>
      </div>

      <div className="px-3 pb-1">
        <div className="h-px bg-border" />
      </div>

      <ScrollArea className="flex-1 px-2">
        <nav className="flex flex-col gap-0.5 py-2">
          {NAVIGATION.map((item) => {
            if (!shouldShow(item)) return null;

            if (item.children) {
              const isExpanded = expandedGroup === item.label;
              const hasActiveChild = item.children.some((c) => isActive(c));

              return (
                <div key={item.tab} className="mb-0.5">
                  <button
                    onClick={() => toggleGroup(item.label)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                      hasActiveChild ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <item.icon className={cn("h-4 w-4 shrink-0", hasActiveChild ? "text-primary" : "text-muted-foreground/70")} />
                      <span>{item.label}</span>
                    </span>
                    <ChevronRight className={cn("h-3 w-3 text-muted-foreground/50 transition-transform duration-200", isExpanded && "rotate-90")} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="py-0.5 space-y-0.5">
                          {item.children.filter(shouldShow).map((child) => renderNavItem(child, true))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return renderNavItem(item);
          })}
        </nav>
      </ScrollArea>

      {/* User footer */}
      <div className="p-2 mt-auto">
        <div className="h-px bg-border mb-2" />
        <div className="flex items-center gap-2.5 rounded-md p-2 hover:bg-accent/50 transition-colors group cursor-pointer">
          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
            {getInitials(user || "U")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium truncate">{user || "User"}</p>
            <p className="text-[10px] text-muted-foreground truncate">{email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="h-7 w-7 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex fixed top-0 left-0 z-30 h-screen flex-col border-r bg-sidebar transition-all duration-200",
          isOpen ? "w-[240px]" : "w-0 overflow-hidden border-r-0"
        )}
      >
        {navContent}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={close}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 z-50 h-screen w-[260px] max-w-[85vw] flex flex-col bg-sidebar shadow-xl lg:hidden"
            >
              <button
                onClick={close}
                className="absolute top-4 right-3 p-1.5 rounded-md hover:bg-accent text-muted-foreground z-10"
              >
                <X className="h-4 w-4" />
              </button>
              {navContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
