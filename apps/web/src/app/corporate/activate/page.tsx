"use client";

import React, { useState, useEffect, Suspense, useId } from "react";
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
  Check,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  FileText,
  Clock
} from "lucide-react";
import { PolyFitLogo } from "@/components/ui/polyfit-logo";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api-client";

interface CheckEmailResponse {
  valid?: boolean;
  exists?: boolean;
  status: "pending_review" | "invite_pending" | "active" | "rejected" | "not_found" | "expired";
  email?: string;
  role?: string;
  org_id?: string;
  organization_name?: string;
  organization_slug?: string;
  token?: string;
  message?: string;
}

function CorporateActivateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const [token, setToken] = useState<string>(tokenParam);
  const [email, setEmail] = useState<string>(emailParam);
  const [companyName, setCompanyName] = useState<string>("Your Organization");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

  const [verifyingToken, setVerifyingToken] = useState<boolean>(Boolean(tokenParam));
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [activatedOrgSlug, setActivatedOrgSlug] = useState<string>("corporate");

  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const termsId = useId();

  // Password Validation Checklist Rules
  const hasMinLength = password.length >= 8;
  const hasUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumOrSpecial = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isPasswordValid = hasMinLength && hasUpperLower && hasNumOrSpecial && passwordsMatch;

  // Verify token on mount if provided
  useEffect(() => {
    async function verifyInviteToken() {
      if (!token && !email) {
        setVerifyingToken(false);
        return;
      }

      setVerifyingToken(true);
      setErrorMsg(null);
      try {
        const query = token ? `token=${encodeURIComponent(token)}` : `email=${encodeURIComponent(email)}`;
        const res = await apiFetch<CheckEmailResponse>(`/api/public/corporate/check-email?${query}`);

        if (res.status === "invite_pending" || res.valid) {
          if (res.email) setEmail(res.email);
          if (res.organization_name) setCompanyName(res.organization_name);
          if (res.organization_slug) setActivatedOrgSlug(res.organization_slug);
          if (res.token) setToken(res.token);
        } else if (res.status === "active") {
          setErrorMsg("This corporate invitation has already been activated. Please sign in with your password.");
        } else if (res.status === "pending_review") {
          setErrorMsg("Your corporate registration is currently under review by PolyFit Operations. An activation link will be sent upon approval.");
        } else {
          setErrorMsg(res.message || "Invitation link is invalid or has expired.");
        }
      } catch (err: any) {
        console.error("[CorporateActivate] Token check notice:", err);
        setErrorMsg(err.message || "Unable to verify invitation link. Please request a new invitation from Operations.");
      } finally {
        setVerifyingToken(false);
      }
    }

    verifyInviteToken();
  }, [tokenParam, emailParam]);

  const handleActivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setErrorMsg("Please satisfy all password security requirements before proceeding.");
      return;
    }
    if (!termsAccepted) {
      setErrorMsg("You must review and agree to the Corporate Wellness Agreement and Terms of Service.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        token: token || undefined,
        email: email.trim().toLowerCase(),
        password,
        terms_accepted: true
      };

      const res = await apiFetch<{
        success: boolean;
        session?: { access_token: string; refresh_token: string };
        organization?: { id: string; name: string; slug: string };
        message?: string;
        redirect_url?: string;
      }>("/api/public/corporate/activate-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.session?.access_token) {
        try {
          await supabase.auth.setSession({
            access_token: res.session.access_token,
            refresh_token: res.session.refresh_token
          });
        } catch (authErr) {
          console.warn("[CorporateActivate] Set session notice:", authErr);
        }
      }

      if (res.organization?.slug) {
        setActivatedOrgSlug(res.organization.slug);
      }
      if (res.organization?.name) {
        setCompanyName(res.organization.name);
      }

      setIsActivated(true);
    } catch (err: any) {
      console.error("[CorporateActivate] Activation error:", err);
      setErrorMsg(err.message || "Failed to activate corporate account. Please check your credentials or request a new link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedToDashboard = () => {
    router.push(`/corporate?org=${activatedOrgSlug}&welcome=true`);
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
            href="/corporate/login"
            className="text-xs font-semibold text-slate-600 hover:text-[#0B1F33] transition-colors"
          >
            Already Activated? Sign In
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-[#008A4B] font-semibold bg-[#E9FAF2] px-3 py-1 rounded-full border border-[#B7F1D2]">
            <Building2 className="w-3.5 h-3.5 text-[#28D17C]" />
            <span>Account Activation</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16 relative z-10">
        <div className="w-full max-w-lg space-y-6">
          {verifyingToken ? (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-8 text-center space-y-4 shadow-[0_4px_24px_-4px_rgba(11,31,51,0.08),0_1px_3px_rgba(11,31,51,0.04)]">
              <div className="w-10 h-10 border-2 border-[#28D17C] border-t-transparent rounded-full animate-spin mx-auto" />
              <h2 className="text-base font-bold text-[#0B1F33]">Verifying Corporate Invitation...</h2>
              <p className="text-xs text-slate-500">Connecting with PolyFit Operations clearinghouse</p>
            </div>
          ) : isActivated ? (
            /* Screen 3: Welcome & Confirmation */
            <div className="bg-white border border-slate-200/90 rounded-3xl p-8 text-center space-y-6 shadow-[0_4px_24px_-4px_rgba(11,31,51,0.08),0_1px_3px_rgba(11,31,51,0.04)] animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-[#E9FAF2] border border-[#B7F1D2] flex items-center justify-center mx-auto text-[#008A4B]">
                <CheckCircle2 className="w-8 h-8 text-[#28D17C]" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E9FAF2] text-[#008A4B] border border-[#B7F1D2]">
                  Account Ready
                </span>
                <h2 className="text-2xl font-extrabold text-[#0B1F33] tracking-tight">
                  Welcome to PolyFit, {companyName}!
                </h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Your administrator credentials are confirmed and your corporate wellness portal is fully activated.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-[#28D17C] flex-shrink-0" />
                  <span>Role: <strong>Corporate Administrator (HR/Finance)</strong></span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <Mail className="w-4 h-4 text-[#28D17C] flex-shrink-0" />
                  <span>Admin Email: <strong>{email}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <Building2 className="w-4 h-4 text-[#28D17C] flex-shrink-0" />
                  <span>Tenant Workspace: <strong>{companyName}</strong></span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleProceedToDashboard}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-[#28D17C] text-slate-950 hover:bg-[#22bf6f] transition-all shadow-md shadow-emerald-500/15 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch Corporate HR Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Screen 2: Password Formulation & Terms Acceptance */
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 mx-auto shadow-md shadow-emerald-500/15 flex items-center justify-center">
                  <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-[#28D17C]" />
                  </div>
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#0B1F33]">
                  Formulate Administrator Password
                </h1>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Set a secure password for <strong className="text-[#0B1F33]">{companyName}</strong> to activate your corporate wellness administrative console.
                </p>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in-50 duration-200"
                >
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold">{errorMsg}</p>
                    {errorMsg.includes("already been activated") && (
                      <Link
                        href="/corporate/login"
                        className="inline-flex items-center gap-1 font-bold text-[#008A4B] hover:underline pt-1"
                      >
                        <span>Click here to sign in</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_4px_24px_-4px_rgba(11,31,51,0.08),0_1px_3px_rgba(11,31,51,0.04)]">
                <form onSubmit={handleActivateSubmit} className="space-y-4">
                  {/* Readonly Work Email */}
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

                  {/* Password Input */}
                  <div>
                    <label
                      htmlFor={passwordId}
                      className="block text-xs font-semibold text-[#0B1F33] mb-1.5"
                    >
                      New Administrator Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id={passwordId}
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create strong password"
                        className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#0B1F33] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#28D17C] focus:ring-2 focus:ring-[#28D17C]/20 transition-all font-mono"
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

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor={confirmPasswordId}
                      className="block text-xs font-semibold text-[#0B1F33] mb-1.5"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id={confirmPasswordId}
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0B1F33] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#28D17C] focus:ring-2 focus:ring-[#28D17C]/20 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Visual Password Security Checklist */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Security Requirements (Enterprise Standard)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${
                            hasMinLength
                              ? "bg-[#28D17C] text-slate-950 font-bold"
                              : "bg-slate-200 text-slate-400"
                          }`}
                        >
                          {hasMinLength ? <Check className="w-2.5 h-2.5" /> : "•"}
                        </div>
                        <span className={hasMinLength ? "text-emerald-700 font-medium" : "text-slate-500"}>
                          At least 8 characters
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${
                            hasUpperLower
                              ? "bg-[#28D17C] text-slate-950 font-bold"
                              : "bg-slate-200 text-slate-400"
                          }`}
                        >
                          {hasUpperLower ? <Check className="w-2.5 h-2.5" /> : "•"}
                        </div>
                        <span className={hasUpperLower ? "text-emerald-700 font-medium" : "text-slate-500"}>
                          Upper & lower case
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${
                            hasNumOrSpecial
                              ? "bg-[#28D17C] text-slate-950 font-bold"
                              : "bg-slate-200 text-slate-400"
                          }`}
                        >
                          {hasNumOrSpecial ? <Check className="w-2.5 h-2.5" /> : "•"}
                        </div>
                        <span className={hasNumOrSpecial ? "text-emerald-700 font-medium" : "text-slate-500"}>
                          Number or symbol
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${
                            passwordsMatch
                              ? "bg-[#28D17C] text-slate-950 font-bold"
                              : "bg-slate-200 text-slate-400"
                          }`}
                        >
                          {passwordsMatch ? <Check className="w-2.5 h-2.5" /> : "•"}
                        </div>
                        <span className={passwordsMatch ? "text-emerald-700 font-medium" : "text-slate-500"}>
                          Passwords match
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Terms Acceptance */}
                  <div className="pt-2">
                    <label htmlFor={termsId} className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        id={termsId}
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="rounded border-slate-300 text-[#28D17C] focus:ring-[#28D17C] w-4 h-4 mt-0.5 flex-shrink-0"
                      />
                      <span className="text-xs text-slate-600 leading-relaxed">
                        I confirm that I am an authorized corporate administrator for{" "}
                        <strong className="text-[#0B1F33]">{companyName}</strong>, and I agree to the{" "}
                        <Link href="/terms" target="_blank" className="text-[#008A4B] font-semibold hover:underline">
                          Corporate Wellness Agreement
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" target="_blank" className="text-[#008A4B] font-semibold hover:underline">
                          Privacy Policy
                        </Link>
                        .
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !isPasswordValid || !termsAccepted}
                    className="w-full mt-4 py-3 px-4 rounded-xl font-bold text-xs bg-[#28D17C] text-slate-950 hover:bg-[#22bf6f] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-500/15 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Activating Administrator Portal...</span>
                      </>
                    ) : (
                      <>
                        <span>Activate Corporate Portal & Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="text-center pt-2">
                <Link
                  href="/corporate/login"
                  className="text-xs text-slate-500 hover:text-[#0B1F33] transition-colors"
                >
                  Already set your password? Return to Corporate Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CorporateActivatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#28D17C] border-t-transparent animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Loading activation credentials...</p>
          </div>
        </div>
      }
    >
      <CorporateActivateContent />
    </Suspense>
  );
}
