"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sun, Moon, ArrowRight, Eye, EyeOff, Mail, Lock, ShieldCheck, CheckCircle2, BarChart3, Clock } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth-store";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user is already authenticated (both client-side state and server session)
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated) {
        // Verify server session is still valid
        try {
          const res = await fetch("/api/method/frappe.auth.get_logged_user", {
            credentials: "same-origin",
          });
          if (res.ok) {
            const params = new URLSearchParams(window.location.search);
            const redirect = params.get("redirect");
            router.replace(redirect || "/");
            return;
          }
        } catch {
          // Session invalid, stay on login
        }
      }
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/method/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ usr: email, pwd: password }),
      });
      if (res.ok) {
        setIsSuccess(true);
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect");
        setTimeout(() => {
          router.push(redirect || "/");
        }, 800);
      } else {
        const d = await res.json();
        setError(d.message || "Invalid credentials");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render anything while checking auth or before hydration — prevents flicker
  if (!mounted || isCheckingAuth) return null;

  return (
    <div className="min-h-screen bg-background flex overflow-hidden selection:bg-primary/30 transition-colors duration-500">
      {/* ── Theme Toggle ── */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-11 w-11 rounded-xl border border-border bg-card/50 backdrop-blur-xl flex items-center justify-center text-foreground hover:border-primary/40 hover:bg-primary/10 transition-all shadow-xl shadow-black/5 group"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 dark:-rotate-90 dark:scale-0 transition-all group-hover:rotate-12" />
          <Moon className="h-5 w-5 absolute rotate-90 scale-0 dark:rotate-0 dark:scale-100 transition-all group-hover:-rotate-12" />
        </button>
      </div>

      {/* ── Split Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 w-full">

        {/* ── Left: Brand Showcase ── */}
        <div className="relative hidden lg:flex flex-col items-center justify-center p-12 bg-slate-100 dark:bg-[#020617] overflow-hidden transition-colors duration-500">
          {/* Animated Grid */}
          <div className="absolute inset-[-100px] opacity-[0.05] dark:opacity-[0.05]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(rgba(148,163,184,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.3) 1px, transparent 1px)`,
                backgroundSize: "50px 50px",
                animation: "grid-drift 20s linear infinite"
              }}
            />
          </div>

          {/* Gradient Mesh Base */}
          <div className="absolute inset-0 opacity-40 dark:opacity-100 transition-opacity">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_30%_70%,rgba(30,64,175,0.12),transparent),radial-gradient(ellipse_60%_40%_at_70%_30%,rgba(56,189,248,0.08),transparent)]" />
          </div>

          {/* Floating Orbs */}
          <motion.div
            animate={{
              x: [0, 30, -20, 40, 0],
              y: [0, -40, 20, 30, 0],
              scale: [1, 1.06, 0.94, 1.04, 1]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-5%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary/10 blur-[80px]"
          />
          <motion.div
            animate={{
              x: [0, -30, 20, -40, 0],
              y: [0, 40, -20, -30, 0],
              scale: [1, 1.05, 0.95, 1.03, 1]
            }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear", delay: 2 }}
            className="absolute bottom-[-8%] right-[-5%] w-[350px] h-[350px] rounded-full bg-primary/10 blur-[80px]"
          />

          {/* Brand Content */}
          <div className="relative z-10 w-full max-w-md text-center">
            {/* Spinning Rings + Logo */}
            <div className="relative w-48 h-48 mx-auto mb-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-primary/20"
              >
                <div className="absolute top-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary shadow-lg shadow-primary/50" />
              </motion.div>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[15px] rounded-full border-2 border-dashed border-primary/15"
              />

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-2xl bg-card/60 backdrop-blur-xl border border-border flex items-center justify-center shadow-2xl shadow-black/10">
                <img src="/favicon.ico" alt="CADesk365 Logo" className="h-10 w-10 object-contain" />
              </div>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl font-black tracking-tight text-foreground leading-tight mb-4"
            >
              Manage your practice<br />
              with <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">CADesk365</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-muted-foreground text-base leading-relaxed mb-10"
            >
              Streamline compliance tracking, task management, and team performance — all in one powerful dashboard.
            </motion.p>

            {/* Feature Pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex flex-wrap justify-center gap-2.5"
            >
              {[
                { label: "Compliance", icon: CheckCircle2 },
                { label: "Team Mgmt", icon: ShieldCheck },
                { label: "Analytics", icon: BarChart3 },
                { label: "Deadlines", icon: Clock },
              ].map((f) => (
                <div
                  key={f.label}
                  className="px-4 py-2 rounded-full text-xs font-bold text-foreground/70 border border-border bg-card/50 backdrop-blur-md hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all cursor-default flex items-center gap-2"
                >
                  <f.icon className="h-3.5 w-3.5 text-primary" />
                  {f.label}
                </div>
              ))}
            </motion.div>
          </div>

          <div className="absolute bottom-8 text-[10px] text-muted-foreground/30 font-bold tracking-[0.3em] uppercase">
            CADesk365
          </div>
        </div>

        {/* ── Right: Login Form ── */}
        <div className="flex items-center justify-center p-8 bg-background relative overflow-hidden transition-colors duration-500">
          {/* Background Wash */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_80%_90%,rgba(30,64,175,0.03),transparent)] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{
              opacity: isSuccess ? 0.4 : 1,
              y: 0,
              scale: isSuccess ? 0.98 : 1
            }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[400px] relative z-10"
          >
            {/* Header */}
            <div className="mb-10">
              <div className="flex items-center gap-3 text-primary text-[11px] font-black tracking-[0.2em] uppercase mb-4">
                <div className="w-8 h-[2px] bg-primary rounded-full" />
                Welcome back
              </div>
              <h1 className="text-4xl font-black tracking-tight text-foreground mb-2">Sign in to your account</h1>
              <p className="text-sm text-muted-foreground">Enter your credentials to continue</p>
            </div>

            {/* Error Box */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
                  exit={{ opacity: 0, x: 10 }}
                  className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[13px] font-bold flex items-center gap-3"
                >
                  <div className="h-6 w-6 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                    ✕
                  </div>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2.5">
                <label htmlFor="email" className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">
                  Email address
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Mail className="h-[18px] w-[18px]" />
                  </div>
                  <input
                    id="email"
                    type="text"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-[54px] rounded-xl border border-border bg-card/30 backdrop-blur-sm pl-12 pr-4 text-sm font-medium text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all placeholder:text-muted-foreground/30"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label htmlFor="password" className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Lock className="h-[18px] w-[18px]" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-[54px] rounded-xl border border-border bg-card/30 backdrop-blur-sm pl-12 pr-12 text-sm font-medium text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all placeholder:text-muted-foreground/30"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-all"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || isSuccess}
                className="w-full h-[56px] mt-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-black text-base shadow-2xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all group overflow-hidden relative"
              >
                <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shine-sweep_2s_infinite]" />

                <div className="flex items-center justify-center gap-2 relative z-10">
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>
            </form>

            <div className="mt-10 flex flex-col items-center">
              <div className="flex items-center gap-4 w-full mb-8">
                <div className="h-px flex-1 bg-border/50" />
                <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em]">CADesk365</span>
                <div className="h-px flex-1 bg-border/50" />
              </div>


            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
