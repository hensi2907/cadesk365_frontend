"use client";

import { Menu, Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getInitials } from "@/lib/utils/date";
import { logoutUser } from "@/lib/api/dashboard";
import { getNotifications } from "@/lib/api/notifications";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const { toggle, setMobileOpen } = useSidebarStore();
  const { user, email, clearAuth, isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Poll for unread notification count every 30 seconds
  const { data: notifData } = useQuery({
    queryKey: ["notification_count"],
    queryFn: getNotifications,
    enabled: isAuthenticated,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const unreadCount = notifData?.unread_count ?? 0;

  const handleLogout = async () => {
    try {
      await logoutUser();
      clearAuth();
      window.location.href = "/login";
    } catch {
      toast.error("Failed to logout");
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6 shadow-sm">
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon" className="hidden lg:inline-flex h-8 w-8" onClick={toggle}>
          <Menu className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setMobileOpen(true)}>
          <Menu className="h-4 w-4" />
        </Button>
        <div className="lg:hidden flex items-center gap-2 ml-1">
          <img src="/favicon.ico" alt="CADesk365 Logo" className="h-7 w-7 object-contain bg-primary/10 rounded p-1" />
          <span className="font-semibold text-[15px] tracking-tight">CADesk365</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="h-8 w-8">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notification Bell */}
        <Button
          id="topbar-notifications"
          variant="ghost"
          size="icon"
          className="h-8 w-8 relative"
          onClick={() => router.push("/notifications")}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-50" />
              <span className="relative inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-[12px] font-bold text-primary cursor-pointer hover:bg-primary/20 transition-colors shadow-sm border border-primary/20">
              {getInitials(user || "U")}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-3 py-2.5">
              <p className="text-sm font-medium">{user}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
