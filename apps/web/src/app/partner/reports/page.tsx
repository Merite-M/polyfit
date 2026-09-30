'use client';

import React, { useState, useMemo } from 'react';
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
import { formatRwf } from '@/lib/invoice-pdf';
import { downloadCsv } from '@/lib/export-csv';
import { generateSettlementPdf } from '@/lib/settlement-pdf';

type ReportTab = 'overview' | 'payment-per-visitor' | 'checkin-details' | 'location-summary';

// ── Realistic Data Sets for Wellhub 4-Tab Reporting Simulation ───────────────

interface VisitorPaymentRecord {
  location_id: string;
  location_name: string;
  visitor_name: string;
  polyfit_id: string;
  employer_name: string;
  total_checkins: number;
  total_payment: number;
}

const DEFAULT_VISITOR_PAYMENTS: VisitorPaymentRecord[] = [
  { location_id: '447f4bf2-ff66', location_name: 'Kigali Central Facility', visitor_name: 'Eric Kwizera', polyfit_id: 'PF-EMP-1082', employer_name: 'Bank of Kigali Plc', total_checkins: 14, total_payment: 70000 },
  { location_id: '447f4bf2-ff66', location_name: 'Kigali Central Facility', visitor_name: 'Solange Uwase', polyfit_id: 'PF-EMP-9114', employer_name: 'MTN Rwandacell', total_checkins: 11, total_payment: 55000 },
  { location_id: '189e7cb8-155e', location_name: 'Nyarutarama Health Branch', visitor_name: 'Jean-Claude Nzeyimana', polyfit_id: 'PF-EMP-3045', employer_name: 'TechCorp Rwanda', total_checkins: 9, total_payment: 45000 },
  { location_id: '447f4bf2-ff66', location_name: 'Kigali Central Facility', visitor_name: 'Aline Mukamana', polyfit_id: 'PF-EMP-7712', employer_name: 'Bank of Kigali Plc', total_checkins: 8, total_payment: 40000 },
  { location_id: '189e7cb8-155e', location_name: 'Nyarutarama Health Branch', visitor_name: 'Patrick Habimana', polyfit_id: 'PF-EMP-5521', employer_name: 'I&M Bank Rwanda', total_checkins: 7, total_payment: 35000 },
  { location_id: '447f4bf2-ff66', location_name: 'Kigali Central Facility', visitor_name: 'Sandrine Gasana', polyfit_id: 'PF-EMP-6689', employer_name: 'MTN Rwandacell', total_checkins: 7, total_payment: 35000 },
  { location_id: '189e7cb8-155e', location_name: 'Nyarutarama Health Branch', visitor_name: 'David Karekezi', polyfit_id: 'PF-EMP-2210', employer_name: 'TechCorp Rwanda', total_checkins: 6, total_payment: 30000 },
  { location_id: '447f4bf2-ff66', location_name: 'Kigali Central Facility', visitor_name: 'Clarisse Uwineza', polyfit_id: 'PF-EMP-8843', employer_name: 'Bank of Kigali Plc', total_checkins: 6, total_payment: 30000 },
  { location_id: '189e7cb8-155e', location_name: 'Nyarutarama Health Branch', visitor_name: 'Fabrice Mugisha', polyfit_id: 'PF-EMP-4491', employer_name: 'MTN Rwandacell', total_checkins: 5, total_payment: 25000 },
  { location_id: '447f4bf2-ff66', location_name: 'Kigali Central Facility', visitor_name: 'Diane Tuyisenge', polyfit_id: 'PF-EMP-1194', employer_name: 'I&M Bank Rwanda', total_checkins: 5, total_payment: 25000 }
];

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
  checkin_type: 'Visit' | 'Co-Pay' | 'Free Trial';
  payment: number;
}

