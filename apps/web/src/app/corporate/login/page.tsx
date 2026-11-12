"use client";

import React, { useState, Suspense, useId } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Phone,
  ShieldCheck,
  HelpCircle
} from "lucide-react";
import { PolyFitLogo } from "@/components/ui/polyfit-logo";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api-client";

type LoginMode = "signin" | "lookup" | "reset";

interface StatusLookupResult {
  exists: boolean;
  status: "pending_review" | "invite_pending" | "active" | "rejected" | "not_found" | "expired";
  email?: string;
  organization_name?: string;
  organization_id?: string;
  organization_slug?: string;
  invitation_token?: string;
  review_sla?: string;
  message?: string;
}

function CorporateLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const registeredParam = searchParams.get("registered") === "true";
  const redirectParam = searchParams.get("redirect") || "/corporate";

  const [mode, setMode] = useState<LoginMode>(registeredParam ? "lookup" : "signin");
  const [email, setEmail] = useState<string>(emailParam);
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(
    registeredParam
      ? "Registration submitted! Check your account status or enter your administrator password below."
      : null
  );
  const [lookupResult, setLookupResult] = useState<StatusLookupResult | null>(null);

  const emailId = useId();
  const passwordId = useId();
  const rememberId = useId();

  // 1. Sign In with Supabase Auth
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter your official corporate email address.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your administrator password.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (error) {
        // If credentials invalid, check if they have a pending invite
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          try {
            const check = await apiFetch<StatusLookupResult>(
              `/api/public/corporate/check-email?email=${encodeURIComponent(cleanEmail)}`
            );
            if (check.status === "invite_pending" && check.invitation_token) {
              setErrorMsg(
                `Your organization "${check.organization_name}" is approved, but your password is not formulated yet.`
              );
              setLookupResult(check);
              setLoading(false);
              return;
            }
            if (check.status === "pending_review") {
              setErrorMsg(
                `Your registration for "${check.organization_name}" is under review by PolyFit Operations.`
              );
              setLookupResult(check);
              setLoading(false);
              return;
            }
          } catch {}
        }
        throw new Error(error.message);
      }

      if (data.session) {
        setSuccessMsg("Signed in successfully! Loading corporate command center...");
        setTimeout(() => {
          router.push(redirectParam);
        }, 300);
      }
    } catch (err: any) {
      console.error("[CorporateLogin] Sign in error:", err);
      setErrorMsg(err.message || "Failed to sign in. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Application Status Lookup
  const handleStatusLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter your work email to look up registration status.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setLookupResult(null);

    try {
      const res = await apiFetch<StatusLookupResult>(
        `/api/public/corporate/check-email?email=${encodeURIComponent(cleanEmail)}`
      );
      setLookupResult(res);

      if (res.status === "invite_pending" && res.invitation_token) {
        setSuccessMsg("Invitation found! You can now activate your account and formulate your password.");
      } else if (res.status === "pending_review") {
        setSuccessMsg("Application located! Our Operations team is currently finalizing your agreement.");
      } else if (res.status === "active") {
        setSuccessMsg("Your account is active! Please switch to the Sign In tab and enter your password.");
      } else {
        setErrorMsg(res.message || "No corporate registration found for this email domain.");
      }
    } catch (err: any) {
      console.error("[CorporateLogin] Status lookup error:", err);
      setErrorMsg(err.message || "Could not check registration status. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Password Reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter your work email to receive password reset instructions.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/corporate/activate`
      });
      if (error) throw error;
      setSuccessMsg(`Password reset instructions dispatched to ${cleanEmail}. Check your inbox.`);
    } catch (err: any) {
      console.error("[CorporateLogin] Reset password error:", err);
      setErrorMsg(err.message || "Could not request password reset. Please contact PolyFit support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1F33] flex flex-col justify-between selection:bg-[#28D17C]/20 selection:text-[#0B1F33] relative overflow-x-hidden">
      {/* Ambient Longevity & Wellness Glow */}
      <div className="absolute top-0 inset-x-0 h-96 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(40,209,124,0.12),rgba(0,210,180,0.05)_50%,transparent_80%)] pointer-events-none" />

      {/* Top Navbar */}
      <header className="h-16 px-6 bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0B1F33] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to website</span>
          </Link>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <Link href="/" className="flex items-center gap-2">
            <PolyFitLogo theme="light" iconSize={26} />
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/corporate/register"
            className="text-xs font-semibold text-[#008A4B] hover:text-[#006837] transition-colors"
          >
            New Employer? Enroll Team
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-[#008A4B] font-semibold bg-[#E9FAF2] px-3 py-1 rounded-full border border-[#B7F1D2]">
            <Building2 className="w-3.5 h-3.5 text-[#28D17C]" />
            <span>Corporate HR Portal</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16 relative z-10">
        <div className="w-full max-w-md space-y-6">
          {/* Header Title */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 mx-auto shadow-md shadow-emerald-500/15 flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <Building2 className="w-6 h-6 text-[#28D17C]" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0B1F33]">
              {mode === "signin" && "Corporate HR Portal"}
              {mode === "lookup" && "Check Registration Status"}
              {mode === "reset" && "Reset Administrator Password"}
            </h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {mode === "signin" &&
                "Access employee benefit rosters, utilization analytics, and automated RRA EBM tax invoices."}
              {mode === "lookup" &&
                "Check the verification status of your company application or resume administrator activation."}
              {mode === "reset" &&
                "Enter your registered corporate email to receive a password reset link."}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200/90 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === "signin"
                  ? "bg-[#0B1F33] text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-[#0B1F33]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("lookup");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === "lookup"
                  ? "bg-[#0B1F33] text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-[#0B1F33]"
              }`}
            >
              Application Status
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("reset");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === "reset"
                  ? "bg-[#0B1F33] text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-[#0B1F33]"
              }`}
            >
              Reset
            </button>
          </div>

          {/* Alert Messages */}
          {errorMsg && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in-50 duration-200"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-semibold">{errorMsg}</p>
                {lookupResult?.status === "invite_pending" && lookupResult.invitation_token && (
                  <Link
                    href={`/corporate/activate?token=${lookupResult.invitation_token}`}
                    className="inline-flex items-center gap-1 font-bold text-[#008A4B] hover:underline pt-1"
                  >
                    <span>Click here to formulate password & activate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in-50 duration-200"
            >
              <CheckCircle2 className="w-4 h-4 text-[#28D17C] shrink-0 mt-0.5" />
              <p className="font-medium flex-1">{successMsg}</p>
            </div>
          )}

          {/* Form Container */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_4px_24px_-4px_rgba(11,31,51,0.08),0_1px_3px_rgba(11,31,51,0.04)]">
            {mode === "signin" && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label
                    htmlFor={emailId}
                    className="block text-xs font-semibold text-[#0B1F33] mb-1.5"
                  >
                    Official Corporate Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id={emailId}
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="hr@company.rw"
                      className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0B1F33] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#28D17C] focus:ring-2 focus:ring-[#28D17C]/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor={passwordId}
                      className="block text-xs font-semibold text-[#0B1F33]"
                    >
                      Administrator Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode("reset")}
                      className="text-[11px] font-semibold text-[#008A4B] hover:text-[#006837]"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id={passwordId}
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#0B1F33] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#28D17C] focus:ring-2 focus:ring-[#28D17C]/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label htmlFor={rememberId} className="flex items-center gap-2 cursor-pointer">
                    <input
                      id={rememberId}
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-[#28D17C] focus:ring-[#28D17C] w-3.5 h-3.5"
                    />
                    <span className="text-xs text-slate-600">Remember session</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs bg-[#28D17C] text-slate-950 hover:bg-[#22bf6f] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-500/15 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Corporate Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {mode === "lookup" && (
              <form onSubmit={handleStatusLookup} className="space-y-4">
                <div>
                  <label
                    htmlFor={emailId}
                    className="block text-xs font-semibold text-[#0B1F33] mb-1.5"
                  >
                    Registered Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id={emailId}
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contact@company.rw"
                      className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0B1F33] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#28D17C] focus:ring-2 focus:ring-[#28D17C]/20 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-[#28D17C] text-slate-950 hover:bg-[#22bf6f] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/15"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Checking Status...</span>
                    </>
                  ) : (
                    <>
                      <span>Check Application Status</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {lookupResult && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Organization:</span>
                      <span className="text-xs font-bold text-[#0B1F33]">
                        {lookupResult.organization_name || "Enterprise Client"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Status:</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          lookupResult.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : lookupResult.status === "invite_pending"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {lookupResult.status === "active"
                          ? "Active & Approved"
                          : lookupResult.status === "invite_pending"
                          ? "Approved — Activation Pending"
                          : "Under PolyFit Operations Review"}
                      </span>
                    </div>

                    {lookupResult.status === "pending_review" && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] leading-relaxed">
                          Your application is currently being verified by PolyFit Compliance (SLA: 24h
                          max). Once approved, an activation link will be sent to your email.
                        </p>
                      </div>
                    )}

                    {lookupResult.status === "invite_pending" && lookupResult.invitation_token && (
                      <Link
                        href={`/corporate/activate?token=${lookupResult.invitation_token}`}
                        className="w-full py-2.5 px-3 rounded-lg bg-[#28D17C] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#22bf6f] transition-colors shadow-xs"
                      >
                        <span>Activate & Formulate Password Now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    {lookupResult.status === "active" && (
                      <button
                        type="button"
                        onClick={() => setMode("signin")}
                        className="w-full py-2.5 px-3 rounded-lg bg-[#0B1F33] text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-colors"
                      >
                        <span>Switch to Sign In & Enter Password</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </form>
            )}

            {mode === "reset" && (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <label
                    htmlFor={emailId}
                    className="block text-xs font-semibold text-[#0B1F33] mb-1.5"
                  >
                    Work Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id={emailId}
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="hr@company.rw"
                      className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0B1F33] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#28D17C] focus:ring-2 focus:ring-[#28D17C]/20 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-[#28D17C] text-slate-950 hover:bg-[#22bf6f] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/15"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Dispatching Link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Password Reset Instructions</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className="text-xs text-slate-500 hover:text-[#0B1F33] transition-colors"
                  >
                    Remember your password? Return to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer Callouts */}
          <div className="text-center space-y-3 pt-2">
            <p className="text-xs text-slate-500">
              Need assistance? Contact your dedicated corporate account executive at{" "}
              <a href="tel:+250788123456" className="text-[#0B1F33] font-semibold hover:underline">
                +250 788 123 456
              </a>{" "}
              or via WhatsApp.
            </p>

            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-200">
              <Link href="/partner/login" className="hover:text-[#0B1F33] transition-colors">
                Partner Facility Login
              </Link>
              <span>•</span>
              <Link href="/operations/login" className="hover:text-[#0B1F33] transition-colors">
                PolyFit Operations
              </Link>
              <span>•</span>
              <Link href="/privacy" className="hover:text-[#0B1F33] transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CorporateLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#28D17C] border-t-transparent animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Loading Corporate Portal...</p>
          </div>
        </div>
      }
    >
      <CorporateLoginContent />
    </Suspense>
  );
}
