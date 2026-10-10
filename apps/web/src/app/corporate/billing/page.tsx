"use client";

import React, { useState } from "react";
import { useCorporate } from "@/contexts/CorporateContext";
import { CorporateHeader } from "@/components/corporate/CorporateHeader";
import { generateRraEbmInvoicePdf } from "@/lib/invoice-pdf";
import { OverdueAlertBanner } from "@/components/corporate/billing/OverdueAlertBanner";
import { InvoiceSummaryCards } from "@/components/corporate/billing/InvoiceSummaryCards";
import { DepartmentAllocationBar } from "@/components/corporate/billing/DepartmentAllocationBar";
import { InvoiceTable, InvoiceRecord } from "@/components/corporate/billing/InvoiceTable";
import { InvoiceDetailDrawer } from "@/components/corporate/billing/InvoiceDetailDrawer";
import { DisputeModal } from "@/components/corporate/billing/DisputeModal";
import {
  Download,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BillingPage() {
  const {
    organization,
    invoices,
    isLoadingInvoices,
    economics,
    disputeInvoice,
    refreshInvoices,
    showToast,
  } = useCorporate();

  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [disputeInvoiceTarget, setDisputeInvoiceTarget] = useState<InvoiceRecord | null>(null);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);

  const handleOpenDetail = (invoice: InvoiceRecord) => {
    setSelectedInvoice(invoice);
    setIsDrawerOpen(true);
  };

  const handleOpenDispute = (invoice: InvoiceRecord) => {
    setDisputeInvoiceTarget(invoice);
    setIsDisputeModalOpen(true);
  };

  const handleSubmitDispute = async (invoiceId: string, reason: string, notes: string) => {
    await disputeInvoice(invoiceId, reason, notes);
    if (selectedInvoice && selectedInvoice.id === invoiceId) {
      setSelectedInvoice((prev) => (prev ? { ...prev, status: "disputed" } : null));
    }
  };

  const handlePayNow = () => {
    const target = invoices.find((i) => i.status === "overdue" || i.status === "sent") || invoices[0];
    if (target) {
      setSelectedInvoice(target);
      setIsDrawerOpen(true);
    }
  };

  const handleExportAllStatement = () => {
    if (invoices.length > 0) {
      generateRraEbmInvoicePdf(invoices[0] as any, { autoDownload: true });
      showToast("Generated and downloaded RRA EBM PDF invoice");
    } else {
      showToast("No invoices available to export");
    }
  };

  return (
    <div className="min-h-full">
      {/* Sticky Corporate Navigation Header with contextual actions */}
      <CorporateHeader
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refreshInvoices()}
              disabled={isLoadingInvoices}
              className="p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Refresh statements"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isLoadingInvoices && "animate-spin text-emerald-500")} />
            </button>

            <button
              type="button"
              onClick={handleExportAllStatement}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Download EBM PDF</span>
              <span className="sm:hidden">EBM PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePayNow}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
            >
              <span>Settle Invoices</span>
            </button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Page Title & Compliance Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-foreground">
                Corporate Billing & Statements
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                RRA EBM v2.1 Certified
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              Consolidated monthly employer invoicing for {organization.name}, RRA tax compliance (18% VAT), verified beneficiary audit trail, and local settlement rails.
            </p>
          </div>
        </div>

        {/* 1. Overdue Banner */}
        <OverdueAlertBanner
          overdueCount={economics.hasOverdue ? 1 : 0}
          overdueAmount={economics.overdueAmount}
          oldestInvoiceNumber="PF-INV-2026-09-0045"
          onPayNow={handlePayNow}
        />

        {/* 2. 4 Bento KPI Metric Cards */}
        <InvoiceSummaryCards
          currentBalance={economics.currentBalance}
          ytdTotalSpent={economics.ytdTotalSpent}
          ytdTotalVisits={economics.ytdTotalVisits}
          avgCostPerVisit={economics.avgCostPerVisit}
          citTaxShieldRwf={economics.citTaxShieldRwf}
          dueDateStr={economics.dueDateStr}
          hasOverdue={economics.hasOverdue}
          onPayNow={handlePayNow}
        />

        {/* 3. Department Wellness Allocation & 6-Month Trend */}
        <DepartmentAllocationBar
          totalYtdSpent={economics.ytdTotalSpent}
        />

        {/* 4. Master Consolidated Invoices Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              Consolidated Invoices & Audit History
            </h2>
            <span className="text-xs text-muted-foreground">
              Currency: Rwandan Francs (RWF)
            </span>
          </div>

          <InvoiceTable
            invoices={invoices}
            onSelectInvoice={handleOpenDetail}
            onDisputeInvoice={handleOpenDispute}
            isLoading={isLoadingInvoices}
          />
        </div>
      </div>

      {/* Sliding Invoice Detail Drawer */}
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
