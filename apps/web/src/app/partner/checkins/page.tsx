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
import { ManualCheckinModal } from '@/components/partner/ManualCheckinModal';
import { RetroactiveClaimModal } from '@/components/partner/RetroactiveClaimModal';
import { MisuseDisputeModal } from '@/components/partner/MisuseDisputeModal';
import { RejectReasonModal } from '@/components/partner/RejectReasonModal';

// Fallback pending items to demonstrate the live 20-minute countdown immediately
const DEFAULT_PENDING_QUEUE: PendingVisit[] = [
  {
    id: 'vis-pend-001',
    check_in_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(), // 3 mins ago
    seconds_remaining: 17 * 60, // 17 mins left of 20
    expires_at: new Date(Date.now() + 17 * 60 * 1000).toISOString(),
    employee_id: 'emp-201',
    verification_method: 'totp_qr',
    employees: {
      id: 'emp-201',
      full_name: 'Eric Kwizera',
      email: 'e.kwizera@bk.rw',
      tier: 'Executive',
      department: 'Technology Infrastructure',
      employee_id_external: 'BK-1082'
    },
    organizations: {
      id: 'org-bk',
      name: 'Bank of Kigali Plc'
    },
    provider_locations: {
      id: '447f4bf2-ff66-48c5-851e-460cba17bfe4',
      name: 'Kigali Central Facility'
    }
  },
  {
    id: 'vis-pend-002',
    check_in_at: new Date(Date.now() - 11 * 60 * 1000).toISOString(), // 11 mins ago
    seconds_remaining: 9 * 60, // 9 mins left of 20
    expires_at: new Date(Date.now() + 9 * 60 * 1000).toISOString(),
    employee_id: 'emp-202',
    verification_method: 'turnstile',
    employees: {
      id: 'emp-202',
      full_name: 'Solange Uwase',
      email: 's.uwase@mtn.rw',
      tier: 'Standard',
      department: 'Corporate Accounts',
      employee_id_external: 'MTN-9114'
    },
    organizations: {
      id: 'org-mtn',
      name: 'MTN Rwandacell'
    },
    provider_locations: {
      id: '447f4bf2-ff66-48c5-851e-460cba17bfe4',
      name: 'Kigali Central Facility'
    }
  }
];

export default function PartnerCheckinsPage() {
  const { provider, selectedLocation, selectedLocationId, todaySummary, refreshSummary } = usePartner();

  // State
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'claims'>('today');
  const [pendingVisits, setPendingVisits] = useState<PendingVisit[]>(DEFAULT_PENDING_QUEUE);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modals state
  const [manualCheckinOpen, setManualCheckinOpen] = useState(false);
  const [retroactiveClaimOpen, setRetroactiveClaimOpen] = useState(false);
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

      if (res?.pending_visits && res.pending_visits.length > 0) {
        setPendingVisits(res.pending_visits);
      }
    } catch (err) {
      console.warn('[PartnerCheckins] Pending queue network fallback:', err);
    }
  }, [selectedLocationId]);

  // Initial fetch and 10s auto-refresh for pending queue
  useEffect(() => {
    fetchPendingQueue();
    const interval = setInterval(fetchPendingQueue, 10000);
    return () => clearInterval(interval);
  }, [fetchPendingQueue, refreshTrigger]);

  const handleManualRefreshAll = async () => {
    setIsRefreshing(true);
    await Promise.allSettled([refreshSummary(), fetchPendingQueue()]);
    setRefreshTrigger((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleApproveSuccess = (visitId: string) => {
    setPendingVisits((prev) => prev.filter((v) => v.id !== visitId));
    refreshSummary();
    setRefreshTrigger((prev) => prev + 1);
    showToast('Check-in approved! Gate relay triggered and visit verified for settlement.');
  };

  const handleRejectSuccess = (visitId: string) => {
    setPendingVisits((prev) => prev.filter((v) => v.id !== visitId));
    refreshSummary();
    setRefreshTrigger((prev) => prev + 1);
    showToast('Check-in declined. Operational rejection reason recorded in audit log.', 'info');
  };

  const handleDisputeSuccess = (visitId: string) => {
    setRefreshTrigger((prev) => prev + 1);
    refreshSummary();
    showToast('Check-in flagged for PolyFit Ops dispute investigation.', 'info');
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
            Reception & Access Verification
          </h1>
          <p className="text-xs sm:text-sm text-[#526173] mt-0.5">
            Manage beneficiary entrance verification, real-time 20-minute approval queue, and settlement tracking.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setManualCheckinOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] font-bold text-xs sm:text-sm transition-colors shadow-xs"
            title="Manual check-in backup by Beneficiary ID or 6-digit TOTP code"
          >
            <UserCheck className="w-4 h-4" />
            <span>Manual Check-in</span>
          </button>

          <button
            onClick={() => setRetroactiveClaimOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F1F4F8] text-[#0B1F33] font-semibold text-xs sm:text-sm border border-[#E2E8F0] transition-colors shadow-xs"
            title="Submit a missed check-in technical exception claim"
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
            <span>Corporate Beneficiaries</span>
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
            <span>Flagged Misuse</span>
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
            <span>Historical Log & CSV Export</span>
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
            <span>Technical Claims</span>
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
          onOpenNewClaim={() => setRetroactiveClaimOpen(true)}
          refreshTrigger={refreshTrigger}
        />
      )}

      {/* Contextual Modals */}
      <ManualCheckinModal
        isOpen={manualCheckinOpen}
        onClose={() => setManualCheckinOpen(false)}
        onSuccess={() => {
          refreshSummary();
          setRefreshTrigger((prev) => prev + 1);
          showToast('Counter manual check-in verified and gate opened!');
        }}
      />

      <RetroactiveClaimModal
        isOpen={retroactiveClaimOpen}
        onClose={() => setRetroactiveClaimOpen(false)}
        onSuccess={() => {
          setRefreshTrigger((prev) => prev + 1);
          showToast('Technical exception claim submitted for monthly reconciliation!');
        }}
      />

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
