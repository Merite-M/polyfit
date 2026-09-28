"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Settings, ArrowLeft, ShieldCheck, CheckCircle2, Save } from "lucide-react";

export default function CorporateSettingsPage() {
  const [orgName, setOrgName] = useState("TechCorp Rwanda");
  const [domain, setDomain] = useState("techcorp.rw");
  const [contactEmail, setContactEmail] = useState("hr@techcorp.rw");
  const [billingEmail, setBillingEmail] = useState("finance@techcorp.rw");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center gap-2 text-xs text-[#8491A3] mb-4">
        <Link href="/corporate" className="hover:text-[#0B1F33] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </Link>
        <span>/</span>
        <span className="text-[#0B1F33] font-semibold">Settings & Allowed Domains</span>
      </div>

      <div className="pb-6 border-b border-[#E2E8F0]">
        <h1 className="text-2xl font-bold text-[#0B1F33]">Organization Settings</h1>
        <p className="text-xs text-[#526173] mt-1">
          Configure allowed corporate email domains, contact points, and company profile.
        </p>
      </div>

      <form onSubmit={handleSave} className="mt-6 space-y-6">
        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#0B1F33] mb-1">Company Profile</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0B1F33] mb-1.5">
                Organization Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] text-sm text-[#0B1F33] focus:outline-none focus:border-[#28D17C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0B1F33] mb-1.5">
                Primary Contact Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] text-sm text-[#0B1F33] focus:outline-none focus:border-[#28D17C]"
              />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0B1F33]">Allowed Email Domains</h2>
              <p className="text-xs text-[#526173] mt-0.5">
                Employees can only register with verified email addresses matching this domain.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-[#28D17C] bg-[#E9FAF2] px-2.5 py-0.5 rounded-full border border-[#28D17C]/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Security Enforced
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0B1F33] mb-1.5">
              Authorized Domain Pattern
            </label>
            <div className="flex items-center gap-2 max-w-sm">
              <span className="text-sm font-semibold text-[#8491A3]">@</span>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] text-sm font-mono text-[#0B1F33] focus:outline-none focus:border-[#28D17C]"
              />
            </div>
            <p className="text-[11px] text-[#8491A3] mt-1.5">
              Registrations from other domains will be rejected automatically.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="text-xs font-semibold text-[#28D17C] flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Settings saved!
            </span>
          )}
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B1F33] hover:bg-[#142C44] text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <Save className="w-3.5 h-3.5 text-[#28D17C]" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
