"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function TaxCertVerifyDynamicPage() {
  const params = useParams();
  const router = useRouter();
  const rawSeal = (params?.seal as string) || "";

  const [sealQuery, setSealQuery] = useState(rawSeal);
  const [loading, setLoading] = useState(true);
  const [certData, setCertData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedSeal, setCopiedSeal] = useState(false);

  useEffect(() => {
    if (!rawSeal) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setCertData(null);

    apiFetch<any>(`/api/billing/tax-certificates/verify/${encodeURIComponent(rawSeal)}`)
      .then((res) => {
        if (res?.verified && res?.certificate) {
          setCertData(res.certificate);
        } else {
          setError(res?.error || "This certificate seal could not be cryptographically authenticated.");
        }
      })
      .catch((err) => {
        console.warn("[VerifyTaxCert] Error:", err.message);
        setError("Invalid or expired digital seal. Please verify the complete 64-character cryptographic hash.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [rawSeal]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sealQuery.trim()) {
      router.push(`/verify/tax-cert/${sealQuery.trim()}`);
    }
  };

  const handleCopySeal = () => {
    if (rawSeal) {
      navigator.clipboard.writeText(rawSeal);
      setCopiedSeal(true);
      setTimeout(() => setCopiedSeal(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1F33] flex flex-col justify-between">
      <PublicNavigation />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
        {/* Verification Status Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
            <Lock className="w-3.5 h-3.5" />
            <span>Public RRA Tax Shield Verification Rail</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] tracking-tight">
            Cryptographic Certificate Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Authorized verification interface for Corporate CFOs, Auditors, and Rwanda Revenue Authority (RRA) Tax Inspectors.
          </p>
        </div>

        {/* Dynamic Verification Content */}
        {loading ? (
          <div className="p-16 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-3">
            <RefreshCw className="w-10 h-10 animate-spin text-[#008A4B] mx-auto" />
            <h3 className="font-bold text-[#0B1F33] text-base">Verifying Cryptographic Digital Seal...</h3>
            <p className="text-xs text-slate-400 font-mono">
              Validating HMAC-SHA256 hash against PolyFit settlement ledger
            </p>
          </div>
        ) : error || !certData ? (
          /* Error / Invalid Seal State */
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-rose-200 shadow-sm text-center space-y-5">
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
                {error || "The supplied digital seal was not found or does not match any certified corporate wellness billing statement."}
              </p>
            </div>

            {/* Seal Re-search input */}
            <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto flex items-center gap-2 pt-2">
              <input
                type="text"
                value={sealQuery}
                onChange={(e) => setSealQuery(e.target.value)}
                placeholder="Enter 64-char HMAC seal..."
                className="flex-1 px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-300 focus:border-[#28D17C] focus:ring-1 focus:ring-[#28D17C] outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#0B1F33] hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Verify</span>
              </button>
            </form>
          </div>
        ) : (
          /* Valid Certificate Card */
          <div className="rounded-3xl bg-white border-2 border-slate-200 shadow-lg overflow-hidden space-y-0">
            {/* Seal Verification Hero Strip */}
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
              {/* Reference Banner */}
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

              {/* Company & Period Overview */}
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

              {/* Tax Deduction Financial Breakdown */}
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

              {/* Legal Reference & Declaration */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed italic">
                &quot;{certData.rra_compliance_statement}&quot;
              </div>

              {/* Digital Seal Digest */}
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

              {/* Footer Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
                <Link
                  href="/verify/tax-cert"
                  className="text-xs text-slate-500 hover:text-[#0B1F33] flex items-center gap-1 font-semibold"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Verify another certificate</span>
                </Link>

                <div className="flex items-center gap-3">
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
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
