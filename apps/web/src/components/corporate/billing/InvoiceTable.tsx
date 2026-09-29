"use client";

import React, { useState } from "react";
import { formatRwf, formatInvoiceDate, generateRraEbmInvoicePdf } from "@/lib/invoice-pdf";
import {
  Search,
  Filter,
  Download,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

export interface InvoiceRecord {
  id: string;
  invoice_number?: string;
  billing_period_start: string;
  billing_period_end: string;
  total_visits: number;
  total_amount: number;
  tax_amount: number;
  status: "draft" | "sent" | "paid" | "overdue" | "disputed";
  due_date?: string;
  paid_at?: string;
  created_at?: string;
  organizations?: {
    name: string;
    tax_id?: string;
    billing_email?: string;
  };
  invoice_line_items?: any[];
}

interface InvoiceTableProps {
  invoices: InvoiceRecord[];
  onSelectInvoice: (invoice: InvoiceRecord) => void;
  onDisputeInvoice: (invoice: InvoiceRecord) => void;
  isLoading?: boolean;
}

export function InvoiceTable({
  invoices,
  onSelectInvoice,
  onDisputeInvoice,
  isLoading = false,
}: InvoiceTableProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "unpaid" | "paid" | "disputed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const overdueCount = invoices.filter((i) => i.status === "overdue").length;
  const unpaidCount = invoices.filter((i) => i.status === "sent" || i.status === "overdue").length;

  const filteredInvoices = invoices.filter((inv) => {
    // Tab filter
    if (activeFilter === "unpaid" && inv.status !== "sent" && inv.status !== "overdue") {
      return false;
    }
    if (activeFilter === "paid" && inv.status !== "paid") {
      return false;
    }
    if (activeFilter === "disputed" && inv.status !== "disputed") {
      return false;
    }

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const numMatch = (inv.invoice_number || "").toLowerCase().includes(q);
      const periodMatch = (inv.billing_period_start || "").includes(q) || (inv.billing_period_end || "").includes(q);
      const statusMatch = inv.status.toLowerCase().includes(q);
      return numMatch || periodMatch || statusMatch;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#E9FAF2] text-[#16A34A] border border-[#16A34A]/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>Paid</span>
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FEF2F2] text-[#DC2626] border border-[#DC2626]/20 animate-pulse">
            <AlertCircle className="w-3 h-3" />
            <span>Overdue</span>
          </span>
        );
      case "sent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#EBF3FF] text-[#005AC2] border border-[#005AC2]/20">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
      case "disputed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FEF3C7] text-[#D97706] border border-[#D97706]/20">
            <ShieldAlert className="w-3 h-3" />
            <span>Disputed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#F1F5F9] text-[#64748B]">
            <span>{status}</span>
          </span>
        );
    }
  };

  const handleDownloadRowPdf = (e: React.MouseEvent, inv: InvoiceRecord) => {
    e.stopPropagation();
    generateRraEbmInvoicePdf({
      id: inv.id,
      invoice_number: inv.invoice_number,
      billing_period_start: inv.billing_period_start,
      billing_period_end: inv.billing_period_end,
      total_visits: inv.total_visits,
      total_amount: inv.total_amount,
      tax_amount: inv.tax_amount,
      status: inv.status,
      due_date: inv.due_date,
      paid_at: inv.paid_at,
      organizations: inv.organizations,
    }, { autoDownload: true });
  };

  return (
    <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-xs overflow-hidden">
      {/* Table Controls */}
      <div className="p-5 border-b border-[#F1F4F8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeFilter === "all"
                ? "bg-[#006D3C] text-white shadow-xs"
                : "text-[#526173] hover:bg-[#F7F9FC]"
            }`}
          >
            All Statements ({invoices.length})
          </button>
          <button
            onClick={() => setActiveFilter("unpaid")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeFilter === "unpaid"
                ? "bg-[#006D3C] text-white shadow-xs"
                : "text-[#526173] hover:bg-[#F7F9FC]"
            }`}
          >
            <span>Unpaid & Overdue</span>
            {unpaidCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeFilter === "unpaid"
                    ? "bg-white/20 text-white"
                    : overdueCount > 0
                    ? "bg-[#DC2626] text-white"
                    : "bg-[#005AC2] text-white"
                }`}
              >
                {unpaidCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveFilter("paid")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeFilter === "paid"
                ? "bg-[#006D3C] text-white shadow-xs"
                : "text-[#526173] hover:bg-[#F7F9FC]"
            }`}
          >
            Paid ({invoices.filter((i) => i.status === "paid").length})
          </button>
          <button
            onClick={() => setActiveFilter("disputed")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeFilter === "disputed"
                ? "bg-[#006D3C] text-white shadow-xs"
                : "text-[#526173] hover:bg-[#F7F9FC]"
            }`}
          >
            Disputed ({invoices.filter((i) => i.status === "disputed").length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#8491A3] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice # or month..."
            className="w-full text-xs rounded-xl border border-[#CBD5E1] bg-white pl-8 pr-3 py-1.5 text-[#0B1F33] focus:border-[#006D3C] focus:ring-1 focus:ring-[#006D3C] outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#F7F9FC] border-b border-[#E2E8F0] text-[#526173] font-semibold">
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Billing Period</th>
              <th className="py-3 px-4 text-center">Visits</th>
              <th className="py-3 px-4 text-right">Net Subtotal</th>
              <th className="py-3 px-4 text-right">18% VAT</th>
              <th className="py-3 px-4 text-right">Total (RWF)</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F4F8]">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-xs text-[#8491A3]">
                  Loading invoice history...
                </td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-xs text-[#8491A3]">
                  No statements match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => {
                const total = Number(inv.total_amount) || 0;
                const tax = Number(inv.tax_amount) || Math.round(total * (0.18 / 1.18));
                const subtotal = total - tax;

                return (
                  <tr
                    key={inv.id}
                    onClick={() => onSelectInvoice(inv)}
                    className="hover:bg-[#F7F9FC]/70 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-bold text-[#0B1F33] group-hover:text-[#006D3C] transition-colors">
                      {inv.invoice_number || `INV-${inv.id.substring(0, 8)}`}
                    </td>
                    <td className="py-3.5 px-4 text-[#526173]">
                      {formatInvoiceDate(inv.billing_period_start)} – {formatInvoiceDate(inv.billing_period_end)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-[#0B1F33]">
                      {inv.total_visits}
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#526173]">
                      {formatRwf(subtotal)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#526173]">
                      {formatRwf(tax)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#0B1F33]">
                      {formatRwf(total)}
                    </td>
                    <td className="py-3.5 px-4 text-[#526173]">
                      {formatInvoiceDate(inv.due_date)}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectInvoice(inv)}
                          title="View statement details and visit audit"
                          className="p-1.5 text-[#526173] hover:text-[#006D3C] hover:bg-[#E9FAF2] rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDownloadRowPdf(e, inv)}
                          title="Download RRA EBM Tax Invoice PDF"
                          className="p-1.5 text-[#526173] hover:text-[#006D3C] hover:bg-[#E9FAF2] rounded-lg transition-colors cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {(inv.status === "sent" || inv.status === "overdue") && (
                          <button
                            onClick={() => onDisputeInvoice(inv)}
                            title="File an invoice dispute"
                            className="p-1.5 text-[#526173] hover:text-[#D97706] hover:bg-[#FEF3C7] rounded-lg transition-colors cursor-pointer"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        )}
                        <ChevronRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#006D3C] group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-4 border-t border-[#F1F4F8] bg-[#F7F9FC] flex items-center justify-between text-[11px] text-[#526173]">
        <span>
          Showing {filteredInvoices.length} of {invoices.length} statement records
        </span>
        <span className="font-semibold text-[#006D3C]">
          All billing is RRA Electronic Billing Machine (EBM) verified
        </span>
      </div>
    </div>
  );
}
