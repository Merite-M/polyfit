'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  Building,
  CheckCircle2,
  AlertCircle,
  FileWarning
} from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { TodayVisit } from './TodayCheckinFeed';

interface MisuseDisputeModalProps {
  visit: TodayVisit | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (visitId: string) => void;
}

export function MisuseDisputeModal({
  visit,
  isOpen,
  onClose,
  onSuccess
}: MisuseDisputeModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState('beneficiary_impersonation');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synchronize native <dialog> with React isOpen prop
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && visit) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen, visit]);

  // Progressive Fallback for Light-Dismiss (Modern Web Guidance)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );

      if (!isDialogContent) {
        onClose();
      }
    };

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener('click', handleBackdropClick);
    dialog.addEventListener('cancel', handleCancel);

    return () => {
      dialog.removeEventListener('click', handleBackdropClick);
      dialog.removeEventListener('cancel', handleCancel);
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visit) return;

    try {
      setIsLoading(true);
      setErrorMsg(null);

      await apiFetch<{ success: boolean; dispute: any }>(`/api/visits/${visit.id}/dispute`, {
        method: 'POST',
        body: JSON.stringify({
          dispute_reason: reason,
          notes: notes.trim()
        })
      });

      onSuccess(visit.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit misuse dispute');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as any)}
      aria-labelledby="dispute-modal-title"
      aria-describedby="dispute-modal-desc"
      className="pf-native-dialog bg-white rounded-2xl shadow-modal border border-[#E2E8F0] overflow-hidden p-0 max-w-md w-[calc(100%-2rem)]"
      onClose={onClose}
    >
      <div className="bg-white w-full overflow-hidden">
        {/* Header */}
        <div className="bg-[#FEF2F2] border-b border-[#FECACA] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white text-[#EF4444] flex items-center justify-center border border-[#FECACA]">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 id="dispute-modal-title" className="font-bold text-[#991B1B] text-sm">
                Flag Check-in Misuse
              </h3>
              <p id="dispute-modal-desc" className="text-[11px] text-[#B91C1C]">
                Report fraudulent benefit usage or pass-sharing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#991B1B] hover:bg-[#FEE2E2] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        {visit && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Visit Summary Card */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#526173]">Beneficiary:</span>
                <strong className="text-[#0B1F33]">
                  {visit.employees?.full_name || 'Beneficiary'} (
                  {visit.employees?.employee_id_external || 'ID'})
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#526173]">Corporate Client:</span>
                <span className="text-[#0B1F33] font-medium">
                  {visit.organizations?.name || 'Corporate Partner'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#526173]">Time:</span>
                <span className="text-[#0B1F33] font-mono">
                  {new Date(visit.check_in_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="dispute-reason-select" className="block text-xs font-bold text-[#0B1F33] mb-1">
                Misuse Classification <span className="text-[#EF4444]">*</span>
              </label>
              <select
                id="dispute-reason-select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EF4444] text-[#0B1F33]"
              >
                <option value="beneficiary_impersonation">
                  Beneficiary Impersonation (Pass lent to non-employee)
                </option>
                <option value="repeated_tap_same_day">
                  Repeated Tap / Anti-Passback Breach
                </option>
                <option value="no_show_ghost_checkin">
                  Ghost Check-in (App activated without entering facility)
                </option>
                <option value="staff_collusion">
                  Suspected Staff Override Collusion
                </option>
                <option value="other">Other Operational Policy Violation</option>
              </select>
            </div>

            <div>
              <label htmlFor="dispute-notes-textarea" className="block text-xs font-bold text-primary mb-1">
                Staff Observation & Evidence <span className="text-error">*</span>
              </label>
              <textarea
                id="dispute-notes-textarea"
                placeholder="Describe what occurred at the counter (e.g. presented physical ID name did not match app profile, photo mismatch, CCTV timestamp)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required
                className="pf-textarea-sm w-full px-3 py-2 text-xs sm:text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-error text-foreground"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#526173] hover:bg-[#F1F4F8] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <span>Submitting Dispute...</span>
                ) : (
                  <>
                    <FileWarning className="w-4 h-4" />
                    <span>Submit Dispute</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}

