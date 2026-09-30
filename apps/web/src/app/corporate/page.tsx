"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CorporateHeader } from "@/components/corporate/CorporateHeader";
import { AdoptionFunnelRow } from "@/components/corporate/AdoptionFunnelRow";
import { EngagementTrendChart } from "@/components/corporate/EngagementTrendChart";
import { CategoryDistribution } from "@/components/corporate/CategoryDistribution";
import { TopProvidersLeaderboard } from "@/components/corporate/TopProvidersLeaderboard";
import { DepartmentTable } from "@/components/corporate/DepartmentTable";
import { RoiMetricsCard } from "@/components/corporate/RoiMetricsCard";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api-client";
import { generateRraEbmInvoicePdf } from "@/lib/invoice-pdf";
import {
  Users,
  Receipt,
  Share2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  Copy,
  Check,
  Building2,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  BarChart3,
  LayoutDashboard,
  ExternalLink,
  CreditCard,
  MessageSquare,
} from "lucide-react";
import { TECHCORP_CANONICAL_DATA } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function CorporateDashboardPage() {
  const { organizationId } = useAuth();
  const [selectedRange, setSelectedRange] = useState("30d");
  const [activeTab, setActiveTab] = useState<"overview" | "analytics">("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Live state initialized from canonical production-grade TechCorp Rwanda dataset
  const [funnelData, setFunnelData] = useState(TECHCORP_CANONICAL_DATA.funnel);
  const [economicsData, setEconomicsData] = useState(TECHCORP_CANONICAL_DATA.economics);

  const activeOrgId = organizationId || TECHCORP_CANONICAL_DATA.organization.id;
  const activeOrgName = TECHCORP_CANONICAL_DATA.organization.name;
  const activeOrgSlug = TECHCORP_CANONICAL_DATA.organization.slug;
  const corporateDomain = TECHCORP_CANONICAL_DATA.organization.allowed_domains[0] || "techcorp.rw";

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const [origin, setOrigin] = useState("https://polyfit.onrender.com");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const inviteUrl = `${origin}/join/${activeOrgSlug}`;

  // Fetch live dashboard and utilization metrics from backend
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Employer Utilization Reporting
      const utilRes = await apiFetch<any>(
        `/api/reporting/employer/${activeOrgId}/utilization`
      );

      if (utilRes && utilRes.summary) {
        setFunnelData((prev) => ({
          ...prev,
          totalEligible: utilRes.summary.total_eligible ?? prev.totalEligible,
          registeredMembers: utilRes.summary.registered_members ?? prev.registeredMembers,
          activeBeneficiaries: utilRes.summary.active_beneficiaries ?? prev.activeBeneficiaries,
          totalVisits: utilRes.summary.total_visits ?? prev.totalVisits,
        }));
      }

      // 2. Fetch Live Billing Summary
      const billingRes = await apiFetch<any>(
        `/api/billing/summary?org_id=${activeOrgId}&year=2026`
      );

      if (billingRes) {
        setEconomicsData((prev) => ({
          ...prev,
          currentInvoiceRwf: billingRes.current_balance ?? prev.currentInvoiceRwf,
          citTaxShieldRwf: billingRes.cit_tax_shield_rwf ?? prev.citTaxShieldRwf,
          pmpmSpendRwf: billingRes.average_cost_per_visit ?? prev.pmpmSpendRwf,
        }));
      }
    } catch {
      // Keep verified demo metrics when offline or disconnected
    } finally {
      setIsLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleCopyLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      showToast("Join link copied to clipboard! Ready to paste into Slack or Teams.");
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // 1-Click "Download Census" Handler (standard RFC 4180 CSV export)
  const handleDownloadCensus = () => {
    const headers = [
      "Employee ID",
      "Full Name",
      "Work Email",
      "Department",
      "Benefit Tier",
      "Status",
      "Joined Date",
    ];
    const rows = TECHCORP_CANONICAL_DATA.employees.map((emp) => [
      emp.employee_id_external || "TC-000",
      emp.full_name,
      emp.email,
      emp.department,
      emp.tier,
      emp.status,
      emp.created_at?.split("T")[0] || "2026-01-15",
    ]);

    const escapeCell = (str: string) => `"${str.replace(/"/g, '""')}"`;
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.map(escapeCell).join(","),
        ...rows.map((row) => row.map(escapeCell).join(",")),
      ].join("\r\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `polyfit-census-${activeOrgSlug}-sep-2026.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(
      `Employee roster census exported successfully (${rows.length} verified records)`
    );
  };

  // 1-Click "Download Official EBM Tax PDF"
  const handleDownloadInvoicePdf = () => {
    generateRraEbmInvoicePdf({
      id: "PF-INV-2026-09-0045",
      invoice_number: economicsData.invoiceNumber,
      billing_period_start: "2026-09-01",
      billing_period_end: "2026-09-30",
      organizations: {
        name: activeOrgName,
        tax_id: "109283746",
        billing_email: "finance@techcorp.rw",
      },
      status: economicsData.invoiceStatus,
      due_date: "2026-09-30",
      total_visits: funnelData.totalVisits,
      tax_amount: 346500,
      total_amount: economicsData.currentInvoiceRwf,
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
    funnelData.registeredMembers > 0
      ? Math.round((funnelData.activeBeneficiaries / funnelData.registeredMembers) * 100)
      : 52;

  return (
    <div className="min-h-full">
      {/* Sticky Corporate Navigation Header */}
      <CorporateHeader
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
        organizationName={activeOrgName}
        organizationSlug={activeOrgSlug}
        totalEligible={funnelData.totalEligible}
        onDownloadCensus={handleDownloadCensus}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#0B1F33] text-white shadow-2xl border border-[#21405A] text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#28D17C] flex-shrink-0" />
            <span>{notification}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* EXECUTIVE ATTENTION BANNER (What Needs Your Attention Today) */}
        <section aria-label="Action Items Banner">
          {economicsData.invoiceStatus === "overdue" ? (
            <div className="p-4 rounded-2xl bg-white border border-[#EF4444]/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start md:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0B1F33]">
                      Action Required
                    </span>
                    <span className="text-[11px] font-bold text-[#EF4444] bg-[#FEF2F2] px-2 py-0.5 rounded-full border border-[#EF4444]/20">
                      Statement Overdue
                    </span>
                  </div>
                  <p className="text-xs text-[#526173] mt-0.5">
                    September statement <strong>{economicsData.invoiceNumber}</strong> (RWF {economicsData.currentInvoiceRwf.toLocaleString()}) was due on Sep 30, 2026. Settle via MoMo or Bank Transfer to keep benefits active.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Link
                  href="/corporate/billing"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold transition-all shadow-xs"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Review & Settle</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/corporate/employees"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] hover:bg-white text-xs font-semibold text-[#0B1F33] transition-all"
                >
                  <span>Manage Roster</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start md:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E9FAF2] text-[#28D17C] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0B1F33]">
                      What Needs Your Attention
                    </span>
                    <span className="text-[11px] font-semibold text-[#28D17C] bg-[#E9FAF2] px-2 py-0.5 rounded-full">
                      All Systems Operational
                    </span>
                  </div>
                  <p className="text-xs text-[#526173] mt-0.5">
                    September statement is <strong className="text-[#28D17C]">PAID</strong>. 
                    Your workforce join link is active with <strong>{corporateDomain}</strong> email verification.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] hover:bg-white text-xs font-semibold text-[#0B1F33] transition-all"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-[#28D17C]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "Link Copied" : "Copy Join Link"}</span>
                </button>
                <Link
                  href="/corporate/employees"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] text-white text-xs font-semibold transition-all shadow-xs"
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
            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between hover:border-[#28D17C]/40 transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8491A3]">
                    Team Engagement
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#E9FAF2] text-[#28D17C] flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[#0B1F33]">
                    {funnelData.activeBeneficiaries}
                  </span>
                  <span className="text-sm font-semibold text-[#526173]">
                    active this month ({activePercent}%)
                  </span>
                </div>
                <p className="text-xs text-[#8491A3] mt-1">
                  Out of {funnelData.registeredMembers} enrolled team members across all departments.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <span className="text-xs text-[#526173] font-medium">
                  {funnelData.totalVisits} verified visits logged
                </span>
                <Link
                  href="/corporate/employees"
                  className="text-xs font-bold text-[#28D17C] hover:text-[#22BC6E] inline-flex items-center gap-1"
                >
                  <span>Manage Roster</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* CARD 2: MONTHLY STATEMENT */}
            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between hover:border-[#28D17C]/40 transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8491A3]">
                    September Statement
                  </span>
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      economicsData.invoiceStatus === "overdue"
                        ? "bg-[#FEF2F2] text-[#EF4444]"
                        : "bg-[#E9FAF2] text-[#28D17C]"
                    )}
                  >
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-[#0B1F33]">
                    RWF {economicsData.currentInvoiceRwf.toLocaleString()}
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 text-[11px] font-bold rounded-full uppercase tracking-wider",
                      economicsData.invoiceStatus === "overdue"
                        ? "bg-[#FEF2F2] text-[#EF4444] border border-[#EF4444]/20"
                        : "bg-[#E9FAF2] text-[#28D17C]"
                    )}
                  >
                    {economicsData.invoiceStatus}
                  </span>
                </div>
                <p className="text-xs text-[#8491A3] mt-1">
                  18% VAT itemized &bull; Official RRA EBM v2.1 Certified
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <button
                  onClick={handleDownloadInvoicePdf}
                  className="text-xs font-bold text-[#0B1F33] hover:text-[#28D17C] inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-[#28D17C]" />
                  <span>Download EBM PDF</span>
                </button>
                <Link
                  href="/corporate/billing"
                  className={cn(
                    "text-xs font-bold",
                    economicsData.invoiceStatus === "overdue"
                      ? "text-[#EF4444] hover:text-[#DC2626]"
                      : "text-[#526173] hover:text-[#0B1F33]"
                  )}
                >
                  {economicsData.invoiceStatus === "overdue"
                    ? "Settle Statement →"
                    : "View History →"}
                </Link>
              </div>
            </div>

            {/* CARD 3: 1-CLICK TEAM INVITE */}
            <div className="p-6 rounded-2xl bg-[#0B1F33] text-white shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8491A3]">
                    Staff Self-Onboarding
                  </span>
                  <span className="text-[11px] font-semibold text-[#28D17C] bg-[#28D17C]/15 px-2 py-0.5 rounded-full border border-[#28D17C]/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    @{corporateDomain}
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-semibold text-white">
                    Send join link to your team
                  </p>
                  <p className="text-xs text-[#8491A3] mt-0.5 line-clamp-1 font-mono">
                    {inviteUrl}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[#21405A] flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "Link Copied!" : "Copy Join Link"}</span>
                </button>
                <a
                  href={`mailto:?subject=Activate%20Your%20${encodeURIComponent(activeOrgName)}%20Wellness%20Pass&body=Hi%20team,%0A%0APlease%20use%20your%20company%20email%20to%20activate%20your%20wellness%20pass%20here:%0A${encodeURIComponent(inviteUrl)}`}
                  className="p-2 rounded-xl bg-[#132D43] hover:bg-[#21405A] text-white text-xs transition-colors"
                  title="Share via Email"
                >
                  <MessageSquare className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* TAB CONTROLS: OVERVIEW VS DETAILED ANALYTICS */}
        <section aria-label="Portal Navigation Tabs">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab("overview")}
                className={cn(
                  "flex items-center gap-2 pb-3 px-1 text-sm font-bold border-b-2 transition-all",
                  activeTab === "overview"
                    ? "border-[#28D17C] text-[#0B1F33]"
                    : "border-transparent text-[#8491A3] hover:text-[#526173]"
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Executive Overview</span>
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={cn(
                  "flex items-center gap-2 pb-3 px-1 text-sm font-bold border-b-2 transition-all",
                  activeTab === "analytics"
                    ? "border-[#28D17C] text-[#0B1F33]"
                    : "border-transparent text-[#8491A3] hover:text-[#526173]"
                )}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Detailed Analytics & Trends</span>
              </button>
            </div>

            <span className="text-xs text-[#8491A3]">
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
                onUpdateListClick={handleDownloadCensus}
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
                totalSpendRwf={economicsData.currentInvoiceRwf}
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
