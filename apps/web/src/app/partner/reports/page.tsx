'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Calendar,
  Building2,
  Users,
  Receipt,
  Download,
  FileSpreadsheet,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Layers,
  Filter
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';
import { apiFetch } from '@/lib/api-client';
import { formatRwf } from '@/lib/invoice-pdf';
import { downloadCsv } from '@/lib/export-csv';
import { generateSettlementPdf } from '@/lib/settlement-pdf';

type ReportTab = 'overview' | 'payment-per-visitor' | 'checkin-details' | 'location-summary';

interface VisitorPaymentRecord {
  location_id: string;
  location_name: string;
  visitor_name: string;
  polyfit_id: string;
  employer_name: string;
  total_checkins: number;
  total_payment: number;
}

interface CheckinDetailRecord {
  id: string;
  date_formatted: string;
  time: string;
  location_id: string;
  location_name: string;
  visitor_name: string;
  polyfit_id: string;
  employer_name: string;
  product: string;
  checkin_period: 'Default' | 'Off-peak';
  checkin_type: 'Mobile App Pass' | 'Turnstile Gate' | 'Front Desk Code';
  payment: number;
}

interface LocationSummaryRecord {
  location_id: string;
  location_name: string;
  checkins: number;
  checkin_amount: number;
  adjustments: number;
  platform_fee: number;
  total_net_payout: number;
}

