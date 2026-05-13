"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Lock, Eye, EyeOff, CheckCircle2, ChevronLeft, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { fetchAPI } from "@/lib/api/client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const passwordSchema = z
  .object({
    old_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [strengthScore, setStrengthScore] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      old_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const newPasswordValue = watch("new_password");

  useEffect(() => {
    let score = 0;
    if (!newPasswordValue) {
      setStrengthScore(0);
      return;
    }
    if (newPasswordValue.length >= 8) score++;
    if (newPasswordValue.length >= 12) score++;
    if (/[A-Z]/.test(newPasswordValue) && /[a-z]/.test(newPasswordValue)) score++;
    if (/[0-9]/.test(newPasswordValue)) score++;
    if (/[^A-Za-z0-9]/.test(newPasswordValue)) score++;
    setStrengthScore(Math.min(score, 5)); // max 5
  }, [newPasswordValue]);

  const onSubmit = async (data: PasswordFormValues) => {
    try {
      await fetchAPI("/api/method/frappe.core.doctype.user.user.update_password", {
        method: "POST",
        body: {
          old_password: data.old_password,
          new_password: data.new_password,
        },
      });

      toast.success("Password updated successfully!", {
        description: "Redirecting to settings...",
      });
      
      reset();
      
      setTimeout(() => {
        router.push("/settings");
      }, 1500);
      
    } catch (error: any) {
      let errorMessage = "Failed to update password.";
      const errStr = error.message || String(error);
      if (errStr.includes("Incorrect")) errorMessage = "Incorrect current password.";
      else if (errStr.includes("Invalid")) errorMessage = "Invalid password format.";
      else if (errStr.includes("Password requirements")) errorMessage = "Password does not meet security requirements.";
      else errorMessage = errStr;

      toast.error(errorMessage);
    }
  };

  const getStrengthColor = () => {
    if (strengthScore === 0) return "bg-border";
    if (strengthScore <= 2) return "bg-red-500";
    if (strengthScore <= 3) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getStrengthLabel = () => {
    if (strengthScore === 0) return "Minimum 8 characters";
    if (strengthScore <= 2) return "Weak";
    if (strengthScore <= 3) return "Fair";
    if (strengthScore === 4) return "Good";
    return "Strong";
  };

  const getStrengthLabelColor = () => {
    if (strengthScore === 0) return "text-muted-foreground";
    if (strengthScore <= 2) return "text-red-500 dark:text-red-400";
    if (strengthScore <= 3) return "text-amber-600 dark:text-amber-400";
    return "text-emerald-600 dark:text-emerald-400";
  };

  return (
    <div className="w-full max-w-[500px] mx-auto py-8">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border rounded-xl overflow-hidden shadow-sm"
      >
        {/* Header */}
        <div className="p-6 border-b bg-muted/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold">Update Password</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Enter your current password and choose a new secure password.
          </p>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
            {/* Current Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Current Password</label>
              <div className="relative">
                <input
                  type={showOld ? "text" : "password"}
                  className={cn(
                    "flex h-11 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors pr-10",
                    errors.old_password ? "border-red-500 focus-visible:ring-red-500/50" : "border-input"
                  )}
                  placeholder="Enter current password"
                  {...register("old_password")}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.old_password && (
                <p className="text-xs text-red-500 flex items-center gap-1.5 mt-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.old_password.message}
                </p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  className={cn(
                    "flex h-11 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors pr-10",
                    errors.new_password ? "border-red-500 focus-visible:ring-red-500/50" : "border-input"
                  )}
                  placeholder="Choose a new password"
                  {...register("new_password")}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password Strength */}
              <div className="pt-1.5">
                <div className="flex gap-1 h-1.5 mb-1.5">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={cn(
                        "flex-1 rounded-full transition-all duration-300",
                        strengthScore >= level ? getStrengthColor() : "bg-muted"
                      )}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className={cn("text-xs font-medium", getStrengthLabelColor())}>
                    {getStrengthLabel()}
                  </span>
                </div>
              </div>

              {errors.new_password && (
                <p className="text-xs text-red-500 flex items-center gap-1.5 mt-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.new_password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  className={cn(
                    "flex h-11 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors pr-10",
                    errors.confirm_password ? "border-red-500 focus-visible:ring-red-500/50" : "border-input"
                  )}
                  placeholder="Re-enter new password"
                  {...register("confirm_password")}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="text-xs text-red-500 flex items-center gap-1.5 mt-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.confirm_password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full flex items-center justify-center gap-2 h-11 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-all",
                "hover:bg-primary/90 hover:shadow-md active:scale-[0.98]",
                isSubmitting && "opacity-70 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Update Password
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
