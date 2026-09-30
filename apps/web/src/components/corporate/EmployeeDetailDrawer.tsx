"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Building,
  Tag,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  Calendar,
  MapPin,
  QrCode,
  Clock,
  Sparkles,
  Crown,
  Shield,
  Trash2,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmployeeVisitRecord {
  id: string;
  check_in_at: string;
  check_out_at?: string | null;
  verification_method: "totp_qr" | "manual" | "nfc";
  status: "verified" | "disputed" | "rejected" | "pending";
  provider_locations?: {
    id: string;
    name: string;
    city?: string | null;
    providers?: {
      id: string;
      name: string;
      category: string;
    } | null;
  } | null;
}

export interface EmployeeBenefitDetail {
  id: string;
  name: string;
  tier?: string | null;
  max_monthly_visits?: number | null;
  co_pay_percentage?: string | number | null;
  allowed_provider_categories?: string[] | null;
}

export interface CorporateEmployee {
  id: string;
  org_id?: string;
  full_name: string;
  email: string;
  employee_id_external?: string | null;
  department?: string | null;
  tier: "basic" | "standard" | "premium" | "executive" | string;
  status: "active" | "frozen" | "terminated";
  created_at?: string;
  visits_this_month?: number;
  eligibility?: {
    id: string;
    status: string;
    activated_at?: string;
    expires_at?: string;
    benefits?: EmployeeBenefitDetail | null;
  } | null;
  recent_visits?: EmployeeVisitRecord[];
}

interface EmployeeDetailDrawerProps {
  employee: CorporateEmployee | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: "active" | "frozen" | "terminated") => Promise<void>;
  onTierChange: (id: string, newTier: "basic" | "standard" | "premium" | "executive") => Promise<void>;
  organizationName?: string;
}

