"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  Lock,
  ArrowRight,
  FileCheck2,
  CheckCircle2,
  Receipt,
  Sparkles
} from "lucide-react";
import PublicNavigation from "@/components/public-navigation";
import Footer from "@/components/landing/footer";

export default function TaxCertVerifyIndexPage() {
  const router = useRouter();
  const [sealInput, setSealInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = sealInput.trim();
    if (!trimmed) {
      setError("Please enter the cryptographic digital seal hash or certificate reference.");
      return;
    }
    router.push(`/verify/tax-cert/${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1F33] flex flex-col justify-between">
      <PublicNavigation />

      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
            <Lock className="w-3.5 h-3.5" />
            <span>Rwanda Revenue Authority • Statutory Audit Rail</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F33] tracking-tight">
            Verify Corporate Tax Shield Certificate
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
            Validate the cryptographic seal of employee wellness expenditure statements under Article 24 of the Rwanda Corporate Income Tax Code.
          </p>
        </div>

        {/* Verification Input Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-md space-y-6">
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="seal-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Digital Certificate Seal or Hash (HMAC-SHA256):
              </label>
              <div className="relative">
                <input
                  id="seal-input"
                  type="text"
                  value={sealInput}
                  onChange={(e) => {
                    setSealInput(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Paste 64-character seal (e.g. 7f8b91a...)"
                  className="w-full px-4 py-3.5 text-xs sm:text-sm font-mono rounded-xl border border-slate-300 focus:border-[#28D17C] focus:ring-2 focus:ring-[#28D17C]/20 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
              {error && (
                <p className="text-xs text-rose-600 mt-1.5 font-medium">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl bg-[#0B1F33] hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Search className="w-4 h-4 text-[#28D17C]" />
              <span>Validate Cryptographic Seal</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </form>

          {/* Verification Criteria Info Box */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <h3 className="font-bold text-[#0B1F33] text-xs uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#008A4B]" />
              <span>What this audit verifies:</span>
            </h3>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#28D17C] shrink-0 mt-0.5" />
                <span><strong>100% Verified Telemetry Visits:</strong> Every check-in was verified through biometric TOTP/turnstile validation at accredited Rwandan facilities.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#28D17C] shrink-0 mt-0.5" />
                <span><strong>RRA EBM Compliance:</strong> Itemized input VAT (18%) and official electronic billing machine receipts registered with Rwanda Revenue Authority.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#28D17C] shrink-0 mt-0.5" />
                <span><strong>Article 24 CIT Deduction:</strong> Certified eligibility for 30% corporate income tax deduction on staff wellness investments.</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
