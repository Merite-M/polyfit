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
    turnstilesOnlineCount: 0,
    latencyMs: 0,
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

  // Dedicated Dispute Clearinghouse State
  const [disputesList, setDisputesList] = useState<any[]>([]);
  const [loadingDisputes, setLoadingDisputes] = useState(false);
  const [disputeFilter, setDisputeFilter] = useState<"open" | "resolved" | "all">("open");
  const [adjudicatingId, setAdjudicatingId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Dedicated Real-Time Fraud & Anomaly Intelligence State
  const [securityAnomalies, setSecurityAnomalies] = useState<any[]>([]);
  const [anomaliesSummary, setAnomaliesSummary] = useState<any>({
    threat_index: "Low (0/100)",
    velocity_violations: 0,
    device_collisions: 0,
    passback_violations: 0,
    outside_geofence: 0,
    cooldown_violations: 0,
    active_anomalies: 0,
    total_scanned_window: 0,
  });
  const [loadingAnomalies, setLoadingAnomalies] = useState(false);
  const [anomalySeverityFilter, setAnomalySeverityFilter] = useState<"all" | "critical" | "warning">("all");
  const [anomalyTypeFilter, setAnomalyTypeFilter] = useState<string>("all");

  // Fetch live security anomalies from backend intelligence engine
  const fetchAnomalies = async () => {
    try {
      setLoadingAnomalies(true);
      const res = await apiFetch<any>(`/api/operations/security/anomalies`);
      if (res?.anomalies && Array.isArray(res.anomalies)) {
        setSecurityAnomalies(res.anomalies);
      }
      if (res?.summary) {
        setAnomaliesSummary(res.summary);
      }
    } catch (err: any) {
      console.warn("[Visits] Anomalies fetch error:", err.message);
    } finally {
      setLoadingAnomalies(false);
    }
  };

  // Fetch dispute queue directly from dedicated endpoint
  const fetchDisputes = async () => {
    try {
      setLoadingDisputes(true);
      const res = await apiFetch<any>(`/api/operations/visits/disputes?status=${disputeFilter}`);
      if (res?.disputes && Array.isArray(res.disputes)) {
        setDisputesList(res.disputes);
      }
    } catch (err: any) {
      console.warn("[Visits] Disputes fetch error:", err.message);
    } finally {
      setLoadingDisputes(false);
    }
  };

  // 1-Click Inline Dispute Adjudication
  const handleInlineAdjudicate = async (
    visitId: string,
    action: "force_validate" | "void" | "split_resolution",
    actionLabel: string
  ) => {
    try {
      setAdjudicatingId(visitId);
      const res = await apiFetch<any>(`/api/operations/visits/${visitId}/dispute/adjudicate`, {
        method: "PATCH",
        body: JSON.stringify({
          action,
          notes: `Resolution (${actionLabel}) approved by PolyFit Operations Desk.`
        })
      });
      if (res?.success) {
        setFeedbackToast({
          message: `Dispute resolved: ${actionLabel}.`,
          type: "success"
        });
        setTimeout(() => setFeedbackToast(null), 4000);
        fetchDisputes();
        fetchVisits();
      }
    } catch (err: any) {
      setFeedbackToast({
        message: err.message || "Failed to adjudicate dispute",
        type: "error"
      });
      setTimeout(() => setFeedbackToast(null), 5000);
    } finally {
      setAdjudicatingId(null);
    }
  };

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

  // Fetch disputes whenever switching to clearinghouse tab or changing filter
  useEffect(() => {
    if (activeTab === "clearinghouse") {
      fetchDisputes();
    }
  }, [activeTab, disputeFilter, refreshKey]);

  // Fetch security anomalies whenever switching to intelligence tab
  useEffect(() => {
    if (activeTab === "intelligence") {
      fetchAnomalies();
    }
  }, [activeTab, refreshKey]);


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
              <span>Visits &amp; Front-Desk Clearance</span>
            </h1>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#E9FAF2] text-[#008A4B] font-semibold border border-[#B7F1D2] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#28D17C] animate-pulse" />
              <span>LIVE</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time verified visits, front-desk dispute clearinghouse, and emergency clearance overrides.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Gateway Status Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#28D17C] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#28D17C]"></span>
            </span>
            <span className="text-slate-600 font-mono text-[11px]">{telemetry.gatewayNode}</span>
          </div>

          {/* Sound Alert Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              soundEnabled
                ? "bg-[#E9FAF2] text-[#008A4B] border-[#B7F1D2]"
                : "bg-white text-slate-600 border-slate-200 hover:text-[#0B1F33] hover:border-slate-300 shadow-xs"
            }`}
            title={soundEnabled ? "Mute Anomaly Chimes" : "Enable Anomaly Sound Alerts"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">{soundEnabled ? "Audio On" : "Muted"}</span>
          </button>

          {/* Stream Pause / Play Toggle */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-2 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              isPaused
                ? "bg-amber-50 text-amber-700 border-amber-300"
                : "bg-white text-slate-600 border-slate-200 hover:text-[#0B1F33] hover:border-slate-300 shadow-xs"
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
            <span>Issue Emergency Pass</span>
          </button>
        </div>
      </div>

      {/* ─── 2. Metric Telemetry Ribbon ─── */}
      <div className="@container grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1 hover:border-slate-300 transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Today's Visits</span>
          <div className="font-mono text-xl font-bold text-[#0B1F33] flex items-center gap-1.5">
            <span>{telemetry.todayVisits}</span>
            <span className="text-[10px] font-normal text-[#008A4B]">({telemetry.todayVerified} OK)</span>
          </div>
          <span className="text-[10px] text-slate-400 block truncate">Kigali &amp; regional network</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1 hover:border-slate-300 transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Integrity Rate</span>
          <div className="font-mono text-xl font-bold text-[#008A4B]">
            {telemetry.verifiedRate}%
          </div>
          <span className="text-[10px] text-slate-400 block">Cryptographic TOTP match</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1 hover:border-slate-300 transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending 20m</span>
          <div className="font-mono text-xl font-bold text-amber-600">
            {telemetry.todayPending}
          </div>
          <span className="text-[10px] text-slate-400 block">Awaiting facility checkout</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1 hover:border-slate-300 transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Anomalies</span>
          <div className={`font-mono text-xl font-bold ${telemetry.activeAnomaliesCount > 0 ? "text-rose-600" : "text-slate-700"}`}>
            {telemetry.activeAnomaliesCount}
          </div>
          <span className="text-[10px] text-slate-400 block">Passback &amp; velocity flags</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1 hover:border-slate-300 transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Open Disputes</span>
          <div className={`font-mono text-xl font-bold ${telemetry.activeDisputesCount > 0 ? "text-purple-600" : "text-slate-700"}`}>
            {telemetry.activeDisputesCount}
          </div>
          <span className="text-[10px] text-slate-400 block">Awaiting ops triage</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1 hover:border-slate-300 transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">IoT Turnstiles</span>
          <div className="font-mono text-xl font-bold text-teal-600 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>{telemetry.turnstilesOnlineCount}</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Active hardware gateways</span>
        </div>
      </div>

      {/* ─── 3. Navigation Tabs & Mode Switcher ─── */}
      <div className="flex items-center justify-between border-b border-slate-200 text-xs">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab("stream")}
            className={`px-4 py-3 font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "stream"
                ? "border-[#28D17C] text-[#0B1F33]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Activity className="w-4 h-4 text-[#008A4B]" />
            <span>Live Telemetry Stream</span>
            <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === "stream"
                ? "bg-[#E9FAF2] text-[#008A4B] border border-[#B7F1D2]"
                : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}>
              {filteredVisits.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("clearinghouse")}
            className={`px-4 py-3 font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "clearinghouse"
                ? "border-[#28D17C] text-[#0B1F33]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="w-4 h-4 text-purple-600" />
            <span>Dispute Clearinghouse</span>
            {disputedVisits.length > 0 && (
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-200">
                {disputedVisits.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("intelligence")}
            className={`px-4 py-3 font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "intelligence"
                ? "border-[#28D17C] text-[#0B1F33]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Fraud &amp; Velocity Intelligence</span>
            {telemetry.activeAnomaliesCount > 0 && (
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                {telemetry.activeAnomaliesCount}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={fetchVisits}
          className="p-2 rounded-lg text-slate-500 hover:text-[#0B1F33] hover:bg-slate-100 transition-colors cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ─── TAB 1: LIVE VISIT STREAM ─── */}
      {activeTab === "stream" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search beneficiary, email, corporate client, facility, or visit ref..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50/50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#28D17C]/20 focus:border-[#28D17C]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Method Filter */}
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50/50 border border-slate-200 text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-[#28D17C]/20 focus:border-[#28D17C] cursor-pointer"
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
                className="px-3 py-2 rounded-xl bg-slate-50/50 border border-slate-200 text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-[#28D17C]/20 focus:border-[#28D17C] cursor-pointer"
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
                className={`px-3 py-2 rounded-xl border font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                  anomalyOnly
                    ? "bg-rose-50 text-rose-700 border-rose-300"
                    : "bg-slate-50/50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Anomalies Only</span>
              </button>
            </div>
          </div>

          {/* Visits Table & Mobile Feed */}
          <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
            {/* Mobile Card Feed (sm:hidden) */}
            <div className="sm:hidden divide-y divide-slate-100">
              {loading && visits.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Activity className="w-6 h-6 animate-spin text-[#008A4B] mx-auto mb-2" />
                  <span className="text-xs">Initializing live telemetry stream from Kigali Gateway...</span>
                </div>
              ) : filteredVisits.length === 0 ? (
                <div className="p-8 text-center text-slate-500 space-y-1">
                  <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                  <span className="block font-semibold text-slate-700 text-xs">No visits match filters.</span>
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
                      className="p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors space-y-2.5 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#E9FAF2] border border-[#B7F1D2] flex items-center justify-center font-bold text-xs text-[#008A4B] shrink-0">
                            {emp?.full_name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (emp?.id) openDrawer("employee", emp.id, emp, emp.full_name);
                              }}
                              className="font-bold text-[#0B1F33] text-xs hover:text-[#008A4B] text-left block"
                            >
                              {emp?.full_name || "Beneficiary"}
                            </button>
                            <div className="text-[10px] text-slate-500 truncate max-w-[160px]">
                              {emp?.email}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-mono text-[#0B1F33] text-[10px] font-semibold">
                            {formatRelativeTime(v.check_in_at)}
                          </div>
                          <div className="text-[9px] text-slate-500 font-mono">
                            {new Date(v.check_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
                        <div>
                          <div className="text-[9px] text-slate-500 uppercase font-semibold">Employer</div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (org?.id) openDrawer("organization", org.id, org, org.name);
                            }}
                            className="font-semibold text-slate-800 hover:text-[#008A4B] flex items-center gap-1 mt-0.5 text-left truncate max-w-[130px]"
                          >
                            <Building2 className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span className="truncate">{org?.name || "Corporate"}</span>
                          </button>
                        </div>

                        <div>
                          <div className="text-[9px] text-slate-500 uppercase font-semibold">Venue</div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (prov?.id) openDrawer("provider", prov.id, prov, prov.name);
                            }}
                            className="font-semibold text-slate-800 hover:text-[#008A4B] flex items-center gap-1 mt-0.5 text-left truncate max-w-[130px]"
                          >
                            <Network className="w-3 h-3 text-teal-600 shrink-0" />
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
                                  ? "bg-rose-50 text-rose-700 border-rose-300"
                                  : "bg-amber-50 text-amber-700 border-amber-300"
                              }`}
                            >
                              {ano.label}
                            </span>
                          ))}
                        </div>

                        <span className="text-[10px] text-[#008A4B] font-semibold inline-flex items-center gap-0.5">
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
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Time</th>
                    <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Beneficiary</th>
                    <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Corporate Client</th>
                    <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Provider Venue</th>
                    <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Verification Method</th>
                    <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Status &amp; Anomalies</th>
                    <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && visits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <Activity className="w-6 h-6 animate-spin text-[#008A4B] mx-auto mb-2" />
                        <span>Initializing live telemetry stream from Kigali Gateway...</span>
                      </td>
                    </tr>
                  ) : filteredVisits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <span className="block font-semibold text-slate-700">No visits matched the selected filters.</span>
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
                          className="pf-table-row-deferred hover:bg-slate-50/80 transition-colors group cursor-pointer"
                          onClick={() => openDrawer("visit", v.id, v, "Visit Inspection")}
                        >
                          {/* Timestamp */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-mono text-[#0B1F33] text-[11px] font-semibold">
                              {formatRelativeTime(v.check_in_at)}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {new Date(v.check_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </td>

                          {/* Beneficiary */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-[#E9FAF2] border border-[#B7F1D2] flex items-center justify-center font-bold text-xs text-[#008A4B] shrink-0">
                                {emp?.full_name?.charAt(0) || "U"}
                              </div>
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (emp?.id) openDrawer("employee", emp.id, emp, emp.full_name);
                                  }}
                                  className="font-bold text-[#0B1F33] truncate group-hover:text-[#008A4B] transition-colors flex items-center gap-1.5 text-left"
                                >
                                  <span>{emp?.full_name || "Employee"}</span>
                                  <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-normal border border-slate-200">
                                    {emp?.tier || "STANDARD"}
                                  </span>
                                </button>
                                <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
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
                              className="text-left group/org hover:text-[#008A4B] transition-colors"
                            >
                              <div className="font-bold text-slate-800 group-hover/org:text-[#008A4B] flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span className="truncate max-w-[130px]">{org?.name || "Corporate Client"}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 block">Corporate Employer</span>
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
                              className="text-left group/prov hover:text-[#008A4B] transition-colors"
                            >
                              <div className="font-bold text-slate-800 group-hover/prov:text-[#008A4B] flex items-center gap-1">
                                <Network className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                <span className="truncate max-w-[140px]">{loc?.name || "Facility"}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 block">
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
                                      ? "bg-rose-50 text-rose-700 border-rose-300"
                                      : ano.severity === "warning"
                                      ? "bg-amber-50 text-amber-700 border-amber-300"
                                      : "bg-teal-50 text-teal-700 border-teal-300"
                                  }`}
                                  title={ano.detail}
                                >
                                  {ano.severity === "critical" ? (
                                    <ShieldAlert className="w-3 h-3 text-rose-600" />
                                  ) : (
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
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
                              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-[#0B1F33] hover:border-[#28D17C] font-semibold text-[11px] shadow-2xs transition-all inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Trace</span>
                              <ChevronRight className="w-3 h-3 text-[#008A4B]" />
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
          {/* Action Feedback Banner */}
          {feedbackToast && (
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in fade-in duration-200 ${
                feedbackToast.type === "success"
                  ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-200"
                  : "bg-rose-950/80 border-rose-500/40 text-rose-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {feedbackToast.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-[#28D17C]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                )}
                <span>{feedbackToast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackToast(null)}
                className="text-slate-400 hover:text-white text-[11px]"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Clearinghouse Header & Filter Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-[#0B1F33] text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>Central Dispute Adjudication Queue</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Front-desk and scanner claims requiring operational review. 1-click overrides honor partner settlement, void fraudulent claims, or apply goodwill coverage.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter Pills */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setDisputeFilter("open")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    disputeFilter === "open"
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>Open &amp; Reviewing</span>
                  {disputesList.filter((d) => d.status === "open" || d.status === "investigating").length > 0 && (
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 font-bold border border-purple-200">
                      {disputesList.filter((d) => d.status === "open" || d.status === "investigating").length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setDisputeFilter("resolved")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    disputeFilter === "resolved"
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>Resolved</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDisputeFilter("all")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    disputeFilter === "all"
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>All</span>
                </button>
              </div>

              <button
                type="button"
                onClick={fetchDisputes}
                disabled={loadingDisputes}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#0B1F33] hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                title="Refresh Dispute Queue"
              >
                <RefreshCw className={`w-4 h-4 ${loadingDisputes ? "animate-spin text-[#008A4B]" : ""}`} />
              </button>
            </div>
          </div>

          {loadingDisputes && disputesList.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center text-slate-500 space-y-2">
              <Activity className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
              <span className="text-xs">Loading live disputes queue from aggregator database...</span>
            </div>
          ) : disputesList.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center text-slate-500 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-[#008A4B] mx-auto" />
              <h4 className="font-bold text-[#0B1F33] text-base">No Disputes Found</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {disputeFilter === "open"
                  ? "Zero open disputes requiring staff intervention. All partner check-in transactions are reconciled."
                  : "No dispute records match the selected filter."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {disputesList.map((dispute) => {
                const visit = dispute.visits;
                const emp = visit?.employees;
                const loc = visit?.provider_locations;
                const prov = loc?.providers;
                const org = visit?.organizations;
                const isOpen = dispute.status === "open" || dispute.status === "investigating";
                const isActionLoading = adjudicatingId === dispute.visit_id;

                return (
                  <div
                    key={dispute.id}
                    className={`p-5 rounded-2xl bg-white border transition-all space-y-4 shadow-xs ${
                      isOpen
                        ? "border-slate-200/80 hover:border-purple-300"
                        : "border-slate-200/60 opacity-90"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded-full font-bold border ${
                            isOpen
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-[#E9FAF2] text-[#008A4B] border-[#B7F1D2]"
                          }`}
                        >
                          {isOpen ? "OPEN DISPUTE" : "RESOLVED"}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">
                          REF: {dispute.id.substring(0, 8)}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {formatRelativeTime(dispute.created_at)}
                      </span>
                    </div>

                    {/* Venue & Beneficiary Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
                        <div className="text-[9px] text-slate-500 uppercase font-semibold flex items-center justify-between">
                          <span>Beneficiary &amp; Employer</span>
                          <span className="font-mono text-[#008A4B]">{emp?.tier || "STANDARD"}</span>
                        </div>
                        <div className="font-bold text-[#0B1F33] truncate">
                          {emp?.full_name || "Corporate Beneficiary"}
                        </div>
                        <div className="text-slate-500 text-[11px] truncate">
                          {org?.name || "Corporate Client"}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
                        <div className="text-[9px] text-slate-500 uppercase font-semibold">
                          Partner Facility
                        </div>
                        <div className="font-bold text-[#0B1F33] truncate">
                          {loc?.name || "Provider Facility"}
                        </div>
                        <div className="text-slate-500 text-[11px] truncate">
                          {prov?.name || "Wellness Provider"} ({loc?.city || "Kigali"})
                        </div>
                      </div>
                    </div>

                    {/* Claim Reason */}
                    <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200/70 text-xs space-y-1">
                      <div className="text-purple-700 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">
                        <span>Reported Claim ({dispute.raised_by_role || "Front-Desk Staff"})</span>
                        <span className="text-amber-700 font-mono font-semibold">~3,800 RWF Exposure</span>
                      </div>
                      <p className="text-slate-700 italic leading-relaxed text-[11px]">
                        &quot;{dispute.reason || "Front desk reported check-in scanner mismatch."}&quot;
                      </p>
                    </div>

                    {/* Resolution Notes if Resolved */}
                    {!isOpen && dispute.resolution_notes && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 space-y-0.5">
                        <span className="text-[9px] uppercase font-bold text-[#008A4B] tracking-wider">
                          Resolution Outcome: {dispute.resolution_type || "Adjudicated"}
                        </span>
                        <p className="text-slate-600">{dispute.resolution_notes}</p>
                      </div>
                    )}

                    {/* Actions Toolbar */}
                    <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          if (visit?.id) {
                            openDrawer("visit", visit.id, visit, "Dispute Inspection");
                          }
                        }}
                        className="text-xs text-slate-600 hover:text-[#0B1F33] font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Full Trace</span>
                        <ExternalLink className="w-3 h-3 text-[#008A4B]" />
                      </button>

                      {isOpen ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() =>
                              handleInlineAdjudicate(dispute.visit_id, "force_validate", "Approve & Pay Partner")
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
                            title="Honors partner reimbursement, validates visit"
                          >
                            Approve &amp; Pay
                          </button>

                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() =>
                              handleInlineAdjudicate(dispute.visit_id, "split_resolution", "Goodwill Split")
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 text-[11px] font-bold shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
                            title="Goodwill coverage (PolyFit absorbs liability, preserves employee quota)"
                          >
                            Goodwill
                          </button>

                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() =>
                              handleInlineAdjudicate(dispute.visit_id, "void", "Reject & Void")
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-[11px] font-bold shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
                            title="Cancels reimbursement, voids visit"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">
                          Resolved {dispute.resolved_at ? formatRelativeTime(dispute.resolved_at) : "recently"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: FRAUD & VELOCITY INTELLIGENCE COCKPIT ─── */}
      {activeTab === "intelligence" && (
        <div className="space-y-5">
          {/* Header & Threat Index Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-[#0B1F33] text-sm">
                  Network Anti-Fraud &amp; Physical Anomaly Intelligence
                </h3>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-800 border border-slate-200">
                  Window: {anomaliesSummary.total_scanned_window || 150} recent check-ins
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-layer verification engine detecting GPS spoofing, impossible physical velocity jumps, device collisions, and cooldown bypasses.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={fetchAnomalies}
                disabled={loadingAnomalies}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#0B1F33] hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                title="Refresh anomaly telemetry from backend engine"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAnomalies ? "animate-spin text-[#008A4B]" : ""}`} />
                <span>Re-scan Network</span>
              </button>
            </div>
          </div>

          {/* 4-Stat Live Intelligence Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Threat Index */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Network Threat Index
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  anomaliesSummary.active_anomalies > 3
                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                    : anomaliesSummary.active_anomalies > 0
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-[#E9FAF2] text-[#008A4B] border border-[#B7F1D2]"
                }`}>
                  {anomaliesSummary.threat_index || "Low (0/100)"}
                </span>
              </div>
              <div className="font-mono text-2xl font-extrabold text-[#0B1F33]">
                {anomaliesSummary.active_anomalies || 0}
                <span className="text-xs font-normal text-slate-500 ml-1.5 font-sans">active flags</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Composite anomaly score across all partner venues in Rwanda.
              </p>
            </div>

            {/* Velocity Jumps */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  Velocity Jumps
                </span>
                <span className="text-[10px] font-mono text-slate-500">&gt;40 km/h</span>
              </div>
              <div className="font-mono text-2xl font-extrabold text-slate-900">
                {anomaliesSummary.velocity_violations || 0}
              </div>
              <p className="text-[11px] text-slate-500">
                Check-ins with impossible transit speeds between distant facilities.
              </p>
            </div>

            {/* Anti-Passback & Collisions */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  Cooldown &amp; Collisions
                </span>
                <span className="text-[10px] font-mono text-slate-500">180m Window</span>
              </div>
              <div className="font-mono text-2xl font-extrabold text-slate-900">
                {(anomaliesSummary.passback_violations || 0) + (anomaliesSummary.device_collisions || 0)}
              </div>
              <p className="text-[11px] text-slate-500">
                Device sharing or multiple check-ins within the 3-hour facility cooldown.
              </p>
            </div>

            {/* Geofence Breaches */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  Geofence Breaches
                </span>
                <span className="text-[10px] font-mono text-slate-500">&gt;500m</span>
              </div>
              <div className="font-mono text-2xl font-extrabold text-slate-900">
                {anomaliesSummary.outside_geofence || 0}
              </div>
              <p className="text-[11px] text-slate-500">
                Scans generated outside validated provider GPS polygons.
              </p>
            </div>
          </div>

          {/* Filter Bar & Anomaly Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-600">Filter Severity:</span>
                <div className="flex items-center p-0.5 rounded-lg bg-slate-200/70 text-xs">
                  <button
                    type="button"
                    onClick={() => setAnomalySeverityFilter("all")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      anomalySeverityFilter === "all"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnomalySeverityFilter("critical")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      anomalySeverityFilter === "critical"
                        ? "bg-white text-rose-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Critical
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnomalySeverityFilter("warning")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      anomalySeverityFilter === "warning"
                        ? "bg-white text-amber-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Warnings
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  Showing {securityAnomalies.filter((a) => anomalySeverityFilter === "all" || a.severity === anomalySeverityFilter).length} detected flags
                </span>
              </div>
            </div>

            {loadingAnomalies && securityAnomalies.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Activity className="w-8 h-8 animate-spin text-[#008A4B] mx-auto" />
                <span className="text-xs">Scanning real-time network telemetry for physical anomalies...</span>
              </div>
            ) : securityAnomalies.filter((a) => anomalySeverityFilter === "all" || a.severity === anomalySeverityFilter).length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E9FAF2] text-[#008A4B] flex items-center justify-center mx-auto border border-[#B7F1D2]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-[#0B1F33] text-sm">
                  Zero Network Anomalies Detected
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  All recent beneficiary check-ins across Kigali and nationwide facilities adhere strictly to 180-minute cooldowns, PostGIS geofence boundaries, and realistic human transit speeds.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Severity &amp; Type</th>
                      <th className="py-3 px-4">Beneficiary &amp; Employer</th>
                      <th className="py-3 px-4">Facility Venue</th>
                      <th className="py-3 px-4">Telemetry Detail</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {securityAnomalies
                      .filter((a) => anomalySeverityFilter === "all" || a.severity === anomalySeverityFilter)
                      .map((anom, idx) => (
                        <tr key={anom.id || idx} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase font-mono border ${
                              anom.severity === "critical"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}>
                              {anom.severity === "critical" ? (
                                <ShieldAlert className="w-3 h-3 text-rose-600" />
                              ) : (
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                              )}
                              <span>{anom.label || anom.type}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">
                              {anom.employee_name || "Beneficiary"}
                            </div>
                            <span className="text-[10px] text-slate-500 block">
                              {anom.organization_name || "Corporate Client"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800 flex items-center gap-1">
                              <Network className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span>{anom.provider_name || "Facility"}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block">
                              {anom.location_name || "Venue"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-slate-700 font-medium">
                              {anom.detail}
                            </div>
                            {anom.speed_kmh && (
                              <span className="font-mono text-[10px] text-amber-700 block">
                                Speed: {anom.speed_kmh} km/h • Distance: {anom.distance_km} km
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                            {anom.flagged_at ? formatRelativeTime(anom.flagged_at) : "Recently"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                if (anom.visit_id) {
                                  openDrawer("visit", anom.visit_id, anom, "Anomaly Investigation");
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-[#0B1F33] hover:border-[#28D17C] font-semibold text-[11px] shadow-2xs transition-all inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Investigate</span>
                              <ChevronRight className="w-3 h-3 text-[#008A4B]" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Real-Time Rule Engine Directives */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="font-bold text-[#0B1F33] text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#008A4B]" />
              <span>Real-Time Anomaly Rule Engine Directives</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
              <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
                <strong className="text-[#0B1F33] block">Rule 1: 180-Minute Cooldown Guarantee</strong>
                <span className="text-slate-500 leading-relaxed">
                  Employees cannot scan into the same gym or studio twice within 3 hours. Cooldown applies network-wide to prevent gym card lending or buddy check-ins.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
                <strong className="text-[#0B1F33] block">Rule 2: PostGIS Geofence Verification</strong>
                <span className="text-slate-500 leading-relaxed">
                  Every dynamic TOTP access code generated in the employee mobile app is bound to the facility polygon. Remote check-ins from office or home are denied.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
                <strong className="text-[#0B1F33] block">Rule 3: Physical Velocity Impossibility</strong>
                <span className="text-slate-500 leading-relaxed">
                  Flagged when consecutive check-ins between separate venues require transit speeds &gt;40 km/h (accounting for Kigali traffic conditions).
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
