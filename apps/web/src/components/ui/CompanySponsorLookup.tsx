"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Search, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Smartphone, 
  AlertCircle,
  HelpCircle,
  Loader2
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useLeadModal } from "@/lib/lead-modal";
import { LivePassVirtualizationModal } from "./LivePassVirtualizationModal";

interface VerifyCompanyResult {
  enrolled: boolean;
  domain: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
    industry?: string;
    logo_url?: string;
  };
  benefit?: {
    id: string;
    name: string;
    tier: string;
    max_monthly_visits: number;
    subsidy_percentage: number;
    co_pay_percentage: number;
    is_fully_sponsored: boolean;
    allowed_categories: string[];
  };
  claim_url?: string;
  message?: string;
}

export function CompanySponsorLookup() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerifyCompanyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const openLeadModal = useLeadModal((s) => s.open);

  const [sampleCompanies, setSampleCompanies] = useState([
    { label: "Bank of Kigali", domain: "bk.rw" },
    { label: "TechCorp Rwanda", domain: "techcorp.rw" },
    { label: "Equity Bank", domain: "equitybank.co.ke" },
  ]);

  useEffect(() => {
    async function fetchEnrolledCompanies() {
      try {
        const res = await apiFetch<any>('/api/organizations?limit=4');
        const list = res?.organizations || res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((org: any) => ({
            label: org.name,
            domain: (Array.isArray(org.allowed_domains) && org.allowed_domains[0]) || org.domain || `${org.slug || 'company'}.rw`,
          }));
          setSampleCompanies(mapped);
        }
      } catch {
        // Resilient fallback
      }
    }
    fetchEnrolledCompanies();
  }, []);

  const handleVerify = async (searchTarget?: string) => {
    const target = (searchTarget || query).trim();
    if (!target) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiFetch<VerifyCompanyResult>(
        `/api/public/verify-company?query=${encodeURIComponent(target)}`
      );
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to verify employer sponsorship. Please try again.");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickTag = (domain: string) => {
    setQuery(domain);
    handleVerify(domain);
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-12 bg-card border border-border rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden text-card-foreground">
      {/* Background Accent Gradient Glow */}
      <div 
        className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" 
        aria-hidden="true"
      />
      <div 
        className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" 
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Employee Benefit Discovery</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Check If Your Employer Sponsors PolyFit
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Enter your work email address or corporate domain to see your employer-funded fitness subsidy and access privileges.
          </p>
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="max-w-xl mx-auto"
        >
          <div className="relative flex flex-col sm:flex-row items-center gap-2.5 p-1.5 bg-background border border-border rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 transition-all">
            <div className="relative flex-1 w-full flex items-center pl-3.5">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. name@bk.rw or techcorp.rw"
                className="w-full bg-transparent px-3 py-2.5 text-sm sm:text-base text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                aria-label="Work email or corporate domain"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <span>Verify Coverage</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Sample Corporate Quick Tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
          <span className="text-muted-foreground font-medium">Try enrolled employers:</span>
          {sampleCompanies.map((c) => (
            <button
              key={c.domain}
              type="button"
              onClick={() => handleQuickTag(c.domain)}
              className="px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors cursor-pointer text-xs font-semibold"
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="max-w-xl mx-auto mt-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Verified Result Card */}
        {result && (
          <div className="max-w-xl mx-auto mt-8 animate-in fade-in-50 zoom-in-95 duration-200">
            {result.enrolled && result.organization && result.benefit ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-foreground space-y-4 shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500 text-slate-900 flex items-center justify-center font-bold text-lg shadow-xs">
                      <Building2 className="w-6 h-6 text-slate-900" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-base sm:text-lg text-foreground">
                          {result.organization.name}
                        </h3>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Verified Corporate Wellness Sponsor (@{result.domain})
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-slate-900 text-xs font-extrabold uppercase tracking-wider">
                    {result.benefit.subsidy_percentage}% Covered
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-background border border-border space-y-2">
                  <div className="flex justify-between items-center text-xs sm:text-sm font-semibold">
                    <span className="text-foreground">{result.benefit.name}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                      {result.benefit.max_monthly_visits} visits / month
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Enjoy full access across all {result.benefit.allowed_categories.join(", ")} partner venues in Rwanda. 
                    Zero membership fees, verified with rotating digital passes.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPassModalOpen(true)}
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Preview Live Access Pass</span>
                  </button>
                  <a
                    href={result.claim_url || `/join/${result.organization.slug}`}
                    className="w-full sm:w-auto py-3 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs sm:text-sm transition-all text-center"
                  >
                    Activate Coverage
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-muted/60 border border-border text-foreground space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-foreground">
                      @{result.domain} Is Not Yet Enrolled
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      PolyFit brings employer-subsidized wellness to top East African workplaces. We can help you propose this benefit to your HR or people operations team.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => openLeadModal('employer')}
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <span>Request Corporate Pilot For Your Team</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Rotating TOTP Pass Virtualization Modal */}
      {result?.organization && (
        <LivePassVirtualizationModal
          isOpen={isPassModalOpen}
          onClose={() => setIsPassModalOpen(false)}
          companyName={result.organization.name}
        />
      )}
    </div>
  );
}
