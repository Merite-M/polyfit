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
  FileSpreadsheet
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { CreateEmployerDrawer } from "@/components/operations/drawers/CreateEmployerDrawer";
import { useOperationsDrawer } from "@/contexts/OperationsDrawerContext";

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

  const [clients, setClients] = useState<CorporateClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");

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

  useEffect(() => {
    fetchClients();
  }, [refreshKey]);

  // Deep-link integration: Check ?id=... from URL params
  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam) {
      openDrawer("organization", idParam);
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-[#28D17C]/20 text-[#28D17C] border border-[#28D17C]/30 font-mono text-[10px] font-bold">
              PF-118
            </span>
            <span className="text-xs text-slate-400 font-medium">Super Admin Modules</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Corporate Clients &amp; Contract Lifecycle
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise contract builder, flexible corporate subsidy matrix, and domain gatekeeping cockpit.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchClients}
            disabled={loading}
            className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh clients list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#28D17C]" : ""}`} />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B1F33] hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-[#28D17C]" />
            <span>New Corporate Client</span>
          </button>
        </div>
      </div>

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

      {/* Streamlined 3-Step Creation Drawer */}
      <CreateEmployerDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(newClient) => {
          fetchClients();
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

