"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  Search,
  Filter,
  Users,
  Percent,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Globe,
  Sliders,
  DollarSign,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  Phone,
  MessageSquare,
  Mail,
  Sparkles,
  UserPlus,
  Check,
  X,
  Clock,
  HelpCircle,
  Calendar
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { CreateEmployerDrawer } from "@/components/operations/drawers/CreateEmployerDrawer";
import { useOperationsDrawer } from "@/contexts/OperationsDrawerContext";

interface DemoRequestItem {
  id: string;
  company_name: string;
  contact_name: string;
  work_email: string;
  phone: string;
  country: string;
  company_size: string;
  message: string | null;
  interest_tier: string | null;
  source: string | null;
  status: string; // 'pending' | 'contacted' | 'approved' | 'disqualified'
  notes?: string | null;
  contacted_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface CorporateClient {
  id: string;
  name: string;
  slug: string;
  industry: string;
  country: string;
  status: string;
  taxId: string | null;
  contactEmail: string | null;
  billingEmail: string | null;
  headcountTier: string;
  contractedSeats: number;
  allowedDomains: string[];
  activeEmployeesCount: number;
  totalEmployeesCount: number;
  utilizationPct: number;
  isNearCapacity: boolean;
  estimatedMonthlyBurnRwf: number;
  benefits: Array<{
    id: string;
    name: string;
    tier: string;
    maxMonthlyVisits: number;
    copayPercentage: number;
    budgetCap: number | null;
    categories: string[];
  }>;
  createdAt: string;
}

function CorporateClientsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { openDrawer, refreshKey } = useOperationsDrawer();

  // Tab state: "clients" or "leads"
  const [activeTab, setActiveTab] = useState<"clients" | "leads">(() => 
    searchParams.get("tab") === "leads" ? "leads" : "clients"
  );

  const [clients, setClients] = useState<CorporateClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Corporate Clients Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");

  // Inbound Leads Desk State
  const [leads, setLeads] = useState<DemoRequestItem[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsStatusFilter, setLeadsStatusFilter] = useState("all");
  const [leadsSizeFilter, setLeadsSizeFilter] = useState("all");
  const [leadsSearchQuery, setLeadsSearchQuery] = useState("");
  const [leadCounts, setLeadCounts] = useState({
    total: 0,
    pending: 0,
    contacted: 0,
    approved: 0,
    disqualified: 0
  });
  const [selectedLeadForOnboarding, setSelectedLeadForOnboarding] = useState<DemoRequestItem | null>(null);
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [leadActionFeedback, setLeadActionFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);

