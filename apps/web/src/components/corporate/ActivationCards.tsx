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

  const handleCopyTemplate = (channel: "whatsapp" | "email" | "sms") => {
    const textTemplates = {
      whatsapp: `*PolyFit Corporate Wellness is Live!* 🏃‍♂️🏊‍♀️\n\nHi team, *${organizationName}* has partnered with PolyFit to provide employer-funded wellness access across Rwanda.\n\nAll staff can now access premier gyms, Olympic swimming pools, and yoga studios across Kigali paid by the company.\n\n👉 *Activate your pass on your mobile phone:* ${inviteUrl}\n\nDownload the PolyFit app or activate using your Staff ID / work email.`,
      email: `Subject: Launch of ${organizationName} Corporate Wellness Pass (PolyFit)\n\nDear Staff,\n\nWe are pleased to introduce our new company wellness benefit in partnership with PolyFit Corporate Wellness Network.\n\nAs an employee of ${organizationName}, you are entitled to verified visits each month across participating facilities in Kigali.\n\nTo activate your benefit and link your mobile pass, click the link below using your company email or Staff ID:\n${inviteUrl}\n\nKind regards,\nPeople & Culture / HR Team`,
      sms: `${organizationName} Wellness Benefit: Activate your corporate fitness pass for gyms and pools across Kigali. Register now: ${inviteUrl}`,
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
                onClick={() => handleCopyTemplate("whatsapp")}
                className="px-2 py-1 rounded-md text-[11px] font-medium bg-[#F1F4F8] hover:bg-[#E9FAF2] hover:text-[#28D17C] text-[#0B1F33] transition-colors flex items-center gap-1"
                title="Copy WhatsApp announcement template"
              >
                <MessageSquare className="w-3 h-3 text-[#28D17C]" />
                <span>{copiedChannel === "whatsapp" ? "Copied WhatsApp!" : "WhatsApp"}</span>
              </button>
              <button
                onClick={() => handleCopyTemplate("email")}
                className="px-2 py-1 rounded-md text-[11px] font-medium bg-[#F1F4F8] hover:bg-[#E9FAF2] hover:text-[#28D17C] text-[#0B1F33] transition-colors flex items-center gap-1"
                title="Copy Email announcement template"
              >
                <Mail className="w-3 h-3 text-[#3B82F6]" />
                <span>{copiedChannel === "email" ? "Copied Email!" : "Email"}</span>
              </button>
              <button
                onClick={() => handleCopyTemplate("sms")}
                className="px-2 py-1 rounded-md text-[11px] font-medium bg-[#F1F4F8] hover:bg-[#E9FAF2] hover:text-[#28D17C] text-[#0B1F33] transition-colors flex items-center gap-1"
                title="Copy SMS / Memo announcement template"
              >
                <Layers className="w-3 h-3 text-slate-500" />
                <span>{copiedChannel === "sms" ? "Copied SMS!" : "SMS / Circular"}</span>
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
