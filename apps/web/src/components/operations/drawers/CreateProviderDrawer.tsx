"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Network,
  Building2,
  MapPin,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Phone,
  Radio,
  Sliders,
  DollarSign,
  Compass,
  Check,
  Loader2
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { formatCurrencyDisplay } from "@/lib/utils";

interface CreateProviderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProvider: any) => void;
}

const CATEGORY_OPTIONS = [
  { id: "gym", label: "Gym & Strength Training", icon: "🏋️‍♂️", defaultRate: 4000 },
  { id: "studio", label: "Yoga & Pilates Studio", icon: "🧘‍♀️", defaultRate: 5000 },
  { id: "pool", label: "Olympic & Aquatic Pool", icon: "🏊‍♂️", defaultRate: 4500 },
  { id: "clinic", label: "Physiotherapy & Rehab", icon: "🩺", defaultRate: 8500 },
  { id: "wellness_center", label: "Holistic Wellness & Spa", icon: "🌿", defaultRate: 7000 }
];

const CITY_OPTIONS = [
  { name: "Kigali", defaultLat: -1.9536, defaultLng: 30.0605 },
  { name: "Musanze", defaultLat: -1.4998, defaultLng: 29.6350 },
  { name: "Rubavu", defaultLat: -1.6750, defaultLng: 29.2600 },
  { name: "Huye", defaultLat: -2.6000, defaultLng: 29.7400 },
  { name: "Nairobi", defaultLat: -1.2921, defaultLng: 36.8219 }
];

const AMENITY_TAGS = [
  "Lockers & Keys",
  "Hot Showers",
  "Sauna & Steam Room",
  "Towel Service",
  "Swimming Pool",
  "Free Valet / Parking",
  "High-Speed Wi-Fi",
  "Organic Juice & Cafe",
  "Olympic Weights",
  "Cardio Deck"
];

const BENEFIT_TIERS = [
  { id: "starter", name: "Starter", desc: "Basic fitness facilities & budget venues" },
  { id: "standard", name: "Standard", desc: "Core gym & studio network (Most common)" },
  { id: "premium", name: "Premium", desc: "Full amenity clubs, boutique studios & pools" },
  { id: "executive", name: "Executive VIP", desc: "High-end luxury wellness resorts & clinics" }
];