const DEFAULT_CHECKIN_DETAILS: CheckinDetailRecord[] = [
  { id: 'chk-01', date_formatted: 'Mon Sep 28', time: '07:15', location_id: '447f4bf2-ff66', location_name: 'Kigali Central', visitor_name: 'Eric Kwizera', polyfit_id: 'PF-EMP-1082', employer_name: 'Bank of Kigali', product: 'Weightlifting & Cardio', checkin_period: 'Default', checkin_type: 'Visit', payment: 5000 },
  { id: 'chk-02', date_formatted: 'Mon Sep 28', time: '08:00', location_id: '189e7cb8-155e', location_name: 'Nyarutarama Branch', visitor_name: 'Jean-Claude Nzeyimana', polyfit_id: 'PF-EMP-3045', employer_name: 'TechCorp Rwanda', product: 'Lap Pool & Sauna', checkin_period: 'Default', checkin_type: 'Visit', payment: 5000 },
  { id: 'chk-03', date_formatted: 'Mon Sep 28', time: '12:30', location_id: '447f4bf2-ff66', location_name: 'Kigali Central', visitor_name: 'Solange Uwase', polyfit_id: 'PF-EMP-9114', employer_name: 'MTN Rwandacell', product: 'Cardio Studio', checkin_period: 'Off-peak', checkin_type: 'Visit', payment: 5000 },
  { id: 'chk-04', date_formatted: 'Mon Sep 28', time: '17:45', location_id: '447f4bf2-ff66', location_name: 'Kigali Central', visitor_name: 'Aline Mukamana', polyfit_id: 'PF-EMP-7712', employer_name: 'Bank of Kigali', product: 'Pilates Group Session', checkin_period: 'Default', checkin_type: 'Visit', payment: 5000 },
  { id: 'chk-05', date_formatted: 'Sun Sep 27', time: '10:00', location_id: '189e7cb8-155e', location_name: 'Nyarutarama Branch', visitor_name: 'Patrick Habimana', polyfit_id: 'PF-EMP-5521', employer_name: 'I&M Bank Rwanda', product: 'Tennis / Racquet Court', checkin_period: 'Default', checkin_type: 'Co-Pay', payment: 5000 },
  { id: 'chk-06', date_formatted: 'Sun Sep 27', time: '14:20', location_id: '447f4bf2-ff66', location_name: 'Kigali Central', visitor_name: 'Sandrine Gasana', polyfit_id: 'PF-EMP-6689', employer_name: 'MTN Rwandacell', product: 'Gym Access', checkin_period: 'Off-peak', checkin_type: 'Visit', payment: 5000 },
  { id: 'chk-07', date_formatted: 'Sat Sep 26', time: '09:10', location_id: '189e7cb8-155e', location_name: 'Nyarutarama Branch', visitor_name: 'David Karekezi', polyfit_id: 'PF-EMP-2210', employer_name: 'TechCorp Rwanda', product: 'Lap Swimming', checkin_period: 'Default', checkin_type: 'Visit', payment: 5000 },
  { id: 'chk-08', date_formatted: 'Fri Sep 25', time: '18:15', location_id: '447f4bf2-ff66', location_name: 'Kigali Central', visitor_name: 'Clarisse Uwineza', polyfit_id: 'PF-EMP-8843', employer_name: 'Bank of Kigali', product: 'Functional Training', checkin_period: 'Default', checkin_type: 'Visit', payment: 5000 }
];

interface LocationSummaryRecord {
  location_id: string;
  location_name: string;
  checkins: number;
  checkin_amount: number;
  adjustments: number;
  platform_fee: number;
  total_net_payout: number;
}

const DEFAULT_LOCATION_SUMMARIES: LocationSummaryRecord[] = [
  {
    location_id: '447f4bf2-ff66-48c5-851e-460cba17bfe4',
    location_name: 'Kigali Central Facility (Unit #851931)',
    checkins: 340,
    checkin_amount: 1700000,
    adjustments: 0,
    platform_fee: -170000,
    total_net_payout: 1530000
  },
  {
    location_id: '189e7cb8-155e-419a-8b83-bd9e3eb021da',
    location_name: 'Nyarutarama Health Branch (Unit #851932)',
    checkins: 150,
    checkin_amount: 750000,
    adjustments: -15000,
    platform_fee: -75000,
    total_net_payout: 660000
  }
];

