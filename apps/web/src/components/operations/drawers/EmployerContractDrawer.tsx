"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Building2,
  Percent,
  Users,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Plus,
  Mail,
  DollarSign,
  FileText,
  Activity,
  Sliders,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  Loader2,
  Upload,
  UserCheck,
  UserX,
  Lock,
  ChevronRight,
  Briefcase,
  Globe
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { BulkUploadModal } from "@/components/corporate/BulkUploadModal";
import { useOperationsDrawer } from "@/contexts/OperationsDrawerContext";

export interface EmployerContractDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string | null;
  initialData?: Record<string, any>;
  onClientUpdated?: () => void;
}

export function EmployerContractDrawer({
  isOpen,
  onClose,
  clientId,
  initialData,
  onClientUpdated
}: EmployerContractDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { openDrawer } = useOperationsDrawer();
  const [activeTab, setActiveTab] = useState<"commercial" | "subsidy" | "domains" | "roster">("commercial");

  const [loading, setLoading] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [domainInput, setDomainInput] = useState("");
  const [domainsUpdating, setDomainsUpdating] = useState(false);
  const [rosterUpdatingId, setRosterUpdatingId] = useState<string | null>(null);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [editingCapacity, setEditingCapacity] = useState(false);
  const [newCapacity, setNewCapacity] = useState<number>(100);

  // Synchronize native <dialog> lifecycle
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Load client detail from API
  const fetchClientDetail = async (id: string) => {
    setLoading(true);
    try {
      const data = await apiFetch<any>(`/api/operations/clients/${id}`);
      if (data && data.organization) {
        setClientData(data);
        setNewCapacity(data.organization.contractedSeats || data.organization.contracted_seats || 100);
      }
    } catch (err) {
      console.error("[EmployerContractDrawer] Failed to fetch client:", err);
      // Fallback to initialData if available
      if (initialData) {
        setClientData({
          organization: initialData,
          metrics: {
            activeEmployeesCount: initialData.activeEmployeesCount || 0,
            contractedSeats: initialData.contractedSeats || 100,
            utilizationPct: initialData.utilizationPct || 0,
            isNearCapacity: initialData.isNearCapacity || false
          },
          benefitPlans: initialData.benefits || [],
          employees: []
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && clientId) {
      fetchClientDetail(clientId);
    }
  }, [isOpen, clientId]);

  const org = clientData?.organization || initialData || {};
  const metrics = clientData?.metrics || {};
  const plans = clientData?.benefitPlans || [];
  const employees = clientData?.employees || [];
  const allowedDomains: string[] = org.allowedDomains || org.allowed_domains || [];

  const contractedSeats = org.contractedSeats || org.contracted_seats || 100;
  const activeCount = metrics.activeEmployeesCount ?? (org.activeEmployeesCount || 0);
  const utilizationPct = contractedSeats > 0 ? Math.round((activeCount / contractedSeats) * 100) : 0;
  const isNearCapacity = utilizationPct >= 90;

  // Status toggle handler
  const handleStatusChange = async (newStatus: string) => {
    if (!clientId) return;
    setStatusUpdating(true);
    try {
      await apiFetch(`/api/operations/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      setClientData((prev: any) => ({
        ...prev,
        organization: { ...prev?.organization, status: newStatus }
      }));
      onClientUpdated?.();
    } catch (err) {
      console.error("[EmployerContractDrawer] Status update failed:", err);
    } finally {
      setStatusUpdating(false);
    }
  };

  // Update Contracted Seats
  const handleSaveCapacity = async () => {
    if (!clientId) return;
    try {
      await apiFetch(`/api/operations/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contracted_seats: newCapacity })
      });
      setClientData((prev: any) => ({
        ...prev,
        organization: { ...prev?.organization, contracted_seats: newCapacity, contractedSeats: newCapacity }
      }));
      setEditingCapacity(false);
      onClientUpdated?.();
    } catch (err) {
      console.error("[EmployerContractDrawer] Capacity update failed:", err);
    }
  };

  // Domain Tag Handlers
  const handleAddDomain = async () => {
    const clean = domainInput.replace(/^@/, "").trim().toLowerCase();
    if (!clean || !clientId || allowedDomains.includes(clean)) return;

    setDomainsUpdating(true);
    const updated = [...allowedDomains, clean];
    try {
      await apiFetch(`/api/operations/clients/${clientId}/domains`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowed_domains: updated })
      });
      setClientData((prev: any) => ({
        ...prev,
        organization: { ...prev?.organization, allowed_domains: updated, allowedDomains: updated }
      }));
      setDomainInput("");
      onClientUpdated?.();
    } catch (err) {
      console.error("[EmployerContractDrawer] Add domain failed:", err);
    } finally {
      setDomainsUpdating(false);
    }
  };

  const handleRemoveDomain = async (domainToRemove: string) => {
    if (!clientId) return;
    setDomainsUpdating(true);
    const updated = allowedDomains.filter((d) => d !== domainToRemove);
    try {
      await apiFetch(`/api/operations/clients/${clientId}/domains`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowed_domains: updated })
      });
      setClientData((prev: any) => ({
        ...prev,
        organization: { ...prev?.organization, allowed_domains: updated, allowedDomains: updated }
      }));
      onClientUpdated?.();
    } catch (err) {
      console.error("[EmployerContractDrawer] Remove domain failed:", err);
    } finally {
      setDomainsUpdating(false);
    }
  };

  // Roster Employee 1-Click Status Toggle
  const handleEmployeeStatusToggle = async (empId: string, currentStatus: string) => {
    if (!clientId) return;
    const targetStatus = currentStatus === "active" ? "frozen" : "active";
    setRosterUpdatingId(empId);
    try {
      await apiFetch(`/api/operations/clients/${clientId}/employees/${empId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus })
      });
      setClientData((prev: any) => ({
        ...prev,
        employees: prev?.employees?.map((e: any) =>
          e.id === empId ? { ...e, status: targetStatus } : e
        )
      }));
      onClientUpdated?.();
    } catch (err) {
      console.error("[EmployerContractDrawer] Employee toggle failed:", err);
    } finally {
      setRosterUpdatingId(null);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="backdrop:bg-black/60 backdrop:backdrop-blur-xs bg-transparent p-0 m-0 w-full h-full max-w-none max-h-none border-none outline-none overflow-hidden"
    >
      <div className="w-full h-full flex justify-end">
        <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header Cockpit */}
        <div className="p-6 bg-[#0B1F33] text-white border-b border-[#21405A] space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#142C44] to-[#071521] border border-[#21405A] flex items-center justify-center text-white font-bold text-base shadow-sm">
                {org.name ? org.name.charAt(0).toUpperCase() : "C"}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold tracking-tight text-white">{org.name || "Corporate Client"}</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    TIN: {org.taxId || org.tax_id || "Unregistered"}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#28D17C]/20 text-[#28D17C] font-semibold border border-[#28D17C]/30">
                    {org.country || "Rwanda"}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <span>{org.industry || "Corporate Wellness"}</span>
                  <span>·</span>
                  <span>Headcount: {org.headcountTier || org.headcount_tier || "51-250"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Status Select Toggle */}
              <div className="relative">
                <select
                  value={org.status || "active"}
                  disabled={statusUpdating}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border appearance-none pr-7 cursor-pointer transition-colors ${
                    org.status === "active"
                      ? "bg-[#28D17C]/20 text-[#28D17C] border-[#28D17C]/40"
                      : org.status === "pipeline"
                      ? "bg-sky-500/20 text-sky-400 border-sky-500/40"
                      : org.status === "suspended"
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                      : "bg-rose-500/20 text-rose-400 border-rose-500/40"
                  }`}
                >
                  <option value="active">Active Client</option>
                  <option value="pipeline">Sales Pipeline</option>
                  <option value="suspended">Suspended</option>
                  <option value="churned">Churned</option>
                </select>
                <div className="absolute right-2 top-2.5 pointer-events-none">
                  {statusUpdating ? (
                    <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  )}
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Seat Capacity Bar with 90% Near-Capacity Alert */}
          <div className="p-3.5 rounded-xl bg-[#071521] border border-[#21405A] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#28D17C]" />
                <span className="font-semibold text-slate-200">Contracted Seat Utilization</span>
                {isNearCapacity && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    <span>≥90% Near Capacity (Upsell Opportunity)</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-white">
                  {activeCount} / {contractedSeats} seats ({utilizationPct}%)
                </span>
                {!editingCapacity ? (
                  <button
                    onClick={() => setEditingCapacity(true)}
                    className="text-[10px] text-[#28D17C] hover:underline"
                  >
                    Adjust
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={newCapacity}
                      onChange={(e) => setNewCapacity(Number(e.target.value))}
                      className="w-16 px-1.5 py-0.5 rounded bg-slate-800 text-white font-mono text-[11px] border border-slate-600"
                    />
                    <button
                      onClick={handleSaveCapacity}
                      className="px-1.5 py-0.5 bg-[#28D17C] text-[#0B1F33] rounded font-bold text-[10px]"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingCapacity(false)}
                      className="text-slate-400 text-[10px]"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Utilization progress bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isNearCapacity ? "bg-amber-400" : "bg-[#28D17C]"
                }`}
                style={{ width: `${Math.min(100, utilizationPct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 bg-slate-50 border-b border-slate-200 flex gap-6 text-xs font-semibold select-none">
          {[
            { id: "commercial", label: "Commercial Terms", icon: Briefcase },
            { id: "subsidy", label: "Subsidy Matrix & Plans", icon: Percent },
            { id: "domains", label: "Domain Gatekeeping", icon: Globe },
            { id: "roster", label: `Beneficiary Census (${employees.length})`, icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 flex items-center gap-2 border-b-2 transition-all ${
                  isActive
                    ? "border-[#28D17C] text-[#0B1F33] font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#28D17C]" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && !clientData ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#28D17C]" />
              <span className="text-xs font-medium">Loading corporate cockpit...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: COMMERCIAL OVERVIEW */}
              {activeTab === "commercial" && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Legal Entity & Tax</div>
                      <div className="text-xs space-y-1 text-slate-700">
                        <div>
                          <strong className="text-slate-900">Entity:</strong> {org.name}
                        </div>
                        <div>
                          <strong className="text-slate-900">TIN:</strong> {org.taxId || org.tax_id || "None"}
                        </div>
                        <div>
                          <strong className="text-slate-900">Jurisdiction:</strong> {org.country || "Rwanda"}
                        </div>
                        <div>
                          <strong className="text-slate-900">Billing Currency:</strong> RWF (Rwanda Franc)
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Contact Channels</div>
                      <div className="text-xs space-y-1 text-slate-700">
                        <div>
                          <strong className="text-slate-900">HR Contact:</strong>{" "}
                          {org.contactEmail || org.contact_email || "Not specified"}
                        </div>
                        <div>
                          <strong className="text-slate-900">Billing Email:</strong>{" "}
                          {org.billingEmail || org.billing_email || "Not specified"}
                        </div>
                        <div>
                          <strong className="text-slate-900">Contract Signed:</strong>{" "}
                          {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : "Active"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operational Invoicing & Historical Billing */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Recent Corporate Invoices & Settled Billing
                      </h4>
                      <span className="text-[11px] text-slate-400">Monthly Arrears Cycle</span>
                    </div>

                    {clientData?.recentInvoices && clientData.recentInvoices.length > 0 ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                        {clientData.recentInvoices.map((inv: any) => (
                          <div key={inv.id} className="p-3.5 flex items-center justify-between bg-white text-xs">
                            <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-slate-400" />
                              <div>
                                <div className="font-bold text-slate-900">{inv.invoice_number || `INV-${inv.id.substring(0, 8)}`}</div>
                                <div className="text-[11px] text-slate-500">
                                  {inv.billing_period_start} to {inv.billing_period_end}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-bold text-slate-900">
                                RWF {Number(inv.total_amount || 0).toLocaleString()}
                              </div>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                {inv.status || "Paid"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                        No invoices generated yet. Invoices are generated at the close of the monthly billing cycle.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: SUBSIDY MATRIX & PLANS */}
              {activeTab === "subsidy" && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Contracted Benefit Plan Tiers & Access Matrix
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Governs which provider facilities beneficiaries can access and how much the employer covers.
                      </p>
                    </div>
                  </div>

                  {plans.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {plans.map((p: any) => (
                        <div
                          key={p.id}
                          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-[#28D17C] transition-all space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">{p.name}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                              {p.tier?.toUpperCase()}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs text-slate-600">
                            <div className="flex justify-between">
                              <span>Monthly Visit Cap:</span>
                              <strong className="text-slate-900">{p.max_monthly_visits || 12} visits/mo</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Employer Subsidy:</span>
                              <strong className="text-[#28D17C] font-mono">
                                {100 - Number(p.co_pay_percentage || 0)}%
                              </strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Employee Co-Pay:</span>
                              <strong className="text-slate-900 font-mono">
                                {Number(p.co_pay_percentage || 0)}%
                              </strong>
                            </div>
                            {p.budget_cap_per_employee && (
                              <div className="flex justify-between">
                                <span>Monthly Allowance Cap:</span>
                                <strong className="text-slate-900 font-mono">
                                  RWF {Number(p.budget_cap_per_employee).toLocaleString()}
                                </strong>
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">
                              Allowed: {p.allowed_provider_categories?.join(", ") || "All Categories"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      No custom plans configured. Standard network access applies.
                    </div>
                  )}

                  {/* Visual Economics Preview Calculator */}
                  <div className="p-4 rounded-xl bg-[#0B1F33] text-white space-y-3 border border-[#21405A]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#28D17C]" />
                      <span className="text-xs font-bold">Standard Network Economics Benchmark</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Based on average network facility fees (RWF 45,000 / month standard benchmark), PolyFit
                      computes the gross monthly financial flow:
                    </p>
                    <div className="grid grid-cols-3 gap-3 pt-1 text-center">
                      <div className="p-2.5 rounded-lg bg-[#142C44]">
                        <div className="text-[10px] text-slate-400">Network Tier Fee</div>
                        <div className="text-xs font-mono font-bold text-white mt-1">RWF 45,000</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#142C44]">
                        <div className="text-[10px] text-slate-400">Avg Employer Share (70%)</div>
                        <div className="text-xs font-mono font-bold text-[#28D17C] mt-1">RWF 31,500</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#142C44]">
                        <div className="text-[10px] text-slate-400">Avg Employee Co-Pay (30%)</div>
                        <div className="text-xs font-mono font-bold text-slate-300 mt-1">RWF 13,500</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: DOMAIN GATEKEEPING */}
              {activeTab === "domains" && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Whitelisted Corporate Email Domains
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      New mobile app users who register with these email domains are instantly auto-matched and
                      verified for this corporate benefit plan.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 text-xs font-mono">
                        @
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. bk.rw, equitybank.co.ke"
                        value={domainInput}
                        onChange={(e) => setDomainInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddDomain();
                          }
                        }}
                        className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={domainsUpdating}
                      onClick={handleAddDomain}
                      className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {domainsUpdating ? "Updating..." : "Add Domain"}
                    </button>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-semibold text-slate-700">Active Authorized Domains:</div>
                    <div className="flex flex-wrap gap-2">
                      {allowedDomains.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 w-full text-center">
                          No corporate domains registered. Anyone registering with an email must be manually invited or
                          added to the roster.
                        </div>
                      ) : (
                        allowedDomains.map((domain) => (
                          <div
                            key={domain}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-semibold"
                          >
                            <span>@{domain}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDomain(domain)}
                              className="text-emerald-600 hover:text-emerald-900 transition-colors"
                              aria-label={`Remove domain ${domain}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Security Policy Information */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#28D17C]" />
                      <span>Zero-Trust Auto-Matching Covenant</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      When a beneficiary creates an account on the PolyFit mobile application with an email ending in
                      any whitelisted domain, the system verifies corporate sponsorship in real-time, generates the TOTP
                      dynamic pass secret, and binds access to the organization&apos;s active subsidy policy.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: EMPLOYEE CENSUS & ROSTER OVERRIDE */}
              {activeTab === "roster" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Beneficiary Census & Roster Management
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Direct super admin inspection and override controls for employee accounts.
                      </p>
                    </div>
                    <button
                      onClick={() => setBulkUploadOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Bulk CSV Sync</span>
                    </button>
                  </div>

                  {employees.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                      {employees.map((emp: any) => {
                        const isUpdating = rosterUpdatingId === emp.id;
                        return (
                          <div
                            key={emp.id}
                            className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                                {emp.full_name?.charAt(0) || "U"}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{emp.full_name}</div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                  <span>{emp.email}</span>
                                  {emp.department && (
                                    <>
                                      <span>·</span>
                                      <span className="font-mono text-[10px]">{emp.department}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                                {emp.tier || "standard"}
                              </span>

                              {/* 1-Click Status Override Toggle */}
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleEmployeeStatusToggle(emp.id, emp.status)}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                                  emp.status === "active"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200"
                                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200"
                                }`}
                                title="Click to toggle status"
                              >
                                {isUpdating ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : emp.status === "active" ? (
                                  "Active"
                                ) : (
                                  "Frozen"
                                )}
                              </button>

                              {/* User 360 Diagnostics Deep Link */}
                              <button
                                type="button"
                                onClick={() => openDrawer("employee", emp.id, emp, emp.full_name)}
                                className="p-1 rounded-md text-slate-400 hover:text-[#28D17C] hover:bg-slate-100 transition-colors"
                                title="Inspect User 360 Support & Device Diagnostics"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400 space-y-2">
                      <Users className="w-6 h-6 text-slate-300 mx-auto" />
                      <div>No beneficiaries enrolled under this employer roster yet.</div>
                      <button
                        onClick={() => setBulkUploadOpen(true)}
                        className="text-xs text-[#28D17C] font-semibold hover:underline"
                      >
                        Upload CSV Census Roster
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#28D17C]" />
            <span>Super Admin Override Mode Enabled</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/corporate?demoOrg=${org.slug || ""}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
            >
              <span>View Employer Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#0B1F33] hover:bg-slate-800 text-white font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Embedded High-Performance Bulk Upload Modal */}
      {clientId && (
        <BulkUploadModal
          isOpen={bulkUploadOpen}
          onClose={() => setBulkUploadOpen(false)}
          orgId={clientId}
          corporateDomain={allowedDomains[0] || "company.rw"}
          onImportSuccess={() => {
            fetchClientDetail(clientId);
            onClientUpdated?.();
          }}
        />
      )}
      </div>
    </dialog>
  );
}
