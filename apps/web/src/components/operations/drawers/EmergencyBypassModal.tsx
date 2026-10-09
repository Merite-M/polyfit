"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Zap,
  ShieldAlert,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  Building2,
  Network,
  User,
  Radio,
  Loader2,
  Clock,
  ArrowRight
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface EmployeeOption {
  id: string;
  fullName: string;
  email: string;
  tier: string;
  orgName: string;
}

interface LocationOption {
  id: string;
  name: string;
  city: string;
  providerName: string;
}

interface EmergencyBypassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBypassIssued?: (visit: any) => void;
  preselectedEmployeeId?: string | null;
  preselectedLocationId?: string | null;
}

const PRESET_REASONS = [
  { id: "reception_offline", label: "Front-Desk Offline / Network Connectivity Failure" },
  { id: "battery_depleted_id_verified", label: "Phone Battery Died — Physical Corporate ID Verified" },
  { id: "turnstile_reader_jam", label: "Hardware QR Scanner / Turnstile Reader Hardware Outage" },
  { id: "vip_goodwill_pass", label: "Executive VIP / Corporate Guest Goodwill Override" },
  { id: "totp_clock_drift", label: "Device System Clock Drift / TOTP Synchronization Glitch" },
];

export function EmergencyBypassModal({
  isOpen,
  onClose,
  onBypassIssued,
  preselectedEmployeeId = null,
  preselectedLocationId = null,
}: EmergencyBypassModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Form State
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(preselectedEmployeeId || "");
  const [selectedLocationId, setSelectedLocationId] = useState<string>(preselectedLocationId || "");
  const [selectedReason, setSelectedReason] = useState<string>("reception_offline");
  const [notes, setNotes] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success state with generated pass
  const [issuedPass, setIssuedPass] = useState<{
    bypassCode: string;
    visit: any;
    employeeName: string;
    locationName: string;
    issuedAt: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  // Fetch employees and locations on open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoadingOptions(true);
    setError(null);
    setIssuedPass(null);

    const loadData = async () => {
      try {
        const [empRes, locRes] = await Promise.all([
          apiFetch<any>("/api/operations/clients").catch(() => null),
          apiFetch<any>("/api/operations/locations").catch(() => null),
        ]);

        if (!isMounted) return;

        // Flatten employee roster from corporate clients
        const empList: EmployeeOption[] = [];
        if (empRes?.clients && Array.isArray(empRes.clients)) {
          empRes.clients.forEach((c: any) => {
            if (c.roster && Array.isArray(c.roster)) {
              c.roster.forEach((e: any) => {
                empList.push({
                  id: e.id,
                  fullName: e.fullName || e.full_name || "Employee",
                  email: e.email || "",
                  tier: (e.tier || "standard").toUpperCase(),
                  orgName: c.name || "Corporate Client",
                });
              });
            }
          });
        }
        setEmployees(empList);

        // Format locations
        const locList: LocationOption[] = [];
        if (locRes?.locations && Array.isArray(locRes.locations)) {
          locRes.locations.forEach((l: any) => {
            locList.push({
              id: l.id,
              name: l.name,
              city: l.city || "Kigali",
              providerName: l.provider_name || l.providerName || "Network Facility",
            });
          });
        }
        setLocations(locList);

        // Set initial preselected values if available
        if (preselectedEmployeeId) setSelectedEmployeeId(preselectedEmployeeId);
        else if (empList.length > 0 && !selectedEmployeeId) setSelectedEmployeeId(empList[0].id);

        if (preselectedLocationId) setSelectedLocationId(preselectedLocationId);
        else if (locList.length > 0 && !selectedLocationId) setSelectedLocationId(locList[0].id);
      } catch (err: any) {
        if (isMounted) setError("Failed to load active roster or facility options.");
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, preselectedEmployeeId, preselectedLocationId]);

  // Dialog open/close lifecycle
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

  // Light dismiss fallback
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !selectedLocationId) {
      setError("Please select both a beneficiary and a facility location.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const chosenEmp = employees.find((e) => e.id === selectedEmployeeId);
    const chosenLoc = locations.find((l) => l.id === selectedLocationId);
    const reasonLabel = PRESET_REASONS.find((r) => r.id === selectedReason)?.label || selectedReason;

    try {
      const res = await apiFetch<any>("/api/operations/visits/emergency-bypass", {
        method: "POST",
        body: JSON.stringify({
          employee_id: selectedEmployeeId,
          provider_location_id: selectedLocationId,
          reason: reasonLabel,
          notes: notes.trim() || undefined,
        }),
      });

      if (res?.success) {
        setIssuedPass({
          bypassCode: res.bypassCode || "EP-BYPASS",
          visit: res.visit,
          employeeName: chosenEmp?.fullName || "Beneficiary",
          locationName: chosenLoc?.name || "Facility",
          issuedAt: new Date().toLocaleTimeString(),
        });
        if (onBypassIssued && res.visit) {
          onBypassIssued(res.visit);
        }
      } else {
        throw new Error(res?.error || "Emergency bypass issuance failed");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to issue emergency bypass. Please check network connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      // @ts-ignore: closedby is part of modern HTML dialog specification
      closedby="any"
      onClick={handleBackdropClick}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="backdrop:bg-[#071521]/75 backdrop:backdrop-blur-sm bg-transparent p-0 m-auto max-w-xl w-full border-none outline-none overflow-visible shadow-2xl"
    >
      <div className="bg-[#0B1F33] text-white rounded-2xl border border-[#21405A] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-[#21405A] bg-[#0E263E] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-wide">
                  Turnstile Emergency Bypass
                </h3>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#28D17C]/20 text-[#28D17C] font-semibold border border-[#28D17C]/30">
                  5-SEC SLA
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Front-desk escalation: instantly unblock an employee at reception.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {issuedPass ? (
            /* Success State: Show Emergency Code */
            <div className="space-y-6 text-center py-2 animate-in fade-in duration-150">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#28D17C]/20 text-[#28D17C] border border-[#28D17C]/40">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-white">Emergency Pass Issued & Verified!</h4>
                <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                  A verified visit has been recorded in the aggregator database and broadcasted to the venue turnstile gateway.
                </p>
              </div>

              {/* Pass Code Card */}
              <div className="p-5 rounded-2xl bg-[#142C44] border border-[#28D17C]/40 max-w-md mx-auto space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Single-Use Front-Desk Pass Code
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-3xl font-extrabold text-[#28D17C] tracking-widest selection:bg-[#28D17C] selection:text-[#0B1F33]">
                    {issuedPass.bypassCode}
                  </span>
                  <button
                    onClick={() => handleCopyCode(issuedPass.bypassCode)}
                    className="p-2 rounded-lg bg-[#0B1F33] hover:bg-slate-800 text-slate-300 hover:text-white border border-[#21405A] transition-colors"
                    title="Copy pass code"
                  >
                    {copied ? <Check className="w-4 h-4 text-[#28D17C]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {copied && (
                  <div className="text-[11px] font-medium text-[#28D17C]">
                    Copied code to clipboard!
                  </div>
                )}
                <div className="text-[11px] text-slate-400 pt-1 border-t border-[#21405A] flex items-center justify-between">
                  <span>Beneficiary: <strong className="text-white">{issuedPass.employeeName}</strong></span>
                  <span>Venue: <strong className="text-white">{issuedPass.locationName}</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] font-bold text-xs transition-colors shadow-md"
                >
                  Done & Return to Live Stream
                </button>
              </div>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Beneficiary Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#28D17C]" />
                  <span>Beneficiary Employee *</span>
                </label>
                {loadingOptions ? (
                  <div className="h-10 rounded-xl bg-slate-800/60 animate-pulse flex items-center px-3 text-xs text-slate-500">
                    Loading corporate roster...
                  </div>
                ) : (
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#142C44] border border-[#21405A] text-white text-xs focus:outline-none focus:border-[#28D17C]"
                  >
                    <option value="" disabled>Select corporate employee...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.orgName} — {emp.tier})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Facility Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-teal-400" />
                  <span>Provider Venue & Turnstile Gate *</span>
                </label>
                {loadingOptions ? (
                  <div className="h-10 rounded-xl bg-slate-800/60 animate-pulse flex items-center px-3 text-xs text-slate-500">
                    Loading facility network...
                  </div>
                ) : (
                  <select
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#142C44] border border-[#21405A] text-white text-xs focus:outline-none focus:border-[#28D17C]"
                  >
                    <option value="" disabled>Select partner venue...</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.providerName} • {loc.city})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Mandatory Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mandatory Escalation Reason *</span>
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#142C44] border border-[#21405A] text-white text-xs focus:outline-none focus:border-[#28D17C]"
                >
                  {PRESET_REASONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Additional Audit Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Internal Ops Notes (Optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Front desk receptionist verified national ID #11998... Employee approved for workout."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#142C44] border border-[#21405A] text-white text-xs focus:outline-none focus:border-[#28D17C] placeholder:text-slate-500"
                />
              </div>

              {/* Notice & Button */}
              <div className="pt-2">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90 leading-relaxed mb-4">
                  <strong>Zero-Bottleneck Notice:</strong> Submitting this bypass will immediately create an authenticated visit with verification method <code>turnstile</code> and log your operator identity for audit compliance.
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl bg-[#142C44] hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || loadingOptions}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] font-bold text-xs transition-colors shadow-md disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Authorizing Pass...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-current" />
                        <span>Authorize Turnstile Bypass</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </dialog>
  );
}
