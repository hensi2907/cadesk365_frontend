"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getClientPortalData } from "@/lib/api/client-portal";
import { 
  LogOut, ShieldCheck, Clock, Bell, Search,
  LayoutDashboard, Folder, HelpCircle, User, MessageSquare, CreditCard,
  FileText
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isLoginPage = pathname === "/client-portal/login";
  const [phone, setPhone] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isLoginPage) return;
    const savedPhone = sessionStorage.getItem("client_phone");
    if (!savedPhone) {
      const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      router.push(`/client-portal/login?redirect=${encodeURIComponent(currentUrl)}`);
    } else {
      setPhone(savedPhone);
    }
  }, [router, isLoginPage, pathname, searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ["client_portal", phone],
    queryFn: () => getClientPortalData(phone || ""),
    enabled: !!phone && !isLoginPage,
  });

  const handleLogout = () => {
    sessionStorage.removeItem("client_phone");
    router.push("/client-portal/login");
  };

  if (isLoginPage) return <>{children}</>;

  if (isLoading && !isLoginPage) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-sm font-medium text-muted-foreground">Initializing Secure Portal...</span>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", href: "/client-portal", icon: LayoutDashboard },
    { label: "Compliances", href: "/client-portal/compliances", icon: ShieldCheck },
    { label: "Documents", href: "/client-portal/documents", icon: Folder },
    { label: "Invoices", href: "/client-portal/invoices", icon: CreditCard },
    { label: "Messages", href: "/client-portal/messages", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#09090b] flex">
      {/* Mini Sidebar */}
      <aside className="w-20 hidden lg:flex flex-col items-center py-8 border-r bg-card/50 backdrop-blur-xl shrink-0">
        <div className="h-12 w-12 bg-primary/50 rounded-2xl flex items-center justify-center text-white mb-10 shadow-lg shadow-primary/20">
          <ShieldCheck className="h-7 w-7" />
        </div>
        
        <nav className="flex-1 flex flex-col gap-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href}
                href={item.href}
                className={cn(
                  "h-10 w-10 flex items-center justify-center rounded-xl transition-all",
                  isActive 
                    ? "bg-primary/10 text-primary dark:text-primary/80 shadow-[inset_0_0_0_1px_rgba(20,184,166,0.2)]" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title={item.label}
              >
                <item.icon className="h-5 w-5" />
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-4">
          <button className="h-10 w-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <HelpCircle className="h-5 w-5" />
          </button>
          <button onClick={handleLogout} className="h-10 w-10 flex items-center justify-center rounded-xl text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b bg-card/30 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-64 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search portal..." 
                className="w-full h-9 bg-muted/50 border-none rounded-lg pl-9 text-sm focus:ring-1 focus:ring-primary/50 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border-2 border-card" />
            </button>
            <div className="h-px w-4 bg-border rotate-90 hidden sm:block" />
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold leading-none">{data?.customer?.name || "Client"}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1 tracking-tighter">Premium Partner</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-white font-bold shadow-md">
              {data?.customer?.name?.[0] || <User className="h-5 w-5" />}
            </div>
          </div>
        </header>

        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
