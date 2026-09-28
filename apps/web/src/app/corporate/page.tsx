"use client";

import React, { useState, useEffect } from "react";
import { CorporateHeader } from "@/components/corporate/CorporateHeader";
import { AdoptionFunnelRow } from "@/components/corporate/AdoptionFunnelRow";
import { ActivationCards } from "@/components/corporate/ActivationCards";
import { EngagementTrendChart } from "@/components/corporate/EngagementTrendChart";
import { CategoryDistribution } from "@/components/corporate/CategoryDistribution";
import { TopProvidersLeaderboard } from "@/components/corporate/TopProvidersLeaderboard";
import { DepartmentTable } from "@/components/corporate/DepartmentTable";
import { RoiMetricsCard } from "@/components/corporate/RoiMetricsCard";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api-client";
import { Sparkles, RefreshCw, CheckCircle2, ShieldAlert } from "lucide-react";

// Fallback enterprise dataset for TechCorp Rwanda demo & offline resilience
const TECHCORP_DEMO_DATA = {
  organization: {
    id: "c79a9982-4477-4336-a24b-561419f6c43b",
    name: "TechCorp Rwanda",
    slug: "techcorp-rwanda",
    industry: "Technology",
  },
  funnel: {
    totalEligible: 1217,
    registeredMembers: 789,
    activeBeneficiaries: 412,
    totalVisits: 1480,
    newMembers30d: 54,
    newBeneficiaries30d: 28,
    avgVisitsPerActive: 3.6,
  },
  economics: {
    currentInvoiceRwf: 1892000,
    invoiceStatus: "paid" as const,
    pmpmSpendRwf: 4592,
  },
  wellness: {
    wellnessHour: "17:00 - 18:00",
    peakDay: "Wednesday",
    categories: {
      gym: 710,
      pool: 355,
      studio: 236,
      clinic: 179,
    },
  },
};

