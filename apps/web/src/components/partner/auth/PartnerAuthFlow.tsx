'use client';

import React, { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  Clock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ExternalLink,
  Lock,
  Mail,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { supabase } from '@/lib/supabase';

interface PartnerAuthFlowProps {
  initialMode?: 'lookup' | 'activate';
  initialToken?: string;
  initialEmail?: string;
}

type AuthStep =
  | 'lookup'
  | 'pending_review'
  | 'password_formulation'
  | 'welcome_confirmation'
  | 'returning_login'
  | 'token_invalid';

interface EmailCheckResult {
  exists?: boolean;
  valid?: boolean;
  status: 'pending_review' | 'invite_pending' | 'active' | 'rejected' | 'not_found' | 'expired';
  email?: string;
  provider_name?: string;
  provider_id?: string;
  invitation_token?: string;
  token?: string;
  role?: string;
  review_sla?: string;
  message?: string;
}

export function PartnerAuthFlow({
  initialMode = 'lookup',
  initialToken = '',
  initialEmail = ''
}: PartnerAuthFlowProps) {
  const router = useRouter();

  // State
  const [step, setStep] = useState<AuthStep>('lookup');
  const [email, setEmail] = useState<string>(initialEmail);
  const [token, setToken] = useState<string>(initialToken);
  const [providerName, setProviderName] = useState<string>('');
  const [providerRole, setProviderRole] = useState<string>('Admin');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Status & Feedback
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusDetails, setStatusDetails] = useState<EmailCheckResult | null>(null);

  // Accessibility IDs
  const emailInputId = useId();
  const passwordInputId = useId();
  const termsCheckboxId = useId();
  const rememberCheckboxId = useId();

  // Password validation rules
  const hasMinLength = password.length >= 8;
  const hasUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumOrSpecial = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const isPasswordValid = hasMinLength && hasUpperLower && hasNumOrSpecial;

  // Auto-verify if token is provided on initial mount
  useEffect(() => {
    if (initialToken && initialToken.trim()) {
      verifyToken(initialToken.trim());
    } else if (initialEmail && initialEmail.trim()) {
      handleLookup(initialEmail.trim());
    }
  }, [initialToken, initialEmail]);

  // Token verification handler (Direct activation links via WhatsApp / email)
  const verifyToken = async (invitationToken: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await apiFetch<EmailCheckResult>(
        `/api/public/partner/check-email?token=${encodeURIComponent(invitationToken)}`
      );

      if (data.status === 'invite_pending') {
        setToken(invitationToken);
        if (data.email) setEmail(data.email);
        if (data.provider_name) setProviderName(data.provider_name);
        if (data.role) setProviderRole(data.role === 'provider_admin' ? 'Admin' : 'Staff');
        setStatusDetails(data);
        setStep('password_formulation');
      } else if (data.status === 'active') {
        if (data.email) setEmail(data.email);
        setErrorMsg('This invitation has already been activated. Please enter your password to sign in.');
        setStep('returning_login');
      } else {
        setErrorMsg(data.message || 'This invitation link is invalid or has expired.');
        setStep('token_invalid');
      }
    } catch (err: any) {
      console.error('[PartnerAuth] Token check error:', err);
      setErrorMsg(err.message || 'Unable to verify invitation link. Please request a new one.');
      setStep('token_invalid');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Identifier lookup (Screen 1)
  const handleLookup = async (lookupEmail?: string) => {
    const targetEmail = (lookupEmail || email).trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const data = await apiFetch<EmailCheckResult>(
        `/api/public/partner/check-email?email=${encodeURIComponent(targetEmail)}`
      );
      setStatusDetails(data);
      if (data.provider_name) setProviderName(data.provider_name);

      if (data.status === 'pending_review') {
        // High-trust Operations Review Screen
        setStep('pending_review');
      } else if (data.status === 'invite_pending') {
        // Direct transition to Password Formulation (Screen 2)
        if (data.invitation_token) setToken(data.invitation_token);
        if (data.role) setProviderRole(data.role === 'provider_admin' ? 'Admin' : 'Staff');
        setStep('password_formulation');
      } else if (data.status === 'active') {
        // Returning Login
        setStep('returning_login');
      } else if (data.status === 'rejected') {
        setErrorMsg(data.message || 'Your facility registration was not approved. Please contact Operations.');
      } else {
        // not_found
        setErrorMsg('No wellness provider account found for this email. Would you like to sign up for free?');
      }
    } catch (err: any) {
      console.error('[PartnerAuth] Email lookup error:', err);
      setErrorMsg(err.message || 'Could not reach PolyFit auth service. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Password Formulation & Account Activation (Screen 2)
  const handleActivateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setErrorMsg('Please satisfy all password security requirements.');
      return;
    }
    if (!termsAccepted) {
      setErrorMsg('You must agree to the Terms of Use and Privacy Policy to proceed.');
      return;
    }

    setLoading(true);
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
        redirect_url?: string;
        session?: { access_token: string; refresh_token: string };
        provider?: { id: string; name: string };
        message?: string;
      }>('/api/public/partner/activate-account', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Synchronize Supabase Auth browser session if tokens returned
      if (res.session?.access_token) {
        try {
          await supabase.auth.setSession({
            access_token: res.session.access_token,
            refresh_token: res.session.refresh_token
          });
        } catch (authErr) {
          console.warn('[PartnerAuth] Set session notice:', authErr);
        }
      }

      if (res.provider?.name) {
        setProviderName(res.provider.name);
      }

      // Transition to Welcome & Access Confirmation (Screen 3)
      setStep('welcome_confirmation');
    } catch (err: any) {
      console.error('[PartnerAuth] Activation error:', err);
      setErrorMsg(err.message || 'Account activation failed. Please check your details or request a new link.');
    } finally {
      setLoading(false);
    }
  };

  // Returning Login handler
  const handleReturningLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        throw new Error(error.message);
      }

      // Successful login for returning partners routes to dashboard
      router.push('/partner/dashboard');
    } catch (err: any) {
      console.error('[PartnerAuth] Login error:', err);
      setErrorMsg(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Welcome Confirmation -> Continue to Facility Setup
  const handleProceedToSetup = () => {
    router.push('/partner/setup');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 group mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#0B1F33] flex items-center justify-center shadow-lg shadow-[#0B1F33]/20 border border-slate-800">
            <span className="text-xl font-black text-white tracking-tight">P</span>
            <span className="w-2 h-2 rounded-full bg-[#28D17C] animate-pulse" />
          </div>
          <span className="text-2xl font-black tracking-tight text-[#0B1F33] dark:text-white">
            Poly<span className="text-[#28D17C]">Fit</span>
          </span>
        </Link>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <Building2 className="w-3.5 h-3.5 text-[#28D17C]" />
          <span>Partner Portal</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all">
        {/* Error Banner */}
        {errorMsg && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">{errorMsg}</p>
              {errorMsg.includes('sign up') && (
                <Link
                  href="/partner/register"
                  className="mt-2 inline-flex items-center gap-1 font-semibold text-[#28D17C] hover:underline"
                >
                  Register your facility <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN 1: IDENTIFIER LOOKUP                                     */}
        {/* ============================================================== */}
        {step === 'lookup' && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] dark:text-white tracking-tight">
                Enter your email
              </h1>
              <p className="text-sm text-[#526173] dark:text-slate-400 mt-1.5">
                It's the one you used to sign up for PolyFit.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookup();
              }}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor={emailInputId}
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    id={emailInputId}
                    type="email"
                    autoFocus
                    required
                    autoComplete="email"
                    placeholder="e.g. manager@kigalifitness.rw"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#28D17C] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3.5 px-4 bg-[#28D17C] hover:bg-[#22b56a] disabled:opacity-50 text-[#0B1F33] font-bold text-base rounded-xl transition-all shadow-md shadow-[#28D17C]/20 hover:shadow-lg hover:shadow-[#28D17C]/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-[#0B1F33] border-t-transparent rounded-full animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Don't have an account?{' '}
                <Link
                  href="/partner/register"
                  className="font-bold text-[#28D17C] hover:text-[#22b56a] hover:underline transition-colors"
                >
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN: PENDING OPERATIONS REVIEW (24H MAX SLA)                */}
        {/* ============================================================== */}
        {step === 'pending_review' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('lookup')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to email
              </button>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                24h Max SLA
              </span>
            </div>

            <div className="text-center pt-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-4">
                <Clock className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-extrabold text-[#0B1F33] dark:text-white">
                Application Under Review
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                Application for <strong className="text-slate-900 dark:text-white">{providerName || 'Your Facility'}</strong>
              </p>
            </div>

            {/* Stepper Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Facility Details Submitted</p>
                  <p className="text-[11px] text-slate-500">Contact, categories & operating amenities recorded</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 animate-pulse">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Operations KYC Verification</p>
                  <p className="text-[11px] text-slate-500">Kigali operations desk review (guaranteed within 24 hours)</p>
                </div>
              </div>

              <div className="flex items-center gap-3 opacity-60">
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Activation Link Dispatched</p>
                  <p className="text-[11px] text-slate-500">Delivered via WhatsApp & email for password setup</p>
                </div>
              </div>
            </div>

            {/* WhatsApp Deep Link / Operations Contact */}
            <div className="pt-2 space-y-3">
              <a
                href={`https://wa.me/250790000000?text=${encodeURIComponent(
                  `Hello PolyFit Operations, checking status of facility review for ${providerName} (${email})`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Contact Operations Desk (WhatsApp)</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>

              <button
                type="button"
                onClick={() => setStep('lookup')}
                className="w-full py-2.5 px-4 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors"
              >
                Check another email
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN 2: PASSWORD FORMULATION                                 */}
        {/* ============================================================== */}
        {step === 'password_formulation' && (
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setStep('lookup')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                {providerName && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {providerName}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] dark:text-white tracking-tight">
                Create your password
              </h1>
              <p className="text-sm text-[#526173] dark:text-slate-400 mt-1">
                Your password is for <strong className="text-slate-900 dark:text-white">{email}</strong>.
              </p>
            </div>

            <form onSubmit={handleActivateAccount} className="space-y-6">
              <div>
                <label
                  htmlFor={passwordInputId}
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    id={passwordInputId}
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    required
                    autoComplete="new-password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#28D17C] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Dynamic Real-Time Password Checklist */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                {/* Rule 1: Upper and Lower */}
                <div className="flex items-center gap-2.5 text-xs">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                      hasUpperLower
                        ? 'bg-[#28D17C] text-[#0B1F33]'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span
                    className={`transition-colors ${
                      hasUpperLower
                        ? 'font-bold text-slate-900 dark:text-white'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Upper and lower cases
                  </span>
                </div>

                {/* Rule 2: Number or special character */}
                <div className="flex items-center gap-2.5 text-xs">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                      hasNumOrSpecial
                        ? 'bg-[#28D17C] text-[#0B1F33]'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span
                    className={`transition-colors ${
                      hasNumOrSpecial
                        ? 'font-bold text-slate-900 dark:text-white'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Number or special character (e.g. !, @, #)
                  </span>
                </div>

                {/* Rule 3: At least 8 characters */}
                <div className="flex items-center gap-2.5 text-xs">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                      hasMinLength
                        ? 'bg-[#28D17C] text-[#0B1F33]'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span
                    className={`transition-colors ${
                      hasMinLength
                        ? 'font-bold text-slate-900 dark:text-white'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    At least 8 characters
                  </span>
                </div>
              </div>

              {/* Terms of Use & Privacy Checkbox */}
              <div className="flex items-start gap-3">
                <input
                  id={termsCheckboxId}
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#28D17C] focus:ring-[#28D17C] cursor-pointer"
                />
                <label
                  htmlFor={termsCheckboxId}
                  className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed cursor-pointer"
                >
                  I have read and agree to the{' '}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="font-bold text-[#28D17C] hover:underline"
                  >
                    Terms of Use
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="font-bold text-[#28D17C] hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !isPasswordValid || !termsAccepted}
                className="w-full py-3.5 px-4 bg-[#28D17C] hover:bg-[#22b56a] disabled:opacity-50 text-[#0B1F33] font-bold text-base rounded-xl transition-all shadow-md shadow-[#28D17C]/20 hover:shadow-lg hover:shadow-[#28D17C]/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-[#0B1F33] border-t-transparent rounded-full animate-spin" />
                    <span>Activating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Sign up</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN 3: WELCOME & ACCESS CONFIRMATION                         */}
        {/* ============================================================== */}
        {step === 'welcome_confirmation' && (
          <div className="text-center py-4 space-y-6">
            {/* Emerald Glowing Circular Checkmark */}
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#28D17C]/25 blur-xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-full bg-[#28D17C] text-[#0B1F33] flex items-center justify-center shadow-2xl shadow-[#28D17C]/40">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-black text-[#0B1F33] dark:text-white tracking-tight">
                Welcome to PolyFit
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">
                Log in to manage the wellness platform for{' '}
                <strong className="text-slate-900 dark:text-white font-bold">
                  {providerName || 'your facility'}
                </strong>
                .
              </p>
            </div>

            {/* Access Role Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-left">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                You have access to:
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0B1F33] text-[#28D17C] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-black">
                    {providerRole}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Full facility management, check-in validation & weekly settlement payouts
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProceedToSetup}
              className="w-full py-4 px-6 bg-[#28D17C] hover:bg-[#22b56a] text-[#0B1F33] font-black text-base rounded-2xl transition-all shadow-lg shadow-[#28D17C]/30 hover:shadow-xl hover:shadow-[#28D17C]/40 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to Facility Setup</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* RETURNING LOGIN SCREEN                                         */}
        {/* ============================================================== */}
        {step === 'returning_login' && (
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setStep('lookup')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Change email
                </button>
                {providerName && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {providerName}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] dark:text-white tracking-tight">
                Enter your password
              </h1>
              <p className="text-sm text-[#526173] dark:text-slate-400 mt-1">
                Signing in as <strong className="text-slate-900 dark:text-white">{email}</strong>
              </p>
            </div>

            <form onSubmit={handleReturningLogin} className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor={passwordInputId}
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      alert('To reset your password, contact operations at ops@polyfit.africa or via WhatsApp.');
                    }}
                    className="text-xs font-semibold text-[#28D17C] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    id={passwordInputId}
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#28D17C] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id={rememberCheckboxId}
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#28D17C] focus:ring-[#28D17C] cursor-pointer"
                />
                <label
                  htmlFor={rememberCheckboxId}
                  className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Remember this device
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full py-3.5 px-4 bg-[#28D17C] hover:bg-[#22b56a] disabled:opacity-50 text-[#0B1F33] font-bold text-base rounded-xl transition-all shadow-md shadow-[#28D17C]/20 hover:shadow-lg hover:shadow-[#28D17C]/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-[#0B1F33] border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Log in</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* TOKEN INVALID / EXPIRED RECOVERY SCREEN                        */}
        {/* ============================================================== */}
        {step === 'token_invalid' && (
          <div className="text-center py-4 space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-[#0B1F33] dark:text-white">
                Invitation Link Expired or Invalid
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                This activation link is no longer valid. Invitation links expire after 14 days for security.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <a
                href={`https://wa.me/250790000000?text=${encodeURIComponent(
                  `Hello PolyFit Operations, my partner activation link expired for ${email || 'my facility'}. Please reissue a fresh invitation link.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Request Fresh Link via WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>

              <button
                type="button"
                onClick={() => setStep('lookup')}
                className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors"
              >
                Sign in with email
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Security & Support Footer */}
      <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
        <div className="flex items-center justify-center gap-4">
          <Link href="/terms" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
            Terms of Service
          </Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
            Privacy Policy
          </Link>
          <span>•</span>
          <a
            href="mailto:ops@polyfit.africa"
            className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Support
          </a>
        </div>
        <p className="text-[11px] text-slate-400">
          Protected by PolyFit Enterprise Infrastructure. All transactions and facility visits are cryptographically verified.
        </p>
      </div>
    </div>
  );
}
