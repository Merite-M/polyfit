'use client';

import React, { useState } from 'react';
import {
  X,
  UserCheck,
  Building,
  CheckCircle2,
  AlertCircle,
  DoorOpen,
  Sparkles,
  Search,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';
import { apiFetch } from '@/lib/api-client';

interface ManualCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManualCheckinModal({ isOpen, onClose, onSuccess }: ManualCheckinModalProps) {
  const { locations, selectedLocationId } = usePartner();
  const [identifier, setIdentifier] = useState('');
  const [locationId, setLocationId] = useState(
    selectedLocationId !== 'all' ? selectedLocationId : locations[0]?.id || ''
  );
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    beneficiaryName: string;
    orgName: string;
    rate: number;
    relayMs: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg('Please enter beneficiary code, work email, or ID number');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);

      // 1. Submit manual intent
      const intentRes = await apiFetch<{
        success: boolean;
        visit: { id: string; employees?: { full_name?: string }; organizations?: { name?: string } };
        requires_partner_approval?: boolean;
      }>('/api/visits/checkin-intent', {
        method: 'POST',
        body: JSON.stringify({
          employee_identifier: identifier.trim(),
          provider_location_id: locationId || locations[0]?.id,
          verification_method: 'manual',
          notes: notes.trim() || 'Manual counter check-in (phone/scanner backup)'
        })
      });

      if (!intentRes?.visit?.id) {
        throw new Error('Could not create check-in session');
      }

      // 2. Immediately approve manual counter visit
      const approveRes = await apiFetch<{
        success: boolean;
        gate_relay_ms?: number;
        visit?: any;
      }>(`/api/visits/${intentRes.visit.id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ notes: 'Counter staff verified in person' })
      });

      setSuccessResult({
        beneficiaryName: intentRes.visit.employees?.full_name || identifier,
        orgName: intentRes.visit.organizations?.name || 'Corporate Partner',
        rate: 5000,
        relayMs: approveRes?.gate_relay_ms || 3000
      });

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Beneficiary may not have an active corporate benefit.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setIdentifier('');
    setNotes('');
    setErrorMsg(null);
    setSuccessResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-[#E2E8F0] overflow-hidden">
        {/* Header */}
        <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E9FAF2] text-[#28D17C] flex items-center justify-center border border-[#28D17C]/20">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#0B1F33] text-sm">Counter Manual Check-in</h3>
              <p className="text-[11px] text-[#526173]">Direct entry when beneficiary phone is unavailable</p>
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
        {successResult ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#E9FAF2] text-[#28D17C] mx-auto flex items-center justify-center border border-[#28D17C]/30 shadow-xs animate-in zoom-in duration-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-[#0B1F33]">Access Granted!</h4>
              <p className="text-xs text-[#526173] mt-1">
                Corporate benefit verified for <strong className="text-[#0B1F33]">{successResult.beneficiaryName}</strong>
              </p>
            </div>

            {/* Turnstile / Gate Relay Indicator */}
            <div className="bg-[#0B1F33] text-white rounded-xl p-3.5 flex items-center justify-between text-left">
              <div className="flex items-center gap-2.5">
                <DoorOpen className="w-5 h-5 text-[#28D17C] animate-pulse" />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Gate Relay Signal Active</span>
                    <span className="w-2 h-2 rounded-full bg-[#28D17C] animate-ping" />
                  </div>
                  <div className="text-[10px] text-[#8491A3] font-mono">
                    Relay open: {successResult.relayMs}ms pulse
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-[#28D17C]">
                +{successResult.rate.toLocaleString()} RWF
              </span>
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full py-2.5 rounded-xl bg-[#0B1F33] hover:bg-[#122A44] text-white text-xs font-bold transition-colors shadow-xs"
            >
              Done & Return to Feed
            </button>
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-2.5 text-xs text-[#991B1B]">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#EF4444]" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#0B1F33] mb-1">
                Beneficiary Identifier <span className="text-[#EF4444]">*</span>
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-[#8491A3] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter employee ID (e.g. BK-8902) or work email..."
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#28D17C] text-[#0B1F33]"
                />
              </div>
              <p className="text-[11px] text-[#8491A3] mt-1">
                Quick test: try <code className="bg-[#F1F4F8] px-1 py-0.5 rounded text-[#0B1F33]">BK-8902</code> or{' '}
                <code className="bg-[#F1F4F8] px-1 py-0.5 rounded text-[#0B1F33]">a.umutoni@bk.rw</code>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B1F33] mb-1">
                Facility / Branch Location
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

            <div>
              <label className="block text-xs font-bold text-[#0B1F33] mb-1">
                Counter Reason / Staff Note
              </label>
              <input
                type="text"
                placeholder="e.g., Phone battery depleted, screen cracked..."
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
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] text-xs font-bold transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <span>Verifying...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admit Beneficiary</span>
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