export default function CorporateDashboardPage() {
  const { organizationId, isDemoMode } = useAuth();
  const [selectedRange, setSelectedRange] = useState("30d");
  const [isLoading, setIsLoading] = useState(false);
  const [downloadNotification, setDownloadNotification] = useState<string | null>(null);

  const activeOrgId = organizationId || TECHCORP_DEMO_DATA.organization.id;
  const activeOrgName = TECHCORP_DEMO_DATA.organization.name;
  const activeOrgSlug = TECHCORP_DEMO_DATA.organization.slug;

  // 1-Click "Download Census" Handler (standard RFC 4180 CSV export)
  const handleDownloadCensus = () => {
    const headers = ["Employee ID", "Full Name", "Work Email", "Department", "Benefit Tier", "Status", "Joined Date"];
    const rows = [
      ["TC-001", "Jean Mugabo", "jean.mugabo@techcorp.rw", "Engineering", "standard", "active", "2026-01-15"],
      ["TC-002", "Marie Uwimana", "marie.uwimana@techcorp.rw", "Marketing", "standard", "active", "2026-02-01"],
      ["TC-003", "Patrick Niyonzima", "patrick.niyonzima@techcorp.rw", "Finance", "premium", "active", "2026-02-15"],
      ["TC-004", "Claudine Mukandekeza", "claudine.mukandekeza@techcorp.rw", "HR", "standard", "active", "2026-03-01"],
      ["TC-005", "Eric Habimana", "eric.habimana@techcorp.rw", "Operations", "basic", "active", "2026-03-10"],
      ["TC-006", "Alice Gasana", "alice.gasana@techcorp.rw", "Engineering", "premium", "active", "2026-04-05"],
      ["TC-007", "David Karekezi", "david.karekezi@techcorp.rw", "Sales", "standard", "active", "2026-05-12"],
      ["TC-008", "Grace Umutoni", "grace.umutoni@techcorp.rw", "Engineering", "premium", "active", "2026-06-20"],
    ];

    const escapeCell = (str: string) => `"${str.replace(/"/g, '""')}"`;
    const csvContent = "data:text/csv;charset=utf-8," + [
      headers.map(escapeCell).join(","),
      ...rows.map((row) => row.map(escapeCell).join(","))
    ].join("\r\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `polyfit-census-${activeOrgSlug}-sep-2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadNotification("Census exported successfully (8 active employee records)");
    setTimeout(() => setDownloadNotification(null), 3000);
  };

  // 1-Click "Download Invoice PDF" Handler
  const handleDownloadInvoice = () => {
    // Generate clean printable receipt
    const invoiceWindow = window.open("", "_blank");
    if (!invoiceWindow) return;

    invoiceWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PolyFit Invoice - ${activeOrgName} - Sep 2026</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0B1F33; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #E2E8F0; padding-bottom: 20px; }
            .badge { background: #E9FAF2; color: #28D17C; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            th, td { text-align: left; padding: 12px; border-bottom: 1px solid #E2E8F0; }
            th { font-size: 11px; text-transform: uppercase; color: #8491A3; }
            .total { text-align: right; margin-top: 30px; font-size: 18px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin: 0; color: #0B1F33;">PolyFit Network</h1>
              <p style="margin: 4px 0; color: #526173;">Corporate Wellness Tax Invoice (RRA EBM-compliant)</p>
            </div>
            <div style="text-align: right;">
              <span class="badge">PAID</span>
              <p style="margin: 4px 0; font-size: 12px; color: #8491A3;">Invoice #PF-2026-09-082</p>
            </div>
          </div>
          <div style="margin-top: 24px;">
            <strong>Billed To:</strong> ${activeOrgName} &bull; Kigali, Rwanda &bull; Tax ID: 109283746
          </div>
          <table>
            <thead>
              <tr><th>Description</th><th>Verified Visits</th><th>Avg Rate</th><th>Total (RWF)</th></tr>
            </thead>
            <tbody>
              <tr><td>Fitness Facilities & Gyms</td><td>710</td><td>2,200</td><td>1,562,000</td></tr>
              <tr><td>Swimming Pools & Aquatic Centers</td><td>355</td><td>2,800</td><td>994,000</td></tr>
              <tr><td>Yoga & Movement Studios</td><td>236</td><td>3,500</td><td>826,000</td></tr>
              <tr><td>Wellness & Physio Clinics</td><td>179</td><td>4,000</td><td>716,000</td></tr>
            </tbody>
          </table>
          <div class="total">
            <p style="margin: 4px 0; font-size: 14px; font-weight: normal; color: #526173;">Subtotal: RWF 1,603,390</p>
            <p style="margin: 4px 0; font-size: 14px; font-weight: normal; color: #526173;">18% VAT: RWF 288,610</p>
            <p style="margin: 8px 0; color: #0B1F33;">Grand Total: RWF 1,892,000</p>
          </div>
          <p style="margin-top: 40px; font-size: 11px; color: #8491A3; text-align: center;">
            PolyFit Corporate Wellness Ltd &bull; 100% Tax-Deductible Health Benefit
          </p>
        </body>
      </html>
    `);
    invoiceWindow.document.close();
    invoiceWindow.print();

    setDownloadNotification("Invoice PDF opened for printing/saving");
    setTimeout(() => setDownloadNotification(null), 3000);
  };

  return (
    <div className="min-h-full">
      {/* Sticky Corporate Header */}
      <CorporateHeader
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
        organizationName={activeOrgName}
        organizationSlug={activeOrgSlug}
        totalEligible={TECHCORP_DEMO_DATA.funnel.totalEligible}
        onDownloadCensus={handleDownloadCensus}
      />

      {/* Instant Notification Toast */}
      {downloadNotification && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in-50 slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B1F33] text-white shadow-xl border border-[#21405A] text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#28D17C]" />
            <span>{downloadNotification}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* 1. Wellhub 3-Stage Adoption Funnel Row */}
        <section aria-label="Adoption Funnel">
          <AdoptionFunnelRow
            data={TECHCORP_DEMO_DATA.funnel}
            onUpdateListClick={handleDownloadCensus}
          />
        </section>

        {/* 2. High-Leverage Activation Deck: Make Signup a Snap + Current Invoice */}
        <section aria-label="Activation and Billing">
          <ActivationCards
            organizationName={activeOrgName}
            organizationSlug={activeOrgSlug}
            currentInvoiceAmount={TECHCORP_DEMO_DATA.economics.currentInvoiceRwf}
            invoiceStatus={TECHCORP_DEMO_DATA.economics.invoiceStatus}
            pmpmSpend={TECHCORP_DEMO_DATA.economics.pmpmSpendRwf}
            onDownloadInvoice={handleDownloadInvoice}
          />
        </section>

        {/* 3. Return on Wellbeing (ROI) & "Wellness Hour" Indicator */}
        <section aria-label="ROI & Wellness Hour">
          <RoiMetricsCard
            activeEmployees={TECHCORP_DEMO_DATA.funnel.activeBeneficiaries}
            totalSpendRwf={TECHCORP_DEMO_DATA.economics.currentInvoiceRwf}
            wellnessHour={TECHCORP_DEMO_DATA.wellness.wellnessHour}
            peakDay={TECHCORP_DEMO_DATA.wellness.peakDay}
          />
        </section>

        {/* 4. Deep-Dive Analytics Deck: Engagement Trends & Wellness Dimensions */}
        <section aria-label="Engagement & Category Analytics">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7">
              <EngagementTrendChart className="h-full" />
            </div>
            <div className="lg:col-span-5">
              <CategoryDistribution
                categories={TECHCORP_DEMO_DATA.wellness.categories}
                totalVisits={TECHCORP_DEMO_DATA.funnel.totalVisits}
                className="h-full"
              />
            </div>
          </div>
        </section>

        {/* 5. Provider Leaderboard & Department Participation Matrix */}
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
    </div>
  );
}
