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
    <div className="min-h-screen bg-[#071521] text-white flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Navbar */}
      <header className="h-16 px-6 bg-[#0B1F33]/80 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <PolyFitLogo theme="dark" iconSize={26} />
          <div className="h-4 w-px bg-slate-800" />
          <span className="text-xs font-semibold text-slate-400">
            Corporate Onboarding
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-amber-400 font-semibold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            <span>Under Review (SLA 24h)</span>
          </div>

          <button
            onClick={() => signOut?.("/corporate/login")}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-2xl space-y-8">
          {/* Executive Organization Header */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 p-0.5 mx-auto shadow-xl shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#0B1F33] rounded-[14px] flex items-center justify-center">
                <Building2 className="w-8 h-8 text-amber-400" />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Verification In Progress
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-1">
                {orgName}
              </h1>
              <p className="text-xs text-slate-400">
                Administrator: <span className="text-white font-medium">{email}</span>
              </p>
            </div>
          </div>

          {/* 3-Step Milestone Card */}
          <div className="bg-[#0B1F33] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Onboarding & Verification Milestones</span>
            </h2>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white">
                      1. Corporate Registration & Subsidy Model
                    </h3>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Completed
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Company profile, headcount, and subsidy structure recorded. Program tier configured.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-amber-300">
                      2. PolyFit Operations & Agreement Finalization
                    </h3>
                    <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                      In Progress (SLA: 24h)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Our compliance desk is reviewing your corporate details, RRA tax parameters, and confirming billing arrangements. You will receive real-time notification upon sign-off.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 opacity-60">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  3
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-400">
                      3. Workforce Access Activation & Roster Upload
                    </h3>
                    <span className="text-[10px] font-semibold text-slate-500">
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
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Your Dedicated Employee Enrollment URL:
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedJoin ? "Copied Link!" : "Copy URL"}</span>
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 truncate select-all border border-slate-800">
                {inviteUrl}
              </div>
              <p className="text-[11px] text-slate-500">
                Employees can pre-verify via this link. Access passes will become scan-ready once corporate review is finalized.
              </p>
            </div>
          </div>

          {/* Expedited Assistance Banner */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
            <h3 className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Need immediate activation for a team launch?</span>
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Contact our corporate onboarding team directly on WhatsApp or phone at{" "}
              <a href="tel:+250788123456" className="text-emerald-400 font-bold hover:underline">
                +250 788 123 456
              </a>{" "}
              or email{" "}
              <a href="mailto:corporate@polyfit.rw" className="text-emerald-400 font-bold hover:underline">
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
