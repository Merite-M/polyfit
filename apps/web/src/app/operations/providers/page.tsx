"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Network,
  Plus,
  Search,
  Filter,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Sliders,
  DollarSign,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Building2,
  Radio,
  Clock,
  Layers,
  Sparkles
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { formatCurrencyDisplay } from "@/lib/utils";
import { CreateProviderDrawer } from "@/components/operations/drawers/CreateProviderDrawer";
import { ProviderDossierDrawer } from "@/components/operations/drawers/ProviderDossierDrawer";

interface ProviderLocationItem {
  id: string;
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  status: string;
  metadata?: {
    geofence_radius_meters?: number;
    per_visit_payout_rate?: number;
    min_benefit_tier?: string;
    is_maintenance_mode?: boolean;
  };
}

interface OperationsProvider {
  id: string;
  name: string;
  category: string;
  contact_email: string | null;
  settlement_email: string | null;
  tax_id: string | null;
  status: string;
  created_at: string;
  location_count: number;
  active_location_count: number;
  maintenance_location_count: number;
  primary_city: string;
  locations: ProviderLocationItem[];
  kyc_status: string;
  per_visit_rate: number;
  today_visits: number;
  mtd_visits: number;
  mtd_payout_rwf: number;
}

interface FleetTelemetry {
  totalProviders: number;
  activeProviders: number;
  inReviewProviders: number;
  suspendedProviders: number;
  totalLocations: number;
  activeLocations: number;
  maintenanceLocations: number;
  todayNetworkVisits: number;
  networkGrossPayoutMtdRwf: number;
  categoryCounts: Record<string, number>;
}

function ProviderNetworkContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [providers, setProviders] = useState<OperationsProvider[]>([]);
  const [telemetry, setTelemetry] = useState<FleetTelemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");

  // Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  const fetchProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<any>("/api/operations/providers");
      if (res && Array.isArray(res.providers)) {
        setProviders(res.providers);
        if (res.telemetry) {
          setTelemetry(res.telemetry);
        }
      }
    } catch (err: any) {
      console.error("[ProviderNetworkPage] Fetch error:", err);
      setError(err?.message || "Failed to load provider network fleet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  // Deep-linking: sync URL query param `?id=...`
  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam) {
      setSelectedProviderId(idParam);
    }
  }, [searchParams]);

  const handleOpenDossier = (providerId: string) => {
    setSelectedProviderId(providerId);
    const params = new URLSearchParams(window.location.search);
    params.set("id", providerId);
    router.replace(`/operations/providers?${params.toString()}`);
  };

  const handleCloseDossier = () => {
    setSelectedProviderId(null);
    const params = new URLSearchParams(window.location.search);
    params.delete("id");
    const newQuery = params.toString();
    router.replace(`/operations/providers${newQuery ? `?${newQuery}` : ""}`);
  };

  // Filtered Providers computation
  const filteredProviders = useMemo(() => {
    return providers.filter((prov) => {
      // 1. Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = prov.name.toLowerCase().includes(q);
        const matchesCategory = prov.category.toLowerCase().includes(q);
        const matchesTax = prov.tax_id?.toLowerCase().includes(q);
        const matchesEmail = prov.contact_email?.toLowerCase().includes(q) || prov.settlement_email?.toLowerCase().includes(q);
        const matchesLocation = prov.locations.some(
          (l) => l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q) || l.address?.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesCategory && !matchesTax && !matchesEmail && !matchesLocation) {
          return false;
        }
      }

      // 2. Status filter
      if (statusFilter !== "all" && prov.status !== statusFilter) {
        return false;
      }

      // 3. Category filter
      if (categoryFilter !== "all" && prov.category !== categoryFilter) {
        return false;
      }

      // 4. City filter
      if (cityFilter !== "all") {
        const hasCity = prov.locations.some(
          (l) => l.city.toLowerCase() === cityFilter.toLowerCase()
        );
        if (!hasCity) return false;
      }

      return true;
    });
  }, [providers, searchQuery, statusFilter, categoryFilter, cityFilter]);

  // Unique cities list for filter dropdown
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    providers.forEach((p) => {
      p.locations.forEach((l) => {
        if (l.city) set.add(l.city);
      });
    });
    return Array.from(set).sort();
  }, [providers]);

  // Derived Telemetry fallbacks
  const totalProviders = telemetry?.totalProviders ?? providers.length;
  const activeProviders = telemetry?.activeProviders ?? providers.filter((p) => p.status === "active").length;
  const inReviewProviders = telemetry?.inReviewProviders ?? providers.filter((p) => p.status === "pending_review" || p.status === "in_review").length;
  const totalLocations = telemetry?.totalLocations ?? providers.reduce((acc, p) => acc + (p.location_count || 0), 0);
  const maintenanceLocations = telemetry?.maintenanceLocations ?? providers.reduce((acc, p) => acc + (p.maintenance_location_count || 0), 0);
  const todayVisits = telemetry?.todayNetworkVisits ?? providers.reduce((acc, p) => acc + (p.today_visits || 0), 0);
  const mtdSettlementRwf = telemetry?.networkGrossPayoutMtdRwf ?? providers.reduce((acc, p) => acc + (p.mtd_payout_rwf || 0), 0);

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "gym":
        return { label: "Gym & Fitness", icon: "🏋️‍♂️", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "studio":
        return { label: "Yoga / Studio", icon: "🧘‍♀️", color: "bg-purple-50 text-purple-700 border-purple-200" };
      case "pool":
        return { label: "Olympic Pool", icon: "🏊‍♂️", color: "bg-cyan-50 text-cyan-700 border-cyan-200" };
      case "clinic":
        return { label: "Physio Clinic", icon: "🩺", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "wellness_center":
        return { label: "Wellness / Spa", icon: "🌿", color: "bg-amber-50 text-amber-700 border-amber-200" };
      default:
        return { label: category.toUpperCase(), icon: "🏢", color: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active Certified
          </span>
        );
      case "pending_review":
      case "in_review":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            KYC In-Review
          </span>
        );
      case "contract_pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
            Contract Pending
          </span>
        );
      case "suspended":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold">
            Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-[#28D17C]/20 text-[#28D17C] border border-[#28D17C]/30 font-mono text-[10px] font-bold">
              PF-119
            </span>
            <span className="text-xs text-slate-400 font-medium">Operations Console</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Provider Network Operations &amp; Payout Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Wellness network fleet management, KYC compliance verification, geofenced facility gates, and per-visit settlement rates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchProviders}
            disabled={loading}
            className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh network fleet"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#28D17C]" : ""}`} />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B1F33] hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-[#28D17C]" />
            <span>Onboard Provider Network</span>
          </button>
        </div>
      </div>

      {/* 4-KPI Fleet Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Provider Network Fleet */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Provider Partners</span>
            <Network className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">{totalProviders}</span>
            <span className="text-xs text-emerald-600 font-medium font-mono">({activeProviders} Active)</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Pending KYC: {inReviewProviders}</span>
            <span>Suspended: {telemetry?.suspendedProviders || 0}</span>
          </div>
        </div>

        {/* KPI 2: Certified Facilities & Maintenance */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Facility Venues</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">{totalLocations}</span>
            <span className="text-xs text-slate-500 font-medium">Locations</span>
          </div>
          <div className="text-[11px] flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-emerald-600 font-medium">
              {totalLocations - maintenanceLocations} Operational
            </span>
            {maintenanceLocations > 0 ? (
              <span className="text-amber-600 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {maintenanceLocations} Maint. Mode
              </span>
            ) : (
              <span className="text-slate-400">0 Maintenance</span>
            )}
          </div>
        </div>

        {/* KPI 3: Today's Network Visits */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Today&apos;s Velocity</span>
            <Radio className="w-4 h-4 text-[#28D17C] animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">{todayVisits}</span>
            <span className="text-xs text-slate-500 font-medium">Verified Visits</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Biometric / TOTP QR</span>
            <span className="text-emerald-600 font-medium">Real-Time Sync</span>
          </div>
        </div>

        {/* KPI 4: MTD Gross Settlements */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">MTD Settlements</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {formatCurrencyDisplay(mtdSettlementRwf)}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Provider Payout Pool</span>
            <span className="font-mono text-slate-600 font-semibold">MTN MoMo + Wire</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search provider, branch venue, tax TIN, contact email..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#28D17C]/20 focus:border-[#28D17C] text-slate-800 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by Category"
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#28D17C]/20 focus:border-[#28D17C]"
          >
            <option value="all">All Categories</option>
            <option value="gym">Gym &amp; Fitness</option>
            <option value="studio">Yoga &amp; Pilates Studio</option>
            <option value="pool">Olympic &amp; Aquatic Pool</option>
            <option value="clinic">Physiotherapy Clinic</option>
            <option value="wellness_center">Wellness Center &amp; Spa</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by Status"
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#28D17C]/20 focus:border-[#28D17C]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Certified</option>
            <option value="pending_review">Pending Review</option>
            <option value="in_review">In Review</option>
            <option value="contract_pending">Contract Pending</option>
            <option value="suspended">Suspended</option>
          </select>

          {/* City Filter */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            aria-label="Filter by City"
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#28D17C]/20 focus:border-[#28D17C]"
          >
            <option value="all">All Territories</option>
            {uniqueCities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Provider Network Data Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-[#28D17C]" />
            <span className="text-xs font-medium">Loading provider telemetry...</span>
          </div>
        ) : error ? (
          <div className="p-10 flex flex-col items-center justify-center gap-2 text-rose-600">
            <AlertTriangle className="w-6 h-6" />
            <span className="text-xs font-semibold">{error}</span>
            <button
              onClick={fetchProviders}
              className="mt-2 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100"
            >
              Retry
            </button>
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">No wellness providers match criteria</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Adjust search queries or onboarding filters to inspect the fleet.
              </p>
            </div>
            {(searchQuery || statusFilter !== "all" || categoryFilter !== "all" || cityFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setCategoryFilter("all");
                  setCityFilter("all");
                }}
                className="text-xs text-[#28D17C] hover:underline font-semibold"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Provider Trade Entity</th>
                  <th className="py-3 px-4">Facility Branches</th>
                  <th className="py-3 px-4">KYC Compliance</th>
                  <th className="py-3 px-4">Negotiated Rate</th>
                  <th className="py-3 px-4">Visits Velocity</th>
                  <th className="py-3 px-4">MTD Accrued Payout</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProviders.map((provider) => {
                  const catBadge = getCategoryBadge(provider.category);
                  const isMaintenance = provider.maintenance_location_count > 0;

                  return (
                    <tr
                      key={provider.id}
                      onClick={() => handleOpenDossier(provider.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Column 1: Trade Entity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-200 group-hover:border-emerald-300 transition-colors">
                            {catBadge.icon}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                              {provider.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${catBadge.color}`}>
                                {catBadge.label}
                              </span>
                              {provider.tax_id && (
                                <span className="font-mono text-[10px] text-slate-400">
                                  TIN: {provider.tax_id}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Branches */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {provider.location_count} {provider.location_count === 1 ? "Location" : "Locations"}
                            </span>
                            <span className="text-[10px] text-slate-400">({provider.primary_city})</span>
                          </div>
                          {isMaintenance ? (
                            <div className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                              <span>{provider.maintenance_location_count} in maintenance mode</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                              All {provider.location_count} active &amp; geofenced
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Column 3: KYC Status */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {getStatusBadge(provider.status)}
                          <div className="text-[10px] text-slate-400">
                            {provider.kyc_status === "approved"
                              ? "RDB & Tax Verified"
                              : provider.kyc_status === "revision_requested"
                              ? "Action Required"
                              : "Docs in Review"}
                          </div>
                        </div>
                      </td>

                      {/* Column 4: Negotiated Rate */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-mono font-bold text-slate-900">
                            {formatCurrencyDisplay(provider.per_visit_rate || 0)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Per verified visit
                          </div>
                        </div>
                      </td>

                      {/* Column 5: Visits Velocity */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono">
                          <div className="text-slate-900 font-bold flex items-center gap-1">
                            <span>{provider.today_visits} today</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {provider.mtd_visits} MTD visits
                          </div>
                        </div>
                      </td>

                      {/* Column 6: MTD Accrued Payout */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono">
                          <div className="text-emerald-700 font-bold">
                            {formatCurrencyDisplay(provider.mtd_payout_rwf || 0)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Settlement queue
                          </div>
                        </div>
                      </td>

                      {/* Column 7: Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDossier(provider.id);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-2xs"
                        >
                          <span>Dossier</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Onboarding Drawer Wizard */}
      <CreateProviderDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(newProvider) => {
          fetchProviders();
          if (newProvider?.id) {
            handleOpenDossier(newProvider.id);
          }
        }}
      />

      {/* 360-degree Dossier & Payout Matrix Drawer */}
      {selectedProviderId && (
        <ProviderDossierDrawer
          isOpen={!!selectedProviderId}
          onClose={handleCloseDossier}
          providerId={selectedProviderId}
          onProviderUpdated={fetchProviders}
        />
      )}
    </div>
  );
}

export default function ProviderNetworkPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-[#28D17C]" />
          <span className="text-xs font-medium">Loading Provider Operations Suite...</span>
        </div>
      }
    >
      <ProviderNetworkContent />
    </Suspense>
  );
}
