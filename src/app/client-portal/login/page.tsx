"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendOtp, verifyOtp } from "@/lib/api/client-portal";
import { toast } from "sonner";
import { Shield, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ClientPortalLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const savedCooldown = sessionStorage.getItem("otp_cooldown");
    if (savedCooldown) {
      const expiryTime = parseInt(savedCooldown, 10);
      const remaining = Math.max(0, Math.ceil((expiryTime - Date.now()) / 1000));
      if (remaining > 0) setCooldown(remaining);
      else sessionStorage.removeItem("otp_cooldown");
    }
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      sessionStorage.removeItem("otp_cooldown");
    }
  }, [cooldown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      toast.error("Please enter a valid 10-digit number");
      return;
    }
    if (cooldown > 0) return;

    setIsLoading(true);
    try {
      const res = await sendOtp(phone);
      toast.success(res.message || "OTP sent successfully");
      if (res.dev_otp) toast.info(`Dev OTP: ${res.dev_otp}`, { duration: 10000 });
      setStep("otp");
      setCooldown(60);
      sessionStorage.setItem("otp_cooldown", (Date.now() + 60000).toString());
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      toast.error("Enter a valid OTP");
      return;
    }
    setIsLoading(true);
    try {
      const success = await verifyOtp(phone, otp);
      if (success) {
        toast.success("Identity verified successfully");
        sessionStorage.setItem("client_phone", phone);
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect");
        router.push(redirect || "/client-portal");
      } else {
        toast.error("Invalid verification code");
      }
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4 relative overflow-hidden text-slate-200">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
        backgroundSize: "48px 48px",
      }} />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-12">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="h-24 w-24 bg-gradient-to-tr from-primary to-emerald-400 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-[0_20px_50px_rgba(20,184,166,0.3)]"
          >
            <Shield className="h-12 w-12" />
          </motion.div>
          <h1 className="text-5xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            CADesk365
          </h1>
          <div className="flex items-center justify-center gap-2 text-slate-400 font-medium tracking-wide uppercase text-xs">
            <Lock className="h-3 w-3 text-primary" />
            Secure Client Environment
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-[#121214]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 shadow-3xl">
            <AnimatePresence mode="wait">
              {step === "phone" ? (
                <motion.form 
                  key="phone"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onSubmit={handleSendOtp} 
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                      <span className="text-[10px] text-primary font-mono">ENCRYPTED</span>
                    </div>
                    <div className="relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold border-r border-white/10 pr-4 mr-4">
                        +91
                      </div>
                      <Input 
                        type="tel" 
                        placeholder="99888 77666" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="h-16 pl-20 bg-black/40 border-white/5 text-xl font-medium tracking-widest focus:ring-primary/30 focus:border-primary/50/50 rounded-2xl transition-all placeholder:text-slate-700"
                        disabled={isLoading}
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-16 text-lg font-black bg-white text-black hover:bg-slate-200 rounded-2xl transition-all active:scale-[0.97] disabled:opacity-50 group" 
                    disabled={isLoading || phone.length < 10 || cooldown > 0}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-3">
                        <div className="h-5 w-5 border-3 border-black/20 border-t-black rounded-full animate-spin" />
                        IDENTIFYING...
                      </div>
                    ) : cooldown > 0 ? (
                      `WAIT ${cooldown}s`
                    ) : (
                      <span className="flex items-center gap-2">
                        SECURE LOGIN <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </Button>
                </motion.form>
              ) : (
                <motion.form 
                  key="otp"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onSubmit={handleVerifyOtp} 
                  className="space-y-8"
                >
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold">Verification</h2>
                    <p className="text-sm text-slate-400">
                      Code sent to <span className="text-white font-mono">+91 {phone.replace(/(\d{5})(\d{5})/, "$1 $2")}</span>
                    </p>
                  </div>
                  
                  <Input 
                    type="text" 
                    placeholder="0000" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="h-20 text-center text-4xl tracking-[0.5em] font-black bg-black/40 border-white/5 focus:ring-emerald-500/30 focus:border-emerald-500/50 rounded-2xl"
                    disabled={isLoading}
                    autoFocus
                  />

                  <div className="space-y-4">
                    <Button 
                      type="submit" 
                      className="w-full h-16 text-lg font-black bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.2)] transition-all active:scale-[0.97]" 
                      disabled={isLoading || otp.length < 4}
                    >
                      {isLoading ? "VERIFYING..." : "GRANT ACCESS"}
                    </Button>

                    <div className="flex justify-between px-2">
                      <button 
                        type="button" 
                        onClick={() => setStep("phone")}
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest font-bold"
                      >
                        ← Back
                      </button>
                      <button 
                        type="button" 
                        onClick={handleSendOtp}
                        disabled={cooldown > 0 || isLoading}
                        className="text-xs text-primary font-bold hover:text-primary/80 disabled:opacity-30 uppercase tracking-widest"
                      >
                        {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <div className="mt-12 flex items-center justify-center gap-8 text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
          <span>MFA Enabled</span>
          <div className="h-1 w-1 bg-slate-800 rounded-full" />
          <span>Biometric Ready</span>
          <div className="h-1 w-1 bg-slate-800 rounded-full" />
          <span>ISO 27001</span>
        </div>
      </motion.div>
    </div>
  );
}
