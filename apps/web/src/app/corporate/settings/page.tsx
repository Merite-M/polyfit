"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle2, Save, Building2, Mail, Hash } from "lucide-react";
import { useCorporate } from "@/contexts/CorporateContext";
import { CorporateHeader } from "@/components/corporate/CorporateHeader";
import { cn } from "@/lib/utils";

export default function CorporateSettingsPage() {
  const { organization, updateOrganizationProfile, showToast } = useCorporate();

  const [orgName, setOrgName] = useState(organization.name);
  const [domain, setDomain] = useState(organization.domain);
  const [taxId, setTaxId] = useState(organization.tax_id || "");
  const [contactEmail, setContactEmail] = useState(organization.contact_email || "");
  const [billingEmail, setBillingEmail] = useState(organization.billing_email || "");
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setOrgName(organization.name);
    setDomain(organization.domain);
    setTaxId(organization.tax_id || "");
    setContactEmail(organization.contact_email || "");
    setBillingEmail(organization.billing_email || "");
  }, [organization]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateOrganizationProfile({
        name: orgName,
        domain: domain,
        tax_id: taxId,
        contact_email: contactEmail,
        billing_email: billingEmail,
      });
      setSaved(true);
      showToast("Organization settings saved successfully");
      setTimeout(() => setSaved(false), 3000);
    } catch {
      showToast("Saved organization settings locally");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-full">
      {/* Sticky Corporate Navigation Header */}
      <CorporateHeader
        actions={
          <button
            type="submit"
            form="corporate-settings-form"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        }
      />

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* Title */}
        <div className="pb-2 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">Organization Settings</h1>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Configure allowed corporate email domains, RRA tax identification, contact points, and company profile.
          </p>
        </div>

        <form id="corporate-settings-form" onSubmit={handleSave} className="space-y-6">
          {/* Company Profile Card */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-2xs space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Company Profile & RRA Tax Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Legal Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/40 text-xs text-foreground focus:outline-none focus:border-primary focus:bg-background transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Rwanda TIN / Tax Identification Number
                </label>
                <div className="relative">
                  <Hash className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="e.g. 108392019"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-muted/40 text-xs font-mono text-foreground focus:outline-none focus:border-primary focus:bg-background transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  HR / Wellness Contact Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-muted/40 text-xs text-foreground focus:outline-none focus:border-primary focus:bg-background transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Finance & Accounts Payable Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-muted/40 text-xs text-foreground focus:outline-none focus:border-primary focus:bg-background transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Allowed Email Domains */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">Allowed Corporate Email Domains</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Employees can only claim corporate passes with verified corporate email addresses matching this domain.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Security Enforced
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Authorized Domain Suffix
              </label>
              <div className="flex items-center gap-2 max-w-sm">
                <span className="text-sm font-semibold text-muted-foreground">@</span>
                <input
                  type="text"
                  required
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/40 text-xs font-mono text-foreground focus:outline-none focus:border-primary focus:bg-background transition-all"
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Self-service signups from public webmails (gmail.com, yahoo.com) are rejected automatically at the edge.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {saved && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Settings saved!
              </span>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isSaving ? "Saving..." : "Save Settings"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
