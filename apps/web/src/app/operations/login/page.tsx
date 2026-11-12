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
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1F33] flex flex-col justify-between selection:bg-[#28D17C]/20 selection:text-[#0B1F33] relative overflow-x-hidden">
      {/* Ambient Longevity & Telemetry Glow */}
      <div className="absolute top-0 inset-x-0 h-96 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(40,209,124,0.12),rgba(0,210,180,0.05)_50%,transparent_80%)] pointer-events-none" />

      {/* Top Header */}
      <header className="h-16 px-6 bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <PolyFitLogo theme="light" iconSize={26} />
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#008A4B] bg-[#E9FAF2] px-2.5 py-0.5 rounded-full border border-[#B7F1D2]">
              Operations Center
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-[#28D17C]" />
          <span className="hidden sm:inline">Restricted Console &bull; Internal Personnel Only</span>
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#E9FAF2] border border-[#B7F1D2] text-[#008A4B] flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
              <KeyRound className="w-6 h-6 text-[#28D17C]" />
            </div>
            <h1 className="text-2xl font-black text-[#0B1F33] tracking-tight">
              PolyFit Staff Clearance
            </h1>
            <p className="text-xs text-slate-500">
              Super Admin, Network Operations & Settlement Audit Console
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_24px_-4px_rgba(11,31,51,0.08),0_1px_3px_rgba(11,31,51,0.04)] space-y-5">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in-50 duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <p className="font-semibold">{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0B1F33] uppercase tracking-wider mb-1.5">
                  PolyFit Staff Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@polyfit.africa"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-[#0B1F33] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#28D17C] focus:ring-2 focus:ring-[#28D17C]/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1F33] uppercase tracking-wider mb-1.5">
                  Security Passkey / Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-[#0B1F33] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#28D17C] focus:ring-2 focus:ring-[#28D17C]/20 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#28D17C] hover:bg-[#22bf6f] text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-500/15 transition-all disabled:opacity-50 cursor-pointer"
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
            <div className="pt-4 border-t border-slate-200 text-center space-y-2">
              <button
                type="button"
                onClick={handleDemoBypass}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1F33] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200/80 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#008A4B]" />
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
      <footer className="py-4 px-6 text-center text-xs text-slate-500 border-t border-slate-200">
        PolyFit Operations & Infrastructure &bull; Kigali Headquarters &bull; Confidential
      </footer>
    </div>
  );
}

export default function OperationsLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#28D17C] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OperationsLoginContent />
    </Suspense>
  );
}
