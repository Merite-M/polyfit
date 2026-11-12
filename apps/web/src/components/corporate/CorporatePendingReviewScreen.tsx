"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Phone,
  Mail,
  Copy,
  ExternalLink,
  ShieldCheck,
  Users,
  Layers,
  Sparkles,
  LogOut,
  ArrowRight
} from "lucide-react";
import { PolyFitLogo } from "@/components/ui/polyfit-logo";
import { useAuth } from "@/contexts/AuthContext";
import { useCorporate } from "@/contexts/CorporateContext";

interface CorporatePendingReviewScreenProps {
  organizationName?: string;
  organizationSlug?: string;
  adminEmail?: string;
  headcount?: number;
  planName?: string;
}

export function CorporatePendingReviewScreen({
  organizationName,
  organizationSlug,
  adminEmail,
  headcount,
  planName
}: CorporatePendingReviewScreenProps) {
  const { signOut, user } = useAuth();
  const { organization, inviteUrl, copyInviteLink, showToast } = useCorporate();

  const orgName = organizationName || organization?.name || "Your Organization";
  const orgSlug = organizationSlug || organization?.slug || "corporate";
  const email = adminEmail || user?.email || organization?.contact_email || "hr@company.rw";

  const [copiedJoin, setCopiedJoin] = useState(false);

  const handleCopy = () => {
    copyInviteLink();
    setCopiedJoin(true);
    setTimeout(() => setCopiedJoin(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1F33] flex flex-col justify-between selection:bg-[#28D17C]/20 selection:text-[#0B1F33] relative overflow-x-hidden">
      {/* Ambient Longevity & Wellness Glow */}
      <div className="absolute top-0 inset-x-0 h-96 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(245,158,11,0.08),rgba(40,209,124,0.06)_40%,transparent_80%)] pointer-events-none" />

      {/* Top Navbar */}
      <header className="h-16 px-6 bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <PolyFitLogo theme="light" iconSize={26} />
          <div className="h-4 w-px bg-slate-200" />
          <span className="text-xs font-semibold text-slate-500">
            Corporate Onboarding
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-amber-700 font-semibold bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Under Review (SLA 24h)</span>
          </div>

          <button
            onClick={() => signOut?.("/corporate/login")}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0B1F33] px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-16 relative z-10">
        <div className="w-full max-w-2xl space-y-8">
          {/* Executive Organization Header */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 p-0.5 mx-auto shadow-md shadow-amber-500/15 flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <Building2 className="w-8 h-8 text-amber-500" />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Verification In Progress
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] tracking-tight pt-1">
                {orgName}
              </h1>
              <p className="text-xs text-slate-500">
                Administrator: <span className="text-[#0B1F33] font-semibold">{email}</span>
              </p>
            </div>
          </div>

          {/* 3-Step Milestone Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_4px_24px_-4px_rgba(11,31,51,0.08),0_1px_3px_rgba(11,31,51,0.04)] space-y-6">
            <h2 className="text-sm font-bold text-[#0B1F33] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#28D17C]" />
              <span>Onboarding & Verification Milestones</span>
            </h2>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#E9FAF2]/60 border border-[#B7F1D2]">
                <div className="w-8 h-8 rounded-full bg-[#28D17C] text-slate-950 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#0B1F33]">
                      1. Corporate Registration & Subsidy Model
                    </h3>
                    <span className="text-[10px] font-semibold text-[#008A4B] bg-[#E9FAF2] px-2 py-0.5 rounded-full border border-[#B7F1D2]">
                      Completed
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Company profile, headcount, and subsidy structure recorded. Program tier configured.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-amber-900">
                      2. PolyFit Operations & Agreement Finalization
                    </h3>
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                      In Progress (SLA: 24h)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Our compliance desk is reviewing your corporate details, RRA tax parameters, and confirming billing arrangements. You will receive real-time notification upon sign-off.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 opacity-60">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  3
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-600">
                      3. Workforce Access Activation & Roster Upload
                    </h3>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Upcoming
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Employee mobile pass unlocks across Rwanda & Kenya network. Real-time HR check-in stream goes live.
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Join Link Pre-view */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#0B1F33]">
                  Your Dedicated Employee Enrollment URL:
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#008A4B] hover:text-[#006837] cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedJoin ? "Copied Link!" : "Copy URL"}</span>
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-white font-mono text-xs text-[#0B1F33] truncate select-all border border-slate-200">
                {inviteUrl}
              </div>
              <p className="text-[11px] text-slate-500">
                Employees can pre-verify via this link. Access passes will become scan-ready once corporate review is finalized.
              </p>
            </div>
          </div>

          {/* Expedited Assistance Banner */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-center space-y-2">
            <h3 className="text-xs font-bold text-[#0B1F33] flex items-center justify-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#28D17C]" />
              <span>Need immediate activation for a team launch?</span>
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Contact our corporate onboarding team directly on WhatsApp or phone at{" "}
              <a href="tel:+250788123456" className="text-[#008A4B] font-bold hover:underline">
                +250 788 123 456
              </a>{" "}
              or email{" "}
              <a href="mailto:corporate@polyfit.rw" className="text-[#008A4B] font-bold hover:underline">
                corporate@polyfit.rw
              </a>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
