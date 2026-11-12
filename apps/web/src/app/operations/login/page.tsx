"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
  Sparkles
} from "lucide-react";
import { PolyFitLogo } from "@/components/ui/polyfit-logo";
import { supabase } from "@polyfit/supabase-client";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";

function OperationsLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/operations";
  const { enableDemoMode } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMsg("Please enter both staff email and secure password");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Supabase Auth sign-in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (authError) {
        throw new Error(authError.message || "Invalid PolyFit staff credentials");
      }

      const user = authData?.user;
      if (!user) {
        throw new Error("Unable to establish authenticated session");
      }

      // 2. Operations role verification via backend
      let hasClearance = false;
      try {
        const verifyRes = await apiFetch<any>("/api/public/operations/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, email: user.email })
        });
        if (verifyRes?.verified) {
          hasClearance = true;
        }
      } catch (err) {
        console.warn("[OperationsLogin] Backend verify notice:", err);
      }

      // Metadata or user_roles check fallback
      if (!hasClearance) {
        const role = user.user_metadata?.role;
        if (role === "super_admin" || role === "polyfit_ops") {
          hasClearance = true;
        }
      }

      if (!hasClearance) {
        await supabase.auth.signOut();
        throw new Error(
          "Access Denied: Your account does not hold PolyFit Operations clearance (super_admin or polyfit_ops required)."
        );
      }

      router.push(returnUrl);
    } catch (err: any) {
      console.error("[OperationsLogin] Sign-in error:", err);
      setErrorMsg(err.message || "Sign in failed. Please verify your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoBypass = () => {
    enableDemoMode?.();
    router.push(returnUrl);
  };

  return (
    <div className="min-h-screen bg-[#07131F] text-slate-100 flex flex-col justify-between selection:bg-emerald-500/20 selection:text-white">
      {/* Top Header */}
      <header className="h-16 px-6 bg-slate-900/60 backdrop-blur-md border-b border-slate-800 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <PolyFitLogo theme="dark" iconSize={26} />
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Operations Center
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Restricted Console &bull; Internal Personnel Only</span>
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              PolyFit Staff Clearance
            </h1>
            <p className="text-xs text-slate-400">
              Super Admin, Network Operations & Settlement Audit Console
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-5">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  PolyFit Staff Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@polyfit.africa"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Security Passkey / Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      <span>Authenticating Staff...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Operations</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Demo Access for Evaluation */}
            <div className="pt-4 border-t border-slate-800 text-center space-y-2">
              <button
                type="button"
                onClick={handleDemoBypass}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700/60"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Launch Operations Demo Console (Local Test Mode)</span>
              </button>
              <p className="text-[10px] text-slate-500">
                Staff accounts require multi-factor verification under PolyFit Enterprise Security Standards.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 text-center text-xs text-slate-600 border-t border-slate-800">
        PolyFit Operations & Infrastructure &bull; Kigali Headquarters &bull; Confidential
      </footer>
    </div>
  );
}

export default function OperationsLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07131F] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OperationsLoginContent />
    </Suspense>
  );
}
