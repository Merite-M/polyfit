'use client';

import React, { useState } from 'react';
import {
  X,
  ClockAlert,
  ZapOff,
  WifiOff,
  BatteryCharging,
  Compass,
  Building,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Info
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';
import { apiFetch } from '@/lib/api-client';

interface RetroactiveClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RetroactiveClaimModal({ isOpen, onClose, onSuccess }: RetroactiveClaimModalProps) {
  const { locations, selectedLocationId } = usePartner();
  const [incidentDate, setIncidentDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
  });
  const [locationId, setLocationId] = useState(
    selectedLocationId !== 'all' ? selectedLocationId : locations[0]?.id || ''
  );
  const [employeeIdentifier, setEmployeeIdentifier] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [reason, setReason] = useState('power_outage');
  const [evidenceRef, setEvidenceRef] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  // Check 2nd of the month policy locally for immediate UX feedback
  const isCutoffExceeded = () => {
    const dateObj = new Date(incidentDate);
    const now = new Date();
    const isPreviousMonth =
      dateObj.getFullYear() < now.getFullYear() ||
      (dateObj.getFullYear() === now.getFullYear() && dateObj.getMonth() < now.getMonth());

    if (isPreviousMonth && now.getDate() > 2) {
      return true;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeIdentifier.trim()) {
      setErrorMsg('Please specify employee code or email');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);

      const res = await apiFetch<{ success: boolean; claim: any }>('/api/visits/retroactive-claim', {
        method: 'POST',
        body: JSON.stringify({
          provider_location_id: locationId || locations[0]?.id,
          employee_identifier: employeeIdentifier.trim(),
          employee_name: employeeName.trim(),
          incident_date: new Date(incidentDate).toISOString(),
          reason,
          evidence_ref: evidenceRef.trim(),
          notes: notes.trim()
        })
      });

      if (res?.success) {
        setIsSuccess(true);
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit exception claim');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setEmployeeIdentifier('');
    setEmployeeName('');
    setEvidenceRef('');
    setNotes('');
    setErrorMsg(null);
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-[#E2E8F0] overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center border border-[#FDE68A]">
              <ClockAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#0B1F33] text-sm">Submit Missed Check-in Claim</h3>
              <p className="text-[11px] text-[#526173]">Power blackout & technical outage reconciliation</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1 rounded-lg text-[#8491A3] hover:text-[#0B1F33] hover:bg-[#E2E8F0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {isSuccess ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#E9FAF2] text-[#28D17C] mx-auto flex items-center justify-center border border-[#28D17C]/30 shadow-xs animate-in zoom-in duration-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-[#0B1F33]">Claim Submitted Successfully</h4>
              <p className="text-xs text-[#526173] mt-1">
                Your exception claim for <strong className="text-[#0B1F33]">{employeeIdentifier}</strong> has been logged for
                PolyFit Operations review.
              </p>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 text-xs text-[#526173] text-left space-y-1">
              <div className="flex justify-between">
                <span>Settlement Value:</span>
                <strong className="text-[#0B1F33] font-mono">5,000 RWF</strong>
              </div>
              <div className="flex justify-between">
                <span>Cut-off Compliance:</span>
                <strong className="text-[#28D17C]">Compliant (On/Before 2nd)</strong>
              </div>
              <div className="flex justify-between">
                <span>Audit Schedule:</span>
                <span className="text-[#0B1F33]">Credited on 15th Monthly Payout</span>
              </div>
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full py-2.5 rounded-xl bg-[#0B1F33] hover:bg-[#122A44] text-white text-xs font-bold transition-colors shadow-xs"
            >
              Done & Return to Claims
            </button>
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            {/* Policy Explainer Box */}
            <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-xs text-[#1E40AF] flex items-start gap-2.5">
              <Info className="w-4 h-4 flex-shrink-0 text-[#2563EB] mt-0.5" />
              <div>
                <strong className="font-semibold block text-[#1E3A8A]">Reconciliation Proof Standards:</strong>
                To protect against false claims, providers must provide either a utility outage reference (REG / ISP
                ticket) or a physical reception sign-in ledger log reference. PolyFit Ops audits all claims before
                releasing payment on the 15th.
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-2.5 text-xs text-[#991B1B]">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#EF4444]" />
                <span>{errorMsg}</span>
              </div>
            )}

            {isCutoffExceeded() && (
              <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-2.5 text-xs text-[#991B1B]">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#EF4444]" />
                <div>
                  <strong>Cut-off Period Exceeded:</strong> Claims for previous months must be submitted on or before the
                  2nd day of the following month. This claim will be rejected by policy enforcement.
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#0B1F33] mb-1">
                  Incident Date & Time <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#28D17C] text-[#0B1F33]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1F33] mb-1">
                  Facility Location <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#28D17C] text-[#0B1F33]"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#0B1F33] mb-1">
                  Beneficiary ID / Email <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. BK-8902 or employee email"
                  value={employeeIdentifier}
                  onChange={(e) => setEmployeeIdentifier(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#28D17C] text-[#0B1F33]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1F33] mb-1">
                  Beneficiary Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aline Umutoni"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#28D17C] text-[#0B1F33]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B1F33] mb-1">
                Outage / Disruption Reason <span className="text-[#EF4444]">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#28D17C] text-[#0B1F33]"
              >
                <option value="power_outage">⚡ Facility Grid Blackout / Generator switchover delay</option>
                <option value="isp_cut">🌐 Fiber Cable Cut / Telecom 4G/5G mobile outage</option>
                <option value="device_battery_dead">🔋 Beneficiary phone battery depleted at entrance</option>
                <option value="geofence_drift">📍 GPS Geofence drift / location jitter prevented check-in</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B1F33] mb-1">
                Evidence Reference (Ticket / Ledger Number)
              </label>
              <input
                type="text"
                placeholder="e.g. REG-OUTAGE-29012, or Paper Ledger Page #42"
                value={evidenceRef}
                onChange={(e) => setEvidenceRef(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#28D17C] text-[#0B1F33]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B1F33] mb-1">
                Incident Description & Context
              </label>
              <textarea
                rows={2}
                placeholder="Describe the circumstance and how identity was verified (national ID, badge, staff witness)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#28D17C] text-[#0B1F33]"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#526173] hover:bg-[#F1F4F8] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || isCutoffExceeded()}
                className="flex-1 py-2.5 rounded-xl bg-[#0B1F33] hover:bg-[#122A44] text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <span>Submitting Claim...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-[#28D17C]" />
                    <span>Submit to Ops</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
