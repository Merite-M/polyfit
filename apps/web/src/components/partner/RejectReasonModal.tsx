'use client';

import React, { useState } from 'react';
import {
  X,
  XCircle,
  AlertCircle,
  UserX,
  ShieldX
} from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { PendingVisit } from './PendingCheckinQueue';

interface RejectReasonModalProps {
  visit: PendingVisit | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (visitId: string) => void;
}

export function RejectReasonModal({
  visit,
  isOpen,
  onClose,
  onSuccess
}: RejectReasonModalProps) {
  const [reason, setReason] = useState('not_present');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !visit) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setErrorMsg(null);

      await apiFetch<{ success: boolean; visit: any }>(`/api/visits/${visit.id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({
          reason,
          notes: notes.trim()
        })
      });

      onSuccess(visit.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reject check-in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-[#E2E8F0] overflow-hidden">
        {/* Header */}
        <div className="bg-[#FEF2F2] border-b border-[#FECACA] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white text-[#EF4444] flex items-center justify-center border border-[#FECACA]">
              <UserX className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#991B1B] text-sm">Reject Check-in Intent</h3>
              <p className="text-[11px] text-[#B91C1C]">Decline admission for this beneficiary session</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#991B1B] hover:bg-[#FEE2E2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-[#526173]">Beneficiary:</span>
              <strong className="text-[#0B1F33]">
                {visit.employees?.full_name || 'Beneficiary'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#526173]">Corporate Client:</span>
              <span className="text-[#0B1F33] font-medium">
                {visit.organizations?.name || 'Corporate Partner'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0B1F33] mb-1">
              Rejection Classification <span className="text-[#EF4444]">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EF4444] text-[#0B1F33]"
            >
              <option value="not_present">
                Beneficiary Not Physically Present at Facility
              </option>
              <option value="wrong_location">
                Wrong Branch / Attempting Check-in at Ineligible Location
              </option>
              <option value="id_mismatch">
                Presented Photo/ID Does Not Match Benefit Record
              </option>
              <option value="capacity_limit">
                Facility at Peak Capacity (Safety Limit Reached)
              </option>
              <option value="other">Other Operational Policy Restriction</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0B1F33] mb-1">
              Counter Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Beneficiary left counter before confirmation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EF4444] text-[#0B1F33]"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#526173] hover:bg-[#F1F4F8] transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isLoading ? <span>Rejecting...</span> : <span>Confirm Rejection</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