export function CreateProviderDrawer({
  isOpen,
  onClose,
  onSuccess
}: CreateProviderDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Legal Entity & Identity
  const [name, setName] = useState("");
  const [category, setCategory] = useState("gym");
  const [contactEmail, setContactEmail] = useState("");
  const [settlementEmail, setSettlementEmail] = useState("");
  const [taxId, setTaxId] = useState("");
  const [initialStatus, setInitialStatus] = useState<"pending_review" | "active">("pending_review");

  // Step 2: Primary Location & Geofence
  const [locationName, setLocationName] = useState("");
  const [city, setCity] = useState("Kigali");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number>(-1.9536);
  const [lng, setLng] = useState<number>(30.0605);
  const [geofenceRadiusMeters, setGeofenceRadiusMeters] = useState<number>(150);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    "Lockers & Keys",
    "Hot Showers",
    "High-Speed Wi-Fi"
  ]);

  // Step 3: Negotiated Payout Matrix & MoMo Rails
  const [perVisitPayoutRate, setPerVisitPayoutRate] = useState<number>(4500);
  const [minBenefitTier, setMinBenefitTier] = useState<string>("standard");
  const [bankName, setBankName] = useState("Bank of Kigali");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [swiftCode, setSwiftCode] = useState("BKIGRWRW");
  const [momoProvider, setMomoProvider] = useState("MTN Mobile Money Rwanda");
  const [momoCode, setMomoCode] = useState("");
  const [momoPhone, setMomoPhone] = useState("");

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
      setCurrentStep(1);
      setError(null);
    }
  }, [isOpen]);

  // Auto-fill settlement email from contact email if blank
  useEffect(() => {
    if (contactEmail && !settlementEmail) {
      setSettlementEmail(contactEmail);
    }
  }, [contactEmail, settlementEmail]);

  // Auto-fill location name when trade name changes if not customized
  useEffect(() => {
    if (name && !locationName) {
      setLocationName(`${name} - Main Branch`);
    }
    if (name && !accountName) {
      setAccountName(name);
    }
  }, [name, locationName, accountName]);

  // Update default rate when category changes
  const handleCategoryChange = (catId: string) => {
    setCategory(catId);
    const cat = CATEGORY_OPTIONS.find((c) => c.id === catId);
    if (cat && currentStep === 1) {
      setPerVisitPayoutRate(cat.defaultRate);
    }
  };

  const handleCityChange = (cityName: string) => {
    setCity(cityName);
    const found = CITY_OPTIONS.find((c) => c.name === cityName);
    if (found) {
      setLat(found.defaultLat);
      setLng(found.defaultLng);
    }
  };

  const toggleAmenity = (tag: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const validateStep1 = () => {
    if (!name.trim()) return "Provider Trade Name is required.";
    if (!contactEmail.trim() || !contactEmail.includes("@")) return "A valid contact email is required.";
    if (!settlementEmail.trim() || !settlementEmail.includes("@")) return "A valid settlement finance email is required.";
    if (!taxId.trim()) return "Rwanda/East Africa Tax ID (TIN) is required for statutory invoicing.";
    return null;
  };

  const validateStep2 = () => {
    if (!locationName.trim()) return "Primary Facility location name is required.";
    if (!address.trim()) return "Physical venue street address is required.";
    if (isNaN(lat) || isNaN(lng)) return "Valid GPS coordinates (latitude & longitude) are required.";
    return null;
  };

  const validateStep3 = () => {
    if (!perVisitPayoutRate || perVisitPayoutRate <= 0) return "A valid per-visit negotiated payout rate is required.";
    if (!accountNumber.trim() && !momoCode.trim() && !momoPhone.trim()) {
      return "Either bank account or MTN MoMo merchant rail details are required for disbursement.";
    }
    return null;
  };

  const handleNext = () => {
    setError(null);
    if (currentStep === 1) {
      const err = validateStep1();
      if (err) {
        setError(err);
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const err = validateStep2();
      if (err) {
        setError(err);
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep === 2) setCurrentStep(1);
    if (currentStep === 3) setCurrentStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const err = validateStep3();
    if (err) {
      setError(err);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        category,
        contact_email: contactEmail.trim().toLowerCase(),
        settlement_email: settlementEmail.trim().toLowerCase(),
        tax_id: taxId.trim(),
        status: initialStatus,
        location_name: locationName.trim(),
        address: address.trim(),
        city,
        lat: Number(lat),
        lng: Number(lng),
        geofence_radius_meters: Number(geofenceRadiusMeters),
        per_visit_payout_rate: Number(perVisitPayoutRate),
        currency: "RWF",
        min_benefit_tier: minBenefitTier,
        amenities: selectedAmenities,
        bank_details: {
          bank_name: bankName,
          account_name: accountName.trim() || name.trim(),
          account_number: accountNumber.trim(),
          swift_code: swiftCode.trim(),
          momo_provider: momoProvider,
          momo_code: momoCode.trim(),
          momo_phone: momoPhone.trim()
        }
      };

      const res = await apiFetch<any>("/api/operations/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res?.success && res.provider) {
        onSuccess(res.provider);
        onClose();
      } else {
        throw new Error(res?.error || "Failed to provision provider network partner.");
      }
    } catch (err: any) {
      console.error("[CreateProviderDrawer] Provisioning error:", err);
      setError(err.message || "Failed to connect to Operations Gateway. Check network status.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      className="backdrop:bg-black/60 backdrop:backdrop-blur-xs bg-transparent p-0 m-0 w-full h-full max-w-none max-h-none border-none outline-none overflow-hidden"
    >
      <div className="w-full h-full flex justify-end">
        <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                    PF-119 Onboarding Engine
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Step {currentStep} of 3</span>
                </div>
                <h2 className="text-base font-bold text-[#0B1F33] mt-0.5">
                  Onboard Wellness Provider Network
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs">
            <div
              className={`flex items-center gap-2 font-medium ${
                currentStep >= 1 ? "text-emerald-700 font-bold" : "text-slate-400"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono ${
                  currentStep > 1
                    ? "bg-emerald-600 text-white"
                    : currentStep === 1
                    ? "bg-emerald-100 text-emerald-800 border-2 border-emerald-500"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : "1"}
              </div>
              <span>Entity Identity</span>
            </div>

            <div className={`h-0.5 w-8 ${currentStep >= 2 ? "bg-emerald-500" : "bg-slate-300"}`} />

            <div
              className={`flex items-center gap-2 font-medium ${
                currentStep >= 2 ? "text-emerald-700 font-bold" : "text-slate-400"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono ${
                  currentStep > 2
                    ? "bg-emerald-600 text-white"
                    : currentStep === 2
                    ? "bg-emerald-100 text-emerald-800 border-2 border-emerald-500"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : "2"}
              </div>
              <span>Location & Geofence</span>
            </div>

            <div className={`h-0.5 w-8 ${currentStep === 3 ? "bg-emerald-500" : "bg-slate-300"}`} />

            <div
              className={`flex items-center gap-2 font-medium ${
                currentStep === 3 ? "text-emerald-700 font-bold" : "text-slate-400"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono ${
                  currentStep === 3
                    ? "bg-emerald-100 text-emerald-800 border-2 border-emerald-500"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                3
              </div>
              <span>Payouts & Rails</span>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Validation Required</p>
                <p className="text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* STEP 1: Entity Identity */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Commercial Entity Profile</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Define the corporate legal partner, tax classification, and operations contact.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Provider Commercial Trade Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kigali Athletic Club, Waka Fitness, Nyarutarama Tennis & Pool"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Wellness Network Category <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CATEGORY_OPTIONS.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryChange(cat.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-20 ${
                          category === cat.id
                            ? "border-emerald-500 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="text-xl">{cat.icon}</div>
                        <div>
                          <div className="text-[11px] font-bold text-slate-800">{cat.label}</div>
                          <div className="text-[9px] text-slate-500 font-mono">
                            Base: {formatCurrencyDisplay(cat.defaultRate)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Operations Contact Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="manager@provider.rw"
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Settlement / Billing Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={settlementEmail}
                      onChange={(e) => setSettlementEmail(e.target.value)}
                      placeholder="finance@provider.rw"
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Rwanda Tax ID (TIN / RRA) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      placeholder="e.g. 109847291"
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Initial Network Status
                    </label>
                    <select
                      value={initialStatus}
                      onChange={(e) => setInitialStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                    >
                      <option value="pending_review">Pending KYC Review (Compliance Queue)</option>
                      <option value="active">Pre-Approved Active Network Partner</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Location & Geofence Radar */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Primary Location & Physical Geofence</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Establish the primary facility venue, GPS coordinates, and proximity gate radius for mobile check-in verification.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Primary Branch Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="e.g. Kigali Heights Flagship"
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      City / Territory <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={city}
                      onChange={(e) => handleCityChange(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                    >
                      {CITY_OPTIONS.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Physical Venue Street Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. KG 7 Ave, Boulevard de l'Umuganda, Kimihurura"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Latitude (GPS) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={lat}
                      onChange={(e) => setLat(parseFloat(e.target.value))}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Longitude (GPS) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={lng}
                      onChange={(e) => setLng(parseFloat(e.target.value))}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-slate-800"
                    />
                  </div>
                </div>

                {/* Interactive Geofence Radar Preview */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-900 text-white space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-[#28D17C] animate-pulse" />
                      <span className="text-xs font-semibold">Proximity Geofence Radar</span>
                    </div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-[#28D17C] border border-[#28D17C]/30">
                      {geofenceRadiusMeters} meters
                    </span>
                  </div>

                  {/* SVG Radar Visualizer */}
                  <div className="relative w-full h-36 bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
                    <svg className="w-full h-full" viewBox="0 0 300 150">
                      <defs>
                        <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#28D17C" stopOpacity="0.35" />
                          <stop offset="70%" stopColor="#28D17C" stopOpacity="0.08" />
                          <stop offset="100%" stopColor="#28D17C" stopOpacity="0" />
                        </radialGradient>
                      </defs>

                      {/* Radar Rings */}
                      <circle cx="150" cy="75" r="25" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                      <circle cx="150" cy="75" r="45" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                      <circle cx="150" cy="75" r="65" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />

                      {/* Crosshairs */}
                      <line x1="150" y1="10" x2="150" y2="140" stroke="#1e293b" strokeWidth="1" />
                      <line x1="40" y1="75" x2="260" y2="75" stroke="#1e293b" strokeWidth="1" />

                      {/* Dynamic Geofence Area */}
                      <circle
                        cx="150"
                        cy="75"
                        r={Math.min(65, (geofenceRadiusMeters / 500) * 60 + 10)}
                        fill="url(#radarGlow)"
                        stroke="#28D17C"
                        strokeWidth="2"
                        className="transition-all duration-200"
                      />

                      {/* Center Point */}
                      <circle cx="150" cy="75" r="4" fill="#28D17C" />
                      <circle cx="150" cy="75" r="8" fill="none" stroke="#28D17C" strokeWidth="1" opacity="0.6" />
                    </svg>

                    <div className="absolute bottom-2 left-3 text-[10px] text-slate-400 font-mono">
                      LAT: {lat || 0} | LNG: {lng || 0}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Threshold Range</span>
                      <span className="font-mono text-[#28D17C]">50m - 500m</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="500"
                      step="10"
                      value={geofenceRadiusMeters}
                      onChange={(e) => setGeofenceRadiusMeters(parseInt(e.target.value))}
                      className="w-full accent-[#28D17C] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                      <span>50m (Boutique)</span>
                      <span>150m (Standard)</span>
                      <span>300m (Compound)</span>
                      <span>500m (Resort)</span>
                    </div>
                  </div>
                </div>

                {/* Amenities Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Facility Amenities Included
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {AMENITY_TAGS.map((tag) => {
                      const isSelected = selectedAmenities.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleAmenity(tag)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                            isSelected
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold"
                              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {isSelected && "✓ "}
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Negotiated Payouts & MoMo Rails */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Commercial Payout Matrix & Banking Rails</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Establish per-visit settlement rates, minimum employee benefit tier access rules, and Mobile Money / Bank payout channels.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Agreed Per-Visit Payout Rate (RWF) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-mono font-bold text-slate-400">
                        RWF
                      </span>
                      <input
                        type="number"
                        min="500"
                        step="100"
                        required
                        value={perVisitPayoutRate}
                        onChange={(e) => setPerVisitPayoutRate(parseInt(e.target.value) || 0)}
                        className="w-full pl-12 pr-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono font-bold text-slate-800"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Paid automatically to provider per verified biometric / TOTP visit.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Minimum Benefit Tier Access <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={minBenefitTier}
                      onChange={(e) => setMinBenefitTier(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                    >
                      {BENEFIT_TIERS.map((tier) => (
                        <option key={tier.id} value={tier.id}>
                          {tier.name} — {tier.desc}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Employees below this corporate tier are blocked at check-in with <code className="text-emerald-700">TIER_RESTRICTED</code>.
                    </p>
                  </div>
                </div>

                {/* Bank Rails */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>Commercial Bank Wire Details (Domestic RWF)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Bank of Kigali, I&M Bank, Equity Bank"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Account Name / Holder
                      </label>
                      <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="Legal Entity Registered Name"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="e.g. 00040-069420-11"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-mono text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        SWIFT / BIC Code
                      </label>
                      <input
                        type="text"
                        value={swiftCode}
                        onChange={(e) => setSwiftCode(e.target.value)}
                        placeholder="BKIGRWRW"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-mono text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* MTN Mobile Money Rails */}
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                    <Phone className="w-4 h-4 text-amber-600" />
                    <span>Instant Mobile Money Disbursement Rails (MTN MoMo)</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Enables zero-friction instant settlement disbursements directly to provider MoMo merchant accounts.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-amber-900 mb-1">
                        MTN MoMo Merchant Code
                      </label>
                      <input
                        type="text"
                        value={momoCode}
                        onChange={(e) => setMomoCode(e.target.value)}
                        placeholder="e.g. MOMO-991823"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-200 bg-white font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-amber-900 mb-1">
                        MoMo Authorized Phone
                      </label>
                      <input
                        type="tel"
                        value={momoPhone}
                        onChange={(e) => setMomoPhone(e.target.value)}
                        placeholder="+250 788 112 233"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-200 bg-white font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 rounded-lg bg-[#0B1F33] hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Provisioning Partner...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Partner Onboarding</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
