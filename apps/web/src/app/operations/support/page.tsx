"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ShieldCheck,
  Smartphone,
  RotateCcw,
  Sliders,
  History,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Lock,
  Unlock,
  Key,
  Shield,
  RefreshCw,
  Building2,
  ChevronRight,
  Eye,
  Info,
  Clock,
  Laptop,
  Check,
  X,
  Sparkles,
  Terminal,
  Activity,
  UserCheck
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useOperationsDrawer } from "@/contexts/OperationsDrawerContext";

interface BeneficiaryItem {
  id: string;
  full_name: string;
  email: string;
  tier: string;
  status: string;
  department?: string;
  device_fingerprint?: string | null;
  device_model?: string | null;
  device_os?: string | null;
  device_reset_count?: number;
  last_device_reset_at?: string | null;
  device_bound_at?: string | null;
  organizations?: {
    id: string;
    name: string;
    status: string;
  };
}

interface PlatformSettingItem {
  id: string;
  key: string;
  value: any;
  category: string;
  description: string;
  is_active: boolean;
  updated_at: string;
}

interface AuditLogItem {
  id: string;
  user_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

interface TeamMemberItem {
  id: string;
  email: string;
  role: "super_admin" | "polyfit_ops" | "finance_manager" | "support_agent";
  last_sign_in_at: string | null;
  created_at: string;
}

const RBAC_ROLE_CONFIG = {
  super_admin: {
    label: "Super Admin",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    description: "Unrestricted platform ownership, governance overrides, role grants & cryptographic key management.",
    canResetDevice: true,
    canOverrideResetLimit: true,
    canUpdateSettings: true,
    canManageRoles: true,
    canModifyBeneficiary: true,
  },
  polyfit_ops: {
    label: "Ops Lead / Operations",
    badgeColor: "bg-emerald-500/20 text-[#28D17C] border-emerald-500/30",
    description: "Network operations, device lock resets with override capability, census audits & rate adjustments.",
    canResetDevice: true,
    canOverrideResetLimit: true,
    canUpdateSettings: true,
    canManageRoles: false,
    canModifyBeneficiary: true,
  },
  finance_manager: {
    label: "Finance Manager",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    description: "Settlement execution, billing audit, payout approvals. Read-only on device hardware locks.",
    canResetDevice: false,
    canOverrideResetLimit: false,
    canUpdateSettings: false,
    canManageRoles: false,
    canModifyBeneficiary: false,
  },
  support_agent: {
    label: "Support Agent (Tier 1)",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    description: "Beneficiary diagnostics, standard 1-click device reset (within 30d quota). Cannot force override.",
    canResetDevice: true,
    canOverrideResetLimit: false,
    canUpdateSettings: false,
    canManageRoles: false,
    canModifyBeneficiary: false,
  },
};

export default function SupportOperationsPage() {
  const { openDrawer } = useOperationsDrawer();

  // Active Simulated Operator Role
  const [activeRole, setActiveRole] = useState<keyof typeof RBAC_ROLE_CONFIG>("super_admin");
  const rolePermissions = RBAC_ROLE_CONFIG[activeRole];

  // Navigation tab
  const [activeTab, setActiveTab] = useState<"beneficiaries" | "settings" | "audit" | "team">("beneficiaries");

  // Beneficiaries State
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryItem[]>([]);
  const [beneficiariesLoading, setBeneficiariesLoading] = useState(true);
  const [beneficiarySearch, setBeneficiarySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");

  // Platform Settings State
  const [settings, setSettings] = useState<PlatformSettingItem[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSavingKey, setSettingsSavingKey] = useState<string | null>(null);
  const [localSettingsValues, setLocalSettingsValues] = useState<Record<string, any>>({});
  const [settingsSuccessNotice, setSettingsSuccessNotice] = useState<string | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogItem | null>(null);
  const auditDialogRef = useRef<HTMLDialogElement>(null);

  // Team Directory State
  const [teamMembers, setTeamMembers] = useState<TeamMemberItem[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [updatingUserRole, setUpdatingUserRole] = useState<string | null>(null);

  // Fetch Beneficiaries
  const fetchBeneficiaries = async () => {
    setBeneficiariesLoading(true);
    try {
      const params = new URLSearchParams();
      if (beneficiarySearch) params.set("query", beneficiarySearch);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (tierFilter !== "all") params.set("tier", tierFilter);

      const res = await apiFetch<any>(`/api/operations/support/beneficiaries?${params.toString()}`);
      if (res?.beneficiaries) {
        setBeneficiaries(res.beneficiaries);
      }
    } catch (err) {
      console.error("[SupportPage] Failed to fetch beneficiaries:", err);
    } finally {
      setBeneficiariesLoading(false);
    }
  };

  // Fetch Settings
  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await apiFetch<any>("/api/operations/settings");
      if (res?.settings) {
        setSettings(res.settings);
        const map: Record<string, any> = {};
        res.settings.forEach((s: PlatformSettingItem) => {
          map[s.key] = s.value;
        });
        setLocalSettingsValues(map);
      }
    } catch (err) {
      console.error("[SupportPage] Failed to fetch settings:", err);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams();
      if (auditActionFilter !== "all") params.set("action", auditActionFilter);
      params.set("limit", "50");

      const res = await apiFetch<any>(`/api/operations/audit-logs?${params.toString()}`);
      if (res?.logs) {
        setAuditLogs(res.logs);
      }
    } catch (err) {
      console.error("[SupportPage] Failed to fetch audit logs:", err);
    } finally {
      setAuditLoading(false);
    }
  };

  // Fetch Team Directory
  const fetchTeam = async () => {
    setTeamLoading(true);
    try {
      const res = await apiFetch<any>("/api/operations/team");
      if (res?.team) {
        setTeamMembers(res.team);
      }
    } catch (err) {
      console.error("[SupportPage] Failed to fetch team:", err);
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, [statusFilter, tierFilter]);

  useEffect(() => {
    if (activeTab === "settings") fetchSettings();
    if (activeTab === "audit") fetchAuditLogs();
    if (activeTab === "team") fetchTeam();
  }, [activeTab]);

  // Handle setting update
  const handleSaveSetting = async (key: string, value: any) => {
    if (!rolePermissions.canUpdateSettings) {
      alert("Permission Denied: Your current role cannot modify core platform configuration knobs.");
      return;
    }
    setSettingsSavingKey(key);
    setSettingsSuccessNotice(null);
    try {
      const res = await apiFetch<any>("/api/operations/settings", {
        method: "PATCH",
        body: JSON.stringify({
          key,
          value,
          operator_email: `operator-${activeRole}@polyfit.rw`,
        }),
      });
      if (res?.setting) {
        setSettingsSuccessNotice(`Updated ${key} to ${JSON.stringify(value)}`);
        fetchSettings();
        setTimeout(() => setSettingsSuccessNotice(null), 4000);
      }
    } catch (err) {
      console.error("[SupportPage] Failed to update setting:", err);
    } finally {
      setSettingsSavingKey(null);
    }
  };

  // Handle Team Role assignment
  const handleAssignRole = async (userId: string, newRole: string) => {
    if (!rolePermissions.canManageRoles) {
      alert("Permission Denied: Only Super Admin can change security access roles.");
      return;
    }
    setUpdatingUserRole(userId);
    try {
      await apiFetch<any>("/api/operations/team/roles", {
        method: "PATCH",
        body: JSON.stringify({
          target_user_id: userId,
          role: newRole,
          operator_email: `operator-${activeRole}@polyfit.rw`,
        }),
      });
      fetchTeam();
    } catch (err) {
      console.error("[SupportPage] Failed to assign role:", err);
    } finally {
      setUpdatingUserRole(null);
    }
  };

  // Modal open helper for audit details
  const openAuditDetail = (log: AuditLogItem) => {
    setSelectedAuditLog(log);
    if (auditDialogRef.current && !auditDialogRef.current.open) {
      auditDialogRef.current.showModal();
    }
  };

  const closeAuditDetail = () => {
    if (auditDialogRef.current?.open) {
      auditDialogRef.current.close();
    }
    setSelectedAuditLog(null);
  };

  // Metric Computations
  const totalBeneficiaries = beneficiaries.length;
  const activeCount = beneficiaries.filter((b) => b.status === "active").length;
  const lockedCount = beneficiaries.filter((b) => !!b.device_fingerprint).length;
  const resetCountSum = beneficiaries.reduce((sum, b) => sum + (b.device_reset_count || 0), 0);

  const filteredBeneficiaries = useMemo(() => {
    if (!beneficiarySearch.trim()) return beneficiaries;
    const q = beneficiarySearch.toLowerCase();
    return beneficiaries.filter(
      (b) =>
        b.full_name?.toLowerCase().includes(q) ||
        b.email?.toLowerCase().includes(q) ||
        b.department?.toLowerCase().includes(q) ||
        b.organizations?.name?.toLowerCase().includes(q)
    );
  }, [beneficiaries, beneficiarySearch]);

  const filteredAuditLogs = useMemo(() => {
    if (!auditSearch.trim()) return auditLogs;
    const q = auditSearch.toLowerCase();
    return auditLogs.filter(
      (l) =>
        l.action?.toLowerCase().includes(q) ||
        l.entity_type?.toLowerCase().includes(q) ||
        JSON.stringify(l.metadata || {}).toLowerCase().includes(q)
    );
  }, [auditLogs, auditSearch]);

  return (
    <div className="min-h-screen bg-[#071521] text-white p-6 space-y-6">
      {/* Top Header & Role Simulator */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 pb-6 border-b border-[#21405A]">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#0E263E] border border-[#21405A] text-[#28D17C]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">User 360 & RBAC Governance</h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#28D17C]/20 text-[#28D17C] border border-[#28D17C]/30">
                  PF-122
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized beneficiary support cockpit, hardware binding security, dynamic platform knobs & immutable audit stream.
              </p>
            </div>
          </div>
        </div>

        {/* Role Simulator Switcher */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-[#0B1F33] border border-[#21405A]">
          <span className="text-[11px] font-semibold text-slate-400 pl-2 pr-1 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#28D17C]" />
            <span>Simulate Role:</span>
          </span>
          {(Object.keys(RBAC_ROLE_CONFIG) as Array<keyof typeof RBAC_ROLE_CONFIG>).map((roleKey) => {
            const isCurrent = activeRole === roleKey;
            const r = RBAC_ROLE_CONFIG[roleKey];
            return (
              <button
                key={roleKey}
                type="button"
                onClick={() => setActiveRole(roleKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isCurrent
                    ? "bg-[#28D17C] text-[#071521] shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-[#142C44]"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Role Capability Banner */}
      <div className="p-3.5 rounded-xl bg-[#0E263E] border border-[#21405A] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] border ${rolePermissions.badgeColor}`}>
            Active: {rolePermissions.label}
          </span>
          <span className="text-slate-300">{rolePermissions.description}</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
          <span className={rolePermissions.canResetDevice ? "text-[#28D17C]" : "text-slate-500"}>
            ✓ Device Reset: {rolePermissions.canResetDevice ? "Allowed" : "Disabled"}
          </span>
          <span className={rolePermissions.canOverrideResetLimit ? "text-[#28D17C]" : "text-slate-500"}>
            ✓ Force Override: {rolePermissions.canOverrideResetLimit ? "Yes" : "No"}
          </span>
          <span className={rolePermissions.canUpdateSettings ? "text-[#28D17C]" : "text-slate-500"}>
            ✓ Knobs Tuning: {rolePermissions.canUpdateSettings ? "Yes" : "No"}
          </span>
        </div>
      </div>

      {/* Real-time Telemetry Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0B1F33] border border-[#21405A] relative overflow-hidden">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Beneficiaries Roster</div>
          <div className="text-2xl font-bold font-mono text-white mt-1.5">
            {totalBeneficiaries}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
            <span>{activeCount} Active</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">{totalBeneficiaries - activeCount} Frozen/Inactive</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B1F33] border border-[#21405A] relative overflow-hidden">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Hardware Locked Passes</div>
          <div className="text-2xl font-bold font-mono text-[#28D17C] mt-1.5">
            {lockedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Anti-credential sharing active
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B1F33] border border-[#21405A] relative overflow-hidden">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">30-Day Device Resets</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1.5">
            {resetCountSum}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Across network beneficiaries
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B1F33] border border-[#21405A] relative overflow-hidden">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Security Audit Velocity</div>
          <div className="text-2xl font-bold font-mono text-indigo-400 mt-1.5">
            {auditLogs.length}+
          </div>
          <div className="text-[11px] text-indigo-300 mt-1 font-mono">
            Tamper-proof HMAC verified
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-[#21405A] space-x-1">
        <button
          type="button"
          onClick={() => setActiveTab("beneficiaries")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === "beneficiaries"
              ? "border-[#28D17C] text-[#28D17C] bg-[#0E263E]/50"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Beneficiary Directory & 360 Cockpit</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === "settings"
              ? "border-[#28D17C] text-[#28D17C] bg-[#0E263E]/50"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Platform Settings Knobs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === "audit"
              ? "border-[#28D17C] text-[#28D17C] bg-[#0E263E]/50"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Immutable Audit Stream</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("team")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === "team"
              ? "border-[#28D17C] text-[#28D17C] bg-[#0E263E]/50"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Team RBAC Roles</span>
        </button>
      </div>

      {/* TAB 1: BENEFICIARY DIRECTORY & 360 COCKPIT */}
      {activeTab === "beneficiaries" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search beneficiary name, email, employer or department..."
                value={beneficiarySearch}
                onChange={(e) => setBeneficiarySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0B1F33] border border-[#21405A] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#28D17C]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#0B1F33] border border-[#21405A] text-xs text-slate-300 focus:outline-none focus:border-[#28D17C]"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="frozen">Frozen Only</option>
                <option value="suspended">Suspended Only</option>
              </select>

              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#0B1F33] border border-[#21405A] text-xs text-slate-300 focus:outline-none focus:border-[#28D17C]"
              >
                <option value="all">All Benefit Tiers</option>
                <option value="basic">Basic Tier</option>
                <option value="standard">Standard Tier</option>
                <option value="premium">Premium Tier</option>
                <option value="executive">Executive Tier</option>
              </select>

              <button
                type="button"
                onClick={fetchBeneficiaries}
                className="p-2 rounded-xl bg-[#0B1F33] border border-[#21405A] text-slate-400 hover:text-white transition-colors"
                title="Refresh Beneficiary List"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Beneficiaries Table */}
          <div className="rounded-xl border border-[#21405A] bg-[#0B1F33] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0E263E] border-b border-[#21405A] text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Beneficiary</th>
                    <th className="py-3 px-4">Employer Client</th>
                    <th className="py-3 px-4">Benefit Tier</th>
                    <th className="py-3 px-4">Hardware Lock Binding</th>
                    <th className="py-3 px-4">Resets (30d)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#21405A]/50">
                  {beneficiariesLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#28D17C] mb-2" />
                        Loading beneficiary telemetry roster...
                      </td>
                    </tr>
                  ) : filteredBeneficiaries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No beneficiaries match current filter parameters.
                      </td>
                    </tr>
                  ) : (
                    filteredBeneficiaries.map((b) => {
                      const isLocked = !!b.device_fingerprint;
                      return (
                        <tr
                          key={b.id}
                          onClick={() => openDrawer("employee", b.id, b, b.full_name)}
                          className="hover:bg-[#0E263E]/60 cursor-pointer transition-colors group"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#142C44] border border-[#21405A] flex items-center justify-center font-bold text-white text-xs group-hover:border-[#28D17C] transition-colors">
                                {b.full_name?.charAt(0) || "B"}
                              </div>
                              <div>
                                <div className="font-bold text-white flex items-center gap-2">
                                  <span>{b.full_name}</span>
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">
                                  {b.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span className="font-medium truncate max-w-[140px]">
                                {b.organizations?.name || "Corporate Client"}
                              </span>
                            </div>
                            {b.department && (
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                {b.department}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-[#28D17C] border border-[#28D17C]/20">
                              {b.tier || "STANDARD"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            {isLocked ? (
                              <div className="flex items-center gap-2">
                                <span className="p-1 rounded bg-emerald-500/10 text-[#28D17C] border border-emerald-500/20">
                                  <Lock className="w-3 h-3" />
                                </span>
                                <div>
                                  <div className="font-mono text-[11px] text-slate-200">
                                    {b.device_model || "Mobile Device"}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
                                    {b.device_fingerprint}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-slate-500">
                                <span className="p-1 rounded bg-slate-800 text-slate-400">
                                  <Unlock className="w-3 h-3" />
                                </span>
                                <span className="text-[11px]">Unbound</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-mono">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              (b.device_reset_count || 0) >= 2
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "text-slate-300"
                            }`}>
                              {b.device_reset_count || 0} / 2
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              b.status === "active"
                                ? "bg-emerald-500/15 text-[#28D17C] border-emerald-500/30"
                                : b.status === "frozen"
                                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                            }`}>
                              {b.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDrawer("employee", b.id, b, b.full_name);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#142C44] hover:bg-[#28D17C] hover:text-[#071521] text-white text-[11px] font-semibold transition-colors inline-flex items-center gap-1.5"
                            >
                              <span>Inspect 360</span>
                              <ExternalLink className="w-3 h-3" />
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

      {/* TAB 2: PLATFORM SETTINGS KNOBS */}
      {activeTab === "settings" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#28D17C]" />
                <span>Real-Time Platform Security & Anti-Fraud Knobs</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic configuration values persisted in PostgreSQL with instantaneous live propagation across verification routes.
              </p>
            </div>
            {settingsSuccessNotice && (
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-[#28D17C] border border-emerald-500/30 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{settingsSuccessNotice}</span>
              </div>
            )}
          </div>

          {settingsLoading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#28D17C] mb-2" />
              Loading system knobs...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Anti-Passback Cooldown */}
              <div className="p-5 rounded-xl bg-[#0B1F33] border border-[#21405A] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Anti-Passback Cooldown Window</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-[#28D17C] bg-[#142C44] px-2 py-0.5 rounded border border-[#21405A]">
                    {localSettingsValues["anti_passback_cooldown_minutes"] || 180} minutes
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Minimum duration a beneficiary must wait between check-ins at the same wellness provider venue before another verified visit can be recorded.
                </p>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="30"
                    max="360"
                    step="15"
                    disabled={!rolePermissions.canUpdateSettings}
                    value={localSettingsValues["anti_passback_cooldown_minutes"] || 180}
                    onChange={(e) =>
                      setLocalSettingsValues((prev) => ({
                        ...prev,
                        anti_passback_cooldown_minutes: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-[#28D17C]"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>30 min (Flexible)</span>
                    <span>180 min (Standard)</span>
                    <span>360 min (Strict)</span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!rolePermissions.canUpdateSettings || settingsSavingKey === "anti_passback_cooldown_minutes"}
                  onClick={() =>
                    handleSaveSetting(
                      "anti_passback_cooldown_minutes",
                      localSettingsValues["anti_passback_cooldown_minutes"] || 180
                    )
                  }
                  className="w-full py-2 rounded-lg bg-[#142C44] hover:bg-[#28D17C] hover:text-[#071521] text-white text-xs font-semibold transition-colors disabled:opacity-40"
                >
                  {settingsSavingKey === "anti_passback_cooldown_minutes" ? "Propagating..." : "Save Cooldown Window"}
                </button>
              </div>

              {/* TOTP Step Interval */}
              <div className="p-5 rounded-xl bg-[#0B1F33] border border-[#21405A] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span>TOTP Pass Rotation Window</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-[#28D17C] bg-[#142C44] px-2 py-0.5 rounded border border-[#21405A]">
                    {localSettingsValues["totp_step_seconds"] || 30} seconds
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Time-step interval for dynamic pass rotation. Shorter intervals increase cryptographic replay immunity; longer intervals tolerate poor connectivity.
                </p>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[30, 45, 60, 90].map((step) => {
                    const isSelected = (localSettingsValues["totp_step_seconds"] || 30) === step;
                    return (
                      <button
                        key={step}
                        type="button"
                        disabled={!rolePermissions.canUpdateSettings}
                        onClick={() =>
                          setLocalSettingsValues((prev) => ({
                            ...prev,
                            totp_step_seconds: step,
                          }))
                        }
                        className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
                          isSelected
                            ? "bg-[#28D17C] text-[#071521] border-[#28D17C]"
                            : "bg-[#142C44] text-slate-300 border-[#21405A] hover:bg-slate-700"
                        }`}
                      >
                        {step}s
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  disabled={!rolePermissions.canUpdateSettings || settingsSavingKey === "totp_step_seconds"}
                  onClick={() =>
                    handleSaveSetting(
                      "totp_step_seconds",
                      localSettingsValues["totp_step_seconds"] || 30
                    )
                  }
                  className="w-full py-2 rounded-lg bg-[#142C44] hover:bg-[#28D17C] hover:text-[#071521] text-white text-xs font-semibold transition-colors disabled:opacity-40"
                >
                  {settingsSavingKey === "totp_step_seconds" ? "Propagating..." : "Save TOTP Interval"}
                </button>
              </div>

              {/* Geofence Enforcement Radius */}
              <div className="p-5 rounded-xl bg-[#0B1F33] border border-[#21405A] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-400" />
                    <span>Venue Geofence Enforcement Radius</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-[#28D17C] bg-[#142C44] px-2 py-0.5 rounded border border-[#21405A]">
                    {localSettingsValues["geofence_radius_meters"] || 250} meters
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Maximum allowable spatial distance between the scanning receptionist device and the beneficiary phone GPS coordinates at verified check-in.
                </p>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="50"
                    max="1000"
                    step="50"
                    disabled={!rolePermissions.canUpdateSettings}
                    value={localSettingsValues["geofence_radius_meters"] || 250}
                    onChange={(e) =>
                      setLocalSettingsValues((prev) => ({
                        ...prev,
                        geofence_radius_meters: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-[#28D17C]"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>50m (Strict Indoor)</span>
                    <span>250m (Standard)</span>
                    <span>1000m (Relaxed)</span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!rolePermissions.canUpdateSettings || settingsSavingKey === "geofence_radius_meters"}
                  onClick={() =>
                    handleSaveSetting(
                      "geofence_radius_meters",
                      localSettingsValues["geofence_radius_meters"] || 250
                    )
                  }
                  className="w-full py-2 rounded-lg bg-[#142C44] hover:bg-[#28D17C] hover:text-[#071521] text-white text-xs font-semibold transition-colors disabled:opacity-40"
                >
                  {settingsSavingKey === "geofence_radius_meters" ? "Propagating..." : "Save Geofence Radius"}
                </button>
              </div>

              {/* Max Monthly Device Resets */}
              <div className="p-5 rounded-xl bg-[#0B1F33] border border-[#21405A] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>Monthly Device Reset Quota</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-[#28D17C] bg-[#142C44] px-2 py-0.5 rounded border border-[#21405A]">
                    {localSettingsValues["max_device_resets_per_month"] || 2} resets / 30d
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Maximum unprivileged hardware lock resets permitted per beneficiary in a rolling 30-day window before manager override is mandatory.
                </p>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[1, 2, 3, 5].map((quota) => {
                    const isSelected = (localSettingsValues["max_device_resets_per_month"] || 2) === quota;
                    return (
                      <button
                        key={quota}
                        type="button"
                        disabled={!rolePermissions.canUpdateSettings}
                        onClick={() =>
                          setLocalSettingsValues((prev) => ({
                            ...prev,
                            max_device_resets_per_month: quota,
                          }))
                        }
                        className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
                          isSelected
                            ? "bg-[#28D17C] text-[#071521] border-[#28D17C]"
                            : "bg-[#142C44] text-slate-300 border-[#21405A] hover:bg-slate-700"
                        }`}
                      >
                        {quota} Resets
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  disabled={!rolePermissions.canUpdateSettings || settingsSavingKey === "max_device_resets_per_month"}
                  onClick={() =>
                    handleSaveSetting(
                      "max_device_resets_per_month",
                      localSettingsValues["max_device_resets_per_month"] || 2
                    )
                  }
                  className="w-full py-2 rounded-lg bg-[#142C44] hover:bg-[#28D17C] hover:text-[#071521] text-white text-xs font-semibold transition-colors disabled:opacity-40"
                >
                  {settingsSavingKey === "max_device_resets_per_month" ? "Propagating..." : "Save Reset Quota"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: IMMUTABLE AUDIT STREAM */}
      {activeTab === "audit" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit action, operator, metadata..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0B1F33] border border-[#21405A] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#28D17C]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#0B1F33] border border-[#21405A] text-xs text-slate-300 focus:outline-none focus:border-[#28D17C]"
              >
                <option value="all">All Audit Actions</option>
                <option value="device_lock_reset">device_lock_reset</option>
                <option value="device_bound">device_bound</option>
                <option value="device_reset_rate_limited">device_reset_rate_limited</option>
                <option value="employee_status_updated">employee_status_updated</option>
                <option value="employee_tier_updated">employee_tier_updated</option>
                <option value="platform_setting_updated">platform_setting_updated</option>
                <option value="admin_role_updated">admin_role_updated</option>
              </select>

              <button
                type="button"
                onClick={fetchAuditLogs}
                className="p-2 rounded-xl bg-[#0B1F33] border border-[#21405A] text-slate-400 hover:text-white transition-colors"
                title="Refresh Audit Logs"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[#21405A] bg-[#0B1F33] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0E263E] border-b border-[#21405A] text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action Event</th>
                    <th className="py-3 px-4">Entity Type</th>
                    <th className="py-3 px-4">Operator / Caller</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#21405A]/50">
                  {auditLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#28D17C] mb-2" />
                        Querying cryptographic audit stream...
                      </td>
                    </tr>
                  ) : filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No audit events match current criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => {
                      const operator = log.metadata?.operator_identifier || log.metadata?.operator_email || log.user_id || "System";
                      return (
                        <tr
                          key={log.id}
                          onClick={() => openAuditDetail(log)}
                          className="hover:bg-[#0E263E]/60 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                            {new Date(log.created_at).toLocaleString()}
                          </td>

                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                              log.action.includes("reset")
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : log.action.includes("updated")
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                : log.action.includes("limited")
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "bg-emerald-500/20 text-[#28D17C] border border-emerald-500/30"
                            }`}>
                              {log.action}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                            {log.entity_type}
                          </td>

                          <td className="py-3 px-4 text-slate-200 font-mono text-[11px] truncate max-w-[160px]">
                            {operator}
                          </td>

                          <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                            {log.ip_address || "127.0.0.1"}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openAuditDetail(log);
                              }}
                              className="text-slate-400 hover:text-[#28D17C] font-mono text-[11px] underline"
                            >
                              Inspect JSON
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

      {/* TAB 4: TEAM RBAC ROLES */}
      {activeTab === "team" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#28D17C]" />
              <span>Team Role-Based Access Control & Governance</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict role segregation protecting super-admin operations console actions from unauthorized escalation.
            </p>
          </div>

          {/* Role Matrix Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(Object.entries(RBAC_ROLE_CONFIG) as Array<[keyof typeof RBAC_ROLE_CONFIG, (typeof RBAC_ROLE_CONFIG)[keyof typeof RBAC_ROLE_CONFIG]]>).map(
              ([roleKey, role]) => (
                <div
                  key={roleKey}
                  className={`p-4 rounded-xl bg-[#0B1F33] border space-y-3 ${
                    activeRole === roleKey ? "border-[#28D17C]" : "border-[#21405A]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${role.badgeColor}`}>
                      {role.label}
                    </span>
                    {activeRole === roleKey && (
                      <span className="text-[10px] text-[#28D17C] font-bold">Simulating</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 min-h-[44px]">
                    {role.description}
                  </p>
                  <div className="pt-2 border-t border-[#21405A] space-y-1.5 text-[10px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Device Lock Reset:</span>
                      <strong className={role.canResetDevice ? "text-[#28D17C]" : "text-rose-400"}>
                        {role.canResetDevice ? "ALLOWED" : "DENIED"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Manager Override:</span>
                      <strong className={role.canOverrideResetLimit ? "text-[#28D17C]" : "text-rose-400"}>
                        {role.canOverrideResetLimit ? "ALLOWED" : "DENIED"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Platform Knobs:</span>
                      <strong className={role.canUpdateSettings ? "text-[#28D17C]" : "text-rose-400"}>
                        {role.canUpdateSettings ? "ALLOWED" : "DENIED"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Role Management:</span>
                      <strong className={role.canManageRoles ? "text-[#28D17C]" : "text-rose-400"}>
                        {role.canManageRoles ? "ALLOWED" : "DENIED"}
                      </strong>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Operator Directory */}
          <div className="rounded-xl border border-[#21405A] bg-[#0B1F33] overflow-hidden">
            <div className="p-4 bg-[#0E263E] border-b border-[#21405A] flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Internal Operations Staff Directory
                </h4>
                <p className="text-[11px] text-slate-400">
                  Manage assigned system privileges for PolyFit operators.
                </p>
              </div>
              {!rolePermissions.canManageRoles && (
                <span className="text-[10px] text-amber-400 font-mono">
                  Role modification requires Super Admin privilege
                </span>
              )}
            </div>

            <div className="divide-y divide-[#21405A]/50">
              {teamLoading ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Loading team directory...
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No internal team members found.
                </div>
              ) : (
                teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 flex items-center justify-between hover:bg-[#0E263E]/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#142C44] border border-[#21405A] flex items-center justify-center font-bold text-white text-xs">
                        {member.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs font-mono">
                          {member.email}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          ID: {member.id} · Enrolled: {new Date(member.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={member.role}
                        disabled={!rolePermissions.canManageRoles || updatingUserRole === member.id}
                        onChange={(e) => handleAssignRole(member.id, e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-[#071521] border border-[#21405A] text-xs font-semibold text-white focus:outline-none focus:border-[#28D17C] disabled:opacity-50"
                      >
                        <option value="super_admin">Super Admin</option>
                        <option value="polyfit_ops">Ops Lead</option>
                        <option value="finance_manager">Finance Manager</option>
                        <option value="support_agent">Support Agent</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Native <dialog> Modal for Audit JSON Inspector */}
      <dialog
        ref={auditDialogRef}
        onClick={(e) => {
          if (e.target === auditDialogRef.current) closeAuditDetail();
        }}
        onCancel={(e) => {
          e.preventDefault();
          closeAuditDetail();
        }}
        className="backdrop:bg-[#071521]/70 backdrop:backdrop-blur-xs bg-[#0B1F33] text-white border border-[#21405A] rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-hidden m-auto shadow-2xl"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#21405A]">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#28D17C]" />
            <h3 className="font-bold text-sm text-white">Cryptographic Audit Entry Metadata</h3>
          </div>
          <button
            type="button"
            onClick={closeAuditDetail}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#142C44]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {selectedAuditLog && (
          <div className="py-4 space-y-4 overflow-y-auto max-h-[60vh] text-xs">
            <div className="grid grid-cols-2 gap-3 text-slate-300">
              <div className="p-2.5 rounded-lg bg-[#0E263E] border border-[#21405A]">
                <div className="text-[10px] text-slate-400 font-mono">ACTION</div>
                <div className="font-bold text-white font-mono mt-0.5">{selectedAuditLog.action}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0E263E] border border-[#21405A]">
                <div className="text-[10px] text-slate-400 font-mono">TIMESTAMP</div>
                <div className="font-mono text-white mt-0.5">
                  {new Date(selectedAuditLog.created_at).toISOString()}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0E263E] border border-[#21405A]">
                <div className="text-[10px] text-slate-400 font-mono">ENTITY TYPE</div>
                <div className="font-mono text-white mt-0.5">{selectedAuditLog.entity_type}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0E263E] border border-[#21405A]">
                <div className="text-[10px] text-slate-400 font-mono">ENTITY ID</div>
                <div className="font-mono text-white mt-0.5 truncate">{selectedAuditLog.entity_id || "N/A"}</div>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 mb-1.5">Raw JSON Metadata Payload:</div>
              <pre className="p-4 rounded-xl bg-[#071521] border border-[#21405A] text-[11px] font-mono text-[#28D17C] overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(selectedAuditLog.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-[#21405A] flex justify-end">
          <button
            type="button"
            onClick={closeAuditDetail}
            className="px-4 py-2 rounded-xl bg-[#142C44] hover:bg-[#28D17C] hover:text-[#071521] text-white text-xs font-semibold transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </dialog>
    </div>
  );
}
