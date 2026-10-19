'use client';

import React from 'react';
import {
  Clock,
  Phone,
  FileText,
  ShieldCheck,
  Sparkles,
  Image as ImageIcon,
  Building,
  DoorOpen,
  LayoutGrid,
  CreditCard,
  Rocket,
  CheckCircle2,
  Save,
  Zap,
} from 'lucide-react';

interface WizardHeaderProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  lastSavedAt: string | null;
  facilityName: string;
  onApplyPresets?: () => void;
}

export const WIZARD_STEPS = [
  { step: 1, title: 'Operating Hours', phase: 1, icon: Clock },
  { step: 2, title: 'Contact & Social', phase: 2, icon: Phone },
  { step: 3, title: 'Guidelines & Bio', phase: 2, icon: FileText },
  { step: 4, title: 'Check-in Rules', phase: 2, icon: ShieldCheck },
  { step: 5, title: 'Amenities', phase: 3, icon: Sparkles },
  { step: 6, title: 'Brand Logo', phase: 3, icon: ImageIcon },
  { step: 7, title: 'Cover Hero', phase: 3, icon: Building },
  { step: 8, title: 'Entrance Photo', phase: 3, icon: DoorOpen },
  { step: 9, title: 'Facility Gallery', phase: 3, icon: LayoutGrid },
  { step: 10, title: 'Payout Rails', phase: 4, icon: CreditCard },
  { step: 11, title: 'Live App Preview', phase: 4, icon: Rocket },
];

export const PHASES = [
  { id: 1, name: 'Phase 1: Availability', shortName: '1. Availability', steps: [1] },
  { id: 2, name: 'Phase 2: Profile & Rules', shortName: '2. Profile & Rules', steps: [2, 3, 4] },
  { id: 3, name: 'Phase 3: Amenities & Media', shortName: '3. Amenities & Media', steps: [5, 6, 7, 8, 9] },
  { id: 4, name: 'Phase 4: Settlement & Launch', shortName: '4. Launch', steps: [10, 11] },
];

export function WizardHeader({
  currentStep,
  onSelectStep,
  lastSavedAt,
  facilityName,
  onApplyPresets,
}: WizardHeaderProps) {
  const currentPhase = PHASES.find((p) => p.steps.includes(currentStep)) || PHASES[0];
  const progressPercent = Math.round(((currentStep - 1) / 10) * 100);
  const activeStepObj = WIZARD_STEPS.find((s) => s.step === currentStep) || WIZARD_STEPS[0];

  return (
    <div className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-3.5 space-y-3">
      {/* Top Bar: Facility Name, Phase, and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8491A3]">
            <span>PolyFit Partner Onboarding</span>
            <span>/</span>
            <span className="text-[#28D17C] font-bold">{currentPhase.name}</span>
            <span>•</span>
            <span className="text-[#0B1F33] font-bold">Step {currentStep} of 11: {activeStepObj.title}</span>
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-[#0B1F33] tracking-tight mt-0.5 truncate max-w-xl">
            {facilityName ? facilityName : 'New Wellness Facility Branch'}
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Fast-Track 1-Click Preset Button */}
          {onApplyPresets && (
            <button
              type="button"
              onClick={onApplyPresets}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E9FAF2] hover:bg-[#d4f7e5] text-[#008A4B] text-xs font-bold border border-[#B7F1D2] shadow-2xs transition-all cursor-pointer"
              title="Prepopulate verified Rwandan operating hours, authentic amenities, cover photo and settlement defaults"
            >
              <Zap className="w-3.5 h-3.5 fill-[#008A4B]" />
              <span>⚡ Fast-Track Kigali Presets</span>
            </button>
          )}

          {/* Draft Save Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#F7F9FC] border border-[#E2E8F0] text-[11px] font-medium text-[#526173]">
            <Save className="w-3 h-3 text-[#28D17C]" />
            <span>{lastSavedAt ? `Saved ${lastSavedAt}` : 'Draft saved'}</span>
          </div>

          {/* Progress Percent Pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#0B1F33] text-white text-xs font-bold">
            <span>{progressPercent}% Complete</span>
          </div>
        </div>
      </div>

      {/* Sleek 4-Phase Segmented Navigation Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
        {PHASES.map((phase) => {
          const isPhaseActive = phase.steps.includes(currentStep);
          const isPhaseDone = phase.steps.every((s) => s < currentStep);

          return (
            <div
              key={phase.id}
              className={`p-2 rounded-xl border transition-all ${
                isPhaseActive
                  ? 'bg-slate-50 border-[#28D17C] ring-1 ring-[#28D17C]/30 shadow-2xs'
                  : isPhaseDone
                  ? 'bg-[#E9FAF2]/40 border-[#B7F1D2] text-[#008A4B]'
                  : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
                <span className={isPhaseActive ? 'text-[#0B1F33]' : ''}>{phase.shortName}</span>
                {isPhaseDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#28D17C]" />
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {phase.steps.length} {phase.steps.length === 1 ? 'step' : 'steps'}
                  </span>
                )}
              </div>

              {/* Mini Step Pills inside this Phase */}
              <div className="flex items-center gap-1">
                {phase.steps.map((st) => {
                  const isCurrent = st === currentStep;
                  const isDone = st < currentStep;
                  const stepMeta = WIZARD_STEPS.find((w) => w.step === st);

                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => onSelectStep(st)}
                      title={`${st}. ${stepMeta?.title || ''}`}
                      className={`flex-1 h-5 rounded-md text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#0B1F33] text-[#28D17C] shadow-xs'
                          : isDone
                          ? 'bg-[#28D17C] text-[#0B1F33] hover:opacity-90'
                          : 'bg-[#E2E8F0] text-[#64748B] hover:bg-[#CBD5E1]'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
