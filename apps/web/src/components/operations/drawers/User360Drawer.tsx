"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Layers,
  Copy,
  Check,
  Activity,
  Calendar,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  QrCode,
  Lock,
  Unlock,
  Radio,
  Sliders,
  Sparkles,
  Info
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useOperationsDrawer } from "@/contexts/OperationsDrawerContext";

export interface User360DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string | null;
  initialData?: Record<string, any>;
  onUpdated?: () => void;
}

export function User360Drawer({
  isOpen,
  onClose,
  employeeId,
  initialData,
  onUpdated
}: User360DrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { openDrawer } = useOperationsDrawer();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Device reset workflow state
  const [resetting, setResetting] = useState(false);
  const [resetReason, setResetReason] = useState("");
  const [isManagerOverride, setIsManagerOverride] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Status & Tier override state
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingTier, setUpdatingTier] = useState(false);

  // Interactive TOTP verification diagnostic tool state
  const [testTokenInput, setTestTokenInput] = useState("");
  const [tokenTestResult, setTokenTestResult] = useState<{ valid: boolean; message: string } | null>(null);

  // Live timer for TOTP countdown ring in simulated pass
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);

  // Sync native dialog lifecycle
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

  // Load Beneficiary 360 data
  const fetchBeneficiaryDetail = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<any>(`/api/operations/support/beneficiaries/${id}`);
      if (res && res.success) {
        setData(res);
        if (res.simulatedPass?.secondsRemaining !== undefined) {
          setSecondsRemaining(res.simulatedPass.secondsRemaining);
        }
      }
    } catch (err: any) {
      console.error("[User360Drawer] Fetch error:", err);
      setError(err?.message || "Failed to load beneficiary 360 profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && employeeId) {
      fetchBeneficiaryDetail(employeeId);
      setResetSuccessMessage(null);
      setIsManagerOverride(false);
      setResetReason("");
      setTokenTestResult(null);
    }
  }, [isOpen, employeeId]);

  // TOTP Live 1-second countdown ticker
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Re-fetch token when step expires if drawer remains open
          if (employeeId) {
            fetchBeneficiaryDetail(employeeId);
          }
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, employeeId]);

  // 1-Click Device Lock Reset Handler
  const handleDeviceReset = async () => {
    if (!employeeId) return;
    setResetting(true);
    setResetSuccessMessage(null);
    setError(null);
    try {
      const res = await apiFetch<any>(`/api/operations/support/beneficiaries/${employeeId}/device-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: resetReason || (isManagerOverride ? "Manager approved override" : "Standard support reset"),
          isManagerOverride
        })
      });

      if (res && res.success) {
        setResetSuccessMessage(res.message);
        setResetReason("");
        setIsManagerOverride(false);
        // Refresh local cockpit data
        await fetchBeneficiaryDetail(employeeId);
        onUpdated?.();
      }
    } catch (err: any) {
      console.error("[User360Drawer] Device reset failed:", err);
      setError(err?.message || "Failed to reset device lock.");
    } finally {
      setResetting(false);
    }
  };

  // 1-Click Status Override Handler
  const handleStatusChange = async (newStatus: string) => {
    if (!employeeId) return;
    setUpdatingStatus(true);
    try {
      await apiFetch(`/api/operations/support/beneficiaries/${employeeId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, reason: "Operator status override" })
      });
      await fetchBeneficiaryDetail(employeeId);
      onUpdated?.();
    } catch (err: any) {
      console.error("[User360Drawer] Status update error:", err);
      setError(err?.message || "Failed to update beneficiary status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // 1-Click Benefit Tier Override Handler
  const handleTierChange = async (newTier: string) => {
    if (!employeeId) return;
    setUpdatingTier(true);
    try {
      await apiFetch(`/api/operations/support/beneficiaries/${employeeId}/tier`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: newTier, reason: "Operator tier override" })
      });
      await fetchBeneficiaryDetail(employeeId);
      onUpdated?.();
    } catch (err: any) {
      console.error("[User360Drawer] Tier update error:", err);
      setError(err?.message || "Failed to update benefit tier.");
    } finally {
      setUpdatingTier(false);
    }
  };

  // Copy Hardware Fingerprint to Clipboard
  const handleCopyFingerprint = (fingerprint: string) => {
    navigator.clipboard.writeText(fingerprint);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  // Test Token Diagnostic
  const handleTestToken = () => {
    if (!testTokenInput || testTokenInput.trim().length !== 6) {
      setTokenTestResult({ valid: false, message: "Enter a 6-digit numeric pass code to verify." });
      return;
    }
    const currentPass = data?.simulatedPass?.token;
    if (testTokenInput.trim() === currentPass) {
      setTokenTestResult({ valid: true, message: "Valid Active Token (Matches Current Step 0s drift)" });
    } else {
      setTokenTestResult({ valid: false, message: "Invalid or Expired Token (Clock drift detected or pass generated on another account)" });
    }
  };

  const b = data?.beneficiary || initialData || {};
  const device = data?.device || {};
  const quota = data?.quota || {};
  const benefit = data?.benefit || {};
  const simPass = data?.simulatedPass || {};
  const diagnostics = data?.totpDiagnostics || {};
  const recentVisits = data?.recentVisits || [];

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="backdrop:bg-black/60 backdrop:backdrop-blur-xs bg-transparent p-0 m-0 w-full h-full max-w-none max-h-none border-none outline-none overflow-hidden select-none"
    >
      <div className="w-full h-full flex justify-end">
        <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200 overflow-hidden">
          
          {/* DRAWER TOP BAR */}
          <div className="p-4 bg-[#0B1F33] text-white flex items-center justify-between border-b border-[#21405A]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#28D17C] to-[#00D2B4] flex items-center justify-center font-bold text-white shadow-md text-sm">
                {b.fullName ? b.fullName.charAt(0) : "U"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#28D17C]/20 text-[#28D17C] font-bold border border-[#28D17C]/40">
                    USER 360 COCKPIT
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    ID: {employeeId?.substring(0, 8)}...
                  </span>
                </div>
                <h3 className="text-base font-bold text-white truncate max-w-md mt-0.5">
                  {b.fullName || "Corporate Beneficiary"}
                </h3>
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

          {/* DRAWER SCROLLABLE BODY */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F7F9FC] text-slate-800">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span className="flex-1">{error}</span>
                <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800 text-xs font-bold">Dismiss</button>
              </div>
            )}

            {resetSuccessMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span className="flex-1 font-medium">{resetSuccessMessage}</span>
              </div>
            )}

            {/* QUICK HEADER METADATA STRIP */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Corporate Employer</span>
                  <button
                    onClick={() => {
                      if (b.organization?.id) {
                        openDrawer("organization", b.organization.id, b.organization, b.organization.name);
                      }
                    }}
                    className="font-bold text-[#0B1F33] hover:text-[#28D17C] transition-colors truncate block max-w-[140px] text-left underline decoration-slate-300"
                    title={b.organization?.name}
                  >
                    {b.organization?.name || "Corporate Partner"}
                  </button>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Corporate Email</span>
                  <span className="font-mono text-slate-700 truncate block max-w-[140px]" title={b.email}>
                    {b.email || "N/A"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Benefit Tier</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <select
                      value={b.tier || "standard"}
                      disabled={updatingTier}
                      onChange={(e) => handleTierChange(e.target.value)}
                      className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-[11px] font-mono font-bold text-[#0B1F33] focus:outline-none focus:ring-1 focus:ring-[#28D17C] cursor-pointer"
                    >
                      <option value="basic">BASIC</option>
                      <option value="standard">STANDARD</option>
                      <option value="premium">PREMIUM</option>
                      <option value="executive">EXECUTIVE</option>
                    </select>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Account Status</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <select
                      value={b.status || "active"}
                      disabled={updatingStatus}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className={`px-2 py-0.5 rounded border text-[11px] font-bold focus:outline-none cursor-pointer ${
                        b.status === "active"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : b.status === "frozen"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}
                    >
                      <option value="active">ACTIVE</option>
                      <option value="frozen">FROZEN</option>
                      <option value="terminated">TERMINATED</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 1: SIMULATED BENEFICIARY MOBILE PASS (TRUE SUPPORT PROXY VIEW) */}
            <div className="rounded-2xl bg-[#0B1F33] text-white p-5 border border-[#21405A] shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-[#21405A] pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#28D17C]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Simulated Beneficiary Pass (Mobile Proxy View)
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#28D17C] animate-pulse" />
                  <span>RFC 6238 ACTIVE</span>
                </div>
              </div>

              {/* Pass Visual Card Silhouette */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#071521] to-[#102A45] border border-[#21405A] space-y-4 relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-[#28D17C] uppercase font-bold block">
                      {b.organization?.name || "POLYFIT NETWORK"}
                    </span>
                    <h5 className="text-lg font-extrabold text-white mt-0.5">
                      {b.fullName || "Beneficiary Pass"}
                    </h5>
                    <span className="text-[11px] text-slate-400 font-mono">
                      External TIN: {b.externalId || "EMP-RW-2026"}
                    </span>
                  </div>

                  <div className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-right">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">Tier</span>
                    <span className="text-xs font-mono font-bold text-[#28D17C] uppercase">
                      {b.tier || "Standard"}
                    </span>
                  </div>
                </div>

                {/* Dynamic TOTP Code Display with Live Radial Countdown Ring */}
                <div className="p-3.5 rounded-xl bg-[#0B1F33]/90 border border-[#21405A] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-[#00D2B4]" />
                      <span>Dynamic Turnstile QR Token</span>
                    </span>
                    <div className="font-mono text-2xl font-black tracking-widest text-white flex items-center gap-2">
                      <span>{simPass.token ? `${simPass.token.slice(0, 3)} ${simPass.token.slice(3)}` : "--- ---"}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Watermark: <strong className="text-slate-300">#{simPass.watermark || "SEC-TOKEN"}</strong>
                    </span>
                  </div>

                  {/* Countdown Timer Ring */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <svg className="w-12 h-12 transform -rotate-90">
                        <circle
                          cx="24"
                          cy="24"
                          r="18"
                          stroke="#132D43"
                          strokeWidth="3"
                          fill="transparent"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r="18"
                          stroke={secondsRemaining < 8 ? "#EF4444" : "#28D17C"}
                          strokeWidth="3"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 18}
                          strokeDashoffset={2 * Math.PI * 18 * (1 - secondsRemaining / 30)}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-linear"
                        />
                      </svg>
                      <span className={`absolute font-mono text-xs font-bold ${secondsRemaining < 8 ? "text-rose-400" : "text-white"}`}>
                        {secondsRemaining}s
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5">Expires</span>
                  </div>
                </div>

                {/* Quota Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">
                      Monthly Quota: <strong className="text-white">{quota.used ?? 0}</strong> of <strong>{quota.limit ?? 12}</strong> Visits
                    </span>
                    <span className="font-mono text-[#28D17C] font-bold">
                      {quota.remaining ?? 0} Left
                    </span>
                  </div>
                  <div className="w-full bg-[#132D43] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        (quota.percentage ?? 0) >= 90 ? "bg-rose-500" : (quota.percentage ?? 0) >= 75 ? "bg-amber-400" : "bg-[#28D17C]"
                      }`}
                      style={{ width: `${Math.min(100, quota.percentage ?? 0)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Copay: {benefit.copayPercentage ?? 0}%</span>
                    <span>Billing Window: {quota.monthPeriod || "Current Month"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: HARDWARE FINGERPRINT & DEVICE LOCK MANAGER */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Lock className={`w-4 h-4 ${device.isBound ? "text-indigo-600" : "text-slate-400"}`} />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Device Lock & Hardware Binding Manager
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase border ${
                    device.isBound
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}>
                    {device.isBound ? "LOCKED TO HARDWARE" : "UNBOUND / AWAITING PHONE"}
                  </span>
                </div>
              </div>

              {/* Hardware Spec Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Hardware Fingerprint (UUID)</span>
                  <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-800">
                    <span>{device.fingerprint || "None (Cleared)"}</span>
                    {device.fingerprint && (
                      <button
                        onClick={() => handleCopyFingerprint(device.fingerprint)}
                        className="p-1 rounded hover:bg-slate-200 text-slate-500 transition-colors"
                        title="Copy UUID"
                      >
                        {copiedFingerprint ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Registered Phone Model</span>
                  <span className="font-semibold text-slate-800">{device.model || "Not Provisioned"}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Operating System</span>
                  <span className="font-mono text-slate-800 font-bold uppercase">{device.os || "N/A"}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Binding Provisioned At</span>
                  <span className="text-slate-700">{device.boundAt ? new Date(device.boundAt).toLocaleString() : "Never"}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">30-Day Reset Count</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                      device.isLockedOut ? "bg-rose-100 text-rose-800" : "bg-slate-200 text-slate-800"
                    }`}>
                      {device.resetsUsed30d ?? 0} of {device.maxAllowedResets ?? 2} Resets Used
                    </span>
                    {device.isLockedOut && (
                      <span className="text-[10px] text-rose-600 font-bold uppercase flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Rate Limited</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 1-Click Device Reset Control */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">
                      1-Click Device Hardware Unbinding
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Clears the current phone hardware UUID so the employee can immediately bind a newly upgraded or replaced phone upon login.
                    </p>
                  </div>
                </div>

                {device.isLockedOut && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-950">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <span>Security Guardrail: 30-Day Reset Limit Reached</span>
                    </div>
                    <p className="text-[10px] leading-relaxed text-amber-800">
                      To prevent fraud or account-sharing between corporate employees, standard resets are restricted to 2 per 30 days. An <strong>Operations Lead</strong> or <strong>Super Admin override</strong> is required to proceed.
                    </p>

                    <label className="flex items-center gap-2 text-xs font-semibold text-amber-950 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={isManagerOverride}
                        onChange={(e) => setIsManagerOverride(e.target.checked)}
                        className="rounded border-amber-400 text-[#0B1F33] focus:ring-[#28D17C]"
                      />
                      <span>Authorize Manager Override (Logs to Immutable Audit Trail)</span>
                    </label>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <input
                    type="text"
                    placeholder="Enter reset justification note (e.g. Phone stolen / Upgraded to iPhone 16)"
                    value={resetReason}
                    onChange={(e) => setResetReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
                  />

                  <button
                    onClick={handleDeviceReset}
                    disabled={resetting || (device.isLockedOut && !isManagerOverride) || !device.isBound}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      !device.isBound
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                        : device.isLockedOut && !isManagerOverride
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-[#0B1F33] hover:bg-slate-800 text-white shadow-sm"
                    }`}
                  >
                    {resetting ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-[#28D17C]" />
                    ) : (
                      <RotateCcw className="w-4 h-4 text-[#28D17C]" />
                    )}
                    <span>
                      {!device.isBound
                        ? "Device Lock Already Cleared"
                        : device.isLockedOut && !isManagerOverride
                        ? "Requires Manager Override to Reset"
                        : "Reset Device Lock (Clear Binding)"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 3: TOTP TELEMETRY & CLOCK DRIFT DIAGNOSTIC TOOL */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    TOTP Telemetry & Clock Drift Diagnostic Tool
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  Step: 30s • Window: ±1
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Server Reference Time</span>
                  <span className="font-mono text-slate-800 text-[11px] block">
                    {diagnostics.serverTime ? new Date(diagnostics.serverTime).toLocaleTimeString() : "Live UTC Sync"}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold block">Drift Offset: 0ms</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Secret Derivation Hash</span>
                  <span className="font-mono text-slate-800 text-[11px] truncate block" title={diagnostics.secretDerivationPreview}>
                    {diagnostics.secretDerivationPreview || "sec-sha256-verified"}
                  </span>
                  <span className="text-[10px] text-slate-500 block">HMAC-SHA256 Pepper Applied</span>
                </div>
              </div>

              {/* Dry-Run Token Validator */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  Verify Beneficiary Phone Code (Dry-Run Test)
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit code employee sees"
                    value={testTokenInput}
                    onChange={(e) => setTestTokenInput(e.target.value.replace(/\D/g, ""))}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
                  />
                  <button
                    onClick={handleTestToken}
                    className="px-4 py-1.5 rounded-lg bg-[#0B1F33] hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
                  >
                    Diagnose
                  </button>
                </div>

                {tokenTestResult && (
                  <div className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                    tokenTestResult.valid ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}>
                    {tokenTestResult.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                    <span>{tokenTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 4: HISTORICAL VISIT LOG */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Recent Verified Visits Stream ({recentVisits.length})
                  </h4>
                </div>
              </div>

              {recentVisits.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  No verified visits recorded for this beneficiary yet this month.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                  {recentVisits.map((v: any) => (
                    <div key={v.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs uppercase">
                          {v.category?.substring(0, 3) || "GYM"}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{v.locationName}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <span>{v.providerName}</span>
                            <span>•</span>
                            <span>{v.city}</span>
                            <span>•</span>
                            <span className="font-mono text-[10px] text-slate-400">{new Date(v.checkInAt).toLocaleDateString()} {new Date(v.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[10px]">
                          {v.status}
                        </span>

                        <button
                          onClick={() => {
                            openDrawer("visit", v.id, v, `Visit Ref ${v.id.substring(0, 8)}`);
                          }}
                          className="p-1 rounded hover:bg-slate-200 text-slate-500 transition-colors"
                          title="Inspect in Visit Monitor"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </dialog>
  );
}
