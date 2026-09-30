"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api-client";
import { formatRwf, generateRraEbmInvoicePdf } from "@/lib/invoice-pdf";
import { OverdueAlertBanner } from "@/components/corporate/billing/OverdueAlertBanner";
import { InvoiceSummaryCards } from "@/components/corporate/billing/InvoiceSummaryCards";
import { DepartmentAllocationBar } from "@/components/corporate/billing/DepartmentAllocationBar";
import { InvoiceTable, InvoiceRecord } from "@/components/corporate/billing/InvoiceTable";
import { InvoiceDetailDrawer } from "@/components/corporate/billing/InvoiceDetailDrawer";
import { DisputeModal } from "@/components/corporate/billing/DisputeModal";
import {
  ArrowLeft,
  ReceiptText,
  Download,
  PlusCircle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Building,
} from "lucide-react";

import { TECHCORP_CANONICAL_DATA } from "@/lib/constants";

export default function BillingPage() {
  const { organizationId, isDemoMode } = useAuth();
  const activeOrgId = organizationId || TECHCORP_CANONICAL_DATA.organization.id;

  const [invoices, setInvoices] = useState<InvoiceRecord[]>(
    TECHCORP_CANONICAL_DATA.invoices as unknown as InvoiceRecord[]
  );
  const [summary, setSummary] = useState({
    currentBalance: TECHCORP_CANONICAL_DATA.economics.currentBalance,
    ytdTotalSpent: TECHCORP_CANONICAL_DATA.economics.ytdTotalSpent,
    ytdTotalVisits: TECHCORP_CANONICAL_DATA.economics.ytdTotalVisits,
    avgCostPerVisit: TECHCORP_CANONICAL_DATA.economics.avgCostPerVisit,
    citTaxShieldRwf: TECHCORP_CANONICAL_DATA.economics.citTaxShieldRwf,
    overdueAmount: TECHCORP_CANONICAL_DATA.economics.overdueAmount,
    overdueCount: 1,
    hasOverdue: TECHCORP_CANONICAL_DATA.economics.hasOverdue,
    dueDateStr: TECHCORP_CANONICAL_DATA.economics.dueDateStr,
    monthlyTrends: [] as any[],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [disputeInvoiceTarget, setDisputeInvoiceTarget] = useState<InvoiceRecord | null>(null);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Fetch billing data from backend API
  const fetchBillingData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Invoices List
      const invRes = await apiFetch<{ invoices: InvoiceRecord[] }>(
        `/api/billing/invoices?org_id=${activeOrgId}&limit=50`
      );

      if (invRes?.invoices && invRes.invoices.length > 0) {
        setInvoices(invRes.invoices);
      }

      // 2. Fetch Summary & Trends
      const summaryRes = await apiFetch<any>(
        `/api/billing/summary?org_id=${activeOrgId}&year=2026`
      );

      if (summaryRes) {
        setSummary({
          currentBalance: summaryRes.current_balance ?? 3127000,
          ytdTotalSpent: summaryRes.ytd_total_spent ?? 6785000,
          ytdTotalVisits: summaryRes.ytd_total_visits ?? 1150,
          avgCostPerVisit: summaryRes.average_cost_per_visit ?? 5900,
          citTaxShieldRwf: summaryRes.cit_tax_shield_rwf ?? 2035500,
          overdueAmount: summaryRes.overdue_amount ?? 2271500,
          overdueCount: summaryRes.overdue_count ?? 1,
          hasOverdue: (summaryRes.overdue_count ?? 0) > 0,
          dueDateStr: "Oct 31, 2026",
          monthlyTrends: summaryRes.monthly_trends || [],
        });
      }
    } catch (err) {
      console.warn("[BillingPage] API fetch fallback to cached/demo state:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, [activeOrgId]);

  const handleOpenDetail = (invoice: InvoiceRecord) => {
    setSelectedInvoice(invoice);
    setIsDrawerOpen(true);
  };

  const handleOpenDispute = (invoice: InvoiceRecord) => {
    setDisputeInvoiceTarget(invoice);
    setIsDisputeModalOpen(true);
  };

  const handleSubmitDispute = async (invoiceId: string, reason: string, notes: string) => {
    await apiFetch(`/api/billing/invoices/${invoiceId}/dispute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, notes }),
    });

    // Optimistically update invoice state
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: "disputed" } : inv
      )
    );

    if (selectedInvoice && selectedInvoice.id === invoiceId) {
      setSelectedInvoice((prev) => (prev ? { ...prev, status: "disputed" } : null));
    }

    setNotification("Dispute submitted successfully. PolyFit Finance will review within 4 hours.");
    setTimeout(() => setNotification(null), 4000);
  };

  const handlePayNow = () => {
    // Find the latest pending or overdue invoice to display in the settlement drawer
    const target = invoices.find((i) => i.status === "overdue" || i.status === "sent") || invoices[0];
    if (target) {
      setSelectedInvoice(target);
      setIsDrawerOpen(true);
    }
  };

  const handleExportAllStatement = () => {
    if (invoices.length > 0) {
      generateRraEbmInvoicePdf(invoices[0], { autoDownload: true });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-[#8491A3] mb-4">
        <Link href="/corporate" className="hover:text-[#0B1F33] flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </Link>
        <span>/</span>
        <span className="text-[#0B1F33] font-semibold">Corporate Billing & Invoicing</span>
      </div>

      {/* Page Title & Actions */}
      <div className="pb-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-[#0B1F33] tracking-tight">
              Corporate Billing & Statements
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#006D3C] bg-[#E9FAF2] px-2.5 py-0.5 rounded-full border border-[#006D3C]/20">
              <ShieldCheck className="w-3.5 h-3.5 text-[#28D17C]" />
              RRA EBM v2.1 Certified
            </span>
          </div>
          <p className="text-xs text-[#526173] mt-1">
            Consolidated monthly employer invoicing, RRA tax compliance (18% VAT), verified beneficiary audit trail, and local settlement rails.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={fetchBillingData}
            disabled={isLoading}
            className="p-2 rounded-xl border border-[#E2E8F0] hover:bg-white text-[#526173] hover:text-[#0B1F33] transition-colors cursor-pointer"
            title="Refresh statements"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#006D3C]" : ""}`} />
          </button>
          <button
            onClick={handleExportAllStatement}
            className="px-3.5 py-2 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F7F9FC] text-xs font-semibold text-[#0B1F33] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#006D3C]" />
            <span>Download Latest EBM PDF</span>
          </button>
          <button
            onClick={handlePayNow}
            className="px-4 py-2 rounded-xl bg-[#006D3C] hover:bg-[#00542D] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <span>Settle Statements</span>
          </button>
        </div>
      </div>

      {/* In-app Notification */}
      {notification && (
        <div className="mt-4 p-3 rounded-xl bg-[#E9FAF2] border border-[#28D17C]/30 text-[#006D3C] text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <Sparkles className="w-4 h-4 text-[#28D17C]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Billing Canvas */}
      <div className="mt-6">
        {/* 1. Overdue Banner (High Priority Alert if any invoice is past due) */}
        <OverdueAlertBanner
          overdueCount={summary.overdueCount}
          overdueAmount={summary.overdueAmount}
          oldestInvoiceNumber="PF-INV-2026-09-0045"
          onPayNow={handlePayNow}
        />

        {/* 2. 4 Bento KPI Metric Cards */}
        <InvoiceSummaryCards
          currentBalance={summary.currentBalance}
          ytdTotalSpent={summary.ytdTotalSpent}
          ytdTotalVisits={summary.ytdTotalVisits}
          avgCostPerVisit={summary.avgCostPerVisit}
          citTaxShieldRwf={summary.citTaxShieldRwf}
          dueDateStr={summary.dueDateStr}
          hasOverdue={summary.hasOverdue}
          onPayNow={handlePayNow}
        />

        {/* 3. Department Wellness Allocation & 6-Month Trend */}
        <DepartmentAllocationBar
          monthlyTrends={summary.monthlyTrends}
          totalYtdSpent={summary.ytdTotalSpent}
        />

        {/* 4. Master Consolidated Invoices Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0B1F33]">
              Consolidated Invoices & Audit History
            </h2>
            <span className="text-xs text-[#526173]">
              Currency: Rwandan Francs (RWF)
            </span>
          </div>

          <InvoiceTable
            invoices={invoices}
            onSelectInvoice={handleOpenDetail}
            onDisputeInvoice={handleOpenDispute}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Sliding Invoice Detail Drawer (Line items, Employee Audit Trail, Settlement Rails) */}
      <InvoiceDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        invoice={selectedInvoice}
        onDispute={handleOpenDispute}
      />

      {/* Formal Dispute Submission Modal */}
      <DisputeModal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        invoice={disputeInvoiceTarget}
        onSubmitDispute={handleSubmitDispute}
      />
    </div>
  );
}