export default function PartnerReportsPage() {
  const { provider, locations, selectedLocationId, setSelectedLocationId } = usePartner();

  // State: Default to 'overview' so operators land on high-level analytics
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [oneMonthOnly, setOneMonthOnly] = useState(true);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [liveReportData, setLiveReportData] = useState<any | null>(null);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // Sync activeTab with URL search parameters on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      if (tabParam === 'overview') {
        setActiveTab('overview');
      } else if (tabParam === 'payment-per-visitor' || tabParam === 'visitors' || tabParam === 'visitor') {
        setActiveTab('payment-per-visitor');
      } else if (tabParam === 'checkin-details' || tabParam === 'checkins' || tabParam === 'history' || tabParam === 'audit') {
        setActiveTab('checkin-details');
      } else if (tabParam === 'location-summary' || tabParam === 'locations' || tabParam === 'branches') {
        setActiveTab('location-summary');
      }
    }
  }, []);

  // Reactive tab switcher with Modern Web Guidance view transitions and URL sync
  const handleTabChange = (newTab: ReportTab) => {
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        setActiveTab(newTab);
      });
    } else {
      setActiveTab(newTab);
    }

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', newTab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  useEffect(() => {
    if (!provider?.id) return;
    const fetchLiveReports = async () => {
      try {
        setIsLoadingReports(true);
        const res = await apiFetch<any>(
          `/api/reporting/provider/${provider.id}/visits?month=${selectedMonth}`
        );
        if (res) {
          setLiveReportData(res);
        }
      } catch (err) {
        console.warn('[PartnerReports] Live report fetch fallback:', err);
      } finally {
        setIsLoadingReports(false);
      }
    };
    fetchLiveReports();
  }, [provider?.id, selectedMonth]);

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = useMemo(() => {
    const parts = selectedMonth.split('-');
    const m = parseInt(parts[1], 10);
    return isNaN(m) ? 8 : Math.max(0, Math.min(11, m - 1));
  }, [selectedMonth]);
  const currentMonthName = MONTH_NAMES[monthIdx];

  // Live database records with reactive filtering by location
  const filteredVisitorPayments: VisitorPaymentRecord[] = useMemo(() => {
    const rawList: VisitorPaymentRecord[] = liveReportData?.visitorPayments || [];

    if (selectedLocationId !== 'all') {
      const loc = locations.find((l) => l.id === selectedLocationId);
      return rawList.filter((item) => {
        if (loc && item.location_name.toLowerCase().includes(loc.name.split(' ')[0].toLowerCase())) {
          return true;
        }
        return item.location_id === selectedLocationId || selectedLocationId.startsWith(item.location_id);
      });
    }
    return rawList;
  }, [liveReportData, selectedLocationId, locations]);

  const filteredCheckins: CheckinDetailRecord[] = useMemo(() => {
    const rawList: CheckinDetailRecord[] = liveReportData?.checkinDetails || [];

    if (selectedLocationId !== 'all') {
      const loc = locations.find((l) => l.id === selectedLocationId);
      return rawList.filter((item) => {
        if (loc && item.location_name.toLowerCase().includes(loc.name.split(' ')[0].toLowerCase())) {
          return true;
        }
        return item.location_id === selectedLocationId || selectedLocationId.startsWith(item.location_id);
      });
    }
    return rawList;
  }, [liveReportData, selectedLocationId, locations]);

  const filteredLocationSummaries: LocationSummaryRecord[] = useMemo(() => {
    if (liveReportData?.locationSummaries && liveReportData.locationSummaries.length > 0) {
      if (selectedLocationId === 'all') return liveReportData.locationSummaries;
      return liveReportData.locationSummaries.filter((item: LocationSummaryRecord) =>
        item.location_id === selectedLocationId ||
        selectedLocationId.startsWith(item.location_id.substring(0, 8))
      );
    }

    // Dynamic fallback matching registered locations from database with real 0 counts
    const registered = locations.map((loc) => ({
      location_id: `LOC-${loc.id.slice(0, 6).toUpperCase()}`,
      location_name: loc.name,
      checkins: 0,
      checkin_amount: 0,
      adjustments: 0,
      platform_fee: 0,
      total_net_payout: 0
    }));

    if (selectedLocationId === 'all') return registered;
    return registered.filter((item) => item.location_id === selectedLocationId || selectedLocationId.startsWith(item.location_id));
  }, [liveReportData, selectedLocationId, locations]);

  // Totals for Location Summary
  const totals = useMemo(() => {
    return filteredLocationSummaries.reduce(
      (acc, curr) => ({
        checkins: acc.checkins + curr.checkins,
        checkin_amount: acc.checkin_amount + curr.checkin_amount,
        adjustments: acc.adjustments + curr.adjustments,
        platform_fee: acc.platform_fee + curr.platform_fee,
        total_net_payout: acc.total_net_payout + curr.total_net_payout
      }),
      { checkins: 0, checkin_amount: 0, adjustments: 0, platform_fee: 0, total_net_payout: 0 }
    );
  }, [filteredLocationSummaries]);

  // Handlers for Export
  const handleExportCsv = () => {
    if (activeTab === 'payment-per-visitor') {
      downloadCsv(
        `polyfit-payment-per-visitor-${selectedMonth}.csv`,
        [
          { header: 'Branch Code', accessor: (r) => r.location_id },
          { header: 'Facility Location', accessor: (r) => r.location_name },
          { header: 'Corporate Member', accessor: (r) => r.visitor_name },
          { header: 'Member ID', accessor: (r) => r.polyfit_id },
          { header: 'Employer Organization', accessor: (r) => r.employer_name },
          { header: 'Total Check-ins', accessor: (r) => r.total_checkins },
          { header: 'Guaranteed Payout (RWF)', accessor: (r) => r.total_payment }
        ],
        filteredVisitorPayments
      );
    } else if (activeTab === 'checkin-details') {
      downloadCsv(
        `polyfit-checkin-details-${selectedMonth}.csv`,
        [
          { header: 'Date', accessor: (r) => r.date_formatted },
          { header: 'Time', accessor: (r) => r.time },
          { header: 'Branch Code', accessor: (r) => r.location_id },
          { header: 'Facility Location', accessor: (r) => r.location_name },
          { header: 'Corporate Member', accessor: (r) => r.visitor_name },
          { header: 'Member ID', accessor: (r) => r.polyfit_id },
          { header: 'Employer Organization', accessor: (r) => r.employer_name },
          { header: 'Activity', accessor: (r) => r.product },
          { header: 'Period', accessor: (r) => r.checkin_period },
          { header: 'Check-in Method', accessor: (r) => r.checkin_type },
          { header: 'Visit Payout (RWF)', accessor: (r) => r.payment }
        ],
        filteredCheckins
      );
    } else if (activeTab === 'location-summary') {
      downloadCsv(
        `polyfit-branch-summary-${selectedMonth}.csv`,
        [
          { header: 'Branch Code', accessor: (r) => r.location_id },
          { header: 'Facility Location', accessor: (r) => r.location_name },
          { header: 'Total Check-ins', accessor: (r) => r.checkins },
          { header: 'Gross Visit Value (RWF)', accessor: (r) => r.checkin_amount },
          { header: 'Adjustments (RWF)', accessor: (r) => r.adjustments },
          { header: 'PolyFit Service Share (RWF)', accessor: (r) => r.platform_fee },
          { header: 'Net Facility Payout (RWF)', accessor: (r) => r.total_net_payout }
        ],
        filteredLocationSummaries
      );
    } else {
      handleDownloadPdf();
    }
  };

  const handleDownloadPdf = () => {
    generateSettlementPdf({
      id: `report-${selectedMonth}`,
      statement_number: `PF-REP-${selectedMonth.replace('-', '')}`,
      period_start: `${selectedMonth}-01`,
      period_end: `${selectedMonth}-30`,
      total_visits: totals.checkins || 0,
      gross_amount: totals.checkin_amount || 0,
      adjustments_amount: Math.abs(totals.adjustments) || 0,
      platform_fee_amount: Math.abs(totals.platform_fee) || 0,
      net_amount: totals.total_net_payout || 0,
      status: totals.checkins > 0 ? 'paid' : 'pending',
      payout_date: `${selectedMonth}-15`,
      payment_reference: `PF-SET-${selectedMonth.replace('-', '')}`,
      provider: {
        name: provider?.name || 'Wellness Partner',
        category: provider?.category || 'wellness',
        tax_id: provider?.tax_id || '',
        settlement_email: provider?.settlement_email || provider?.contact_email || ''
      }
    });
  };

  // Helper text per tab with human gym operator language
  const getTabHelp = () => {
    switch (activeTab) {
      case 'overview':
        return {
          title: 'Monthly Overview & Visit Volume',
          desc: 'High-level summary of verified member visits, unique corporate guests, and estimated monthly earnings.',
          q: 'What is the Monthly Overview report?',
          a: 'The Overview summarizes your facility visit volume, top employer corporate clients, and estimated monthly settlement payouts.'
        };
      case 'payment-per-visitor':
        return {
          title: 'Earnings per Member / Employee',
          desc: 'Visit count and payout totals grouped by individual corporate employee.',
          q: 'What is the Payment per Visitor report?',
          a: 'This report groups check-in volume by individual corporate member. It lets you see repeat employee check-in volume and exact earnings per employee under corporate wellness plans.'
        };
      case 'checkin-details':
        return {
          title: 'Detailed Check-in Log & Visits',
          desc: 'Itemized chronological log of every verified entry, arrival time, activity, and visit payout.',
          q: 'What is the Detailed Check-in Log?',
          a: 'A complete line-by-line record of every verified entrance. It gives full transparency into peak and off-peak check-ins, entry methods, and per-visit earnings.'
        };
      case 'location-summary':
        return {
          title: 'Branch & Facility Summary',
          desc: 'Financial and visit breakdown across your physical facility locations.',
          q: 'What is the Branch Summary report?',
          a: 'A financial comparison across your physical facility branches, showing check-in totals, gross visit earnings, and net payout distribution.'
        };
    }
  };

  const tabInfo = getTabHelp();

  return (
    <div className="space-y-6 pb-20">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8491A3]">
            <span>PolyFit Partner Network</span>
            <span>/</span>
            <span className="text-[#0B1F33]">Verified Visits &amp; Payout Reports</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B1F33] tracking-tight mt-1">
            Reports &amp; Visit Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#526173] mt-0.5">
            Track your verified visits, corporate member arrivals, and monthly payout statements in one place.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/partner/settlements"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F1F4F8] text-[#0B1F33] text-xs font-semibold border border-[#E2E8F0] transition-colors shadow-xs"
          >
            <Receipt className="w-4 h-4 text-[#28D17C]" />
            <span>Monthly Statements</span>
          </Link>

          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault();
              setIsAccordionOpen(true);
            }}
            className="text-xs text-[#0B1F33] hover:text-[#008A4B] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-[#8491A3]" />
            <span>How it works</span>
          </a>
        </div>
      </div>

      {/* Segmented 4-Tab Navigation Bar with Full Accessibility & URL Reactivity */}
      <div className="border-b border-[#E2E8F0] overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-1 sm:gap-6 min-w-max" role="tablist" aria-label="Partner Reports Tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'overview'}
            onClick={() => handleTabChange('overview')}
            className={`py-3.5 px-3 sm:px-4 text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer relative flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'text-[#0B1F33] font-extrabold'
                : 'text-[#8491A3] hover:text-[#0B1F33]'
            }`}
          >
            <BarChart3 className={`w-4 h-4 ${activeTab === 'overview' ? 'text-[#28D17C]' : 'text-[#8491A3]'}`} />
            <span>Overview</span>
            {activeTab === 'overview' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#28D17C] rounded-t-full" />
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'payment-per-visitor'}
            onClick={() => handleTabChange('payment-per-visitor')}
            className={`py-3.5 px-3 sm:px-4 text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer relative flex items-center gap-2 ${
              activeTab === 'payment-per-visitor'
                ? 'text-[#0B1F33] font-extrabold'
                : 'text-[#8491A3] hover:text-[#0B1F33]'
            }`}
          >
            <Users className={`w-4 h-4 ${activeTab === 'payment-per-visitor' ? 'text-[#28D17C]' : 'text-[#8491A3]'}`} />
            <span>Payment per Visitor</span>
            {activeTab === 'payment-per-visitor' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#28D17C] rounded-t-full" />
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'checkin-details'}
            onClick={() => handleTabChange('checkin-details')}
            className={`py-3.5 px-3 sm:px-4 text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer relative flex items-center gap-2 ${
              activeTab === 'checkin-details'
                ? 'text-[#0B1F33] font-extrabold'
                : 'text-[#8491A3] hover:text-[#0B1F33]'
            }`}
          >
            <FileSpreadsheet className={`w-4 h-4 ${activeTab === 'checkin-details' ? 'text-[#28D17C]' : 'text-[#8491A3]'}`} />
            <span>Check-in Details &amp; Logs</span>
            {activeTab === 'checkin-details' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#28D17C] rounded-t-full" />
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'location-summary'}
            onClick={() => handleTabChange('location-summary')}
            className={`py-3.5 px-3 sm:px-4 text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer relative flex items-center gap-2 ${
              activeTab === 'location-summary'
                ? 'text-[#0B1F33] font-extrabold'
                : 'text-[#8491A3] hover:text-[#0B1F33]'
            }`}
          >
            <Building2 className={`w-4 h-4 ${activeTab === 'location-summary' ? 'text-[#28D17C]' : 'text-[#8491A3]'}`} />
            <span>Branch Summary</span>
            {activeTab === 'location-summary' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#28D17C] rounded-t-full" />
            )}
          </button>
        </nav>
      </div>

      {/* Tab Header Description */}
      <div>
        <h2 className="text-lg font-bold text-[#0B1F33] tracking-tight">{tabInfo.title}</h2>
        <p className="text-xs sm:text-sm text-[#526173] mt-0.5">{tabInfo.desc}</p>
      </div>

      {/* Period & Location Filter Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Period Choice */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#0B1F33] uppercase tracking-wider block">
              Choose a period
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-medium text-[#526173] cursor-pointer">
                <input
                  type="checkbox"
                  checked={oneMonthOnly}
                  onChange={(e) => setOneMonthOnly(e.target.checked)}
                  className="rounded text-[#28D17C] focus:ring-[#28D17C]"
                />
                <span>One month only</span>
              </label>

              <div className="relative inline-block">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="text-xs font-bold font-mono text-[#0B1F33] bg-[#F7F9FC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
                />
              </div>
            </div>
          </div>

          {/* Location Switcher */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#0B1F33] uppercase tracking-wider block">
              Location Filter
            </span>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="text-xs font-semibold text-[#0B1F33] bg-[#F7F9FC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
            >
              <option value="all">All Locations (Network View)</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Expandable "What is this report?" Accordion (Wellhub Style) */}
        <div className="border-t border-[#E2E8F0] pt-3">
          <button
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
            className="flex items-center justify-between w-full text-xs font-bold text-[#0B1F33] hover:text-[#008A4B] transition-colors"
          >
            <span>{tabInfo.q}</span>
            {isAccordionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {isAccordionOpen && (
            <p className="text-xs text-[#526173] mt-2 leading-relaxed bg-[#F7F9FC] p-3 rounded-xl border border-[#E2E8F0]">
              {tabInfo.a}
            </p>
          )}
        </div>
      </div>

      {/* Wellhub Soft Lavender Disclaimer Notice Banner */}
      <div className="bg-[#FAF5FF] border border-[#E9D5FF] rounded-2xl p-4 flex items-center gap-3 shadow-xs">
        <Info className="w-4 h-4 text-[#7C3AED] flex-shrink-0" />
        <span className="text-xs text-[#6D28D9] font-medium">
          Your payment may change when your commercial conditions and contract terms are applied.
        </span>
      </div>

      {/* ── TAB 1: OVERVIEW ─────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
              <span className="text-xs text-[#8491A3] font-semibold">Total Verified Visits</span>
              <div className="text-2xl font-extrabold text-[#0B1F33] font-mono mt-1">
                {totals.checkins.toLocaleString()}
              </div>
              <span className="text-[11px] text-[#008A4B] font-semibold mt-1 block">
                {currentMonthName} Verified Activity
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
              <span className="text-xs text-[#8491A3] font-semibold">Unique Corporate Members</span>
              <div className="text-2xl font-extrabold text-[#0B1F33] font-mono mt-1">
                {filteredVisitorPayments.length}
              </div>
              <span className="text-[11px] text-[#526173] mt-1 block">Across enrolled employer clients</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
              <span className="text-xs text-[#8491A3] font-semibold">Average Visits / Day</span>
              <div className="text-2xl font-extrabold text-[#0B1F33] font-mono mt-1">
                {(totals.checkins / 30).toFixed(1)}
              </div>
              <span className="text-[11px] text-[#526173] mt-1 block">30-day active rolling period</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
              <span className="text-xs text-[#8491A3] font-semibold">Estimated Net Payout</span>
              <div className="text-2xl font-extrabold text-[#008A4B] font-mono mt-1">
                {formatRwf(totals.total_net_payout)}
              </div>
              <span className="text-[11px] text-[#8491A3] mt-1 block">Net-15 disbursement</span>
            </div>
          </div>

          {/* Corporate Clients Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
            <h3 className="text-sm font-bold text-[#0B1F33] mb-4 uppercase tracking-wider">
              Top Corporate Clients by Check-in Volume
            </h3>
            {(!liveReportData?.visitsByOrganization || liveReportData.visitsByOrganization.length === 0) ? (
              <div className="py-8 text-center">
                <Building2 className="w-8 h-8 text-[#A0AEC0] mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold text-[#526173]">No corporate client visits recorded for this period yet.</p>
                <p className="text-[11px] text-[#8491A3] mt-0.5">Visits from corporate employees will appear here in real-time as check-ins are verified.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {liveReportData.visitsByOrganization.slice(0, 5).map((c: any, idx: number) => {
                  const colors = ['bg-[#28D17C]', 'bg-[#00D2B4]', 'bg-[#3B82F6]', 'bg-[#F59E0B]', 'bg-[#8B5CF6]'];
                  const color = colors[idx % colors.length];
                  return (
                    <div key={c.orgId || c.orgName} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#0B1F33]">{c.orgName}</span>
                        <span className="font-mono text-[#526173]">
                          {c.visitCount} visits ({c.percentageOfVisits}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#F1F4F8] rounded-full overflow-hidden">
                        <div
                          className={`h-full ${color} rounded-full`}
                          style={{ width: `${Math.min(100, Math.max(2, c.percentageOfVisits))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: PAYMENT PER VISITOR (Wellhub Screenshot 1) ───────────────── */}
      {activeTab === 'payment-per-visitor' && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <span className="text-xs font-bold text-[#8491A3] uppercase tracking-wider">
              Verified Visits &amp; Earnings ({filteredVisitorPayments.length} Corporate Members)
            </span>
            <span className="text-[11px] font-mono text-[#526173]">
              Period: {selectedMonth}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F9FC] text-[#526173] font-semibold border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3 px-4">Branch Code</th>
                  <th className="py-3 px-4">Facility Location</th>
                  <th className="py-3 px-4">Corporate Member</th>
                  <th className="py-3 px-4">Member ID</th>
                  <th className="py-3 px-4 text-right">Total Check-ins</th>
                  <th className="py-3 px-4 text-right">Guaranteed Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredVisitorPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="max-w-xs mx-auto text-center space-y-2">
                        <Users className="w-8 h-8 text-[#A0AEC0] mx-auto opacity-50" />
                        <p className="text-sm font-bold text-[#0B1F33]">No Member Visits Recorded</p>
                        <p className="text-xs text-[#8491A3]">
                          No corporate employees have checked in at this location for {selectedMonth}.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVisitorPayments.map((v, i) => (
                    <tr key={i} className="hover:bg-[#F7F9FC]/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-[#526173]">{v.location_id}</td>
                      <td className="py-3 px-4 font-semibold text-[#0B1F33]">{v.location_name}</td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#0B1F33]">{v.visitor_name}</p>
                        <p className="text-[10px] text-[#8491A3]">{v.employer_name}</p>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#526173]">{v.polyfit_id}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#0B1F33]">
                        {v.total_checkins}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#008A4B]">
                        {formatRwf(v.total_payment)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: CHECK-IN DETAILS (Wellhub Screenshot 4) ──────────────────── */}
      {activeTab === 'checkin-details' && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <span className="text-xs font-bold text-[#8491A3] uppercase tracking-wider">
              Chronological Visit Log
            </span>
            <span className="text-[11px] font-mono text-[#526173]">
              Period: {selectedMonth}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F9FC] text-[#526173] font-semibold border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Branch Code</th>
                  <th className="py-3 px-4">Facility Location</th>
                  <th className="py-3 px-4">Corporate Member</th>
                  <th className="py-3 px-4">Member ID</th>
                  <th className="py-3 px-4">Activity</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Check-in Method</th>
                  <th className="py-3 px-4 text-right">Visit Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredCheckins.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center">
                      <div className="max-w-xs mx-auto text-center space-y-2">
                        <FileSpreadsheet className="w-8 h-8 text-[#A0AEC0] mx-auto opacity-50" />
                        <p className="text-sm font-bold text-[#0B1F33]">No Check-in Log Entries</p>
                        <p className="text-xs text-[#8491A3]">
                          Verified visits will populate this chronological ledger in real-time.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCheckins.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F7F9FC]/70 transition-colors">
                      <td className="py-3 px-4 text-[#0B1F33] font-semibold">{c.date_formatted}</td>
                      <td className="py-3 px-4 font-mono text-[#526173]">{c.time}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#526173]">{c.location_id}</td>
                      <td className="py-3 px-4 text-[#0B1F33]">{c.location_name}</td>
                      <td className="py-3 px-4 font-semibold text-[#0B1F33]">{c.visitor_name}</td>
                      <td className="py-3 px-4 font-mono text-[#8491A3]">{c.polyfit_id}</td>
                      <td className="py-3 px-4 text-[#526173]">{c.product}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            c.checkin_period === 'Off-peak'
                              ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                              : 'bg-[#F7F9FC] text-[#526173] border-[#E2E8F0]'
                          }`}
                        >
                          {c.checkin_period}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E9FAF2] text-[#008A4B] border border-[#B7F1D2]">
                          {c.checkin_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#008A4B]">
                        {formatRwf(c.payment)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: LOCATION SUMMARY (Wellhub Screenshot 3) ──────────────────── */}
      {activeTab === 'location-summary' && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <span className="text-xs font-bold text-[#8491A3] uppercase tracking-wider">
              Branch Performance &amp; Payout Summary
            </span>
            <span className="text-[11px] font-mono text-[#526173]">
              Period: {selectedMonth}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F9FC] text-[#526173] font-semibold border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3 px-4">Branch Code</th>
                  <th className="py-3 px-4">Facility Location</th>
                  <th className="py-3 px-4 text-right">Total Check-ins</th>
                  <th className="py-3 px-4 text-right">Gross Visit Value</th>
                  <th className="py-3 px-4 text-right">Adjustments</th>
                  <th className="py-3 px-4 text-right">PolyFit Service Share</th>
                  <th className="py-3 px-4 text-right">Net Facility Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredLocationSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="max-w-xs mx-auto text-center space-y-2">
                        <Building2 className="w-8 h-8 text-[#A0AEC0] mx-auto opacity-50" />
                        <p className="text-sm font-bold text-[#0B1F33]">No Branch Activity Recorded</p>
                        <p className="text-xs text-[#8491A3]">
                          Branch totals will display once facility locations process member visits.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLocationSummaries.map((l) => (
                    <tr key={l.location_id} className="hover:bg-[#F7F9FC]/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#526173]">
                        {l.location_id}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#0B1F33]">{l.location_name}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-[#0B1F33]">
                        {l.checkins}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#526173]">
                        {formatRwf(l.checkin_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#EF4444]">
                        {formatRwf(l.adjustments)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#8491A3]">
                        {formatRwf(l.platform_fee)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#008A4B]">
                        {formatRwf(l.total_net_payout)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-[#F7F9FC] border-t-2 border-[#E2E8F0] font-bold">
                <tr>
                  <td colSpan={2} className="py-3.5 px-4 text-[#0B1F33] uppercase tracking-wider">
                    Total Network Summary
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[#0B1F33]">
                    {totals.checkins}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[#526173]">
                    {formatRwf(totals.checkin_amount)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[#EF4444]">
                    {formatRwf(totals.adjustments)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[#8491A3]">
                    {formatRwf(totals.platform_fee)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-sm text-[#008A4B]">
                    {formatRwf(totals.total_net_payout)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Fixed / Bottom Action Bar (Wellhub Style "Get Report") ───────────── */}
      <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-20 pointer-events-none">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 flex items-center justify-between">
          <div className="hidden sm:block" />
          <div className="pointer-events-auto bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-[#E2E8F0] flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F1F4F8] text-[#0B1F33] font-semibold text-xs transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#00D2B4]" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] font-bold text-xs shadow-md transition-all active:scale-98"
            >
              <Download className="w-4 h-4 text-[#0B1F33]" />
              <span>Get Report (PDF)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
