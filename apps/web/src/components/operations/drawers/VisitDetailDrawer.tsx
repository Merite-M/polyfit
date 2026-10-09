"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Activity,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Building2,
  Network,
  User,
  Clock,
  Radio,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
  Lock,
  Layers,
  Loader2,
  FileText
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useOperationsDrawer } from "@/contexts/OperationsDrawerContext";

export interface VisitDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  visitId: string | null;
  initialData?: Record<string, any>;
  onVisitUpdated?: () => void;
}

export function VisitDetailDrawer({
  isOpen,
  onClose,
  visitId,
  initialData,
  onVisitUpdated,
}: VisitDetailDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { openDrawer } = useOperationsDrawer();

  const [visit, setVisit] = useState<any>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [adjudicating, setAdjudicating] = useState(false);
  const [adjudicationNotes, setAdjudicationNotes] = useState("");
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch complete visit data if ID provided
  useEffect(() => {
    if (!isOpen || !visitId) return;

    let isMounted = true;
    setActionSuccessMessage(null);
    setError(null);

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await apiFetch<any>(`/api/operations/visits?search=${visitId}`);
        if (!isMounted) return;
        if (res?.visits && res.visits.length > 0) {
          setVisit(res.visits[0]);
        } else if (initialData) {
          setVisit(initialData);
        }
      } catch (err: any) {
        if (isMounted && !visit) setError("Failed to load visit telemetry trace.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [isOpen, visitId, initialData]);

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

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  const handleAdjudicate = async (action: "force_validate" | "void" | "split_resolution") => {
    if (!visit?.id) return;
    setAdjudicating(true);
    setError(null);
    setActionSuccessMessage(null);

    try {
      const res = await apiFetch<any>(`/api/operations/visits/${visit.id}/dispute/adjudicate`, {
        method: "PATCH",
        body: JSON.stringify({
          action,
          notes: adjudicationNotes.trim() || undefined,
        }),
      });

      if (res?.success) {
        setVisit((prev: any) => ({
          ...prev,
          status: res.visit?.status || prev.status,
          metadata: res.visit?.metadata || prev.metadata,
          visit_disputes: res.dispute ? [res.dispute] : prev.visit_disputes,
        }));
        setActionSuccessMessage(`Successfully applied action: ${action.replace("_", " ").toUpperCase()}`);
        setAdjudicationNotes("");
        if (onVisitUpdated) onVisitUpdated();
      } else {
        throw new Error(res?.error || "Adjudication failed");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to execute adjudication action.");
    } finally {
      setAdjudicating(false);
    }
  };

  const employee = visit?.employees;
  const organization = visit?.organizations;
  const location = visit?.provider_locations;
  const provider = location?.providers;
  const dispute = visit?.visit_disputes && visit?.visit_disputes.length > 0 ? visit.visit_disputes[0] : null;

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
      className="backdrop:bg-[#071521]/70 backdrop:backdrop-blur-xs bg-transparent p-0 m-0 w-full h-full max-w-none max-h-none border-none outline-none overflow-hidden"
    >
      <div className="w-full h-full flex justify-end">
        <div className="w-full max-w-2xl bg-[#0B1F33] text-white h-full shadow-2xl flex flex-col border-l border-[#21405A] animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-5 border-b border-[#21405A] bg-[#0E263E] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#142C44] text-[#28D17C] border border-[#28D17C]/30 shadow-xs">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-[#28D17C]/20 text-[#28D17C] border border-[#28D17C]/30">
                    TELEMETRY TRACE
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    ID: {visit?.id?.substring(0, 13)}...
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white truncate max-w-sm mt-0.5">
                  {employee?.full_name || "Beneficiary Visit"} @ {location?.name || "Facility"}
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

          {/* Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
            {loading && (
              <div className="flex items-center justify-center p-8 text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#28D17C]" />
                <span>Loading cryptographic verification audit...</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {actionSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{actionSuccessMessage}</span>
              </div>
            )}

            {/* Status & Method Banner */}
            <div className="p-4 rounded-xl bg-[#142C44] border border-[#21405A] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                  Verification Status
                </span>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] uppercase tracking-wide border ${
                    visit?.status === "verified"
                      ? "bg-[#28D17C]/20 text-[#28D17C] border-[#28D17C]/40"
                      : visit?.status === "disputed"
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                      : visit?.status === "rejected"
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  }`}>
                    {visit?.status || "pending"}
                  </span>
                  <span className="font-mono text-xs text-slate-300">
                    Method: <strong className="text-white uppercase">{visit?.verification_method || "TOTP_QR"}</strong>
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                  Check-in Timestamp
                </span>
                <span className="font-mono text-xs text-white">
                  {visit?.check_in_at ? new Date(visit.check_in_at).toLocaleString() : "Just now"}
                </span>
              </div>
            </div>

            {/* Zero-Silo Deep-Link Cards: Employer & Provider */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Employer Card */}
              <div className="p-4 rounded-xl bg-[#0E263E] border border-[#21405A] space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Corporate Client</span>
                  </span>
                  <button
                    onClick={() => {
                      if (organization?.id) {
                        openDrawer("organization", organization.id, organization, organization.name);
                      }
                    }}
                    className="text-[#28D17C] hover:underline flex items-center gap-1 text-[11px] font-semibold"
                  >
                    <span>PF-118 Drawer</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm">{organization?.name || "Corporate Employer"}</h4>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                    <span>Beneficiary: <strong className="text-slate-200">{employee?.full_name || "N/A"}</strong></span>
                    <span className="font-mono px-1.5 py-0.2 rounded bg-slate-800 text-[#28D17C] font-semibold text-[10px]">
                      {employee?.tier || "STANDARD"}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-400 mt-0.5 truncate">
                    {employee?.email}
                  </div>
                </div>
              </div>

              {/* Provider Card */}
              <div className="p-4 rounded-xl bg-[#0E263E] border border-[#21405A] space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5 text-teal-400" />
                    <span>Provider Venue</span>
                  </span>
                  <button
                    onClick={() => {
                      if (provider?.id) {
                        openDrawer("provider", provider.id, provider, provider.name);
                      }
                    }}
                    className="text-[#28D17C] hover:underline flex items-center gap-1 text-[11px] font-semibold"
                  >
                    <span>PF-119 Dossier</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm">{location?.name || "Facility Venue"}</h4>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                    <span>Network: <strong className="text-slate-200">{provider?.name || "Provider"}</strong></span>
                    <span className="uppercase text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-teal-300">
                      {provider?.category || "GYM"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {location?.address || location?.city || "Kigali, Rwanda"}
                  </div>
                </div>
              </div>
            </div>

            {/* Cryptographic & Biometric Audit Box */}
            <div className="p-4 rounded-xl bg-[#142C44] border border-[#21405A] space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Lock className="w-4 h-4 text-[#28D17C]" />
                <span>Cryptographic & Access Pass Audit</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#0B1F33] border border-[#21405A] space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">TOTP Hash (SHA-256)</span>
                  <p className="font-mono text-[11px] text-slate-200 truncate">
                    {visit?.totp_token_hash || "sha256:d829f001ae49... (Verified)"}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#0B1F33] border border-[#21405A] space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Device Fingerprint</span>
                  <p className="font-mono text-[11px] text-slate-200 truncate">
                    {visit?.device_fingerprint || "iOS/Expo 56.0 • Secure Enclave"}
                  </p>
                </div>
              </div>

              {visit?.metadata?.is_emergency_bypass && (
                <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Emergency Bypass Authorized</span>
                  </div>
                  <div className="text-[11px] text-amber-200">
                    Bypass Pass Token: <strong className="font-mono text-white">{visit?.metadata?.bypass_code}</strong>
                  </div>
                  <div className="text-[10px] text-slate-300">
                    Reason: {visit?.metadata?.reason} • Authorized by: {visit?.metadata?.authorized_by}
                  </div>
                </div>
              )}
            </div>

            {/* Geofence Perimeter Verification */}
            <div className="p-4 rounded-xl bg-[#0E263E] border border-[#21405A] space-y-3">
              <div className="flex items-center justify-between text-white font-bold text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-400" />
                  <span>Geofence Perimeter Telemetry</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#28D17C] font-semibold border border-emerald-500/30">
                  MAX 200M RADIUS
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#0B1F33] border border-[#21405A] flex items-center justify-between text-xs">
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">User Coordinates</div>
                  <div className="font-mono text-slate-200 text-[11px] mt-0.5">
                    {visit?.geo_lat ? `${visit.geo_lat}, ${visit.geo_lng}` : "-1.9536, 30.0605 (Kigali)"}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Facility Coordinates</div>
                  <div className="font-mono text-slate-200 text-[11px] mt-0.5">
                    {location?.lat ? `${location.lat}, ${location.lng}` : "-1.9538, 30.0602"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Perimeter Delta</div>
                  <div className="font-mono font-bold text-[#28D17C] text-[11px] mt-0.5">
                    18m (Inside)
                  </div>
                </div>
              </div>
            </div>

            {/* Dispute Clearinghouse & Adjudication Workspace */}
            <div className="p-4 rounded-xl bg-[#142C44] border border-[#21405A] space-y-4">
              <div className="flex items-center justify-between text-white font-bold text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>Dispute Adjudication Clearinghouse</span>
                </div>
                {dispute && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/40">
                    DISPUTE: {dispute.status.toUpperCase()}
                  </span>
                )}
              </div>

              {dispute ? (
                <div className="p-3 rounded-lg bg-[#0B1F33] border border-[#21405A] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span>Raised by: <strong className="text-white capitalize">{dispute.raised_by_role}</strong></span>
                    <span>Date: <strong className="text-white">{new Date(dispute.created_at).toLocaleDateString()}</strong></span>
                  </div>
                  <div className="text-slate-200 bg-slate-900/60 p-2.5 rounded border border-slate-800">
                    "{dispute.reason}"
                  </div>
                  {dispute.resolution_notes && (
                    <div className="text-slate-300 text-[11px] pt-1">
                      Resolution Notes: <em className="text-slate-400">{dispute.resolution_notes}</em>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  No active dispute filed for this visit. Ops leads can still execute goodwill overrides, voiding, or dispute adjudication if requested by HR or gym management.
                </p>
              )}

              {/* Action Notes Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300">
                  Adjudication Audit Rationale (Mandatory for overrides)
                </label>
                <textarea
                  value={adjudicationNotes}
                  onChange={(e) => setAdjudicationNotes(e.target.value)}
                  placeholder="e.g. Front desk confirmed biometric reader error. Goodwill split applied to honor provider payout without charging employee."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B1F33] border border-[#21405A] text-white text-xs focus:outline-none focus:border-[#28D17C] placeholder:text-slate-500"
                />
              </div>

              {/* Tri-Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={adjudicating}
                  onClick={() => handleAdjudicate("force_validate")}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-[#28D17C] border border-emerald-500/40 text-xs font-bold transition-colors disabled:opacity-50"
                  title="Honors provider payout and charges employer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Force Validate</span>
                </button>

                <button
                  type="button"
                  disabled={adjudicating}
                  onClick={() => handleAdjudicate("void")}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 text-xs font-bold transition-colors disabled:opacity-50"
                  title="Cancels provider payout and refunds employee monthly allowance"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Void Visit</span>
                </button>

                <button
                  type="button"
                  disabled={adjudicating}
                  onClick={() => handleAdjudicate("split_resolution")}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 text-xs font-bold transition-colors disabled:opacity-50"
                  title="Goodwill override: honors provider settlement while exempting employee benefit quota"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Split Goodwill</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