export default function PartnerReportsPage() {
  const { provider, locations, selectedLocationId, setSelectedLocationId } = usePartner();

  // State
  const [activeTab, setActiveTab] = useState<ReportTab>('payment-per-visitor');
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [oneMonthOnly, setOneMonthOnly] = useState(true);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  // Filtered records by location
  const filteredVisitorPayments = useMemo(() => {
    if (selectedLocationId === 'all') return DEFAULT_VISITOR_PAYMENTS;
    const loc = locations.find((l) => l.id === selectedLocationId);
    if (!loc) return DEFAULT_VISITOR_PAYMENTS;
    return DEFAULT_VISITOR_PAYMENTS.filter((item) =>
      item.location_name.toLowerCase().includes(loc.name.split(' ')[0].toLowerCase())
    );
  }, [selectedLocationId, locations]);

  const filteredCheckins = useMemo(() => {
    if (selectedLocationId === 'all') return DEFAULT_CHECKIN_DETAILS;
    const loc = locations.find((l) => l.id === selectedLocationId);
    if (!loc) return DEFAULT_CHECKIN_DETAILS;
    return DEFAULT_CHECKIN_DETAILS.filter((item) =>
      item.location_name.toLowerCase().includes(loc.name.split(' ')[0].toLowerCase())
    );
  }, [selectedLocationId, locations]);

  const filteredLocationSummaries = useMemo(() => {
    if (selectedLocationId === 'all') return DEFAULT_LOCATION_SUMMARIES;
    return DEFAULT_LOCATION_SUMMARIES.filter((item) => item.location_id === selectedLocationId);
  }, [selectedLocationId]);

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
          { header: 'Location ID', accessor: (r) => r.location_id },
          { header: 'Location', accessor: (r) => r.location_name },
          { header: 'Visitor Name', accessor: (r) => r.visitor_name },
          { header: 'PolyFit ID', accessor: (r) => r.polyfit_id },
          { header: 'Employer Organization', accessor: (r) => r.employer_name },
          { header: 'Total Check-ins', accessor: (r) => r.total_checkins },
          { header: 'Total Payment (RWF)', accessor: (r) => r.total_payment }
        ],
        filteredVisitorPayments
      );
    } else if (activeTab === 'checkin-details') {
      downloadCsv(
        `polyfit-checkin-details-${selectedMonth}.csv`,
        [
          { header: 'Date', accessor: (r) => r.date_formatted },
          { header: 'Time', accessor: (r) => r.time },
          { header: 'Location ID', accessor: (r) => r.location_id },
          { header: 'Location', accessor: (r) => r.location_name },
          { header: 'Visitor Name', accessor: (r) => r.visitor_name },
          { header: 'PolyFit ID', accessor: (r) => r.polyfit_id },
          { header: 'Employer Organization', accessor: (r) => r.employer_name },
          { header: 'Product', accessor: (r) => r.product },
          { header: 'Period', accessor: (r) => r.checkin_period },
          { header: 'Check-in Type', accessor: (r) => r.checkin_type },
          { header: 'Payment (RWF)', accessor: (r) => r.payment }
        ],
        filteredCheckins
      );
    } else if (activeTab === 'location-summary') {
      downloadCsv(
        `polyfit-location-summary-${selectedMonth}.csv`,
        [
          { header: 'Location ID', accessor: (r) => r.location_id },
          { header: 'Location', accessor: (r) => r.location_name },
          { header: 'Total Check-ins', accessor: (r) => r.checkins },
          { header: 'Gross Amount (RWF)', accessor: (r) => r.checkin_amount },
          { header: 'Adjustments (RWF)', accessor: (r) => r.adjustments },
          { header: 'Platform Share (RWF)', accessor: (r) => r.platform_fee },
          { header: 'Total Net Payout (RWF)', accessor: (r) => r.total_net_payout }
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
      total_visits: totals.checkins || 490,
      gross_amount: totals.checkin_amount || 2450000,
      adjustments_amount: Math.abs(totals.adjustments) || 15000,
      platform_fee_amount: Math.abs(totals.platform_fee) || 245000,
      net_amount: totals.total_net_payout || 2190000,
      status: 'paid',
      payout_date: '2026-10-15',
      payment_reference: 'BK-FT-20261015-091',
      provider: {
        name: provider?.name || 'FitLife Gym Kigali',
        category: provider?.category || 'gym',
        tax_id: provider?.tax_id || '108392019',
        settlement_email: provider?.settlement_email || 'finance@fitlife.rw'
      }
    });
  };

  // Helper text per tab
  const getTabHelp = () => {
    switch (activeTab) {
      case 'overview':
        return {
          title: 'Overview Analytics',
          desc: 'High-level aggregation of visits, active employer partners, and overall revenue velocity for the selected period.',
          q: 'What is the Overview report?',
          a: 'The Overview summarizes aggregate platform utilization and revenue metrics across all registered locations.'
        };
      case 'payment-per-visitor':
        return {
          title: 'Payment per visitor',
          desc: 'This report shows all check-ins done by each corporate visitor for the selected locations and period.',
          q: "What's a Payment per visitor report?",
          a: 'This report groups check-in volume by individual corporate beneficiary. It lets you analyze client loyalty, repeat attendance, and total revenue generated per user under corporate wellness plans.'
        };
      case 'checkin-details':
        return {
          title: 'Check-in details',
          desc: 'This report shows all check-in details for the selected locations and period, including the date, time, payment per check-in, and product used.',
          q: "What's a Check-in details report?",
          a: 'An itemized chronological audit of every verified entrance. It provides full transparency into off-peak rates, employee tiers, and payment calculation.'
        };
      case 'location-summary':
        return {
          title: 'Location summary',
          desc: 'This report shows revenue for your selected locations and period, including total visitors and unique visits.',
          q: "What's a Revenue per location report?",
          a: 'A financial comparison across your physical facility branches, showing gross check-in value, adjustments, and net payout distribution.'
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
            <span className="text-[#0B1F33]">Audit & Intelligence</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B1F33] tracking-tight mt-1">
            Reports
          </h1>
          <p className="text-xs sm:text-sm text-[#526173] mt-0.5">
            Track your payment, check-in, and visitor history, all in one place!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/partner/settlements"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F1F4F8] text-[#0B1F33] text-xs font-semibold border border-[#E2E8F0] transition-colors shadow-xs"
          >
            <Receipt className="w-4 h-4 text-[#28D17C]" />
            <span>Settlement Statements</span>
          </Link>

          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault();
              setIsAccordionOpen(true);
            }}
            className="text-xs text-[#0B1F33] hover:text-[#008A4B] font-semibold flex items-center gap-1"
          >
            <HelpCircle className="w-4 h-4 text-[#8491A3]" />
            <span>How it works</span>
          </a>
        </div>
      </div>

      {/* Segmented 4-Tab Navigation Bar (Wellhub Style) */}
      <div className="border-b border-[#E2E8F0] overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-1 sm:gap-8 min-w-max">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 px-1 sm:px-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors relative ${
              activeTab === 'overview'
                ? 'text-[#0B1F33]'
                : 'text-[#8491A3] hover:text-[#0B1F33]'
            }`}
          >
            <span>Overview</span>
            {activeTab === 'overview' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#28D17C] rounded-t-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('payment-per-visitor')}
            className={`py-3.5 px-1 sm:px-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors relative ${
              activeTab === 'payment-per-visitor'
                ? 'text-[#0B1F33]'
                : 'text-[#8491A3] hover:text-[#0B1F33]'
            }`}
          >
            <span>Payment per visitor</span>
            {activeTab === 'payment-per-visitor' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#28D17C] rounded-t-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('checkin-details')}
            className={`py-3.5 px-1 sm:px-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors relative ${
              activeTab === 'checkin-details'
                ? 'text-[#0B1F33]'
                : 'text-[#8491A3] hover:text-[#0B1F33]'
            }`}
          >
            <span>Check-ins details</span>
            {activeTab === 'checkin-details' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#28D17C] rounded-t-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('location-summary')}
            className={`py-3.5 px-1 sm:px-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors relative ${
              activeTab === 'location-summary'
                ? 'text-[#0B1F33]'
                : 'text-[#8491A3] hover:text-[#0B1F33]'
            }`}
          >
            <span>Location summary</span>
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
              <div className="text-2xl font-extrabold text-[#0B1F33] font-mono mt-1">490</div>
              <span className="text-[11px] text-[#008A4B] font-semibold mt-1 block">+12% vs last month</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
              <span className="text-xs text-[#8491A3] font-semibold">Unique Corporate Beneficiaries</span>
              <div className="text-2xl font-extrabold text-[#0B1F33] font-mono mt-1">142</div>
              <span className="text-[11px] text-[#526173] mt-1 block">Across 6 enterprise clients</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
              <span className="text-xs text-[#8491A3] font-semibold">Average Visits / Day</span>
              <div className="text-2xl font-extrabold text-[#0B1F33] font-mono mt-1">16.3</div>
              <span className="text-[11px] text-[#526173] mt-1 block">Peak: Mon & Wed 07:00</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
              <span className="text-xs text-[#8491A3] font-semibold">Estimated Net Payout</span>
              <div className="text-2xl font-extrabold text-[#008A4B] font-mono mt-1">2,190,000 RWF</div>
              <span className="text-[11px] text-[#8491A3] mt-1 block">Disbursement: Oct 15</span>
            </div>
          </div>

          {/* Corporate Clients Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
            <h3 className="text-sm font-bold text-[#0B1F33] mb-4 uppercase tracking-wider">
              Top Corporate Clients by Check-in Volume
            </h3>
            <div className="space-y-3">
              {[
                { name: 'Bank of Kigali Plc', visits: 205, share: 42, color: 'bg-[#28D17C]' },
                { name: 'MTN Rwandacell', visits: 155, share: 31, color: 'bg-[#00D2B4]' },
                { name: 'TechCorp Rwanda', visits: 90, share: 18, color: 'bg-[#3B82F6]' },
                { name: 'I&M Bank Rwanda', visits: 40, share: 9, color: 'bg-[#F59E0B]' }
              ].map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0B1F33]">{c.name}</span>
                    <span className="font-mono text-[#526173]">
                      {c.visits} visits ({c.share}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#F1F4F8] rounded-full overflow-hidden">
                    <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.share}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: PAYMENT PER VISITOR (Wellhub Screenshot 1) ───────────────── */}
      {activeTab === 'payment-per-visitor' && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <span className="text-xs font-bold text-[#8491A3] uppercase tracking-wider">
              Report Data ({filteredVisitorPayments.length} Corporate Visitors)
            </span>
            <span className="text-[11px] font-mono text-[#526173]">
              Period: {selectedMonth}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F9FC] text-[#526173] font-semibold border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3 px-4">Location ID</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Visitor</th>
                  <th className="py-3 px-4">PolyFit ID</th>
                  <th className="py-3 px-4 text-right">Total Check-ins</th>
                  <th className="py-3 px-4 text-right">Total Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredVisitorPayments.map((v, i) => (
                  <tr key={i} className="hover:bg-[#F7F9FC]/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-[#8491A3]">{v.location_id}...</td>
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
                ))}
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
              Chronological Audit Trail
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
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Visitor</th>
                  <th className="py-3 px-4">PolyFit ID</th>
                  <th className="py-3 px-4">Product / Activity</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredCheckins.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F7F9FC]/70 transition-colors">
                    <td className="py-3 px-4 text-[#0B1F33] font-semibold">{c.date_formatted}</td>
                    <td className="py-3 px-4 font-mono text-[#526173]">{c.time}</td>
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
                ))}
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
              Facility Multi-Location Financial Rollup
            </span>
            <span className="text-[11px] font-mono text-[#526173]">
              Period: {selectedMonth}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F9FC] text-[#526173] font-semibold border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3 px-4">Location ID</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Check-ins</th>
                  <th className="py-3 px-4 text-right">Check-in Amount</th>
                  <th className="py-3 px-4 text-right">Adjustments</th>
                  <th className="py-3 px-4 text-right">Platform Share</th>
                  <th className="py-3 px-4 text-right">Total Net Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredLocationSummaries.map((l) => (
                  <tr key={l.location_id} className="hover:bg-[#F7F9FC]/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[#8491A3]">
                      {l.location_id.substring(0, 12)}...
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
                ))}
              </tbody>
              <tfoot className="bg-[#F7F9FC] border-t-2 border-[#E2E8F0] font-bold">
                <tr>
                  <td colSpan={2} className="py-3.5 px-4 text-[#0B1F33] uppercase tracking-wider">
                    Total Network Rollup
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
      <div className="fixed bottom-0 left-0 right-0 lg:pl-64 z-20 pointer-events-none">
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
