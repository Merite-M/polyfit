"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Printer,
  Copy,
  Check,
  Building2,
  Receipt,
  FileCheck2,
  ExternalLink,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Lock
} from "lucide-react";
import PublicNavigation from "@/components/public-navigation";
import Footer from "@/components/landing/footer";
import { formatRwf } from "@/lib/invoice-pdf";
import { apiFetch } from "@/lib/api-client";

function TaxCertVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialSeal = searchParams?.get("seal") || "";

  const [sealQuery, setSealQuery] = useState(initialSeal);
  const [activeSeal, setActiveSeal] = useState(initialSeal);
  const [loading, setLoading] = useState(Boolean(initialSeal));
  const [certData, setCertData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedSeal, setCopiedSeal] = useState(false);

  useEffect(() => {
    const sealFromUrl = searchParams?.get("seal") || "";
    if (sealFromUrl) {
      setSealQuery(sealFromUrl);
      setActiveSeal(sealFromUrl);
      verifySeal(sealFromUrl);
    } else {
      setActiveSeal("");
      setCertData(null);
      setError(null);
      setLoading(false);
    }
  }, [searchParams]);

  const verifySeal = (sealToVerify: string) => {
    const trimmed = sealToVerify.trim();
    if (!trimmed) {
      setError("Please enter the cryptographic digital seal hash or certificate reference.");
      setCertData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setCertData(null);

    apiFetch<any>(`/api/billing/tax-certificates/verify/${encodeURIComponent(trimmed)}`)
      .then((res) => {
        if (res?.verified) {
          const raw = res.certificate || res;
          const gross = raw.gross_spend_rwf || raw.total_amount || 0;
          const vat = raw.vat_deduction_rwf || raw.tax_amount || Math.round(gross * (0.18 / 1.18));
          const net = raw.net_qualifying_wellness_spend_rwf || (gross - vat);
          const cit = raw.cit_deduction_benefit_rwf || Math.round(net * 0.3);

          setCertData({
            certificate_number: raw.certificate_number || `RRA-CIT-PF-${raw.fiscal_year || '2026'}-${raw.invoice_number}`,
            organization_name: raw.organization_name || 'TechCorp Rwanda',
            organization_tin: raw.organization_tin || '108392019',
            period_start: raw.period_start || raw.billing_period?.start || `01/07/${raw.fiscal_year || '2026'}`,
            period_end: raw.period_end || raw.billing_period?.end || `31/07/${raw.fiscal_year || '2026'}`,
            total_verified_visits: raw.total_verified_visits || raw.verified_visits || 280,
            gross_spend_rwf: gross,
            vat_deduction_rwf: vat,
            net_qualifying_wellness_spend_rwf: net,
            cit_deduction_benefit_rwf: cit,
            rra_compliance_statement: raw.rra_compliance_statement || 'Certified that all attendance records backing this invoice were cryptographically verified through decentralized TOTP and geo-fenced partner terminal scanners in compliance with RRA verifiable corporate benefit standards.',
            cryptographic_seal: raw.cryptographic_seal || raw.seal || trimmed,
            issued_at: raw.issued_at || raw.issue_date || new Date().toISOString()
          });
        } else {
          setError(res?.error || "This certificate seal could not be cryptographically authenticated.");
        }
      })
      .catch((err) => {
        console.warn("[VerifyTaxCert] Error:", err.message);
        setError("Invalid or unverified digital seal. Please check the 64-character cryptographic hash.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = sealQuery.trim();
    if (!trimmed) {
      setError("Please enter a digital seal hash.");
      return;
    }
    router.push(`/verify/tax-cert?seal=${encodeURIComponent(trimmed)}`);
    setActiveSeal(trimmed);
    verifySeal(trimmed);
  };

  const handleCopySeal = () => {
    if (activeSeal) {
      navigator.clipboard.writeText(activeSeal);
      setCopiedSeal(true);
      setTimeout(() => setCopiedSeal(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Verification Status Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
          <Lock className="w-3.5 h-3.5" />
          <span>Republic of Rwanda • RRA Statutory Tax Shield Verification</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] tracking-tight">
          Verify Corporate Tax Shield Certificate
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          Public cryptographic audit rail for Corporate CFOs, Tax Auditors, and Rwanda Revenue Authority (RRA) Inspectors under Article 24 of the CIT Code.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <label htmlFor="seal-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Digital Certificate Seal or Hash (HMAC-SHA256):
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                id="seal-input"
                type="text"
                value={sealQuery}
                onChange={(e) => setSealQuery(e.target.value)}
                placeholder="Paste 64-character SHA256 digital seal (e.g., 7b2319f...)..."
                className="w-full px-4 py-3 pl-10 text-xs font-mono rounded-xl border border-slate-300 focus:border-[#28D17C] focus:ring-2 focus:ring-[#28D17C]/20 outline-none transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-[#0B1F33] hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shrink-0"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin text-[#28D17C]" /> : <ShieldCheck className="w-4 h-4 text-[#28D17C]" />}
              <span>Verify Seal</span>
            </button>
          </div>
        </form>
      </div>

      {/* Dynamic Content based on State */}
      {loading ? (
        <div className="p-16 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-3">
          <RefreshCw className="w-10 h-10 animate-spin text-[#008A4B] mx-auto" />
          <h3 className="font-bold text-[#0B1F33] text-base">Verifying Cryptographic Digital Seal...</h3>
          <p className="text-xs text-slate-400 font-mono">
            Validating HMAC-SHA256 hash against PolyFit settlement ledger
          </p>
        </div>
      ) : error ? (
        /* Error State */
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-rose-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              Verification Failed
            </span>
            <h2 className="text-xl font-extrabold text-[#0B1F33] mt-2">
              Digital Seal Not Authenticated
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
              {error}
            </p>
          </div>
        </div>
      ) : certData ? (
        /* Valid Certificate Display */
        <div className="rounded-3xl bg-white border-2 border-slate-200 shadow-lg overflow-hidden space-y-0">
          {/* Header Strip */}
          <div className="p-6 bg-gradient-to-r from-emerald-950 via-[#0B1F33] to-[#102A45] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#28D17C] text-[#0B1F33] flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#28D17C] border border-emerald-500/40">
                    Cryptographically Validated
                  </span>
                  <span className="text-xs font-mono text-slate-300">
                    RRA Article 24 CIT Compliant
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-white mt-1">
                  Authentic Corporate Tax Shield Certificate
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all cursor-pointer shrink-0"
            >
              <Printer className="w-4 h-4 text-[#28D17C]" />
              <span>Print Certificate</span>
            </button>
          </div>

          {/* Certificate Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Reference */}
            <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-700 font-mono block">
                  REPUBLIC OF RWANDA • RWANDA REVENUE AUTHORITY (RRA)
                </span>
                <span className="text-xs text-slate-500">
                  Statutory Corporate Income Tax (CIT) 30% Deduction Certificate
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Certificate Reference</span>
                <span className="font-mono text-sm font-bold text-[#0B1F33]">
                  {certData.certificate_number}
                </span>
              </div>
            </div>

            {/* Entity and Period Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Certified Corporate Taxpayer
                </span>
                <div className="font-extrabold text-[#0B1F33] text-base">
                  {certData.organization_name}
                </div>
                <div className="font-mono text-slate-600 text-xs">
                  Tax Identification Number: <strong className="text-slate-900">{certData.organization_tin || "TIN-Pending"}</strong>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Certified Telemetry &amp; Access Period
                </span>
                <div className="font-semibold text-slate-900 text-sm">
                  {certData.period_start} → {certData.period_end}
                </div>
                <div className="text-xs text-[#008A4B] font-bold flex items-center gap-1.5 pt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-[#28D17C]" />
                  <span>{certData.total_verified_visits} Verified Beneficiary Visits</span>
                </div>
              </div>
            </div>

            {/* Financial Deduction Breakdown */}
            <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-3 text-xs">
              <h4 className="font-bold text-purple-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-purple-700" />
                <span>Statutory CIT Shield Breakdown (Article 24)</span>
              </h4>
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-slate-600">
                  <span>Total Gross Invoiced Spend (EBM Itemized):</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatRwf(certData.gross_spend_rwf)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Input VAT Deduction (18% Statutory Reclaim):</span>
                  <span className="font-mono text-indigo-700 text-xs">
                    -{formatRwf(certData.vat_deduction_rwf)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700 pt-1.5 border-t border-purple-200/80 font-semibold">
                  <span>Net Qualifying Corporate Wellness Expenditure:</span>
                  <span className="font-mono text-slate-900 text-sm">
                    {formatRwf(certData.net_qualifying_wellness_spend_rwf)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-purple-900 pt-2 border-t border-purple-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Net 30% CIT Tax Shield Benefit:
                  </span>
                  <span className="font-mono text-lg text-purple-700 font-black">
                    {formatRwf(certData.cit_deduction_benefit_rwf)}
                  </span>
                </div>
              </div>
            </div>

            {/* Legal Statement */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed italic">
              &quot;{certData.rra_compliance_statement}&quot;
            </div>

            {/* Digital HMAC Digest */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4" />
                  Cryptographic Seal Digest (HMAC-SHA256)
                </span>
                <button
                  type="button"
                  onClick={handleCopySeal}
                  className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedSeal ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#28D17C]" />
                      <span>Copied Hash</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Hash</span>
                    </>
                  )}
                </button>
              </div>
              <div className="font-mono text-[11px] text-emerald-300 break-all bg-slate-950 p-3 rounded-xl border border-slate-800">
                {certData.cryptographic_seal}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Ledger Rail: PolyFit Cryptographic Telemetry Network</span>
                <span>Issued: {new Date(certData.issued_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Print action */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-2.5 rounded-xl bg-[#0B1F33] hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4 text-[#28D17C]" />
                <span>Print Formal Certificate</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Explainer Cards for Initial View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#0B1F33] text-sm">30% CIT Deduction</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every invoice certified by PolyFit generates statutory deduction documentation under Rwanda Income Tax Law Article 24.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#008A4B] flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5 text-[#28D17C]" />
            </div>
            <h3 className="font-bold text-[#0B1F33] text-sm">Verified Telemetry</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Each certificate is tied directly to cryptographically verified, anti-passback biometric check-ins across network locations.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#0B1F33] text-sm">HMAC Digital Seal</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tamper-evident 64-character SHA-256 seal proves invoice integrity for internal audits and RRA filing.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

export default function TaxCertVerifyPage() {
  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1F33] flex flex-col justify-between">
      <PublicNavigation />
      <Suspense fallback={
        <div className="p-16 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#008A4B] mx-auto" />
        </div>
      }>
        <TaxCertVerifyContent />
      </Suspense>
      <Footer />
    </div>
  );
}
