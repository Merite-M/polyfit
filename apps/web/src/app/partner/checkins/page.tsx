'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ScanLine,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  UserCheck,
  ClockAlert,
  Building,
  RefreshCw,
  PlusCircle,
  FileSpreadsheet,
  DoorOpen,
  Sparkles
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';
import { apiFetch } from '@/lib/api-client';
import { AntiMisuseBanner } from '@/components/partner/AntiMisuseBanner';
import { PendingCheckinQueue, PendingVisit } from '@/components/partner/PendingCheckinQueue';
import { TodayCheckinFeed, TodayVisit } from '@/components/partner/TodayCheckinFeed';
import { HistoricalCheckinLog } from '@/components/partner/HistoricalCheckinLog';
import { RetroactiveClaimsList } from '@/components/partner/RetroactiveClaimsList';
import { MisuseDisputeModal } from '@/components/partner/MisuseDisputeModal';
import { RejectReasonModal } from '@/components/partner/RejectReasonModal';
import { FrontDeskAccessTerminal } from '@/components/partner/FrontDeskAccessTerminal';

export default function PartnerCheckinsPage() {
  const {
    provider,
    selectedLocation,
    selectedLocationId,
    todaySummary,
    refreshSummary,
    openManualCheckin,
    openRetroactiveClaim,
    notifyCheckinAction,
    globalUpdateTrigger
  } = usePartner();

  // State
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'claims'>('today');
  const [pendingVisits, setPendingVisits] = useState<PendingVisit[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modals state (dispute & reject reason modals remain contextual to specific visit item)
  const [disputeTargetVisit, setDisputeTargetVisit] = useState<TodayVisit | null>(null);
  const [rejectTargetVisit, setRejectTargetVisit] = useState<PendingVisit | null>(null);

  // Success alert toast
  const [actionAlert, setActionAlert] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setActionAlert({ message, type });
    setTimeout(() => setActionAlert(null), 4000);
  };

  // Fetch live pending queue from backend
  const fetchPendingQueue = useCallback(async () => {
    try {
      const locParam = selectedLocationId !== 'all' ? `?provider_location_id=${selectedLocationId}` : '';
      const res = await apiFetch<{ success: boolean; pending_visits: PendingVisit[] }>(
        `/api/visits/pending${locParam}`
      );

      if (res?.pending_visits && Array.isArray(res.pending_visits)) {
        setPendingVisits(res.pending_visits);
      } else {
        setPendingVisits([]);
      }
    } catch (err) {
      console.warn('[PartnerCheckins] Pending queue network notice:', err);
      setPendingVisits([]);
    }
  }, [selectedLocationId]);

  // Initial fetch, 10s auto-refresh, and global reactive sync
  useEffect(() => {
    fetchPendingQueue();
    const interval = setInterval(fetchPendingQueue, 10000);
    return () => clearInterval(interval);
  }, [fetchPendingQueue, refreshTrigger, globalUpdateTrigger]);

  const handleManualRefreshAll = async () => {
    setIsRefreshing(true);
    await Promise.allSettled([refreshSummary(), fetchPendingQueue()]);
    setRefreshTrigger((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleApproveSuccess = (visitId: string) => {
    setPendingVisits((prev) => prev.filter((v) => v.id !== visitId));
    notifyCheckinAction('approved');
    setRefreshTrigger((prev) => prev + 1);
    showToast('Check-in approved! Visit verified for monthly payout.');
  };

  const handleRejectSuccess = (visitId: string) => {
    setPendingVisits((prev) => prev.filter((v) => v.id !== visitId));
    notifyCheckinAction('rejected');
    setRefreshTrigger((prev) => prev + 1);
    showToast('Check-in declined. Reason recorded in attendance log.', 'info');
  };

  const handleDisputeSuccess = (visitId: string, reason?: string) => {
    notifyCheckinAction('disputed');
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('polyfit_partner_today_visits');
        if (cached) {
          const parsed: TodayVisit[] = JSON.parse(cached);
          const updated = parsed.map((v) =>
            v.id === visitId
              ? {
                  ...v,
                  status: 'disputed' as const,
                  is_disputed: true,
                  dispute_reason: reason || 'beneficiary_impersonation'
                }
              : v
          );
          localStorage.setItem('polyfit_partner_today_visits', JSON.stringify(updated));
        }
      } catch {}
    }
    setRefreshTrigger((prev) => prev + 1);
    showToast('Check-in flagged for PolyFit dispute review.', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert Banner */}
      {actionAlert && (
        <div className="bg-[#0B1F33] text-white px-4 py-3 rounded-xl border border-[#28D17C]/40 shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#28D17C] flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium">{actionAlert.message}</span>
          </div>
          <button
            onClick={() => setActionAlert(null)}
            className="text-[#8491A3] hover:text-white text-xs font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Operations Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8491A3]">
            <span>PolyFit Partner Network</span>
            <span>/</span>
            <span className="text-[#0B1F33]">Check-in Operations</span>
            {selectedLocation && (
              <>
                <span>/</span>
                <span className="text-[#28D17C] font-bold">{selectedLocation.name}</span>
              </>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B1F33] tracking-tight mt-1">
            Front Desk &amp; Access Verification
          </h1>
          <p className="text-xs sm:text-sm text-[#526173] mt-0.5">
            Manage corporate member entrance verification, real-time 20-minute approval queue, and payout tracking.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={openManualCheckin}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] font-bold text-xs sm:text-sm transition-colors shadow-xs"
            title="Manual check-in backup by Member ID or 6-digit passcode"
          >
            <UserCheck className="w-4 h-4" />
            <span>Manual Check-in</span>
          </button>

          <button
            onClick={openRetroactiveClaim}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F1F4F8] text-[#0B1F33] font-semibold text-xs sm:text-sm border border-[#E2E8F0] transition-colors shadow-xs"
            title="Submit a missed check-in or offline entry claim"
          >
            <ClockAlert className="w-4 h-4 text-[#F59E0B]" />
            <span>Missed Check-in Claim</span>
          </button>

          <button
            onClick={handleManualRefreshAll}
            title="Refresh all metrics and queues"
            className="p-2 rounded-xl bg-white hover:bg-[#F1F4F8] text-[#526173] border border-[#E2E8F0] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#28D17C]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Front-Desk Rapid Access Terminal (Peak Rush Hour: sub-200ms verification) */}
      <FrontDeskAccessTerminal
        onVerificationSuccess={(visitId) => {
          handleApproveSuccess(visitId);
          handleManualRefreshAll();
        }}
        onOpenDispute={(fakeVisit) => setDisputeTargetVisit(fakeVisit)}
        onOpenManualBackup={openManualCheckin}
      />

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Verified Visits */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#8491A3] text-xs font-semibold">
            <span>Verified Visits Today</span>
            <CheckCircle2 className="w-4 h-4 text-[#28D17C]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] mt-2">
            {todaySummary?.total_visits_today ?? 18}
          </div>
          <div className="text-[11px] text-[#28D17C] font-semibold mt-1 flex items-center gap-1">
            <span>Corporate Members</span>
          </div>
        </div>

        {/* Metric 2: Accrued Settlement */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#8491A3] text-xs font-semibold">
            <span>Reconciled Payout Today</span>
            <Receipt className="w-4 h-4 text-[#00D2B4]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] font-mono mt-2">
            {(todaySummary?.settlement_earned_today ?? 90000).toLocaleString()}{' '}
            <span className="text-sm font-sans font-semibold text-[#8491A3]">RWF</span>
          </div>
          <div className="text-[11px] text-[#526173] font-medium mt-1">
            5,000 RWF / verified visit
          </div>
        </div>

        {/* Metric 3: Pending in Queue */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#8491A3] text-xs font-semibold">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] mt-2 flex items-baseline gap-2">
            <span>{pendingVisits.length}</span>
            {pendingVisits.length > 0 && (
              <span className="text-xs font-bold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-full animate-pulse">
                20m Window
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#8491A3] mt-1">
            Awaiting front-desk validation
          </div>
        </div>

        {/* Metric 4: Disputed / Flagged */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#8491A3] text-xs font-semibold">
            <span>Flagged Entries</span>
            <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] mt-2">
            {todaySummary?.disputed_count ?? 0}
          </div>
          <div className="text-[11px] text-[#8491A3] mt-1">
            Under PolyFit Ops Review
          </div>
        </div>
      </div>

      {/* Pending Check-ins Queue (20-min Validation Window) - Top Front-Desk Priority */}
      <PendingCheckinQueue
        pendingVisits={pendingVisits}
        onApproveSuccess={handleApproveSuccess}
        onRejectClick={(visit) => setRejectTargetVisit(visit)}
        onRefresh={fetchPendingQueue}
      />

      {/* Anti-Misuse Policy Banner */}
      <AntiMisuseBanner onOpenDisputeModal={() => setDisputeTargetVisit({ id: 'general-flag' } as any)} />

      {/* Tab Switcher */}
      <div className="border-b border-[#E2E8F0] flex items-center justify-between">
        <div className="flex items-center gap-1 sm:gap-4">
          <button
            onClick={() => setActiveTab('today')}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'today'
                ? 'border-[#28D17C] text-[#0B1F33]'
                : 'border-transparent text-[#526173] hover:text-[#0B1F33]'
            }`}
          >
            <ScanLine className="w-4 h-4 text-[#28D17C]" />
            <span>Today's Live Feed</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-[#28D17C] text-[#0B1F33]'
                : 'border-transparent text-[#526173] hover:text-[#0B1F33]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-[#00D2B4]" />
            <span>Attendance Log &amp; CSV</span>
          </button>

          <button
            onClick={() => setActiveTab('claims')}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'claims'
                ? 'border-[#28D17C] text-[#0B1F33]'
                : 'border-transparent text-[#526173] hover:text-[#0B1F33]'
            }`}
          >
            <ClockAlert className="w-4 h-4 text-[#F59E0B]" />
            <span>Missed &amp; Offline Claims</span>
          </button>
        </div>
      </div>

      {/* Active Tab Body */}
      {activeTab === 'today' && (
        <TodayCheckinFeed
          onFlagDispute={(visit) => setDisputeTargetVisit(visit)}
          refreshTrigger={refreshTrigger}
        />
      )}

      {activeTab === 'history' && <HistoricalCheckinLog />}

      {activeTab === 'claims' && (
        <RetroactiveClaimsList
          onOpenNewClaim={openRetroactiveClaim}
          refreshTrigger={refreshTrigger}
        />
      )}

      {/* Contextual Item Modals */}
      <MisuseDisputeModal
        visit={disputeTargetVisit}
        isOpen={!!disputeTargetVisit}
        onClose={() => setDisputeTargetVisit(null)}
        onSuccess={handleDisputeSuccess}
      />

      <RejectReasonModal
        visit={rejectTargetVisit}
        isOpen={!!rejectTargetVisit}
        onClose={() => setRejectTargetVisit(null)}
        onSuccess={handleRejectSuccess}
      />
    </div>
  );
}
