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
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  Phone,
  Mail,
  X,
  Check,
  Edit3
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { formatCurrencyDisplay } from "@/lib/utils";
import { useOperationsDrawer } from "@/contexts/OperationsDrawerContext";
import { CreateProviderDrawer } from "@/components/operations/drawers/CreateProviderDrawer";

interface AmendmentRequestItem {
  id: string;
  providerId: string;
  providerName: string;
  category: string;
  providerStatus: string;
  contractId: string | null;
  requestType: string;
  currentRate: number;
  requestedRate: number;
  deltaAmount: number;
  deltaPercentage: number;
  justification: string;
  contactPhone: string | null;
  contactEmail: string | null;
  status: string; // 'pending' | 'approved' | 'rejected' | 'counter_offered'
  reviewedBy: string | null;
  reviewedAt: string | null;
  adminNotes: string | null;
  counterOfferRate: number | null;
  createdAt: string;
}

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
  contactEmail?: string | null;
  contact_email?: string | null;
  settlementEmail?: string | null;
  settlement_email?: string | null;
  taxId?: string | null;
  tax_id?: string | null;
  status: string;
  created_at?: string;
  createdAt?: string;
  location_count?: number;
  locationsCount?: number;
  active_location_count?: number;
  maintenance_location_count?: number;
  hasActiveMaintenance?: boolean;
  primary_city?: string;
  primaryCity?: string;
  primaryLocation?: string;
  primaryAddress?: string;
  locations?: ProviderLocationItem[];
  kyc_status?: string;
  kycCompliance?: { status?: string };
  per_visit_rate?: number;
  primaryPayoutRate?: number;
  today_visits?: number;
  todayVisitsCount?: number;
  mtd_visits?: number;
  mtdVisitsCount?: number;
  mtd_payout_rwf?: number;
  estimatedMtdGrossRwf?: number;
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

  // Drawers & Operations Context
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { openDrawer, refreshKey } = useOperationsDrawer();

  // Tab state: "fleet" | "amendments"
  const [activeTab, setActiveTab] = useState<"fleet" | "amendments">(() => 
    searchParams.get("tab") === "amendments" ? "amendments" : "fleet"
  );

  // Rate Amendments State
  const [amendments, setAmendments] = useState<AmendmentRequestItem[]>([]);
  const [amendmentsLoading, setAmendmentsLoading] = useState(false);
  const [amendmentsStatusFilter, setAmendmentsStatusFilter] = useState("all");
  const [amendmentsSearchQuery, setAmendmentsSearchQuery] = useState("");
  const [amendmentsCounts, setAmendmentsCounts] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    counterOffered: 0
  });
  const [processingAmendmentId, setProcessingAmendmentId] = useState<string | null>(null);
  const [amendmentFeedback, setAmendmentFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [counterModal, setCounterModal] = useState<{
    isOpen: boolean;
    req: AmendmentRequestItem | null;
    rate: string;
    notes: string;
    error?: string | null;
  }>({ isOpen: false, req: null, rate: "", notes: "", error: null });

  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean;
    req: AmendmentRequestItem | null;
    notes: string;
  }>({ isOpen: false, req: null, notes: "" });

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

  const fetchAmendments = async () => {
    setAmendmentsLoading(true);
    try {
      const params = new URLSearchParams();
      if (amendmentsStatusFilter !== "all") params.append("status", amendmentsStatusFilter);
      if (amendmentsSearchQuery.trim()) params.append("search", amendmentsSearchQuery.trim());
      params.append("limit", "100");

      const res = await apiFetch<any>(`/api/operations/amendment-requests?${params.toString()}`);
      if (res && Array.isArray(res.data)) {
        setAmendments(res.data);
        if (res.counts) setAmendmentsCounts(res.counts);
      }
    } catch (err: any) {
      console.error("[ProviderNetworkPage] Fetch amendments error:", err);
    } finally {
      setAmendmentsLoading(false);
    }
  };

  const handleAdjudicateAmendment = async (
    requestId: string,
    action: "approved" | "rejected" | "counter_offered",
    notes?: string,
    counterRate?: number
  ) => {
    setProcessingAmendmentId(requestId);
    setAmendmentFeedback(null);
    try {
      const payload: any = { action };
      if (notes) payload.admin_notes = notes;
      if (counterRate) payload.counter_offer_rate = counterRate;

      await apiFetch<any>(`/api/operations/amendment-requests/${requestId}/adjudicate`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });

      setAmendmentFeedback({
        type: "success",
        message: `Amendment request marked as ${action.toUpperCase()}`
      });
      setTimeout(() => setAmendmentFeedback(null), 4000);
      fetchAmendments();
      fetchProviders();
    } catch (err: any) {
      setAmendmentFeedback({
        type: "error",
        message: "Failed to adjudicate rate amendment: " + (err?.message || "Unknown error")
      });
    } finally {
      setProcessingAmendmentId(null);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [refreshKey]);

  useEffect(() => {
    fetchAmendments();
  }, [refreshKey, amendmentsStatusFilter]);

  // Deep-linking: sync URL query param `?id=...` and `?tab=...`
  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam) {
      openDrawer("provider", idParam);
    }
    const tabParam = searchParams.get("tab");
    if (tabParam === "amendments") {
      setActiveTab("amendments");
    }
  }, [searchParams, openDrawer]);

  const handleOpenDossier = (providerId: string) => {
    openDrawer("provider", providerId);
  };

  // Filtered Providers computation
  const filteredProviders = useMemo(() => {
    return (providers || []).filter((prov) => {
      const provLocations = prov.locations || [];
      // 1. Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = prov.name?.toLowerCase().includes(q);
        const matchesCategory = prov.category?.toLowerCase().includes(q);
        const matchesTax = (prov.tax_id || prov.taxId)?.toLowerCase().includes(q);
        const matchesEmail = (prov.contact_email || prov.contactEmail)?.toLowerCase().includes(q) || 
                             (prov.settlement_email || prov.settlementEmail)?.toLowerCase().includes(q);
        const matchesCity = (prov.primary_city || prov.primaryCity)?.toLowerCase().includes(q);
        const matchesLocation = provLocations.some(
          (l) => l.name?.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q) || l.address?.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesCategory && !matchesTax && !matchesEmail && !matchesCity && !matchesLocation) {
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
        const primaryCityMatch = (prov.primary_city || prov.primaryCity || "").toLowerCase() === cityFilter.toLowerCase();
        const hasCity = provLocations.some(
          (l) => l.city && l.city.toLowerCase() === cityFilter.toLowerCase()
        );
        if (!primaryCityMatch && !hasCity) return false;
      }

      return true;
    });
  }, [providers, searchQuery, statusFilter, categoryFilter, cityFilter]);

  // Unique cities list for filter dropdown
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    (providers || []).forEach((p) => {
      if (p.primary_city) set.add(p.primary_city);
      if (p.primaryCity) set.add(p.primaryCity);
      (p.locations || []).forEach((l) => {
        if (l?.city) set.add(l.city);
      });
    });
    return Array.from(set).filter(Boolean).sort();
  }, [providers]);

  // Derived Telemetry fallbacks
  const totalProviders = telemetry?.totalProviders ?? (providers || []).length;
  const activeProviders = telemetry?.activeProviders ?? (providers || []).filter((p) => p.status === "active").length;
  const inReviewProviders = telemetry?.inReviewProviders ?? (providers || []).filter((p) => p.status === "pending_review" || p.status === "in_review").length;
  const totalLocations = telemetry?.totalLocations ?? (providers || []).reduce((acc, p) => acc + (p.location_count ?? p.locationsCount ?? (p.locations?.length || 1)), 0);
  const maintenanceLocations = telemetry?.maintenanceLocations ?? (providers || []).reduce((acc, p) => acc + (p.maintenance_location_count ?? (p.hasActiveMaintenance ? 1 : 0)), 0);
  const todayVisits = telemetry?.todayNetworkVisits ?? (providers || []).reduce((acc, p) => acc + (p.today_visits ?? p.todayVisitsCount ?? 0), 0);
  const mtdSettlementRwf = telemetry?.networkGrossPayoutMtdRwf ?? (providers || []).reduce((acc, p) => acc + (p.mtd_payout_rwf ?? p.estimatedMtdGrossRwf ?? 0), 0);

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
            <span className="px-2 py-0.5 rounded-full bg-[#28D17C]/15 text-[#156d41] font-semibold text-[11px]">
              Partner Network Fleet
            </span>
            <span className="text-xs text-slate-400 font-medium">• KYC &amp; Rate Cards</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Provider Network Operations &amp; Payout Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Wellness network fleet management, KYC compliance verification, geofenced facility gates, and partner rate amendments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (activeTab === "fleet") fetchProviders();
              else fetchAmendments();
            }}
            disabled={loading || amendmentsLoading}
            className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh current view"
          >
            <RefreshCw className={`w-4 h-4 ${(loading || amendmentsLoading) ? "animate-spin text-[#28D17C]" : ""}`} />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B1F33] hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#28D17C]" />
            <span>Onboard Provider Network</span>
          </button>
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("fleet")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "fleet"
              ? "bg-[#0B1F33] text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Wellness Fleet Registry</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
            {totalProviders}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("amendments")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "amendments"
              ? "bg-[#0B1F33] text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-amber-400" />
          <span>Rate Amendment Requests</span>
          <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            amendmentsCounts.pending > 0 
              ? "bg-amber-500 text-slate-950" 
              : "bg-slate-200 text-slate-700"
          }`}>
            {amendmentsCounts.pending > 0 ? `${amendmentsCounts.pending} Reviewing` : amendmentsCounts.total}
          </span>
        </button>
      </div>

      {activeTab === "fleet" && (
        <>
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
          <>
            {/* Mobile Card View (sm:hidden) */}
            <div className="sm:hidden divide-y divide-slate-100">
              {filteredProviders.map((provider) => {
                const catBadge = getCategoryBadge(provider.category);
                const isMaintenance = (provider.maintenance_location_count || 0) > 0 || Boolean(provider.hasActiveMaintenance);

                return (
                  <div
                    key={provider.id}
                    onClick={() => handleOpenDossier(provider.id)}
                    className="p-4 active:bg-slate-50 transition-colors space-y-3 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-base shrink-0 border border-slate-200">
                          {catBadge.icon}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {provider.name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${catBadge.color}`}>
                              {catBadge.label}
                            </span>
                            {(provider.tax_id || provider.taxId) && (
                              <span className="font-mono text-[10px] text-slate-400">
                                TIN: {provider.tax_id || provider.taxId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {getStatusBadge(provider.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Locations</div>
                        <div className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>
                            {provider.location_count ?? provider.locationsCount ?? (provider.locations?.length || 1)}{" "}
                            ({provider.primary_city || provider.primaryCity || "Kigali"})
                          </span>
                        </div>
                        {isMaintenance && (
                          <div className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            <span>Maintenance</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Payout Rate</div>
                        <div className="font-mono font-bold text-slate-900 mt-0.5">
                          {formatCurrencyDisplay(provider.per_visit_rate ?? provider.primaryPayoutRate ?? 0)}
                        </div>
                        <div className="text-[9px] text-slate-400">per verified visit</div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Visits Today / MTD</div>
                        <div className="font-mono font-semibold text-slate-900 mt-0.5">
                          {provider.today_visits ?? provider.todayVisitsCount ?? 0} / {provider.mtd_visits ?? provider.mtdVisitsCount ?? 0}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">MTD Accrued</div>
                        <div className="font-mono font-bold text-emerald-700 mt-0.5">
                          {formatCurrencyDisplay(provider.mtd_payout_rwf ?? provider.estimatedMtdGrossRwf ?? 0)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">Tap to inspect Dossier &amp; Payout Matrix</span>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold text-xs shadow-2xs"
                      >
                        <span>Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
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
                    const isMaintenance = (provider.maintenance_location_count || 0) > 0 || Boolean(provider.hasActiveMaintenance);

                    return (
                      <tr
                        key={provider.id}
                        onClick={() => handleOpenDossier(provider.id)}
                        className="pf-table-row-deferred hover:bg-slate-50/80 transition-colors cursor-pointer group"
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
                                {(provider.tax_id || provider.taxId) && (
                                  <span className="font-mono text-[10px] text-slate-400">
                                    TIN: {provider.tax_id || provider.taxId}
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
                                {provider.location_count ?? provider.locationsCount ?? (provider.locations?.length || 1)}{" "}
                                {(provider.location_count ?? provider.locationsCount ?? 1) === 1 ? "Location" : "Locations"}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ({provider.primary_city || provider.primaryCity || "Kigali"})
                              </span>
                            </div>
                            {isMaintenance ? (
                              <div className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                                <span>{provider.maintenance_location_count ?? 1} in maintenance mode</span>
                              </div>
                            ) : (
                              <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                                All {provider.location_count ?? provider.locationsCount ?? 1} active &amp; geofenced
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Column 3: KYC Status */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            {getStatusBadge(provider.status)}
                            <div className="text-[10px] text-slate-400">
                              {(provider.kyc_status || provider.kycCompliance?.status) === "approved"
                                ? "RDB & Tax Verified"
                                : (provider.kyc_status || provider.kycCompliance?.status) === "revision_requested"
                                ? "Action Required"
                                : "Docs in Review"}
                            </div>
                          </div>
                        </td>

                        {/* Column 4: Negotiated Rate */}
                        <td className="py-3.5 px-4">
                          <div>
                            <div className="font-mono font-bold text-slate-900">
                              {formatCurrencyDisplay(provider.per_visit_rate ?? provider.primaryPayoutRate ?? 0)}
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
                              <span>{provider.today_visits ?? provider.todayVisitsCount ?? 0} today</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {provider.mtd_visits ?? provider.mtdVisitsCount ?? 0} MTD visits
                            </div>
                          </div>
                        </td>

                        {/* Column 6: MTD Accrued Payout */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono">
                            <div className="text-emerald-700 font-bold">
                              {formatCurrencyDisplay(provider.mtd_payout_rwf ?? provider.estimatedMtdGrossRwf ?? 0)}
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
          </>
        )}
      </div>
      </>
      )}

      {/* Rate Amendment Requests Review Desk */}
      {activeTab === "amendments" && (
        <div className="space-y-6">
          {amendmentFeedback && (
            <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
              amendmentFeedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}>
              <div className="flex items-center gap-2">
                {amendmentFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{amendmentFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setAmendmentFeedback(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Top Amendments KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Total Amendment Inquiries</span>
                <DollarSign className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 font-mono">{amendmentsCounts.total}</span>
                <span className="text-xs text-slate-400">All submissions</span>
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                Rate adjustment requests submitted by partner facilities
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-amber-800 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Awaiting Adjudication</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-900 font-mono">{amendmentsCounts.pending}</span>
                <span className="text-xs text-amber-700 font-semibold">Requires Action</span>
              </div>
              <div className="text-[11px] text-amber-700 pt-1 border-t border-amber-200/60">
                Partner contracts awaiting operator rate decision
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-blue-800 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[10px]">In Negotiation</span>
                <MessageSquare className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-blue-900 font-mono">{amendmentsCounts.counterOffered}</span>
                <span className="text-xs text-blue-700 font-medium">Counter-Offered</span>
              </div>
              <div className="text-[11px] text-blue-700 pt-1 border-t border-blue-200/60">
                Counter-proposals sent to partner facilities
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-emerald-800 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Applied &amp; Contracted</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-900 font-mono">{amendmentsCounts.approved}</span>
                <span className="text-xs text-emerald-700 font-medium">Active Rates</span>
              </div>
              <div className="text-[11px] text-emerald-700 pt-1 border-t border-emerald-200/60">
                Updated rates live in check-in verification engine
              </div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search amendments by provider name, justification notes, phone, or email..."
                  value={amendmentsSearchQuery}
                  onChange={(e) => setAmendmentsSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchAmendments()}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#28D17C] focus:border-transparent"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold overflow-x-auto">
                {[
                  { id: "all", label: `All (${amendmentsCounts.total})` },
                  { id: "pending", label: `Pending (${amendmentsCounts.pending})` },
                  { id: "counter_offered", label: `Counter-Offered (${amendmentsCounts.counterOffered})` },
                  { id: "approved", label: `Approved (${amendmentsCounts.approved})` },
                  { id: "rejected", label: `Declined (${amendmentsCounts.rejected})` }
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setAmendmentsStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                      amendmentsStatusFilter === st.id
                        ? "bg-white text-slate-900 shadow-xs font-bold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Amendments Table */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            {amendmentsLoading ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#28D17C]" />
                <span className="text-xs">Loading rate amendment requests...</span>
              </div>
            ) : amendments.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <div className="text-sm font-semibold text-slate-700">No Rate Amendment Requests Found</div>
                <div className="text-xs text-slate-400 mt-1">
                  Partner renegotiation requests submitted from their portal desk will appear here.
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Provider Partner</th>
                      <th className="py-3 px-4">Rate Comparison</th>
                      <th className="py-3 px-4">Business Case &amp; Justification</th>
                      <th className="py-3 px-4">Partner Contact</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Adjudication</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {amendments.map((req) => {
                      const isPending = req.status === "pending";
                      const isCounter = req.status === "counter_offered";
                      const isApproved = req.status === "approved";
                      const isRejected = req.status === "rejected";

                      return (
                        <tr key={req.id} className="pf-table-row-deferred hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-xs">{req.providerName}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 text-slate-600">
                                {req.category}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Req: {req.requestType.replace("_", " ")}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-baseline gap-2">
                              <span className="text-slate-400 line-through font-mono text-[11px]">
                                {formatCurrencyDisplay(req.currentRate)}
                              </span>
                              <span className="font-bold font-mono text-xs text-slate-900">
                                {formatCurrencyDisplay(req.requestedRate)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`inline-flex items-center text-[10px] font-bold font-mono px-1.5 py-0.2 rounded ${
                                req.deltaAmount > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                              }`}>
                                {req.deltaAmount > 0 ? `+${formatCurrencyDisplay(req.deltaAmount)}` : formatCurrencyDisplay(req.deltaAmount)}
                                {" "}({req.deltaPercentage > 0 ? `+${req.deltaPercentage}%` : `${req.deltaPercentage}%`})
                              </span>
                            </div>
                            {req.counterOfferRate && (
                              <div className="mt-1 text-[11px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                Counter: {formatCurrencyDisplay(req.counterOfferRate)}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 max-w-xs">
                            <p className="text-[11px] text-slate-700 italic line-clamp-2">
                              "{req.justification || "No written justification provided"}"
                            </p>
                            {req.adminNotes && (
                              <div className="mt-1 text-[10px] text-slate-500 font-mono bg-slate-100 p-1 rounded">
                                Ops note: {req.adminNotes}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {req.contactPhone && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-700 font-mono">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{req.contactPhone}</span>
                              </div>
                            )}
                            {req.contactEmail && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{req.contactEmail}</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                              isApproved
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : isCounter
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : isRejected
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse"
                            }`}>
                              {req.status.replace("_", " ")}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-1.5">
                                {/* 1-Click Approve */}
                                <button
                                  type="button"
                                  onClick={() => handleAdjudicateAmendment(req.id, "approved", "Approved via Operations Clearinghouse")}
                                  disabled={processingAmendmentId === req.id}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Approve requested rate and update provider contract immediately"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Approve Rate</span>
                                </button>

                                {/* Counter-Offer */}
                                <button
                                  type="button"
                                  onClick={() => setCounterModal({
                                    isOpen: true,
                                    req,
                                    rate: String(Math.round((req.currentRate + req.requestedRate) / 2)),
                                    notes: "PolyFit benchmark counter-offer"
                                  })}
                                  disabled={processingAmendmentId === req.id}
                                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Offer a compromise rate"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Counter</span>
                                </button>

                                {/* Decline */}
                                <button
                                  type="button"
                                  onClick={() => setRejectModal({
                                    isOpen: true,
                                    req,
                                    notes: "Rate exceeds regional category cap"
                                  })}
                                  disabled={processingAmendmentId === req.id}
                                  className="px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-colors cursor-pointer"
                                  title="Decline amendment request"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400 font-mono">
                                {req.reviewedBy ? `Adjudicated by ${req.reviewedBy}` : "Processed"}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Counter-Offer Native Dialog Modal */}
          {counterModal.isOpen && counterModal.req && (
            <dialog
              open
              onCancel={(e) => {
                e.preventDefault();
                setCounterModal({ isOpen: false, req: null, rate: "", notes: "", error: null });
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setCounterModal({ isOpen: false, req: null, rate: "", notes: "", error: null });
                }
              }}
              className="fixed inset-0 m-0 p-4 w-full h-full max-w-none max-h-none bg-slate-950/60 backdrop:bg-slate-950/60 backdrop:backdrop-blur-xs z-50 flex items-center justify-center border-none outline-none"
            >
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">Counter-Offer Payout Rate</h3>
                  </div>
                  <button
                    onClick={() => setCounterModal({ isOpen: false, req: null, rate: "", notes: "", error: null })}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {counterModal.error && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {counterModal.error}
                  </div>
                )}

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <div className="font-bold text-slate-900">{counterModal.req.providerName}</div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Current Contract Rate:</span>
                      <strong className="font-mono text-slate-700">{formatCurrencyDisplay(counterModal.req.currentRate)}</strong>
                    </div>
                    <div className="flex items-center justify-between text-amber-800">
                      <span>Requested Rate:</span>
                      <strong className="font-mono">{formatCurrencyDisplay(counterModal.req.requestedRate)}</strong>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Counter-Offer Rate (RWF per visit)
                    </label>
                    <input
                      type="number"
                      value={counterModal.rate}
                      onChange={(e) => setCounterModal((prev) => ({ ...prev, rate: e.target.value, error: null }))}
                      placeholder="e.g. 4000"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Commercial Reasoning / Note to Partner
                    </label>
                    <textarea
                      value={counterModal.notes}
                      onChange={(e) => setCounterModal((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Explain the platform commercial benchmark..."
                      style={{ fieldSizing: "content" } as React.CSSProperties}
                      className="w-full pf-textarea-sm px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCounterModal({ isOpen: false, req: null, rate: "", notes: "", error: null })}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!counterModal.rate || Number(counterModal.rate) <= 0) {
                        setCounterModal((prev) => ({ ...prev, error: "Please enter a valid counter-offer rate greater than 0." }));
                        return;
                      }
                      handleAdjudicateAmendment(
                        counterModal.req!.id,
                        "counter_offered",
                        counterModal.notes,
                        Number(counterModal.rate)
                      );
                      setCounterModal({ isOpen: false, req: null, rate: "", notes: "", error: null });
                    }}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Submit Counter-Offer
                  </button>
                </div>
              </div>
            </dialog>
          )}

          {/* Rejection Native Dialog Modal */}
          {rejectModal.isOpen && rejectModal.req && (
            <dialog
              open
              onCancel={(e) => {
                e.preventDefault();
                setRejectModal({ isOpen: false, req: null, notes: "" });
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setRejectModal({ isOpen: false, req: null, notes: "" });
                }
              }}
              className="fixed inset-0 m-0 p-4 w-full h-full max-w-none max-h-none bg-slate-950/60 backdrop:bg-slate-950/60 backdrop:backdrop-blur-xs z-50 flex items-center justify-center border-none outline-none"
            >
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-rose-600">
                    <AlertTriangle className="w-4 h-4" />
                    <h3 className="text-sm font-bold text-slate-900">Decline Rate Amendment</h3>
                  </div>
                  <button
                    onClick={() => setRejectModal({ isOpen: false, req: null, notes: "" })}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <p className="text-slate-600">
                    Are you sure you want to decline the rate increase for <strong>{rejectModal.req.providerName}</strong> ({formatCurrencyDisplay(rejectModal.req.currentRate)} → {formatCurrencyDisplay(rejectModal.req.requestedRate)})?
                  </p>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Decline Reason &amp; Formal Feedback
                    </label>
                    <textarea
                      value={rejectModal.notes}
                      onChange={(e) => setRejectModal((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Specify decline rationale..."
                      style={{ fieldSizing: "content" } as React.CSSProperties}
                      className="w-full pf-textarea-sm px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setRejectModal({ isOpen: false, req: null, notes: "" })}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleAdjudicateAmendment(
                        rejectModal.req!.id,
                        "rejected",
                        rejectModal.notes || "Rate adjustment declined based on platform benchmarks"
                      );
                      setRejectModal({ isOpen: false, req: null, notes: "" });
                    }}
                    className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Confirm Decline
                  </button>
                </div>
              </div>
            </dialog>
          )}
        </div>
      )}

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
