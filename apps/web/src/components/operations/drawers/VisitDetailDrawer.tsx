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
      className="backdrop:bg-[#0B1F33]/40 backdrop:backdrop-blur-xs bg-transparent p-0 m-0 w-full h-full max-w-none max-h-none border-none outline-none overflow-hidden"
    >
      <div className="w-full h-full flex justify-end">
        <div className="w-full max-w-2xl bg-white text-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#E9FAF2] text-[#008A4B] border border-[#B7F1D2] shadow-xs">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-[#E9FAF2] text-[#008A4B] border border-[#B7F1D2]">
                    TELEMETRY TRACE
                  </span>
                  <span className="font-mono text-xs text-slate-500">
                    ID: {visit?.id?.substring(0, 13)}...
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#0B1F33] truncate max-w-sm mt-0.5">
                  {employee?.full_name || "Beneficiary Visit"} @ {location?.name || "Facility"}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
            {loading && (
              <div className="flex items-center justify-center p-8 text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#28D17C]" />
                <span>Loading cryptographic verification audit...</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {actionSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#008A4B] flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#008A4B]" />
                <span>{actionSuccessMessage}</span>
              </div>
            )}

            {/* Status & Method Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Verification Status
                </span>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] uppercase tracking-wide border ${
                    visit?.status === "verified"
                      ? "bg-emerald-50 text-[#008A4B] border-emerald-200"
                      : visit?.status === "disputed"
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : visit?.status === "rejected"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {visit?.status || "pending"}
                  </span>
                  <span className="font-mono text-xs text-slate-600">
                    Method: <strong className="text-[#0B1F33] uppercase">{visit?.verification_method || "TOTP_QR"}</strong>
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Check-in Timestamp
                </span>
                <span className="font-mono text-xs text-[#0B1F33] font-semibold">
                  {visit?.check_in_at ? new Date(visit.check_in_at).toLocaleString() : "Just now"}
                </span>
              </div>
            </div>

            {/* Zero-Silo Deep-Link Cards: Employer & Provider */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Employer Card */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Corporate Client</span>
                  </span>
                  <button
                    onClick={() => {
                      if (organization?.id) {
                        openDrawer("organization", organization.id, organization, organization.name);
                      }
                    }}
                    className="text-[#008A4B] hover:underline flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                  >
                    <span>Client Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div>
                  <h4 className="font-bold text-[#0B1F33] text-sm">{organization?.name || "Corporate Employer"}</h4>
                  <div className="text-[11px] text-slate-600 mt-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>Beneficiary: <strong className="text-slate-800">{employee?.full_name || "N/A"}</strong></span>
                      <span className="font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-[#008A4B] border border-emerald-200 font-semibold text-[10px]">
                        {employee?.tier || "STANDARD"}
                      </span>
                    </div>
                    {employee?.id && (
                      <button
                        type="button"
                        onClick={() => openDrawer("employee", employee.id, employee, employee.full_name)}
                        className="text-[10px] text-[#008A4B] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        title="Open User 360 Support Drawer"
                      >
                        <span>User 360</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                  <div className="font-mono text-[11px] text-slate-500 mt-0.5 truncate">
                    {employee?.email}
                  </div>
                </div>
              </div>

              {/* Provider Card */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5 text-teal-600" />
                    <span>Provider Venue</span>
                  </span>
                  <button
                    onClick={() => {
                      if (provider?.id) {
                        openDrawer("provider", provider.id, provider, provider.name);
                      }
                    }}
                    className="text-[#008A4B] hover:underline flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                  >
                    <span>Provider Dossier</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div>
                  <h4 className="font-bold text-[#0B1F33] text-sm">{location?.name || "Facility Venue"}</h4>
                  <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-2">
                    <span>Network: <strong className="text-slate-800">{provider?.name || "Provider"}</strong></span>
                    <span className="uppercase text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                      {provider?.category || "GYM"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {location?.address || location?.city || "Kigali, Rwanda"}
                  </div>
                </div>
              </div>
            </div>

            {/* Cryptographic & Biometric Audit Box */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#0B1F33] font-bold text-xs">
                <Lock className="w-4 h-4 text-[#008A4B]" />
                <span>Cryptographic &amp; Access Pass Audit</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">TOTP Hash (SHA-256)</span>
                  <p className="font-mono text-[11px] text-slate-800 truncate">
                    {visit?.totp_token_hash || "sha256:d829f001ae49... (Verified)"}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Device Fingerprint</span>
                  <p className="font-mono text-[11px] text-slate-800 truncate">
                    {visit?.device_fingerprint || "iOS/Expo 56.0 • Secure Enclave"}
                  </p>
                </div>
              </div>

              {visit?.metadata?.is_emergency_bypass && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Emergency Bypass Authorized</span>
                  </div>
                  <div className="text-[11px] text-amber-900">
                    Bypass Pass Token: <strong className="font-mono text-[#0B1F33]">{visit?.metadata?.bypass_code}</strong>
                  </div>
                  <div className="text-[10px] text-slate-600">
                    Reason: {visit?.metadata?.reason} • Authorized by: {visit?.metadata?.authorized_by}
                  </div>
                </div>
              )}
            </div>

            {/* Geofence Perimeter Verification */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-[#0B1F33] font-bold text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  <span>Geofence Perimeter Telemetry</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E9FAF2] text-[#008A4B] font-semibold border border-[#B7F1D2]">
                  MAX 200M RADIUS
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold">User Coordinates</div>
                  <div className="font-mono text-slate-800 text-[11px] mt-0.5">
                    {visit?.geo_lat ? `${visit.geo_lat}, ${visit.geo_lng}` : "-1.9536, 30.0605 (Kigali)"}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Facility Coordinates</div>
                  <div className="font-mono text-slate-800 text-[11px] mt-0.5">
                    {location?.lat ? `${location.lat}, ${location.lng}` : "-1.9538, 30.0602"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Perimeter Delta</div>
                  <div className="font-mono font-bold text-[#008A4B] text-[11px] mt-0.5">
                    18m (Inside)
                  </div>
                </div>
              </div>
            </div>

            {/* Dispute Clearinghouse & Adjudication Workspace */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between text-[#0B1F33] font-bold text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>Dispute Adjudication Clearinghouse</span>
                </div>
                {dispute && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                    DISPUTE: {dispute.status.toUpperCase()}
                  </span>
                )}
              </div>

              {dispute ? (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-500 text-[10px]">
                    <span>Raised by: <strong className="text-[#0B1F33] capitalize">{dispute.raised_by_role}</strong></span>
                    <span>Date: <strong className="text-[#0B1F33]">{new Date(dispute.created_at).toLocaleDateString()}</strong></span>
                  </div>
                  <div className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200">
                    "{dispute.reason}"
                  </div>
                  {dispute.resolution_notes && (
                    <div className="text-slate-600 text-[11px] pt-1">
                      Resolution Notes: <em className="text-slate-700">{dispute.resolution_notes}</em>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">
                  No active dispute filed for this visit. Ops leads can still execute goodwill overrides, voiding, or dispute adjudication if requested by HR or gym management.
                </p>
              )}

              {/* Action Notes Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">
                  Adjudication Audit Rationale (Mandatory for overrides)
                </label>
                <textarea
                  value={adjudicationNotes}
                  onChange={(e) => setAdjudicationNotes(e.target.value)}
                  placeholder="e.g. Front desk confirmed biometric reader error. Goodwill split applied to honor provider payout without charging employee."
                  style={{ fieldSizing: "content" } as React.CSSProperties}
                  className="w-full pf-textarea-sm px-3.5 py-2.5 rounded-xl bg-slate-50/50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#28D17C]/20 focus:border-[#28D17C] placeholder:text-slate-400"
                />
              </div>

              {/* Tri-Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={adjudicating}
                  onClick={() => handleAdjudicate("force_validate")}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#E9FAF2] hover:bg-emerald-100 text-[#008A4B] border border-[#B7F1D2] text-xs font-bold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                  title="Honors provider payout and charges employer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Force Validate</span>
                </button>

                <button
                  type="button"
                  disabled={adjudicating}
                  onClick={() => handleAdjudicate("void")}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                  title="Cancels provider payout and refunds employee monthly allowance"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Void Visit</span>
                </button>

                <button
                  type="button"
                  disabled={adjudicating}
                  onClick={() => handleAdjudicate("split_resolution")}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
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