export function EmployeeDetailDrawer({
  employee,
  isOpen,
  onClose,
  onStatusChange,
  onTierChange,
  organizationName = "TechCorp Rwanda",
}: EmployeeDetailDrawerProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingTier, setIsUpdatingTier] = useState(false);
  const [statusActionMessage, setStatusActionMessage] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !employee) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const maxVisits =
    employee.eligibility?.benefits?.max_monthly_visits ??
    (employee.tier === "premium" ? 20 : employee.tier === "standard" ? 10 : 4);
  const visitsUsed = employee.visits_this_month ?? 0;
  const usagePercentage = Math.min(100, Math.round((visitsUsed / Math.max(1, maxVisits)) * 100));

  const handleStatusToggle = async (newStatus: "active" | "frozen" | "terminated") => {
    if (newStatus === employee.status || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    setStatusActionMessage(
      newStatus === "frozen"
        ? "Suspending mobile pass & benefits..."
        : newStatus === "active"
        ? "Reactivating corporate pass..."
        : "Terminating benefit access..."
    );
    try {
      await onStatusChange(employee.id, newStatus);
      setStatusActionMessage(
        newStatus === "frozen"
          ? "Benefit pass frozen. Access revoked."
          : newStatus === "active"
          ? "Employee reactivated with full network access."
          : "Employee terminated."
      );
      setTimeout(() => setStatusActionMessage(null), 3000);
    } catch {
      setStatusActionMessage("Failed to update status. Please try again.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleTierSelect = async (newTier: "basic" | "standard" | "premium" | "executive") => {
    if (newTier === employee.tier || isUpdatingTier) return;
    setIsUpdatingTier(true);
    try {
      await onTierChange(employee.id, newTier);
    } finally {
      setIsUpdatingTier(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col border-l border-[#E2E8F0] animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F7F9FC]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8491A3]">
                Beneficiary Profile
              </span>
              <span className="text-xs text-[#E2E8F0]">•</span>
              <span className="text-xs font-medium text-[#526173]">
                {organizationName}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8491A3] hover:text-[#0B1F33] hover:bg-white transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Action Feedback Banner */}
            {statusActionMessage && (
              <div
                className={cn(
                  "p-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in",
                  employee.status === "frozen"
                    ? "bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]"
                    : employee.status === "terminated"
                    ? "bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]"
                    : "bg-[#E9FAF2] text-[#006D3C] border border-[#A7F3D0]"
                )}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>{statusActionMessage}</span>
              </div>
            )}

            {/* Profile Overview Card */}
            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0B1F33] to-[#1E3A5F] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                {getInitials(employee.full_name)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-[#0B1F33] truncate">
                    {employee.full_name}
                  </h2>
                  {employee.status === "active" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E9FAF2] text-[#006D3C] border border-[#28D17C]/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#28D17C]" />
                      Active
                    </span>
                  )}
                  {employee.status === "frozen" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF3C7] text-[#B45309] border border-[#F59E0B]/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                      Frozen
                    </span>
                  )}
                  {employee.status === "terminated" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEE2E2] text-[#991B1B] border border-[#EF4444]/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                      Terminated
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-2 text-xs text-[#526173]">
                  <Mail className="w-3.5 h-3.5 text-[#8491A3]" />
                  <span className="truncate">{employee.email}</span>
                </div>

                <div className="mt-2 flex items-center gap-2 text-xs text-[#8491A3]">
                  <span className="font-mono bg-[#F1F4F8] px-2 py-0.5 rounded text-[11px] font-medium text-[#0B1F33]">
                    {employee.employee_id_external || "ID: Unassigned"}
                  </span>
                  <span>•</span>
                  <span>{employee.department || "General"}</span>
                </div>
              </div>
            </div>

            {/* Wellhub-Style Quick Status Switcher */}
            <div className="p-4 rounded-2xl bg-[#F7F9FC] border border-[#E2E8F0]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#0B1F33] flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#00D2B4]" />
                  Corporate Benefit Status
                </span>
                <span className="text-[11px] text-[#8491A3]">
                  Instant Pass Control
                </span>
              </div>

              {/* Segmented Control */}
              <div className="grid grid-cols-3 gap-1.5 bg-[#E2E8F0]/60 p-1 rounded-xl">
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusToggle("active")}
                  className={cn(
                    "py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                    employee.status === "active"
                      ? "bg-white text-[#006D3C] shadow-xs"
                      : "text-[#526173] hover:text-[#0B1F33]"
                  )}
                >
                  <PlayCircle className="w-3.5 h-3.5 text-[#28D17C]" />
                  <span>Active</span>
                </button>

                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusToggle("frozen")}
                  className={cn(
                    "py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                    employee.status === "frozen"
                      ? "bg-white text-[#B45309] shadow-xs"
                      : "text-[#526173] hover:text-[#0B1F33]"
                  )}
                >
                  <PauseCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Freeze</span>
                </button>

                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusToggle("terminated")}
                  className={cn(
                    "py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                    employee.status === "terminated"
                      ? "bg-white text-[#991B1B] shadow-xs"
                      : "text-[#526173] hover:text-[#0B1F33]"
                  )}
                >
                  <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
                  <span>Revoke</span>
                </button>
              </div>

              <p className="text-[11px] text-[#526173] mt-2.5 leading-relaxed">
                {employee.status === "active" && (
                  "Full access enabled. Dynamic TOTP QR pass active on employee's PolyFit mobile pass."
                )}
                {employee.status === "frozen" && (
                  "Temporary pause (e.g. sabbatical, parental leave). Passes are immediately suspended and visits blocked at all partner venues."
                )}
                {employee.status === "terminated" && (
                  "Permanent separation. Benefit policy expired and mobile authorization revoked."
                )}
              </p>
            </div>

            {/* Benefit Tier & Quota Gauge */}
            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#8491A3]">
                    Benefit Tier Allocation
                  </h3>
                  <p className="text-xs text-[#526173] mt-0.5">
                    Plan rules and monthly visit cap
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {(["basic", "standard", "premium", "executive"] as const).map((tierName) => (
                    <button
                      key={tierName}
                      disabled={isUpdatingTier}
                      onClick={() => handleTierSelect(tierName)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer",
                        employee.tier === tierName
                          ? "bg-[#0B1F33] text-white shadow-xs"
                          : "text-[#526173] hover:bg-[#F1F4F8]"
                      )}
                    >
                      {tierName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quota Progress Bar */}
              <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E2E8F0]">
                <div className="flex items-center justify-between text-xs font-semibold text-[#0B1F33] mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#28D17C]" />
                    Monthly Visits Utilized
                  </span>
                  <span>
                    {visitsUsed} / {maxVisits} visits ({usagePercentage}%)
                  </span>
                </div>

                <div className="w-full h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      usagePercentage > 85
                        ? "bg-[#F59E0B]"
                        : "bg-gradient-to-r from-[#28D17C] to-[#00D2B4]"
                    )}
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-[#526173]">
                  <span>
                    Co-pay:{" "}
                    <strong className="text-[#0B1F33]">
                      {employee.tier === "executive"
                        ? "0% (Executive 100% Funded)"
                        : employee.tier === "premium"
                        ? "0% (100% Employer Funded)"
                        : employee.tier === "standard"
                        ? "15% Co-Pay"
                        : "20% Co-Pay"}
                    </strong>
                  </span>
                  <span>
                    Status:{" "}
                    <strong className="text-[#006D3C]">
                      {employee.status === "active" ? "Pass Valid" : "Pass Paused"}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Category Access Tag List */}
              <div>
                <span className="text-[11px] font-semibold text-[#8491A3] uppercase tracking-wider block mb-2">
                  Eligible Venue Categories
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#E9FAF2] text-[#006D3C] border border-[#28D17C]/20">
                    Fitness & Gyms
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#E9FAF2] text-[#006D3C] border border-[#28D17C]/20">
                    Swimming Pools
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#E9FAF2] text-[#006D3C] border border-[#28D17C]/20">
                    Yoga & Pilates Studios
                  </span>
                  {(employee.tier === "premium" || employee.tier === "executive") && (
                    <>
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#E9FAF2] text-[#006D3C] border border-[#28D17C]/20">
                        Physiotherapy Clinics
                      </span>
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#E9FAF2] text-[#006D3C] border border-[#28D17C]/20">
                        Recovery Centers
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Verified Visit History Timeline */}
            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#8491A3] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#00D2B4]" />
                  Verified Visit Activity
                </h3>
                <span className="text-[11px] text-[#526173]">
                  Latest Verified Check-ins
                </span>
              </div>

              {employee.recent_visits && employee.recent_visits.length > 0 ? (
                <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-[#E2E8F0]">
                  {employee.recent_visits.map((v) => {
                    const dateFormatted = new Date(v.check_in_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                    const timeFormatted = new Date(v.check_in_at).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div key={v.id} className="relative flex items-start gap-3 pl-7">
                        <span className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-[#28D17C] -translate-x-1/2" />
                        <div className="flex-1 min-w-0 bg-[#F7F9FC] p-3 rounded-xl border border-[#E2E8F0]">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[#0B1F33] truncate">
                              {v.provider_locations?.providers?.name || v.provider_locations?.name || "Kigali Central Facility"}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#006D3C]">
                              <CheckCircle2 className="w-3 h-3 text-[#28D17C]" />
                              Verified
                            </span>
                          </div>

                          <div className="mt-1 flex items-center justify-between text-[11px] text-[#526173]">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#8491A3]" />
                              {dateFormatted} at {timeFormatted}
                            </span>
                            <span className="capitalize text-[#8491A3] font-mono text-[10px]">
                              {v.verification_method === "totp_qr" ? "QR Pass" : v.verification_method}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 px-4 bg-[#F7F9FC] rounded-xl border border-dashed border-[#E2E8F0]">
                  <QrCode className="w-8 h-8 text-[#8491A3] mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-[#0B1F33]">
                    No Visits Recorded This Month
                  </p>
                  <p className="text-[11px] text-[#526173] mt-0.5">
                    Verified visits at partner gyms and studios will populate here in real-time.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-[#E2E8F0] bg-[#F7F9FC] flex items-center justify-between">
            <span className="text-[11px] text-[#8491A3] font-mono">
              ID: {employee.id.slice(0, 8)}...
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0B1F33] hover:bg-[#F1F4F8] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
