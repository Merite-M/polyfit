"use client";

import React, { useEffect, useRef } from "react";
import { useOperationsDrawer } from "@/contexts/OperationsDrawerContext";
import { EmployerContractDrawer } from "./EmployerContractDrawer";
import { ProviderDossierDrawer } from "./ProviderDossierDrawer";
import { VisitDetailDrawer } from "./VisitDetailDrawer";
import { InvoiceSettlementDrawer } from "./InvoiceSettlementDrawer";
import { 
  X, 
  Building2, 
  Network, 
  MapPin, 
  User, 
  Activity, 
  FileText,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { formatCurrencyDisplay } from "@/lib/utils";

export function SlideOverDrawerHost() {
  const { drawerState, closeDrawer } = useOperationsDrawer();
  const dialogRef = useRef<HTMLDialogElement>(null);

  // If organization type, delegate directly to the dedicated EmployerContractDrawer (PF-118)
  if (drawerState.isOpen && drawerState.type === "organization" && drawerState.id) {
    return (
      <EmployerContractDrawer
        isOpen={drawerState.isOpen}
        onClose={closeDrawer}
        clientId={drawerState.id}
        initialData={drawerState.data}
      />
    );
  }

  // If provider or location type, delegate directly to the dedicated ProviderDossierDrawer (PF-119)
  const targetProviderId = drawerState.type === "provider" 
    ? drawerState.id 
    : drawerState.type === "location" 
      ? (drawerState.data?.providerId || drawerState.id) 
      : null;

  if (drawerState.isOpen && (drawerState.type === "provider" || drawerState.type === "location") && targetProviderId) {
    return (
      <ProviderDossierDrawer
        isOpen={drawerState.isOpen}
        onClose={closeDrawer}
        providerId={targetProviderId}
        initialData={drawerState.data}
      />
    );
  }

  // If visit type, delegate directly to the dedicated VisitDetailDrawer (PF-120)
  if (drawerState.isOpen && drawerState.type === "visit" && drawerState.id) {
    return (
      <VisitDetailDrawer
        isOpen={drawerState.isOpen}
        onClose={closeDrawer}
        visitId={drawerState.id}
        initialData={drawerState.data}
      />
    );
  }

  // If invoice or settlement type, delegate directly to InvoiceSettlementDrawer (PF-121)
  if (drawerState.isOpen && (drawerState.type === "invoice" || drawerState.type === "settlement") && drawerState.id) {
    return (
      <InvoiceSettlementDrawer
        isOpen={drawerState.isOpen}
        onClose={closeDrawer}
        entityType={drawerState.type}
        entityId={drawerState.id}
        initialData={drawerState.data}
      />
    );
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (drawerState.isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [drawerState.isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      closeDrawer();
    }
  };

  const { type, id, data } = drawerState;

  const renderIcon = () => {
    switch (type) {
      case "organization": return <Building2 className="w-5 h-5 text-indigo-500" />;
      case "provider": return <Network className="w-5 h-5 text-emerald-500" />;
      case "location": return <MapPin className="w-5 h-5 text-teal-500" />;
      case "employee": return <User className="w-5 h-5 text-blue-500" />;
      case "visit": return <Activity className="w-5 h-5 text-amber-500" />;
      case "invoice": return <FileText className="w-5 h-5 text-purple-500" />;
      default: return null;
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onCancel={(e) => {
        e.preventDefault();
        closeDrawer();
      }}
      className="backdrop:bg-black/40 backdrop:backdrop-blur-xs bg-transparent p-0 m-0 w-full h-full max-w-none max-h-none border-none outline-none overflow-hidden"
    >
      <div className="w-full h-full flex justify-end">
        <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                {renderIcon()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    {type}
                  </span>
                  <span className="font-mono text-xs text-slate-400">ID: {id?.substring(0, 8)}...</span>
                </div>
                <h3 className="text-sm font-bold text-[#0B1F33] truncate max-w-xs mt-0.5">
                  {drawerState.title}
                </h3>
              </div>
            </div>
            <button
              onClick={closeDrawer}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
            {/* Entity Quick Specs */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[10px]">
                Quick Attributes
              </h4>

              {type === "organization" && (
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Legal Name</span>
                    <span className="font-semibold text-slate-800">{data?.title || data?.name || "Client"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Tax ID (TIN)</span>
                    <span className="font-mono text-slate-800">{data?.taxId || data?.tax_id || "RRA-Pending"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Contact Email</span>
                    <span className="font-mono text-slate-800">{data?.contactEmail || data?.contact_email || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Contract Status</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px]">
                      {data?.status || "Active"}
                    </span>
                  </div>
                </div>
              )}

              {type === "provider" && (
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Trade Name</span>
                    <span className="font-semibold text-slate-800">{data?.title || data?.name || "Provider"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Category</span>
                    <span className="uppercase font-semibold text-slate-800">{data?.category || "Gym"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Settlement Email</span>
                    <span className="font-mono text-slate-800">{data?.contactEmail || data?.settlement_email || "finance@provider.rw"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">KYC Status</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px]">
                      {data?.status || "Verified"}
                    </span>
                  </div>
                </div>
              )}

              {type === "location" && (
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Facility Venue</span>
                    <span className="font-semibold text-slate-800">{data?.title || data?.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Provider</span>
                    <span className="font-semibold text-slate-800">{data?.providerName || "Wellness Network"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">District / City</span>
                    <span className="text-slate-800">{data?.city || "Kigali"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Physical Address</span>
                    <span className="text-slate-800 text-right max-w-[200px] truncate">{data?.address || "Kigali City Center"}</span>
                  </div>
                </div>
              )}

              {type === "employee" && (
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Full Name</span>
                    <span className="font-semibold text-slate-800">{data?.title || data?.full_name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Corporate Email</span>
                    <span className="font-mono text-slate-800">{data?.email || "employee@corp.rw"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Employer Organization</span>
                    <span className="font-semibold text-slate-800">{data?.orgName || "Corporate Partner"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Benefit Tier</span>
                    <span className="uppercase font-mono text-[#008A4B] font-bold">{data?.tier || "Standard"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Roster Status</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px]">
                      {data?.status || "Active"}
                    </span>
                  </div>
                </div>
              )}

              {type === "visit" && (
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Visit Ref</span>
                    <span className="font-mono text-slate-800">{id?.substring(0, 16)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Verification</span>
                    <span className="font-semibold text-slate-800">{data?.method || "TOTP QR"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Beneficiary</span>
                    <span className="font-semibold text-slate-800">{data?.employeeName || "Verified Employee"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Status</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px]">
                      {data?.status || "Verified"}
                    </span>
                  </div>
                </div>
              )}

              {type === "invoice" && (
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Invoice Number</span>
                    <span className="font-mono font-semibold text-slate-800">{data?.title || "INV-2026-001"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Total Billed</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatCurrencyDisplay(Number(data?.amount || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Client Organization</span>
                    <span className="font-semibold text-slate-800">{data?.orgName || "Corporate Client"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Payment Status</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-[10px]">
                      {data?.status || "Sent"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Zero-Silo Covenant: Deep Link Action */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#28D17C]" />
                <span>Operational Actions</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Execute deep edits, rate amendments, or account resets directly within the corresponding module.
              </p>
              
              <div className="pt-2">
                {type === "organization" && (
                  <a
                    href={`/operations/clients?id=${id}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B1F33] hover:bg-slate-800 text-white font-semibold transition-colors"
                  >
                    <span>Open in Contract Builder (PF-118)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {type === "provider" && (
                  <a
                    href={`/operations/providers?id=${id}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B1F33] hover:bg-slate-800 text-white font-semibold transition-colors"
                  >
                    <span>Open Provider Dossier & Payout Matrix (PF-119)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {type === "employee" && (
                  <a
                    href={`/operations/support?id=${id}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B1F33] hover:bg-slate-800 text-white font-semibold transition-colors"
                  >
                    <span>Open User 360 & Device Lock (PF-122)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {type === "visit" && (
                  <a
                    href={`/operations/visits?id=${id}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B1F33] hover:bg-slate-800 text-white font-semibold transition-colors"
                  >
                    <span>Inspect in Live Visit Monitor (PF-120)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {type === "invoice" && (
                  <a
                    href={`/operations/finance?id=${id}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B1F33] hover:bg-slate-800 text-white font-semibold transition-colors"
                  >
                    <span>Inspect in Marketplace Finance (PF-121)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {type === "location" && (
                  <a
                    href={`/operations/providers?id=${data?.providerId}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B1F33] hover:bg-slate-800 text-white font-semibold transition-colors"
                  >
                    <span>View Parent Provider Network (PF-119)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