  // Creation drawer state
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Load clients list
  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<any>("/api/operations/clients");
      if (res && Array.isArray(res.clients)) {
        setClients(res.clients);
      }
    } catch (err: any) {
      console.error("[CorporateClientsPage] Fetch error:", err);
      setError(err?.message || "Failed to load corporate clients list.");
    } finally {
      setLoading(false);
    }
  };

  // Load inbound leads
  const fetchLeads = async () => {
    setLeadsLoading(true);
    try {
      const params = new URLSearchParams();
      if (leadsStatusFilter !== "all") params.append("status", leadsStatusFilter);
      if (leadsSizeFilter !== "all") params.append("companySize", leadsSizeFilter);
      if (leadsSearchQuery.trim()) params.append("search", leadsSearchQuery.trim());
      params.append("limit", "100");

      const res = await apiFetch<any>(`/api/operations/demo-requests?${params.toString()}`);
      if (res && Array.isArray(res.data)) {
        setLeads(res.data);
        if (res.counts) setLeadCounts(res.counts);
      }
    } catch (err: any) {
      console.error("[CorporateClientsPage] Fetch leads error:", err);
    } finally {
      setLeadsLoading(false);
    }
  };

  // Update lead status
  const handleUpdateLeadStatus = async (id: string, newStatus: string) => {
    setUpdatingLeadId(id);
    setLeadActionFeedback(null);
    try {
      await apiFetch<any>(`/api/operations/demo-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      });
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status: newStatus } : l));
      setLeadActionFeedback({
        type: "success",
        message: `Lead status updated to ${newStatus.toUpperCase()}`
      });
      setTimeout(() => setLeadActionFeedback(null), 4000);
      fetchLeads();
    } catch (err: any) {
      setLeadActionFeedback({
        type: "error",
        message: "Failed to update lead status: " + (err?.message || "Unknown error")
      });
    } finally {
      setUpdatingLeadId(null);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [refreshKey]);

  useEffect(() => {
    fetchLeads();
  }, [refreshKey, leadsStatusFilter, leadsSizeFilter]);

  // Deep-link integration: Check ?id=... from URL params
  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam) {
      openDrawer("organization", idParam);
    }
    const tabParam = searchParams.get("tab");
    if (tabParam === "leads") {
      setActiveTab("leads");
    }
  }, [searchParams, openDrawer]);

  // Filtered clients calculation
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // 1. Text Search (Name, Domains, Tax ID, Industry)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = client.name.toLowerCase().includes(q);
        const matchesIndustry = client.industry.toLowerCase().includes(q);
        const matchesTax = client.taxId?.toLowerCase().includes(q);
        const matchesDomain = client.allowedDomains.some((d) => d.toLowerCase().includes(q));
        if (!matchesName && !matchesIndustry && !matchesTax && !matchesDomain) {
          return false;
        }
      }

      // 2. Status filter
      if (statusFilter !== "all" && client.status !== statusFilter) {
        return false;
      }

      // 3. Industry filter
      if (industryFilter !== "all" && client.industry !== industryFilter) {
        return false;
      }

      // 4. Headcount tier filter
      if (tierFilter !== "all" && client.headcountTier !== tierFilter) {
        return false;
      }

      return true;
    });
  }, [clients, searchQuery, statusFilter, industryFilter, tierFilter]);

  // Aggregate Metrics for Top KPI Strip
  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === "active").length;
  const pipelineClients = clients.filter((c) => c.status === "pipeline").length;
  const totalContractedSeats = clients.reduce((acc, c) => acc + (c.contractedSeats || 0), 0);
  const totalActiveBeneficiaries = clients.reduce((acc, c) => acc + (c.activeEmployeesCount || 0), 0);
  const nearCapacityCount = clients.filter((c) => c.isNearCapacity).length;
  const aggregateBurnRwf = clients.reduce((acc, c) => acc + (c.estimatedMonthlyBurnRwf || 0), 0);

  const avgUtilization = totalContractedSeats > 0
    ? Math.round((totalActiveBeneficiaries / totalContractedSeats) * 100)
    : 0;

  // Unique industries for filter dropdown
  const uniqueIndustries = useMemo(() => {
    return Array.from(new Set(clients.map((c) => c.industry).filter(Boolean)));
  }, [clients]);

  const handleOnboardLead = (lead: DemoRequestItem) => {
    setSelectedLeadForOnboarding(lead);
    setIsCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-[#28D17C]/15 text-[#156d41] font-semibold text-[11px]">
              Corporate Client Management
            </span>
            <span className="text-xs text-slate-400 font-medium">• Roster &amp; Benefit Contracts</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Corporate Clients &amp; Contract Lifecycle
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise contract builder, flexible corporate subsidy matrix, and inbound employer demo clearinghouse.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (activeTab === "clients") fetchClients();
              else fetchLeads();
            }}
            disabled={loading || leadsLoading}
            className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh current view"
          >
            <RefreshCw className={`w-4 h-4 ${(loading || leadsLoading) ? "animate-spin text-[#28D17C]" : ""}`} />
          </button>

          <button
            onClick={() => {
              setSelectedLeadForOnboarding(null);
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B1F33] hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#28D17C]" />
            <span>New Corporate Client</span>
          </button>
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("clients")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "clients"
              ? "bg-[#0B1F33] text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Active Corporate Clients</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
            {totalClients}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("leads")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "leads"
              ? "bg-[#0B1F33] text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Inbound Corporate Leads &amp; Demos</span>
          <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            leadCounts.pending > 0 
              ? "bg-blue-500 text-white" 
              : "bg-slate-200 text-slate-700"
          }`}>
            {leadCounts.pending > 0 ? `${leadCounts.pending} Pending` : leadCounts.total}
          </span>
        </button>
      </div>

      {activeTab === "clients" && (
        <>
      {/* Top Executive KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Clients */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Corporate Clients</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">{totalClients}</span>
            <span className="text-xs text-emerald-600 font-medium">({activeClients} Active)</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Pipeline: {pipelineClients}</span>
            <span>Suspended: {clients.filter((c) => c.status === "suspended").length}</span>
          </div>
        </div>

        {/* KPI 2: Contracted Seats Utilization */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Contracted Capacity</span>
            <Users className="w-4 h-4 text-[#28D17C]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {totalActiveBeneficiaries}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ {totalContractedSeats} seats</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Avg Utilization:</span>
            <span className="font-mono font-bold text-slate-700">{avgUtilization}%</span>
          </div>
        </div>

        {/* KPI 3: Near-Capacity Alert */}
        <div className={`p-4 rounded-xl border shadow-xs space-y-2 transition-all ${
          nearCapacityCount > 0 ? "bg-amber-50/70 border-amber-200 text-amber-900" : "bg-white border-slate-200/80"
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              {nearCapacityCount > 0 ? "Expansion Alerts" : "Capacity Headroom"}
            </span>
            <AlertTriangle className={`w-4 h-4 ${nearCapacityCount > 0 ? "text-amber-600" : "text-slate-400"}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${nearCapacityCount > 0 ? "text-amber-900" : "text-slate-900"}`}>
              {nearCapacityCount}
            </span>
            <span className="text-xs font-medium">Clients ≥ 90% full</span>
          </div>
          <div className="text-[11px] pt-1 border-t border-slate-100/80">
            {nearCapacityCount > 0 ? (
              <span className="font-semibold text-amber-800">Upsell & seat contract expansion ready</span>
            ) : (
              <span className="text-slate-400">All enterprise accounts within seat limits</span>
            )}
          </div>
        </div>

        {/* KPI 4: Monthly Subsidy Burn Estimate */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Monthly Subsidy Burn</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-mono font-bold text-slate-900">
              RWF {(aggregateBurnRwf / 1000000).toFixed(1)}M
            </span>
            <span className="text-xs text-slate-400">/ mo</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>B2B Contract GMV</span>
            <span className="text-emerald-600 font-semibold font-mono">Healthy Burn</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by company name, allowed domain, TIN, or industry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#28D17C] focus:border-transparent"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold overflow-x-auto">
            {["all", "active", "pipeline", "suspended", "churned"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-md capitalize transition-all ${
                  statusFilter === st
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px] font-semibold">Industry:</span>
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#28D17C]"
            >
              <option value="all">All Industries</option>
              {uniqueIndustries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px] font-semibold">Headcount Tier:</span>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#28D17C]"
            >
              <option value="all">All Tiers</option>
              <option value="1-50">1 - 50</option>
              <option value="51-250">51 - 250</option>
              <option value="251-1000">251 - 1,000</option>
              <option value="1000+">1,000+ Enterprise</option>
            </select>
          </div>

          <div className="ml-auto text-[11px] text-slate-500">
            Showing <strong className="text-slate-900">{filteredClients.length}</strong> of {totalClients} corporate clients
          </div>
        </div>
      </div>

      {/* Corporate Client Directory Table & Mobile Cards */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {/* Mobile Responsive Cards (Touch-friendly 1-tap list) */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#28D17C]" />
              <span className="text-xs">Loading corporate clients...</span>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Building2 className="w-6 h-6 mx-auto mb-1 text-slate-300" />
              <div className="text-xs font-semibold text-slate-700">No matching clients</div>
            </div>
          ) : (
            filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => openDrawer("organization", client.id)}
                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#0B1F33] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{client.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">TIN: {client.taxId || "Unregistered"}</div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      client.status === "active"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {client.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>{client.activeEmployeesCount} / {client.contractedSeats} seats ({client.utilizationPct}%)</span>
                  <span className="font-semibold text-[#008A4B] flex items-center gap-1">
                    <span>Manage</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Data Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0B1F33] text-white border-b border-[#21405A]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">Client Legal Name</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">Industry &amp; Country</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">Contracted Capacity</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">Whitelisted Domains</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">Active Plans</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#28D17C]" />
                      <span>Loading corporate client directory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div className="font-semibold text-slate-700">No corporate clients match your filters</div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Try adjusting the search query or filters above.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  return (
                    <tr
                      key={client.id}
                      onClick={() => openDrawer("organization", client.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      {/* Company Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#142C44] to-[#071521] border border-[#21405A] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-[#28D17C] transition-colors flex items-center gap-1.5">
                              <span>{client.name}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              TIN: {client.taxId || "Unregistered"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            client.status === "active"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : client.status === "pipeline"
                              ? "bg-sky-50 text-sky-800 border-sky-200"
                              : client.status === "suspended"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-rose-50 text-rose-800 border-rose-200"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{client.status}</span>
                        </span>
                      </td>

                      {/* Industry & Country */}
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-medium">{client.industry}</div>
                        <div className="text-[11px] text-slate-400">{client.country || "Rwanda"}</div>
                      </td>

                      {/* Capacity & Progress */}
                      <td className="py-3.5 px-4 min-w-[170px]">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-mono font-bold text-slate-900">
                            {client.activeEmployeesCount} / {client.contractedSeats} seats
                          </span>
                          <span
                            className={`font-mono font-bold ${
                              client.isNearCapacity ? "text-amber-600" : "text-slate-500"
                            }`}
                          >
                            {client.utilizationPct}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              client.isNearCapacity ? "bg-amber-500" : "bg-[#28D17C]"
                            }`}
                            style={{ width: `${Math.min(100, client.utilizationPct)}%` }}
                          />
                        </div>
                        {client.isNearCapacity && (
                          <div className="text-[10px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Near 90% seat cap</span>
                          </div>
                        )}
                      </td>

                      {/* Whitelisted Domains */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {client.allowedDomains.length === 0 ? (
                            <span className="text-slate-400 text-[11px] italic">None</span>
                          ) : (
                            client.allowedDomains.slice(0, 2).map((d) => (
                              <span
                                key={d}
                                className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono border border-slate-200"
                              >
                                @{d}
                              </span>
                            ))
                          )}
                          {client.allowedDomains.length > 2 && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-mono">
                              +{client.allowedDomains.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Active Plans */}
                      <td className="py-3.5 px-4">
                        {client.benefits && client.benefits.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                              {client.benefits[0].name}
                            </span>
                            {client.benefits.length > 1 && (
                              <span className="text-[10px] text-slate-400">
                                +{client.benefits.length - 1}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Standard Matrix</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDrawer("organization", client.id);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#0B1F33] hover:text-white text-slate-700 text-xs font-semibold transition-all"
                        >
                          <span>Open Cockpit</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Inbound Employer Leads & Demos Desk */}
      {activeTab === "leads" && (
        <div className="space-y-6">
          {leadActionFeedback && (
            <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
              leadActionFeedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}>
              <div className="flex items-center gap-2">
                {leadActionFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{leadActionFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setLeadActionFeedback(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Top Inbound Leads KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Total Inquiries</span>
                <Sparkles className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 font-mono">{leadCounts.total}</span>
                <span className="text-xs text-slate-400">All submissions</span>
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                Inbound requests from corporate landing page &amp; demo forms
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-blue-800 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Pending Outreach</span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-blue-900 font-mono">{leadCounts.pending}</span>
                <span className="text-xs text-blue-700 font-semibold">Requires Action</span>
              </div>
              <div className="text-[11px] text-blue-700 pt-1 border-t border-blue-200/60">
                Awaiting first contact or demo scheduling call
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-amber-800 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[10px]">In Active Discussion</span>
                <MessageSquare className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-900 font-mono">{leadCounts.contacted}</span>
                <span className="text-xs text-amber-700 font-medium">Contacted</span>
              </div>
              <div className="text-[11px] text-amber-700 pt-1 border-t border-amber-200/60">
                Demo held or commercial proposal shared
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-emerald-800 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Converted Clients</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-900 font-mono">{leadCounts.approved}</span>
                <span className="text-xs text-emerald-700 font-medium">Won &amp; Onboarded</span>
              </div>
              <div className="text-[11px] text-emerald-700 pt-1 border-t border-emerald-200/60">
                Enterprise roster active in aggregator
              </div>
            </div>
          </div>

          {/* Leads Filter & Search Bar */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search leads by company, contact person, email, or phone..."
                  value={leadsSearchQuery}
                  onChange={(e) => setLeadsSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchLeads()}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#28D17C] focus:border-transparent"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold overflow-x-auto">
                {[
                  { id: "all", label: `All (${leadCounts.total})` },
                  { id: "pending", label: `Pending (${leadCounts.pending})` },
                  { id: "contacted", label: `Contacted (${leadCounts.contacted})` },
                  { id: "approved", label: `Converted (${leadCounts.approved})` },
                  { id: "disqualified", label: `Disqualified (${leadCounts.disqualified})` }
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setLeadsStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                      leadsStatusFilter === st.id
                        ? "bg-white text-slate-900 shadow-xs font-bold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Secondary Filter Row */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px] font-semibold">Company Size:</span>
                <select
                  value={leadsSizeFilter}
                  onChange={(e) => setLeadsSizeFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#28D17C]"
                >
                  <option value="all">All Sizes</option>
                  <option value="1-50">1 - 50 employees</option>
                  <option value="51-200">51 - 200 employees</option>
                  <option value="201-500">201 - 500 employees</option>
                  <option value="500+">500+ Enterprise</option>
                </select>
              </div>

              <div className="ml-auto text-[11px] text-slate-500">
                Showing <strong className="text-slate-900">{leads.length}</strong> inquiries
              </div>
            </div>
          </div>

          {/* Leads Table */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            {leadsLoading ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#28D17C]" />
                <span className="text-xs">Loading inbound employer inquiries...</span>
              </div>
            ) : leads.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <div className="text-sm font-semibold text-slate-700">No Demo Inquiries Found</div>
                <div className="text-xs text-slate-400 mt-1">
                  {leadsStatusFilter !== "all" || leadsSearchQuery ? "Try resetting your search or filter pills." : "New employer inquiries from the landing page will arrive here."}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Company &amp; Location</th>
                      <th className="py-3 px-4">Contact Person</th>
                      <th className="py-3 px-4">Size &amp; Tier Interest</th>
                      <th className="py-3 px-4">Inquiry Notes</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Submitted</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leads.map((lead) => {
                      const cleanPhone = (lead.phone || "").replace(/[^0-9]/g, "");
                      const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(lead.contact_name)},%20thank%20you%20for%20requesting%20a%20PolyFit%20demo%20for%20${encodeURIComponent(lead.company_name)}.` : null;
                      const mailLink = `mailto:${lead.work_email}?subject=PolyFit%20Corporate%20Wellness%20Demo%20-%20${encodeURIComponent(lead.company_name)}&body=Hello%20${encodeURIComponent(lead.contact_name)},%0A%0AThank%20you%20for%20your%20interest%20in%20PolyFit.`;

                      return (
                        <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-xs">{lead.company_name}</div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                              <Globe className="w-3 h-3 text-slate-400" />
                              <span>{lead.country || "Rwanda"}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">{lead.contact_name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{lead.work_email}</div>
                            <div className="text-[10px] text-slate-400">{lead.phone}</div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span>{lead.company_size || "Not specified"}</span>
                            </div>
                            {lead.interest_tier && (
                              <div className="mt-1">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {lead.interest_tier}
                                </span>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 max-w-xs">
                            <p className="text-[11px] text-slate-600 line-clamp-2 italic">
                              "{lead.message || "No custom message entered"}"
                            </p>
                          </td>

                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                              lead.status === "approved"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : lead.status === "contacted"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : lead.status === "disqualified"
                                ? "bg-slate-100 text-slate-500 border border-slate-200"
                                : "bg-blue-100 text-blue-800 border border-blue-200 animate-pulse"
                            }`}>
                              {lead.status === "approved" ? "Converted" : lead.status}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                            {new Date(lead.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Direct WhatsApp button */}
                              {waLink && (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                  title="Chat on WhatsApp"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              )}

                              {/* Direct Email button */}
                              <a
                                href={mailLink}
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
                                title="Send Email"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </a>

                              {/* 1-Click Status: Contacted */}
                              {lead.status === "pending" && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateLeadStatus(lead.id, "contacted")}
                                  disabled={updatingLeadId === lead.id}
                                  className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-[11px] font-semibold transition-colors cursor-pointer"
                                  title="Mark as Contacted"
                                >
                                  Mark Contacted
                                </button>
                              )}

                              {/* 1-Click Onboard as Corporate Client */}
                              {lead.status !== "approved" && (
                                <button
                                  type="button"
                                  onClick={() => handleOnboardLead(lead)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0B1F33] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                                  title="Open Onboarding Drawer with lead data pre-filled"
                                >
                                  <UserPlus className="w-3 h-3 text-[#28D17C]" />
                                  <span>Onboard Client</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Streamlined 3-Step Creation Drawer */}
      <CreateEmployerDrawer
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setSelectedLeadForOnboarding(null);
        }}
        initialLeadData={selectedLeadForOnboarding ? {
          companyName: selectedLeadForOnboarding.company_name,
          contactName: selectedLeadForOnboarding.contact_name,
          workEmail: selectedLeadForOnboarding.work_email,
          country: selectedLeadForOnboarding.country,
          companySize: selectedLeadForOnboarding.company_size,
          interestTier: selectedLeadForOnboarding.interest_tier || "standard"
        } : null}
        onSuccess={async (newClient) => {
          fetchClients();
          if (selectedLeadForOnboarding) {
            await handleUpdateLeadStatus(selectedLeadForOnboarding.id, "approved");
            setSelectedLeadForOnboarding(null);
          }
          if (newClient?.id) {
            openDrawer("organization", newClient.id);
          }
        }}
      />
    </div>
  );
}

export default function CorporateClientsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-12 text-center text-slate-400">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-[#28D17C] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">Loading Corporate Clients Cockpit...</span>
          </div>
        </div>
      }
    >
      <CorporateClientsContent />
    </React.Suspense>
  );
}

