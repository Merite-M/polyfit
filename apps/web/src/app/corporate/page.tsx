"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CorporateHeader } from "@/components/corporate/CorporateHeader";
import { AdoptionFunnelRow } from "@/components/corporate/AdoptionFunnelRow";
import { EngagementTrendChart } from "@/components/corporate/EngagementTrendChart";
import { CategoryDistribution } from "@/components/corporate/CategoryDistribution";
import { TopProvidersLeaderboard } from "@/components/corporate/TopProvidersLeaderboard";
import { DepartmentTable } from "@/components/corporate/DepartmentTable";
import { RoiMetricsCard } from "@/components/corporate/RoiMetricsCard";
import { useCorporate } from "@/contexts/CorporateContext";
import { generateRraEbmInvoicePdf } from "@/lib/invoice-pdf";
import { TECHCORP_CANONICAL_DATA } from "@/lib/constants";
import {
  Users,
  Receipt,
  AlertTriangle,
  ArrowRight,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  BarChart3,
  LayoutDashboard,
  CreditCard,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CorporateDashboardPage() {
  const {
    organization,
    funnelData,
    economics,
    showToast,
    downloadCensusCsv,
    copyInviteLink,
    inviteUrl,
  } = useCorporate();

  const [activeTab, setActiveTab] = useState<"overview" | "analytics">("overview");
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    copyInviteLink();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // 1-Click "Download Official EBM Tax PDF"
  const handleDownloadInvoicePdf = () => {
    generateRraEbmInvoicePdf({
      id: "PF-INV-2026-09-0045",
      invoice_number: economics.invoiceNumber,
      billing_period_start: "2026-09-01",
      billing_period_end: "2026-09-30",
      organizations: {
        name: organization.name,
        tax_id: organization.tax_id || "109283746",
        billing_email: organization.billing_email || `finance@${organization.domain}`,
      },
      status: economics.invoiceStatus,
      due_date: "2026-09-30",
      total_visits: funnelData.totalVisits,
      tax_amount: 346500,
      total_amount: economics.currentInvoiceRwf,
      line_items: [
        {
          provider_name: "Waka Fitness & Wellness Centers",
          provider_category: "Gym & Fitness",
          visit_count: 284,
          per_visit_rate: 3500,
          subtotal: 994000,
        },
        {
          provider_name: "Cercle Sportif de Kigali (Lap Pools)",
          provider_category: "Swimming & Aquatic",
          visit_count: 142,
          per_visit_rate: 4000,
          subtotal: 568000,
        },
        {
          provider_name: "Nyashad Movement & Yoga Studios",
          provider_category: "Yoga & Studios",
          visit_count: 110,
          per_visit_rate: 3500,
          subtotal: 385000,
        },
        {
          provider_name: "Kigali Physio & Wellness Clinic",
          provider_category: "Physiotherapy & Wellness",
          visit_count: 106,
          per_visit_rate: 4500,
          subtotal: 477000,
        },
      ],
    });
    showToast("Official Rwanda EBM v2.1 Tax Invoice PDF downloaded!");
  };

  const activePercent =
    funnelData.registeredEmployees > 0
      ? Math.round((funnelData.activeBeneficiaries / funnelData.registeredEmployees) * 100)
      : 52;

  const handleTabChange = (tab: "overview" | "analytics") => {
    if (tab === activeTab) return;
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        setActiveTab(tab);
      });
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="min-h-full">
      {/* Sticky Corporate Navigation Header */}
      <CorporateHeader />

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* EXECUTIVE ATTENTION BANNER (What Needs Your Attention Today) */}
        <section aria-label="Action Items Banner">
          {economics.invoiceStatus === "overdue" ? (
            <div className="p-4 rounded-2xl bg-card border border-rose-500/30 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start md:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Action Required
                    </span>
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-500/20">
                      Statement Overdue
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    September statement <strong>{economics.invoiceNumber}</strong> (RWF {economics.currentInvoiceRwf.toLocaleString()}) was due on Sep 30, 2026. Settle via MoMo or Bank Transfer to keep benefits active.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Link
                  href="/corporate/billing"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Review & Settle</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/corporate/employees"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all shadow-2xs"
                >
                  <span>Manage Roster</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start md:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      What Needs Your Attention
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      All Systems Operational
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    September statement is <strong className="text-emerald-600 dark:text-emerald-400">PAID</strong>. 
                    Your workforce join link is active with <strong>{organization.domain}</strong> email verification.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all cursor-pointer shadow-2xs"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                  <span>{copiedLink ? "Link Copied" : "Copy Join Link"}</span>
                </button>
                <Link
                  href="/corporate/employees"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
                >
                  <span>Add Employee</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* 3 HIGH-IMPACT EXECUTIVE CARDS */}
        <section aria-label="Executive Overview Cards">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* CARD 1: TEAM ENGAGEMENT */}
            <div className="p-6 rounded-2xl bg-card border border-border shadow-2xs flex flex-col justify-between hover:border-primary/40 transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Team Engagement
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-foreground">
                    {funnelData.activeBeneficiaries}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">
                    active this month ({activePercent}%)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Out of {funnelData.registeredEmployees} enrolled team members across all departments.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  {funnelData.totalVisits} verified visits logged
                </span>
                <Link
                  href="/corporate/employees"
                  className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>Manage Roster</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* CARD 2: MONTHLY STATEMENT */}
            <div className="p-6 rounded-2xl bg-card border border-border shadow-2xs flex flex-col justify-between hover:border-primary/40 transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    September Statement
                  </span>
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      economics.invoiceStatus === "overdue"
                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-500"
                        : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-foreground font-mono">
                    RWF {economics.currentInvoiceRwf.toLocaleString()}
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 text-[11px] font-bold rounded-full uppercase tracking-wider",
                      economics.invoiceStatus === "overdue"
                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    )}
                  >
                    {economics.invoiceStatus}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  18% VAT itemized &bull; Official RRA EBM v2.1 Certified
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                <button
                  onClick={handleDownloadInvoicePdf}
                  className="text-xs font-bold text-foreground hover:text-primary inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Download EBM PDF</span>
                </button>
                <Link
                  href="/corporate/billing"
                  className={cn(
                    "text-xs font-bold",
                    economics.invoiceStatus === "overdue"
                      ? "text-rose-600 hover:text-rose-700"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {economics.invoiceStatus === "overdue"
                    ? "Settle Statement →"
                    : "View History →"}
                </Link>
              </div>
            </div>

            {/* CARD 3: 1-CLICK TEAM INVITE */}
            <div className="p-6 rounded-2xl bg-slate-900 dark:bg-card text-white shadow-2xs flex flex-col justify-between border border-border">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Staff Self-Onboarding
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    @{organization.domain}
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-semibold text-white">
                    Send join link to your team
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 font-mono">
                    {inviteUrl}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-2 px-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "Link Copied!" : "Copy Join Link"}</span>
                </button>
                <a
                  href={`mailto:?subject=Activate%20Your%20${encodeURIComponent(organization.name)}%20Wellness%20Pass&body=Hi%20team,%0A%0APlease%20use%20your%20company%20email%20to%20activate%20your%20wellness%20pass%20here:%0A${encodeURIComponent(inviteUrl)}`}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs transition-colors"
                  title="Share via Email"
                >
                  <MessageSquare className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* TAB CONTROLS: OVERVIEW VS DETAILED ANALYTICS (View Transitions enabled) */}
        <section aria-label="Portal Navigation Tabs">
          <div className="flex items-center justify-between border-b border-border pb-1">
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleTabChange("overview")}
                className={cn(
                  "flex items-center gap-2 pb-3 px-1 text-sm font-bold border-b-2 transition-all cursor-pointer",
                  activeTab === "overview"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Executive Overview</span>
              </button>
              <button
                onClick={() => handleTabChange("analytics")}
                className={cn(
                  "flex items-center gap-2 pb-3 px-1 text-sm font-bold border-b-2 transition-all cursor-pointer",
                  activeTab === "analytics"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Detailed Analytics & Trends</span>
              </button>
            </div>

            <span className="text-xs text-muted-foreground hidden sm:inline">
              {activeTab === "overview" ? "Simplified view for HR management" : "Deep metrics & category utilization"}
            </span>
          </div>
        </section>

        {/* TAB 1: EXECUTIVE OVERVIEW CONTENT */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 3-Stage Adoption Funnel Bar */}
            <section aria-label="Adoption Funnel">
              <AdoptionFunnelRow
                data={funnelData}
                onUpdateListClick={downloadCensusCsv}
              />
            </section>

            {/* Provider Leaderboard & Department Participation Matrix */}
            <section aria-label="Venues and Departments">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-5">
                  <TopProvidersLeaderboard className="h-full" />
                </div>
                <div className="lg:col-span-7">
                  <DepartmentTable className="h-full" />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: DETAILED ANALYTICS CONTENT */}
        {activeTab === "analytics" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Return on Wellbeing & Peak Wellness Hour */}
            <section aria-label="ROI & Wellness Hour">
              <RoiMetricsCard
                activeEmployees={funnelData.activeBeneficiaries}
                totalSpendRwf={economics.currentInvoiceRwf}
                wellnessHour={TECHCORP_CANONICAL_DATA.wellness.wellnessHour}
                peakDay={TECHCORP_CANONICAL_DATA.wellness.peakDay}
              />
            </section>

            {/* Engagement Trends & Category Distribution */}
            <section aria-label="Engagement & Category Analytics">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-7">
                  <EngagementTrendChart className="h-full" />
                </div>
                <div className="lg:col-span-5">
                  <CategoryDistribution
                    categories={TECHCORP_CANONICAL_DATA.wellness.categories}
                    totalVisits={funnelData.totalVisits}
                    className="h-full"
                  />
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
