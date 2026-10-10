"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Activity,
  Zap,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Radio,
  Clock,
  Filter,
  Search,
  RefreshCw,
  Sliders,
  ExternalLink,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Building2,
  Network,
  User,
  MapPin,
  Sparkles,
  AlertTriangle,
  FileText,
  RotateCcw,
  QrCode,
  Smartphone,
  CreditCard,
  DoorOpen,
  ArrowUpRight,
  TrendingUp,
  Layers,
  ChevronRight
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";
import { useOperationsDrawer } from "@/contexts/OperationsDrawerContext";

interface AnomalyTag {
  type: string;
  severity: "warning" | "critical" | "info";
  label: string;
  detail: string;
  code?: string;
  minutesBetween?: number;
  kmDistance?: number;
  distanceMeters?: number;
}

interface OperationsVisit {
  id: string;
  check_in_at: string;
  check_out_at?: string | null;
  verification_method: string;
  status: string;
  totp_token_hash?: string | null;
  device_fingerprint?: string | null;
  geo_lat?: number | null;
  geo_lng?: number | null;
  metadata?: Record<string, any>;
  employees?: {
    id: string;
    full_name: string;
    email: string;
    tier: string;
    department: string;
    status: string;
  };
  organizations?: {
    id: string;
    name: string;
    status: string;
  };
  provider_locations?: {
    id: string;
    name: string;
    city: string;
    address: string;
    lat: number;
    lng: number;
    status: string;
    provider_id: string;
    providers?: {
      id: string;
      name: string;
      category: string;
      status: string;
    };
  };
  visit_disputes?: Array<{
    id: string;
    raised_by_role: string;
    reason: string;
    status: string;
    resolution_type?: string | null;
    resolution_notes?: string | null;
    created_at: string;
    resolved_at?: string | null;
  }>;
  anomalies?: AnomalyTag[];
  has_anomaly?: boolean;
}

interface TelemetryMetrics {
  todayVisits: number;
  todayVerified: number;
  todayPending: number;
  todayRejected: number;
  verifiedRate: number;
  activeDisputesCount: number;
  activeAnomaliesCount: number;
  turnstilesOnlineCount: number;
  latencyMs: number;
  gatewayNode: string;
  status: string;
}

function LiveVisitMonitorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openDrawer, openBypassModal, refreshKey } = useOperationsDrawer();

  // Active Tab
  const [activeTab, setActiveTab] = useState<"stream" | "clearinghouse" | "intelligence">("stream");

  // Telemetry & Visits Data
  const [visits, setVisits] = useState<OperationsVisit[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryMetrics>({
    todayVisits: 0,
    todayVerified: 0,
    todayPending: 0,
    todayRejected: 0,
    verifiedRate: 100,
    activeDisputesCount: 0,
    activeAnomaliesCount: 0,
    turnstilesOnlineCount: 108,
    latencyMs: 142,
    gatewayNode: "Kigali Gateway Node (KG-OPS-01)",
    status: "nominal",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stream Controls
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [anomalyOnly, setAnomalyOnly] = useState(false);

  // Web Audio Synthesized Chime for Anomalies
  const playAnomalyChime = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.15); // A4
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // AudioContext unavailable or blocked by autoplay
    }
  };

  // Fetch telemetry and visits feed
  const fetchVisits = async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (methodFilter !== "all") params.set("method", methodFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (anomalyOnly) params.set("anomaly_only", "true");
      params.set("limit", "100");

      const res = await apiFetch<any>(`/api/operations/visits?${params.toString()}`);
      if (res?.visits && Array.isArray(res.visits)) {
        setVisits(res.visits);
      }
      if (res?.telemetry) {
        setTelemetry(res.telemetry);
      }
    } catch (err: any) {
      console.warn("[LiveVisitMonitor] Fetch error:", err.message);
      setError("Unable to sync telemetry stream. Reconnecting...");
    } finally {
      setLoading(false);
    }
  };

  // Initial load & Polling fallback every 12 seconds
  useEffect(() => {
    fetchVisits();

    const interval = setInterval(() => {
      if (!isPaused) {
        fetchVisits();
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [isPaused, methodFilter, statusFilter, anomalyOnly, searchQuery, refreshKey]);

  // Supabase Realtime channel subscription for instant check-in events
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("operations-visits-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "visits" },
        (payload: any) => {
          if (isPaused) return;

          if (payload.eventType === "INSERT") {
            // Refetch visits or prepend
            fetchVisits();
            playAnomalyChime();
          } else if (payload.eventType === "UPDATE") {
            fetchVisits();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isPaused, soundEnabled]);

  // Filtered visits in memory for instantaneous search response
  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      if (methodFilter !== "all" && v.verification_method !== methodFilter) return false;
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      if (anomalyOnly && !v.has_anomaly) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const emp = v.employees?.full_name?.toLowerCase() || "";
        const email = v.employees?.email?.toLowerCase() || "";
        const org = v.organizations?.name?.toLowerCase() || "";
        const loc = v.provider_locations?.name?.toLowerCase() || "";
        const prov = v.provider_locations?.providers?.name?.toLowerCase() || "";
        const id = v.id.toLowerCase();
        return (
          emp.includes(q) ||
          email.includes(q) ||
          org.includes(q) ||
          loc.includes(q) ||
          prov.includes(q) ||
          id.includes(q)
        );
      }
      return true;
    });
  }, [visits, methodFilter, statusFilter, anomalyOnly, searchQuery]);

  // Disputes list for Clearinghouse Tab
  const disputedVisits = useMemo(() => {
    return visits.filter(
      (v) => v.status === "disputed" || (v.visit_disputes && v.visit_disputes.length > 0)
    );
  }, [visits]);

  // Format relative timestamp
  const formatRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 10) return "just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return new Date(isoString).toLocaleDateString();
  };

  const renderMethodBadge = (method: string) => {
    switch (method) {
      case "totp_qr":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[10px] font-mono">
            <QrCode className="w-3 h-3" />
            <span>TOTP QR</span>
          </span>
        );
      case "turnstile":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/15 text-[#28D17C] border border-[#28D17C]/30 text-[10px] font-mono">
            <DoorOpen className="w-3 h-3" />
            <span>TURNSTILE</span>
          </span>
        );
      case "manual":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
            <Smartphone className="w-3 h-3" />
            <span>MANUAL OVERRIDE</span>
          </span>
        );
      case "nfc":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono">
            <CreditCard className="w-3 h-3" />
            <span>NFC PASS</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-mono">
            <span>{method}</span>
          </span>
        );
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#28D17C]/20 text-[#28D17C] border border-[#28D17C]/30 font-bold text-[10px] tracking-wide">
            <CheckCircle2 className="w-3 h-3" />
            <span>VERIFIED</span>
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-[10px] tracking-wide">
            <Clock className="w-3 h-3" />
            <span>PENDING 20M</span>
          </span>
        );
      case "disputed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold text-[10px] tracking-wide">
            <AlertTriangle className="w-3 h-3" />
            <span>DISPUTED</span>
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-[10px] tracking-wide">
            <XCircle className="w-3 h-3" />
            <span>REJECTED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── 1. Command Header & Real-Time Controls ─── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0B1F33] flex items-center gap-2">
              <Activity className="w-6 h-6 text-[#28D17C]" />
              <span>Real-Time Visit Monitor & Access Control</span>
            </h1>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#E9FAF2] text-[#008A4B] font-semibold border border-[#B7F1D2] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#28D17C] animate-pulse" />
              <span>LIVE</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time telemetry stream, automated anti-fraud anomaly engine & dispute clearinghouse across Kigali, Musanze & Nairobi.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Gateway Status Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0E263E] border border-[#21405A] text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#28D17C] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#28D17C]"></span>
            </span>
            <span className="text-slate-300 font-mono text-[11px]">{telemetry.gatewayNode}</span>
          </div>

          {/* Sound Alert Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1.5 ${
              soundEnabled
                ? "bg-[#28D17C]/20 text-[#28D17C] border-[#28D17C]/40"
                : "bg-[#142C44] text-slate-400 border-[#21405A] hover:text-white"
            }`}
            title={soundEnabled ? "Mute Anomaly Chimes" : "Enable Anomaly Sound Alerts"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">{soundEnabled ? "Audio On" : "Muted"}</span>
          </button>

          {/* Stream Pause / Play Toggle */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-2 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1.5 ${
              isPaused
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-[#142C44] text-slate-300 border-[#21405A] hover:text-white"
            }`}
            title={isPaused ? "Resume Live Telemetry Stream" : "Pause Stream (Freeze View)"}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span className="hidden md:inline">{isPaused ? "Stream Paused" : "Stream Active"}</span>
          </button>

          {/* 1-Click Turnstile Emergency Bypass CTA */}
          <button
            onClick={() => openBypassModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] font-bold text-xs transition-colors shadow-sm"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Emergency Turnstile Pass</span>
          </button>
        </div>
      </div>

      {/* ─── 2. Metric Telemetry Ribbon ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#0B1F33] border border-[#21405A] space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Today's Visits</span>
          <div className="font-mono text-xl font-bold text-white flex items-center gap-1.5">
            <span>{telemetry.todayVisits}</span>
            <span className="text-[10px] font-normal text-[#28D17C]">({telemetry.todayVerified} OK)</span>
          </div>
          <span className="text-[10px] text-slate-500 block truncate">Kigali & regional network</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0B1F33] border border-[#21405A] space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Integrity Rate</span>
          <div className="font-mono text-xl font-bold text-[#28D17C]">
            {telemetry.verifiedRate}%
          </div>
          <span className="text-[10px] text-slate-500 block">Cryptographic TOTP match</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0B1F33] border border-[#21405A] space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Pending 20m</span>
          <div className="font-mono text-xl font-bold text-amber-400">
            {telemetry.todayPending}
          </div>
          <span className="text-[10px] text-slate-500 block">Awaiting facility checkout</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0B1F33] border border-[#21405A] space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Active Anomalies</span>
          <div className={`font-mono text-xl font-bold ${telemetry.activeAnomaliesCount > 0 ? "text-rose-400" : "text-slate-300"}`}>
            {telemetry.activeAnomaliesCount}
          </div>
          <span className="text-[10px] text-slate-500 block">Passback & velocity flags</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0B1F33] border border-[#21405A] space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Open Disputes</span>
          <div className={`font-mono text-xl font-bold ${telemetry.activeDisputesCount > 0 ? "text-purple-400" : "text-slate-300"}`}>
            {telemetry.activeDisputesCount}
          </div>
          <span className="text-[10px] text-slate-500 block">Awaiting ops triage</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0B1F33] border border-[#21405A] space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">IoT Turnstiles</span>
          <div className="font-mono text-xl font-bold text-[#00D2B4] flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-[#00D2B4]" />
            <span>{telemetry.turnstilesOnlineCount}</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Active hardware gateways</span>
        </div>
      </div>

      {/* ─── 3. Navigation Tabs & Mode Switcher ─── */}
      <div className="flex items-center justify-between border-b border-[#21405A] text-xs">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab("stream")}
            className={`px-4 py-3 font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "stream"
                ? "border-[#28D17C] text-[#28D17C]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Live Telemetry Stream</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
              {filteredVisits.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("clearinghouse")}
            className={`px-4 py-3 font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "clearinghouse"
                ? "border-[#28D17C] text-[#28D17C]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Dispute Clearinghouse</span>
            {disputedVisits.length > 0 && (
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                {disputedVisits.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("intelligence")}
            className={`px-4 py-3 font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "intelligence"
                ? "border-[#28D17C] text-[#28D17C]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Fraud & Velocity Intelligence</span>
            {telemetry.activeAnomaliesCount > 0 && (
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                {telemetry.activeAnomaliesCount}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={fetchVisits}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ─── TAB 1: LIVE VISIT STREAM ─── */}
      {activeTab === "stream" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#0B1F33] border border-[#21405A] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search beneficiary, email, corporate client, facility, or visit ref..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#142C44] border border-[#21405A] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#28D17C]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Method Filter */}
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#142C44] border border-[#21405A] text-slate-200 text-xs focus:outline-none focus:border-[#28D17C]"
              >
                <option value="all">All Methods</option>
                <option value="totp_qr">TOTP Dynamic QR</option>
                <option value="turnstile">Turnstile Relay</option>
                <option value="manual">Manual Override</option>
                <option value="nfc">NFC Pass</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#142C44] border border-[#21405A] text-slate-200 text-xs focus:outline-none focus:border-[#28D17C]"
              >
                <option value="all">All Statuses</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending 20m</option>
                <option value="disputed">Disputed</option>
                <option value="rejected">Rejected</option>
              </select>

              {/* Anomaly Only Toggle */}
              <button
                onClick={() => setAnomalyOnly(!anomalyOnly)}
                className={`px-3 py-2 rounded-xl border font-semibold text-xs transition-colors flex items-center gap-1.5 ${
                  anomalyOnly
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    : "bg-[#142C44] text-slate-300 border-[#21405A] hover:text-white"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Anomalies Only</span>
              </button>
            </div>
          </div>

          {/* Visits Table & Mobile Feed */}
          <div className="rounded-2xl bg-[#0B1F33] border border-[#21405A] overflow-hidden shadow-xl">
            {/* Mobile Card Feed (sm:hidden) */}
            <div className="sm:hidden divide-y divide-[#21405A]">
              {loading && visits.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Activity className="w-6 h-6 animate-spin text-[#28D17C] mx-auto mb-2" />
                  <span className="text-xs">Initializing live telemetry stream from Kigali Gateway...</span>
                </div>
              ) : filteredVisits.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-1">
                  <ShieldCheck className="w-8 h-8 text-slate-500 mx-auto mb-1" />
                  <span className="block font-semibold text-slate-300 text-xs">No visits match filters.</span>
                  <span className="text-[10px] text-slate-500">Adjust search criteria or status.</span>
                </div>
              ) : (
                filteredVisits.map((v) => {
                  const emp = v.employees;
                  const org = v.organizations;
                  const loc = v.provider_locations;
                  const prov = loc?.providers;

                  return (
                    <div
                      key={v.id}
                      onClick={() => openDrawer("visit", v.id, v, "Visit Inspection")}
                      className="p-4 active:bg-[#122A42] transition-colors space-y-2.5 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#142C44] border border-[#21405A] flex items-center justify-center font-bold text-xs text-[#28D17C] shrink-0">
                            {emp?.full_name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (emp?.id) openDrawer("employee", emp.id, emp, emp.full_name);
                              }}
                              className="font-bold text-white text-xs hover:text-[#28D17C] text-left block"
                            >
                              {emp?.full_name || "Beneficiary"}
                            </button>
                            <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                              {emp?.email}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-mono text-white text-[10px] font-semibold">
                            {formatRelativeTime(v.check_in_at)}
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono">
                            {new Date(v.check_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#0E263E] p-2.5 rounded-xl border border-[#21405A]">
                        <div>
                          <div className="text-[9px] text-slate-400 uppercase font-semibold">Employer</div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (org?.id) openDrawer("organization", org.id, org, org.name);
                            }}
                            className="font-semibold text-slate-200 hover:text-[#28D17C] flex items-center gap-1 mt-0.5 text-left truncate max-w-[130px]"
                          >
                            <Building2 className="w-3 h-3 text-indigo-400 shrink-0" />
                            <span className="truncate">{org?.name || "Corporate"}</span>
                          </button>
                        </div>

                        <div>
                          <div className="text-[9px] text-slate-400 uppercase font-semibold">Venue</div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (prov?.id) openDrawer("provider", prov.id, prov, prov.name);
                            }}
                            className="font-semibold text-slate-200 hover:text-[#28D17C] flex items-center gap-1 mt-0.5 text-left truncate max-w-[130px]"
                          >
                            <Network className="w-3 h-3 text-teal-400 shrink-0" />
                            <span className="truncate">{loc?.name || "Facility"}</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {renderMethodBadge(v.verification_method)}
                          {renderStatusBadge(v.status)}
                          {v.anomalies?.map((ano, idx) => (
                            <span
                              key={idx}
                              className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold font-mono border ${
                                ano.severity === "critical"
                                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                  : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              }`}
                            >
                              {ano.label}
                            </span>
                          ))}
                        </div>

                        <span className="text-[10px] text-[#28D17C] font-semibold inline-flex items-center gap-0.5">
                          Inspect <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#0E263E] border-b border-[#21405A] text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Beneficiary</th>
                    <th className="py-3 px-4">Corporate Client</th>
                    <th className="py-3 px-4">Provider Venue</th>
                    <th className="py-3 px-4">Verification Method</th>
                    <th className="py-3 px-4">Status & Anomalies</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#21405A]/70">
                  {loading && visits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Activity className="w-6 h-6 animate-spin text-[#28D17C] mx-auto mb-2" />
                        <span>Initializing live telemetry stream from Kigali Gateway...</span>
                      </td>
                    </tr>
                  ) : filteredVisits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <ShieldCheck className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                        <span className="block font-semibold text-slate-300">No visits matched the selected filters.</span>
                        <span className="text-[11px] text-slate-500">Try loosening search criteria or switching status.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredVisits.map((v) => {
                      const emp = v.employees;
                      const org = v.organizations;
                      const loc = v.provider_locations;
                      const prov = loc?.providers;

                      return (
                        <tr
                          key={v.id}
                          className="hover:bg-[#122A42] transition-colors group cursor-pointer"
                          onClick={() => openDrawer("visit", v.id, v, "Visit Inspection")}
                        >
                          {/* Timestamp */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-mono text-white text-[11px] font-semibold">
                              {formatRelativeTime(v.check_in_at)}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {new Date(v.check_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </td>

                          {/* Beneficiary */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-[#142C44] border border-[#21405A] flex items-center justify-center font-bold text-xs text-[#28D17C] shrink-0">
                                {emp?.full_name?.charAt(0) || "U"}
                              </div>
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (emp?.id) openDrawer("employee", emp.id, emp, emp.full_name);
                                  }}
                                  className="font-bold text-white truncate group-hover:text-[#28D17C] transition-colors flex items-center gap-1.5 text-left"
                                >
                                  <span>{emp?.full_name || "Employee"}</span>
                                  <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 font-normal">
                                    {emp?.tier || "STANDARD"}
                                  </span>
                                </button>
                                <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                                  {emp?.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Corporate Client (Zero-Silo link) */}
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (org?.id) {
                                  openDrawer("organization", org.id, org, org.name);
                                }
                              }}
                              className="text-left group/org hover:text-[#28D17C] transition-colors"
                            >
                              <div className="font-bold text-slate-200 group-hover/org:text-[#28D17C] flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span className="truncate max-w-[130px]">{org?.name || "Corporate Client"}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 block">PF-118 Contract</span>
                            </button>
                          </td>

                          {/* Provider Venue (Zero-Silo link) */}
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (prov?.id) {
                                  openDrawer("provider", prov.id, prov, prov.name);
                                }
                              }}
                              className="text-left group/prov hover:text-[#28D17C] transition-colors"
                            >
                              <div className="font-bold text-slate-200 group-hover/prov:text-[#28D17C] flex items-center gap-1">
                                <Network className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                                <span className="truncate max-w-[140px]">{loc?.name || "Facility"}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 block">
                                {prov?.name || "Provider"} • {loc?.city || "Kigali"}
                              </span>
                            </button>
                          </td>

                          {/* Verification Method */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {renderMethodBadge(v.verification_method)}
                          </td>

                          {/* Status & Anomaly Pills */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {renderStatusBadge(v.status)}

                              {/* Anomaly Badges */}
                              {v.anomalies?.map((ano, idx) => (
                                <span
                                  key={idx}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono border ${
                                    ano.severity === "critical"
                                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                      : ano.severity === "warning"
                                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                      : "bg-teal-500/20 text-teal-300 border-teal-500/40"
                                  }`}
                                  title={ano.detail}
                                >
                                  {ano.severity === "critical" ? (
                                    <ShieldAlert className="w-3 h-3" />
                                  ) : (
                                    <AlertTriangle className="w-3 h-3" />
                                  )}
                                  <span>{ano.label}</span>
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDrawer("visit", v.id, v, "Visit Inspection");
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-[#142C44] hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-[11px] transition-colors inline-flex items-center gap-1"
                            >
                              <span>Trace</span>
                              <ChevronRight className="w-3 h-3" />
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
        </div>
      )}

      {/* ─── TAB 2: DISPUTE ADJUDICATION CLEARINGHOUSE ─── */}
      {activeTab === "clearinghouse" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#0B1F33] border border-[#21405A] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Central Dispute Adjudication Queue</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review disputed visits raised by reception staff or employees. Tri-action overrides honor provider settlement, void visits, or execute split goodwill resolutions.
              </p>
            </div>
            <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40">
              {disputedVisits.length} Pending Adjudication
            </span>
          </div>

          {disputedVisits.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#0B1F33] border border-[#21405A] text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-[#28D17C] mx-auto" />
              <h4 className="font-bold text-white text-base">No Open Disputes in Queue</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                All check-in transactions across partner facilities are reconciled and undisputed. Incoming front-desk claims will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {disputedVisits.map((v) => {
                const dispute = v.visit_disputes?.[0];
                const emp = v.employees;
                const loc = v.provider_locations;
                const org = v.organizations;

                return (
                  <div
                    key={v.id}
                    className="p-5 rounded-2xl bg-[#0B1F33] border border-[#21405A] hover:border-purple-500/50 transition-colors space-y-4 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40">
                          DISPUTE REF: {v.id.substring(0, 8)}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatRelativeTime(v.check_in_at)}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-amber-400">
                        ~7,000 RWF Exposure
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0E263E] border border-[#21405A] space-y-1.5 text-xs">
                      <div className="text-slate-400 text-[10px] uppercase font-semibold flex items-center justify-between">
                        <span>Beneficiary & Employer</span>
                        <span className="text-white font-mono">{emp?.tier || "STANDARD"}</span>
                      </div>
                      <div className="font-bold text-white">{emp?.full_name} ({org?.name})</div>
                      <div className="text-slate-400 text-[11px]">Venue: <strong className="text-slate-200">{loc?.name}</strong></div>
                    </div>

                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs space-y-1">
                      <div className="text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                        Claim Reason ({dispute?.raised_by_role || "Provider"})
                      </div>
                      <p className="text-slate-200 italic">
                        "{dispute?.reason || "Front desk reported check-in scanner mismatch."}"
                      </p>
                    </div>

                    <div className="pt-1 flex items-center justify-end gap-2">
                      <button
                        onClick={() => openDrawer("visit", v.id, v, "Visit Adjudication")}
                        className="px-4 py-2 rounded-xl bg-[#142C44] hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
                      >
                        Open Full Adjudication Workspace
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: FRAUD & VELOCITY INTELLIGENCE ─── */}
      {activeTab === "intelligence" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#0B1F33] border border-[#21405A] space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <RotateCcw className="w-4 h-4" />
                <span>Anti-Passback Violations</span>
              </div>
              <div className="font-mono text-3xl font-extrabold text-white">
                {visits.filter((v) => v.anomalies?.some((a) => a.type === "anti_passback")).length}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Check-in attempts blocked within the 180-minute cooldown window at the same partner facility.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0B1F33] border border-[#21405A] space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Zap className="w-4 h-4" />
                <span>Impossible Velocity Jumps</span>
              </div>
              <div className="font-mono text-3xl font-extrabold text-white">
                {visits.filter((v) => v.anomalies?.some((a) => a.type === "velocity_anomaly")).length}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Instances where check-ins occurred across venues &gt;40km apart within less than 60 minutes.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0B1F33] border border-[#21405A] space-y-2">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
                <MapPin className="w-4 h-4" />
                <span>Geofence Deviations</span>
              </div>
              <div className="font-mono text-3xl font-extrabold text-white">
                {visits.filter((v) => v.anomalies?.some((a) => a.type === "outside_geofence")).length}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Scans initiated with mobile GPS coordinates &gt;500 meters outside facility boundary.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0B1F33] border border-[#21405A] space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#28D17C]" />
              <span>Real-Time Anomaly Rule Engine Directives</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-[#0E263E] border border-[#21405A] space-y-1">
                <strong className="text-white block">Rule 1: 180-Minute Cooldown Guarantee</strong>
                <span className="text-slate-400 leading-relaxed">
                  Employees cannot scan into the same gym or studio twice within 3 hours. Cooldown applies network-wide to prevent gym card lending or buddy check-ins.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0E263E] border border-[#21405A] space-y-1">
                <strong className="text-white block">Rule 2: PostGIS Geofence Verification</strong>
                <span className="text-slate-400 leading-relaxed">
                  Every dynamic TOTP access code generated in the employee mobile app is bound to the facility polygon. Remote check-ins from office or home are denied.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OperationsVisitsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading Live Visit Monitor...</div>}>
      <LiveVisitMonitorContent />
    </Suspense>
  );
}
