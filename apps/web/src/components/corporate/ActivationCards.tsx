"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Share2,
  Copy,
  CheckCircle2,
  Receipt,
  Download,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Mail,
  ShieldCheck,
  ArrowRight,
  TrendingDown,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivationCardsProps {
  organizationSlug?: string;
  organizationName?: string;
  currentInvoiceAmount?: number;
  invoiceStatus?: "paid" | "pending" | "processing";
  pmpmSpend?: number;
  className?: string;
  onDownloadInvoice?: () => void;
}

export function ActivationCards({
  organizationSlug = "techcorp-rwanda",
  organizationName = "TechCorp Rwanda",
  currentInvoiceAmount = 1892000,
  invoiceStatus = "paid",
  pmpmSpend = 4592,
  className,
  onDownloadInvoice,
}: ActivationCardsProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);

  const inviteUrl = typeof window !== "undefined"
    ? `${window.location.origin}/join/${organizationSlug}`
    : `https://polyfit.onrender.com/join/${organizationSlug}`;

  const handleCopyLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyTemplate = (channel: "slack" | "teams" | "email") => {
    const textTemplates = {
      slack: `🎉 *Exciting News!* ${organizationName} is partnering with *PolyFit Corporate Wellness Network*.\n\nAll employees can now access top gyms, swimming pools, yoga studios, and wellness clinics across Kigali & Nairobi with your corporate benefit!\n\n👉 *Activate your mobile pass here:* ${inviteUrl}\n(Sign up using your @${organizationSlug.replace(/-.*/, '')}.rw work email)`,
      teams: `**PolyFit Corporate Wellness Benefit is Live!**\n\n${organizationName} employees are now eligible for subsidized access to independent gyms, pools, and studios.\n\nRegister your access pass: ${inviteUrl}`,
      email: `Subject: Welcome to PolyFit — Your New Corporate Wellness Benefit!\n\nHi Team,\n\nWe are excited to launch our partnership with PolyFit. You can now visit verified gyms, pools, and studios across the network.\n\nClaim your mobile pass here:\n${inviteUrl}\n\nBest,\nHR & People Team`,
    };

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(textTemplates[channel]);
      setCopiedChannel(channel);
      setTimeout(() => setCopiedChannel(null), 2500);
    }
  };

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-5", className)}>
      {/* CARD 1: "Make Signup a Snap" (Wellhub Signature Viral Onboarding) */}
      <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-[#28D17C]/10 to-[#00D2B4]/5 rounded-bl-full pointer-events-none" />

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#E9FAF2] flex items-center justify-center text-[#28D17C]">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#0B1F33]">
                Make signup a snap
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-[#28D17C] bg-[#E9FAF2] px-2.5 py-0.5 rounded-full border border-[#28D17C]/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Domain-Locked
            </span>
          </div>

          <p className="text-xs text-[#526173] leading-relaxed max-w-xl mb-4">
            Help employees get started by sharing your company's dedicated signup link on your internal communication channels. Only corporate emails from your domain will be approved.
          </p>

          {/* Join Link Input Box with 1-Click Copy */}
          <div className="flex items-center gap-2 p-1.5 pl-3 rounded-xl bg-[#F7F9FC] border border-[#E2E8F0] focus-within:border-[#28D17C] transition-all max-w-xl">
            <span className="text-xs font-mono text-[#526173] truncate flex-1 select-all">
              {inviteUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0",
                copiedLink
                  ? "bg-[#28D17C] text-[#0B1F33]"
                  : "bg-[#0B1F33] hover:bg-[#142C44] text-white"
              )}
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Share Formatting Channels */}
        <div className="mt-4 pt-3 border-t border-[#F1F4F8] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-[#8491A3]">
            <span>Share announcement copy:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleCopyTemplate("slack")}
                className="px-2 py-1 rounded-md text-[11px] font-medium bg-[#F1F4F8] hover:bg-[#E9FAF2] hover:text-[#28D17C] text-[#0B1F33] transition-colors flex items-center gap-1"
                title="Copy Slack announcement template"
              >
                <MessageSquare className="w-3 h-3" />
                <span>{copiedChannel === "slack" ? "Copied Slack!" : "Slack"}</span>
              </button>
              <button
                onClick={() => handleCopyTemplate("teams")}
                className="px-2 py-1 rounded-md text-[11px] font-medium bg-[#F1F4F8] hover:bg-[#E9FAF2] hover:text-[#28D17C] text-[#0B1F33] transition-colors flex items-center gap-1"
                title="Copy MS Teams announcement template"
              >
                <Layers className="w-3 h-3" />
                <span>{copiedChannel === "teams" ? "Copied Teams!" : "Teams"}</span>
              </button>
              <button
                onClick={() => handleCopyTemplate("email")}
                className="px-2 py-1 rounded-md text-[11px] font-medium bg-[#F1F4F8] hover:bg-[#E9FAF2] hover:text-[#28D17C] text-[#0B1F33] transition-colors flex items-center gap-1"
                title="Copy Email announcement template"
              >
                <Mail className="w-3 h-3" />
                <span>{copiedChannel === "email" ? "Copied Email!" : "Email"}</span>
              </button>
            </div>
          </div>

          <Link
            href="/corporate/employees"
            className="text-xs font-semibold text-[#0B1F33] hover:text-[#28D17C] transition-colors flex items-center gap-1"
          >
            <span>View Roster Census</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* CARD 2: Current Invoice & PMPM Economics */}
      <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between relative overflow-hidden group">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8491A3]">
              Current Invoice
            </span>
            <Link
              href="/corporate/billing"
              className="text-xs font-semibold text-[#28D17C] hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="mt-1 flex items-baseline justify-between">
            <div className="text-2xl font-bold tracking-tight text-[#0B1F33]">
              RWF {currentInvoiceAmount.toLocaleString()}
            </div>
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                invoiceStatus === "paid"
                  ? "bg-[#E9FAF2] text-[#28D17C] border-[#28D17C]/30"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              )}
            >
              {invoiceStatus === "paid" ? "Paid" : "Pending"}
            </span>
          </div>

          {/* PMPM (Per Member Per Month) Metric (Industry Health Benchmark) */}
          <div className="mt-4 p-3 rounded-xl bg-[#F7F9FC] border border-[#E2E8F0] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold uppercase text-[#8491A3]">
                PMPM Spend
              </span>
              <p className="text-sm font-bold text-[#0B1F33]">
                RWF {pmpmSpend.toLocaleString()}{" "}
                <span className="text-[10px] font-normal text-[#526173]">/ active user</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-semibold text-[#28D17C] flex items-center justify-end gap-0.5">
                <TrendingDown className="w-3 h-3" />
                -12% vs gym sub
              </span>
              <p className="text-[10px] text-[#8491A3]">Cost efficiency</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#F1F4F8] flex items-center justify-between">
          <span className="text-[11px] text-[#8491A3]">RRA EBM-18% VAT</span>
          <button
            onClick={onDownloadInvoice}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F7F9FC] text-xs font-semibold text-[#0B1F33] transition-colors shadow-2xs group/btn"
          >
            <Download className="w-3.5 h-3.5 text-[#28D17C] group-hover/btn:scale-110 transition-transform" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
