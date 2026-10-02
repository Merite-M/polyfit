'use client';

import React, { useMemo } from 'react';
import {
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { WizardLocationState } from './types';

interface Step3Props {
  state: WizardLocationState;
  onChange: (patch: Partial<WizardLocationState>) => void;
}

export function Step3GuidelinesDescription({ state, onChange }: Step3Props) {
  // Real-time Retail Price Anti-Leakage detector
  const priceLeakageDetected = useMemo(() => {
    const text = (state.description || '') + ' ' + (state.important_notice || '');
    const regex = /(?:(\$|€|£|rwf|frw|frs|usd|eur)\s*\d+)|(?:\d+\s*(?:rwf|frw|frs|usd|eur|\$|€|£))|(?:\b(per\s+month|\/month|monthly\s+membership|monthly\s+rate|discount\s+code|promo\s+price|tarif\s+mensuel)\b)/i;
    return regex.test(text);
  }, [state.description, state.important_notice]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-subtle text-success text-xs font-bold uppercase tracking-wider mb-2">
          <FileText className="w-3.5 h-3.5" />
          <span>Step 3 of 11 • Description & Guidelines</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-primary">
          Facility Story & What to Know Before Visiting
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Tell corporate employees about your facility ambiance, high-end equipment, and amenities. PolyFit enforces strict anti-retail price protection.
        </p>
      </div>

      {/* DOs & DON'Ts Guidance Banner (Wellhub Benchmark) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* DO Card */}
        <div className="bg-accent-subtle/70 border border-accent/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-success">
            <CheckCircle className="w-4 h-4 text-accent" />
            <span>DO Highlight</span>
          </div>
          <ul className="text-xs text-success space-y-1.5 list-disc list-inside">
            <li>Activities, equipment brands (Eleiko, Hammer Strength, Balanced Body)</li>
            <li>Venue vibe, natural lighting, and accessibility</li>
            <li>Locker room perks: hot showers, Finnish sauna, steam</li>
            <li>Certified multilingual personal trainers & instructors</li>
          </ul>
        </div>

        {/* DON'T Card */}
        <div className="bg-error/10 border border-error/20 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-error">
            <XCircle className="w-4 h-4 text-error" />
            <span>DON&apos;T Mention Retail Prices</span>
          </div>
          <ul className="text-xs text-error space-y-1.5 list-disc list-inside">
            <li>Do NOT list retail prices (e.g. 50,000 RWF per month)</li>
            <li>Do NOT promote walk-in discounts or direct memberships</li>
            <li>Corporate employee access is dictated by their employer plan</li>
            <li>PolyFit guarantees automatic per-visit settlement with you</li>
          </ul>
        </div>
      </div>

      {/* Anti-Leakage Warning Alert if triggered */}
      {priceLeakageDetected && (
        <div className="bg-warning/10 border-2 border-warning/30 rounded-xl p-4 flex items-start gap-3 text-xs text-warning animate-shake">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-sm block">Retail Price or Subscription Term Detected</span>
            <p>
              Your description mentions pricing, currency, or retail membership terms. Because PolyFit is a B2B2C corporate wellness network, corporate employees already have their visits covered by their employer. Please remove retail prices to comply with network standards.
            </p>
          </div>
        </div>
      )}

      {/* Main Description Textarea */}
      <div className="bg-card rounded-xl border border-border p-4 sm:p-5 space-y-2 shadow-xs">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-primary">
            Public Facility Description <span className="text-error">*</span>
          </label>
          <span className="text-[11px] text-subdued">
            {(state.description || '').length} characters (min 40 recommended)
          </span>
        </div>

        <textarea
          placeholder="e.g. Welcome to Kigali's premier conditioning and wellness center. Located on Level 2 of Kigali City Tower, our facility offers Olympic lifting platforms, a dedicated reformer pilates studio, a panoramic cardio floor, and luxury recovery saunas. Certified coaches are on deck to assist corporate beneficiaries..."
          value={state.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className={`pf-textarea w-full p-3 bg-muted border rounded-lg text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 ${
            priceLeakageDetected
              ? 'border-warning focus:ring-warning'
              : 'border-border focus:ring-accent'
          }`}
        />
      </div>

      {/* Important Information / What to know before visit */}
      <div className="bg-card rounded-xl border border-border p-4 sm:p-5 space-y-2 shadow-xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-accent" />
          <label className="text-xs font-bold text-primary">
            Important Visitor Guidelines / What to Know Before Visiting
          </label>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Displayed prominently under &quot;Need to Know&quot; on the employee app screen.
        </p>

        <textarea
          placeholder="e.g. Clean indoor athletic shoes are strictly mandatory on the fitness and workout floor. Please present your corporate badge or PolyFit TOTP QR code at the reception desk upon arrival. Lockers are provided; please bring your own padlock or purchase one at the front desk."
          value={state.important_notice}
          onChange={(e) => onChange({ important_notice: e.target.value })}
          className="pf-textarea-sm w-full p-3 bg-muted border border-border rounded-lg text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
    </div>
  );
}
