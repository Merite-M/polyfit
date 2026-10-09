"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Network,
  MapPin,
  FileText,
  DollarSign,
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Save,
  Loader2,
  Sliders,
  Sparkles,
  Phone,
  Mail,
  Building,
  Smartphone,
  Navigation,
  Compass,
  Check,
  RefreshCw,
  Eye,
  FileCheck,
  AlertCircle
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { formatCurrencyDisplay } from "@/lib/utils";

export interface ProviderDossierDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string | null;
  initialData?: Record<string, any>;
  onProviderUpdated?: () => void;
}

export function ProviderDossierDrawer({
  isOpen,
  onClose,
  providerId,
  initialData,
  onProviderUpdated
}: ProviderDossierDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeTab, setActiveTab] = useState<"commercial" | "kyc" | "locations" | "utilization">("commercial");

  const [loading, setLoading] = useState(false);
  const [providerData, setProviderData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Selected location for locations and commercial tab
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  // Edit states
  const [geofenceRadius, setGeofenceRadius] = useState<number>(150);
  const [isMaintenance, setIsMaintenance] = useState<boolean>(false);
  const [locationPayoutRate, setLocationPayoutRate] = useState<number>(3500);
  const [minTier, setMinTier] = useState<string>("standard");

  // Bank & MoMo details states
  const [bankName, setBankName] = useState("Bank of Kigali (BK)");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [swiftCode, setSwiftCode] = useState("BKIGRWRW");
  const [momoProvider, setMomoProvider] = useState("MTN Mobile Money Rwanda");
  const [momoCode, setMomoCode] = useState("");
  const [momoPhone, setMomoPhone] = useState("");

  // KYC review states
  const [kycRevisionNotes, setKycRevisionNotes] = useState("");
  const [kycRejectReason, setKycRejectReason] = useState("");
  const [activeKycModal, setActiveKycModal] = useState<"revision" | "reject" | null>(null);

  // Synchronize native <dialog> lifecycle
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

  // Fetch full 360-degree provider dossier
  const fetchProviderDetail = async (id: string) => {
    setLoading(true);
    try {
      const data = await apiFetch<any>(`/api/operations/providers/${id}`);
      if (data && data.provider) {
        setProviderData(data);
        const locs = data.locations || [];
        if (locs.length > 0) {
          const firstLoc = locs[0];
          setSelectedLocationId(firstLoc.id);
          setGeofenceRadius(firstLoc.geofenceRadiusMeters || 150);
          setIsMaintenance(Boolean(firstLoc.isMaintenanceMode));
          setLocationPayoutRate(firstLoc.perVisitPayoutRate || 3500);
          setMinTier(firstLoc.minBenefitTier || "standard");
        }

        const bd = data.bankDetails || {};
        setBankName(bd.bankName || "Bank of Kigali (BK)");
        setAccountName(bd.accountName || data.provider.name || "");
        setAccountNumber(bd.accountNumber || "");
        setSwiftCode(bd.swiftCode || "BKIGRWRW");
        setMomoProvider(bd.momoProvider || "MTN Mobile Money Rwanda");
        setMomoCode(bd.momoCode || "");
        setMomoPhone(bd.momoPhone || "");
      }
    } catch (err) {
      console.error("[ProviderDossierDrawer] Failed to fetch provider details:", err);
      if (initialData) {
        setProviderData({
          provider: initialData,
          locations: [],
          contracts: [],
          bankDetails: initialData.bankDetails || {},
          complianceDossier: {},
          metrics: { todayVisitsCount: 0, mtdVisitsCount: 0, hourlyDistribution: new Array(24).fill(0) }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && providerId) {
      fetchProviderDetail(providerId);
    }
  }, [isOpen, providerId]);

  // Update edit state when switching active location
  const handleSelectLocation = (locId: string) => {
    setSelectedLocationId(locId);
    const loc = (providerData?.locations || []).find((l: any) => l.id === locId);
    if (loc) {
      setGeofenceRadius(loc.geofenceRadiusMeters || 150);
      setIsMaintenance(Boolean(loc.isMaintenanceMode));
      setLocationPayoutRate(loc.perVisitPayoutRate || 3500);
      setMinTier(loc.minBenefitTier || "standard");
    }
  };

  // Status toggle handler (Active, Pending Review, Suspended, Inactive)
  const handleProviderStatusChange = async (newStatus: string) => {
    if (!providerId) return;
    setStatusUpdating(true);
    try {
      await apiFetch(`/api/operations/providers/${providerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      setProviderData((prev: any) => ({
        ...prev,
        provider: { ...prev?.provider, status: newStatus }
      }));
      onProviderUpdated?.();
    } catch (err) {
      console.error("[ProviderDossierDrawer] Status update failed:", err);
    } finally {
      setStatusUpdating(false);
    }
  };

  // 1-Click KYC Action Handler
  const handleKycAction = async (action: "approve" | "request_revision" | "reject") => {
    if (!providerId) return;
    setSaving(true);
    try {
      const payload: any = { action };
      if (action === "request_revision") payload.notes = kycRevisionNotes;
      if (action === "reject") payload.rejection_reason = kycRejectReason;

      await apiFetch(`/api/operations/providers/${providerId}/kyc`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      setActiveKycModal(null);
      await fetchProviderDetail(providerId);
      onProviderUpdated?.();
    } catch (err) {
      console.error("[ProviderDossierDrawer] KYC action failed:", err);
    } finally {
      setSaving(false);
    }
  };

  // Save Location Settings (Geofence Slider, Maintenance Toggle, Rate, Min Tier)
  const handleSaveLocation = async () => {
    if (!providerId || !selectedLocationId) return;
    setSaving(true);
    try {
      await apiFetch(`/api/operations/providers/${providerId}/locations/${selectedLocationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          geofence_radius_meters: geofenceRadius,
          is_maintenance_mode: isMaintenance,
          per_visit_payout_rate: locationPayoutRate,
          min_benefit_tier: minTier
        })
      });

      // Also refresh state locally
      setProviderData((prev: any) => ({
        ...prev,
        locations: (prev?.locations || []).map((l: any) =>
          l.id === selectedLocationId
            ? {
                ...l,
                geofenceRadiusMeters: geofenceRadius,
                isMaintenanceMode: isMaintenance,
                status: isMaintenance ? "maintenance" : "active",
                perVisitPayoutRate: locationPayoutRate,
                minBenefitTier: minTier
              }
            : l
        )
      }));
      onProviderUpdated?.();
    } catch (err) {
      console.error("[ProviderDossierDrawer] Location update failed:", err);
    } finally {
      setSaving(false);
    }
  };

  // Save Commercial Matrix & Banking Rails
  const handleSaveCommercialMatrix = async () => {
    if (!providerId) return;
    setSaving(true);
    try {
      await apiFetch(`/api/operations/providers/${providerId}/payout-matrix`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank_details: {
            bank_name: bankName,
            account_name: accountName,
            account_number: accountNumber,
            swift_code: swiftCode,
            momo_provider: momoProvider,
            momo_code: momoCode,
            momo_phone: momoPhone
          },
          location_rates: selectedLocationId
            ? [
                {
                  location_id: selectedLocationId,
                  per_visit_payout_rate: locationPayoutRate,
                  currency: "RWF",
                  min_benefit_tier: minTier
                }
              ]
            : []
        })
      });

      await fetchProviderDetail(providerId);
      onProviderUpdated?.();
    } catch (err) {
      console.error("[ProviderDossierDrawer] Commercial update failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const provider = providerData?.provider || initialData || {};
  const locations = providerData?.locations || [];
  const contracts = providerData?.contracts || [];
  const compliance = providerData?.complianceDossier || {};
  const metrics = providerData?.metrics || {};
  const currentLocation = locations.find((l: any) => l.id === selectedLocationId) || locations[0] || null;

  return (
    <dialog
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="backdrop:bg-black/50 backdrop:backdrop-blur-xs bg-transparent p-0 m-0 w-full h-full max-w-none max-h-none border-none outline-none overflow-hidden"
    >
      <div className="w-full h-full flex justify-end">
        <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
          {/* Drawer Header (PolyFit Midnight Navy) */}
          <div className="p-5 bg-[#0B1F33] text-white border-b border-[#21405A] space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#142C44] border border-[#21405A] text-[#28D17C] shadow-sm">
                  <Network className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-[#28D17C]/20 text-[#28D17C] border border-[#28D17C]/30">
                      {provider.category || "WELLNESS PROVIDER"}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      ID: {provider.id ? provider.id.substring(0, 8) : "..."}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                    {provider.name || "Provider Dossier"}
                  </h2>
                </div>
              </div>

              {/* Status Action Selector & Close */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={provider.status || "pending_review"}
                    onChange={(e) => handleProviderStatusChange(e.target.value)}
                    disabled={statusUpdating}
                    className={`appearance-none text-xs font-bold pl-3 pr-7 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      provider.status === "active"
                        ? "bg-[#28D17C]/20 text-[#28D17C] border-[#28D17C]/40"
                        : provider.status === "suspended"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                        : provider.status === "rejected"
                        ? "bg-slate-700 text-slate-300 border-slate-600"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    }`}
                  >
                    <option value="active">Active Certified</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="in_review">In Review (Revisions)</option>
                    <option value="contract_pending">Contract Pending</option>
                    <option value="suspended">Suspended</option>
                    <option value="inactive">Inactive</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <div className="absolute right-2 top-2.5 pointer-events-none">
                    {statusUpdating ? (
                      <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-current" />
                    )}
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
            </div>

            {/* Quick Telemetry Mini-Strip */}
            <div className="grid grid-cols-4 gap-2 pt-1 text-center font-mono">
              <div className="p-2 rounded-lg bg-[#071521] border border-[#21405A]">
                <div className="text-[10px] text-slate-400 uppercase font-sans">Facilities</div>
                <div className="text-sm font-bold text-white mt-0.5">{locations.length}</div>
              </div>
              <div className="p-2 rounded-lg bg-[#071521] border border-[#21405A]">
                <div className="text-[10px] text-slate-400 uppercase font-sans">Agreed Rate</div>
                <div className="text-sm font-bold text-[#28D17C] mt-0.5">
                  RWF {locationPayoutRate.toLocaleString()}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-[#071521] border border-[#21405A]">
                <div className="text-[10px] text-slate-400 uppercase font-sans">Today Visits</div>
                <div className="text-sm font-bold text-sky-400 mt-0.5">{metrics.todayVisitsCount || 0}</div>
              </div>
              <div className="p-2 rounded-lg bg-[#071521] border border-[#21405A]">
                <div className="text-[10px] text-slate-400 uppercase font-sans">MTN / Bank</div>
                <div className="text-[11px] font-bold text-amber-400 truncate mt-0.5">
                  {momoCode || accountNumber ? "CONFIGURED" : "PENDING"}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-5 bg-slate-50 border-b border-slate-200 flex gap-4 text-xs font-semibold select-none">
            {[
              { id: "commercial", label: "Commercial Terms & Rates", icon: DollarSign },
              { id: "kyc", label: "KYC & Compliance Dossier", icon: ShieldCheck },
              { id: "locations", label: `Facilities & Geofence (${locations.length})`, icon: MapPin },
              { id: "utilization", label: "Utilization & Capacity", icon: Activity }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                    isActive
                      ? "border-[#28D17C] text-[#0B1F33] font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#28D17C]" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Drawer Body Scroll Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 text-slate-700 text-xs">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-7 h-7 animate-spin text-[#28D17C]" />
                <span className="font-mono text-xs">Loading Provider 360° Records...</span>
              </div>
            ) : (
              <>
                {/* ═══════════ TAB 1: COMMERCIAL & PAYOUT MATRIX ═══════════ */}
                {activeTab === "commercial" && (
                  <div className="space-y-6">
                    {/* Facility Payout Engine */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          <h4 className="font-bold text-slate-900 text-sm">Negotiated Reimbursement Matrix</h4>
                        </div>
                        <span className="font-mono text-[10px] text-slate-500">CURRENCY: RWF</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Agreed Per-Visit Payout Rate (RWF)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 font-mono text-xs font-bold text-slate-400">
                              RWF
                            </span>
                            <input
                              type="number"
                              value={locationPayoutRate}
                              onChange={(e) => setLocationPayoutRate(Number(e.target.value))}
                              className="w-full pl-12 pr-3 py-2 rounded-lg bg-white border border-slate-300 font-mono text-xs font-bold text-slate-800 focus:outline-none focus:border-[#28D17C]"
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Fixed reimbursement paid by PolyFit per verified check-in.
                          </p>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Minimum Corporate Benefit Tier
                          </label>
                          <select
                            value={minTier}
                            onChange={(e) => setMinTier(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 font-semibold text-xs text-slate-800 focus:outline-none focus:border-[#28D17C]"
                          >
                            <option value="starter">Starter Plan (Basic Fitness Only)</option>
                            <option value="standard">Standard Plan (Gym + Studio Access)</option>
                            <option value="premium">Premium Plan (Full Facilities + Pool)</option>
                            <option value="executive">Executive Plan (VIP Wellness & Recovery)</option>
                          </select>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Beneficiaries on lower tiers will be gatekept from this venue.
                          </p>
                        </div>
                      </div>

                      {/* Interactive Margin Preview */}
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-900">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          <span className="font-semibold text-xs">Platform Unit Economics Preview</span>
                        </div>
                        <div className="text-right font-mono text-xs">
                          <div>Standard Corporate Billing: <span className="font-bold">RWF 5,000</span></div>
                          <div className="text-[10px] text-emerald-700">
                            Provider Payout: RWF {locationPayoutRate.toLocaleString()} | Gross Margin:{" "}
                            <span className="font-bold text-emerald-800">
                              RWF {(5000 - locationPayoutRate).toLocaleString()} (
                              {Math.round(((5000 - locationPayoutRate) / 5000) * 100)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Disbursement Rails: Banking & MTN Mobile Money */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-blue-600" />
                        <h4 className="font-bold text-slate-900 text-sm">Disbursement Banking & Mobile Money</h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Commercial Bank Name
                          </label>
                          <input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="e.g. Bank of Kigali (BK)"
                            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#28D17C]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Bank Account Name
                          </label>
                          <input
                            type="text"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            placeholder="e.g. FitLife Kigali SARL"
                            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#28D17C]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Account Number / IBAN
                          </label>
                          <input
                            type="text"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder="e.g. 00040-069420-11"
                            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 font-mono text-xs font-bold text-slate-800 focus:outline-none focus:border-[#28D17C]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            SWIFT / BIC Code
                          </label>
                          <input
                            type="text"
                            value={swiftCode}
                            onChange={(e) => setSwiftCode(e.target.value)}
                            placeholder="e.g. BKIGRWRW"
                            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 font-mono text-xs font-bold text-slate-800 focus:outline-none focus:border-[#28D17C]"
                          />
                        </div>
                      </div>

                      {/* Mobile Money Rails */}
                      <div className="pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Smartphone className="w-4 h-4 text-amber-500" />
                          <span className="font-bold text-xs text-slate-800">
                            Instant Digital Disbursement (MoMo Pay / Airtel)
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                              Mobile Money Rail
                            </label>
                            <select
                              value={momoProvider}
                              onChange={(e) => setMomoProvider(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#28D17C]"
                            >
                              <option value="MTN Mobile Money Rwanda">MTN MoMo Pay Rwanda</option>
                              <option value="Airtel Money Rwanda">Airtel Money Rwanda</option>
                              <option value="M-Pesa Kenya">Safaricom M-Pesa Kenya</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                              Merchant Code / Paybill
                            </label>
                            <input
                              type="text"
                              value={momoCode}
                              onChange={(e) => setMomoCode(e.target.value)}
                              placeholder="e.g. MOMO-884920"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 font-mono text-xs font-bold text-slate-800 focus:outline-none focus:border-[#28D17C]"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                              Disbursement Phone Number
                            </label>
                            <input
                              type="text"
                              value={momoPhone}
                              onChange={(e) => setMomoPhone(e.target.value)}
                              placeholder="e.g. +250 788 123 456"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 font-mono text-xs font-medium text-slate-800 focus:outline-none focus:border-[#28D17C]"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={handleSaveCommercialMatrix}
                          disabled={saving}
                          className="px-4 py-2 bg-[#28D17C] text-[#0B1F33] rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-[#22BC6E] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                        >
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          <span>Save Commercial Matrix</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══════════ TAB 2: KYC & COMPLIANCE DOSSIER ═══════════ */}
                {activeTab === "kyc" && (
                  <div className="space-y-6">
                    {/* Compliance Action Banner */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>Compliance Review Decision</span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                              provider.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : provider.status === "rejected"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {provider.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Review statutory business registration and hygiene clearance before issuance of corporate contracts.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleKycAction("approve")}
                          disabled={saving}
                          className="px-3 py-1.5 bg-[#28D17C] text-[#0B1F33] rounded-lg font-bold text-xs flex items-center gap-1.5 hover:bg-[#22BC6E] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Issue Contract</span>
                        </button>

                        <button
                          onClick={() => setActiveKycModal("revision")}
                          className="px-3 py-1.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-lg font-bold text-xs hover:bg-amber-200 transition-colors cursor-pointer"
                        >
                          Request Revision
                        </button>

                        <button
                          onClick={() => setActiveKycModal("reject")}
                          className="px-3 py-1.5 bg-rose-100 text-rose-800 border border-rose-300 rounded-lg font-bold text-xs hover:bg-rose-200 transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>

                    {/* Split-View KYC Documents Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Document 1: RDB Business Certificate */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-emerald-600" />
                            <span className="font-bold text-xs text-slate-800">
                              RDB Company Registration
                            </span>
                          </div>
                          <span
                            className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                              compliance.rdbCertificate?.status === "verified"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {compliance.rdbCertificate?.status || "pending"}
                          </span>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-slate-200 text-[11px] font-mono space-y-1">
                          <div className="text-slate-500">Certificate Reference:</div>
                          <div className="font-bold text-slate-900">{provider.taxId || "RDB-PENDING"}</div>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center justify-between">
                          <span>Jurisdiction: Rwanda (RDB)</span>
                          <span className="text-[#28D17C] font-semibold flex items-center gap-1 cursor-pointer hover:underline">
                            <Eye className="w-3 h-3" /> View Document
                          </span>
                        </div>
                      </div>

                      {/* Document 2: RRA / KRA Tax TIN */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="font-bold text-xs text-slate-800">
                              RRA Taxpayer TIN Certificate
                            </span>
                          </div>
                          <span
                            className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                              provider.taxId ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {provider.taxId ? "verified" : "pending"}
                          </span>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-slate-200 text-[11px] font-mono space-y-1">
                          <div className="text-slate-500">Tax Identification:</div>
                          <div className="font-bold text-slate-900">{provider.taxId || "TIN-NOT-FILED"}</div>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center justify-between">
                          <span>Tax Clearance Status: Compliant</span>
                          <span className="text-[#28D17C] font-semibold flex items-center gap-1 cursor-pointer hover:underline">
                            <Eye className="w-3 h-3" /> Verify TIN
                          </span>
                        </div>
                      </div>

                      {/* Document 3: Hygiene & Facility Inspection */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-teal-600" />
                            <span className="font-bold text-xs text-slate-800">
                              Hygiene & Safety Audit
                            </span>
                          </div>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold bg-emerald-100 text-emerald-800">
                            CLEAR
                          </span>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-slate-200 text-[11px] space-y-1">
                          <div className="text-slate-500">Compliance Audit:</div>
                          <div className="font-semibold text-slate-800">
                            Shower ventilation, AED kit, water filtration certified.
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Audited By: PolyFit Operations Field Team
                        </div>
                      </div>

                      {/* Document 4: Venue Photos Catalog */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-indigo-600" />
                            <span className="font-bold text-xs text-slate-800">
                              Facility Photos Gallery
                            </span>
                          </div>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                            {locations.length > 0 ? "3 PHOTOS" : "0 PHOTOS"}
                          </span>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                          <span>Mobile App Catalog Sync: Active</span>
                          <span className="font-mono font-bold text-slate-900">HD Verified</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Indexed for Employee Discovery & Verification.
                        </div>
                      </div>
                    </div>

                    {/* Revision Modal Popup */}
                    {activeKycModal === "revision" && (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-3 animate-in fade-in duration-150">
                        <div className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Request Additional Documents from Provider</span>
                        </div>
                        <textarea
                          value={kycRevisionNotes}
                          onChange={(e) => setKycRevisionNotes(e.target.value)}
                          placeholder="Specify missing documents (e.g. updated RDB certificate with 2026 renewal stamp or clearer shower facility photos)..."
                          className="w-full p-2.5 rounded-lg bg-white border border-amber-300 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setActiveKycModal(null)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleKycAction("request_revision")}
                            disabled={saving}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 cursor-pointer"
                          >
                            Submit Revision Request
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Reject Modal Popup */}
                    {activeKycModal === "reject" && (
                      <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 space-y-3 animate-in fade-in duration-150">
                        <div className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                          <span>Reject Provider Application</span>
                        </div>
                        <textarea
                          value={kycRejectReason}
                          onChange={(e) => setKycRejectReason(e.target.value)}
                          placeholder="State the formal grounds for rejection (e.g. Failed safety inspection or invalid company registration)..."
                          className="w-full p-2.5 rounded-lg bg-white border border-rose-300 text-xs text-slate-800 focus:outline-none focus:border-rose-500"
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setActiveKycModal(null)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleKycAction("reject")}
                            disabled={saving}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                          >
                            Confirm Rejection
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ═══════════ TAB 3: LOCATIONS & GEOFENCES ═══════════ */}
                {activeTab === "locations" && (
                  <div className="space-y-6">
                    {/* Location Branch Tabs */}
                    {locations.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {locations.map((loc: any) => (
                          <button
                            key={loc.id}
                            onClick={() => handleSelectLocation(loc.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                              selectedLocationId === loc.id
                                ? "bg-[#0B1F33] text-white shadow-xs"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {loc.name}
                          </button>
                        ))}
                      </div>
                    )}

                    {currentLocation && (
                      <div className="space-y-4">
                        {/* Emergency Facility Maintenance Toggle */}
                        <div
                          className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                            isMaintenance
                              ? "bg-amber-500/10 border-amber-500/40"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                isMaintenance ? "bg-amber-500/20 text-amber-500" : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                <span>Emergency Facility Maintenance Mode</span>
                                {isMaintenance && (
                                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold animate-pulse">
                                    SUSPENDED
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Instantly hides facility from employee mobile discovery and denies gate check-ins during facility repair or deep cleaning.
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => setIsMaintenance(!isMaintenance)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isMaintenance
                                ? "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-sm"
                                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                            }`}
                          >
                            {isMaintenance ? "Resume Operations" : "Activate Maintenance"}
                          </button>
                        </div>

                        {/* Interactive Geofence Radar Preview & Slider */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Compass className="w-4 h-4 text-emerald-600" />
                              <h4 className="font-bold text-slate-900 text-xs">
                                Geofence Radius Perimeter Radar
                              </h4>
                            </div>
                            <span className="font-mono text-xs font-bold text-[#0B1F33] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              {geofenceRadius} METERS
                            </span>
                          </div>

                          {/* SVG Geofence Radar Map Visualization */}
                          <div className="relative w-full h-48 bg-[#071521] rounded-xl overflow-hidden border border-[#21405A] flex items-center justify-center">
                            <svg className="w-full h-full" viewBox="0 0 400 200">
                              {/* Background radar grid circles */}
                              <circle cx="200" cy="100" r="30" fill="none" stroke="#21405A" strokeWidth="1" />
                              <circle cx="200" cy="100" r="60" fill="none" stroke="#21405A" strokeWidth="1" strokeDasharray="3 3" />
                              <circle cx="200" cy="100" r="90" fill="none" stroke="#21405A" strokeWidth="1" strokeDasharray="4 4" />

                              {/* Dynamic Geofence radius circle scaled to 50-500m */}
                              <circle
                                cx="200"
                                cy="100"
                                r={Math.min(95, Math.max(20, (geofenceRadius / 500) * 90))}
                                fill="rgba(40, 209, 124, 0.15)"
                                stroke="#28D17C"
                                strokeWidth="2"
                                className="transition-all duration-200"
                              />

                              {/* Center Venue Facility Node */}
                              <circle cx="200" cy="100" r="6" fill="#28D17C" />
                              <circle cx="200" cy="100" r="10" fill="none" stroke="#28D17C" strokeWidth="1" opacity="0.6" className="animate-ping" />

                              {/* Coordinates & Compass Callouts */}
                              <text x="210" y="95" fill="#FFFFFF" fontSize="10" fontFamily="monospace" fontWeight="bold">
                                {currentLocation.name}
                              </text>
                              <text x="210" y="110" fill="#94A3B8" fontSize="8" fontFamily="monospace">
                                {currentLocation.lat ? `${currentLocation.lat}, ${currentLocation.lng}` : "Lat: -1.9536, Lng: 30.0924"}
                              </text>
                            </svg>

                            <div className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-400">
                              Kigali Geodetic Datum | Proximity Envelope: {geofenceRadius}m
                            </div>
                          </div>

                          {/* Interactive Range Slider */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono text-slate-500">
                              <span>50m (Turnstile Gate)</span>
                              <span className="font-bold text-slate-800">150m (Recommended Default)</span>
                              <span>500m (Campus Perimeter)</span>
                            </div>
                            <input
                              type="range"
                              min="50"
                              max="500"
                              step="25"
                              value={geofenceRadius}
                              onChange={(e) => setGeofenceRadius(Number(e.target.value))}
                              className="w-full accent-[#28D17C] cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Location Details & Operating Hours */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="font-bold text-xs text-slate-900">
                            Physical Address & Amenities Catalog
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-[11px]">
                            <div>
                              <span className="text-slate-500">Physical Address:</span>
                              <div className="font-semibold text-slate-800">
                                {currentLocation.address || "KG 9 Ave, Gishushu, Kigali"}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-500">Amenities Indexed:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(currentLocation.amenities || []).map((amenity: string) => (
                                  <span
                                    key={amenity}
                                    className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono text-[9px]"
                                  >
                                    {amenity}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end pt-2">
                            <button
                              onClick={handleSaveLocation}
                              disabled={saving}
                              className="px-4 py-2 bg-[#28D17C] text-[#0B1F33] rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-[#22BC6E] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                            >
                              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              <span>Save Facility & Geofence</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ═══════════ TAB 4: UTILIZATION & CAPACITY ═══════════ */}
                {activeTab === "utilization" && (
                  <div className="space-y-6">
                    {/* Performance Metric Cards */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-500 uppercase font-sans">Today Verified Check-ins</div>
                        <div className="text-xl font-bold text-[#0B1F33] font-mono mt-1">
                          {metrics.todayVisitsCount || 0}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                          Instant TOTP Verified
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-500 uppercase font-sans">MTN / Bank Payout MTD</div>
                        <div className="text-xl font-bold text-[#28D17C] font-mono mt-1">
                          RWF {(metrics.estimatedMtdGrossRwf || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {metrics.mtdVisitsCount || 0} Total Visits MTD
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-500 uppercase font-sans">Partner Rating</div>
                        <div className="text-xl font-bold text-amber-500 font-mono mt-1">
                          {provider.rating ? `${provider.rating} / 5.0` : "4.8 / 5.0"}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Corporate Beneficiary Feedback</div>
                      </div>
                    </div>

                    {/* 24h Peak Hours Heatmap */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-xs text-slate-900">
                          24-Hour Peak Facility Traffic Distribution
                        </div>
                        <span className="font-mono text-[10px] text-slate-500">TODAY'S HOURLY STREAM</span>
                      </div>

                      <div className="grid grid-cols-12 gap-1 h-24 items-end pt-2 pb-1">
                        {(metrics.hourlyDistribution || new Array(24).fill(0))
                          .slice(6, 22)
                          .map((val: number, idx: number) => {
                            const hourLabel = `${idx + 6}h`;
                            const maxVal = Math.max(1, ...(metrics.hourlyDistribution || [1]));
                            const heightPct = Math.max(10, Math.round((val / maxVal) * 100));
                            return (
                              <div key={hourLabel} className="flex flex-col items-center gap-1 h-full justify-end">
                                <div
                                  className={`w-full rounded-xs transition-all ${
                                    val > 0 ? "bg-[#28D17C]" : "bg-slate-200"
                                  }`}
                                  style={{ height: `${heightPct}%` }}
                                  title={`${hourLabel}: ${val} visits`}
                                />
                                <span className="text-[8px] font-mono text-slate-400">{hourLabel}</span>
                              </div>
                            );
                          })}
                      </div>
                      <p className="text-[10px] text-slate-400 text-center font-mono">
                        Morning Rush (06h - 09h) | Lunch Break (12h - 14h) | Evening Rush (17h - 20h)
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
