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
  Dumbbell,
  Sparkles,
  LogOut,
  ArrowRight,
  MessageSquare
} from "lucide-react";
import { PolyFitLogo } from "@/components/ui/polyfit-logo";
import { useAuth } from "@/contexts/AuthContext";

interface PartnerPendingReviewScreenProps {
  providerName?: string;
  providerCategory?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export function PartnerPendingReviewScreen({
  providerName = "Wellness Provider Facility",
  providerCategory = "Fitness & Wellness",
  contactEmail,
  contactPhone
}: PartnerPendingReviewScreenProps) {
  const { user, signOut } = useAuth();
  const [copiedLink, setCopiedLink] = useState(false);

  const supportEmail = "partners@polyfit.africa";
  const supportPhone = "+250 788 123 456";
  const supportWhatsapp = "+250788123456";

  const copyContact = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#07131F] text-slate-100 flex flex-col justify-between selection:bg-[#28D17C]/20 selection:text-white">
      {/* Top Navbar */}
      <header className="h-16 px-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <PolyFitLogo theme="dark" iconSize={26} />
            <span className="text-xs uppercase font-bold tracking-widest text-[#28D17C] bg-[#28D17C]/10 px-2 py-0.5 rounded border border-[#28D17C]/20">
              Partner Network
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => signOut("/partner/login")}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-800"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-6">
          {/* Status Banner */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#28D17C]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                    Step 2: PolyFit Review Pending
                  </span>
                  <span className="text-xs text-slate-500">• SLA: 24 Hours</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                  {providerName}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Category: <span className="text-slate-300 font-medium capitalize">{providerCategory}</span> • Account Admin:{" "}
                  <span className="text-slate-300 font-medium">{contactEmail || user?.email}</span>
                </p>
              </div>
            </div>

            {/* Verification Timeline */}
            <div className="py-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Partner Onboarding Milestones
              </h3>

              <div className="space-y-3">
                {/* Step 1: Complete */}
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800">
                  <CheckCircle2 className="w-5 h-5 text-[#28D17C] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">1. Facility Profile & Location Submitted</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Your facility specs, operating hours, and payout coordinates have been securely registered.
                    </p>
                  </div>
                </div>

                {/* Step 2: Active */}
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/30">
                  <div className="w-5 h-5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-300">2. PolyFit Operations & Rate Card Audit</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Our partner success team in Kigali is verifying your physical address and counter-signing your corporate reimbursement rate card (guaranteed RWF payout per verified corporate visit).
                    </p>
                  </div>
                </div>

                {/* Step 3: Upcoming */}
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-800/20 border border-slate-800/50 opacity-60">
                  <div className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center text-[10px] text-slate-400 shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-300">3. Live Check-In Scanner & Settlement Access</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Once approved, your reception desk TOTP scanner will activate immediately and your facility will appear in the PolyFit Employee Mobile App directory.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Contact Support Box */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-white">Need Priority Activation for an Upcoming Event?</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Reach our Kigali Partner Desk directly on WhatsApp or phone for immediate inspection dispatch.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={`https://wa.me/${supportWhatsapp}?text=Hello%20PolyFit,%20we%20submitted%20partner%20registration%20for%20${encodeURIComponent(providerName)}%20and%20request%20verification.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Desk</span>
                </a>
                <a
                  href={`mailto:${supportEmail}?subject=Partner%20Activation:%20${encodeURIComponent(providerName)}`}
                  className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-2">
            <span>Logged in as {user?.email}</span>
            <Link
              href="/partner/login"
              className="hover:text-slate-300 transition-colors flex items-center gap-1"
            >
              <span>Switch Partner Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 text-center text-xs text-slate-600 border-t border-slate-800">
        PolyFit Wellness Aggregator &bull; Provider Network Operations &bull; Kigali, Rwanda
      </footer>
    </div>
  );
}
