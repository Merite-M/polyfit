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
} from 'lucide-react';

interface WizardHeaderProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  lastSavedAt: string | null;
  facilityName: string;
}

export const WIZARD_STEPS = [
  { step: 1, title: 'Operating Hours', phase: 1, icon: Clock },
  { step: 2, title: 'Contact & Social', phase: 2, icon: Phone },
  { step: 3, title: 'Guidelines & Bio', phase: 2, icon: FileText },
  { step: 4, title: 'Check-in Rules', phase: 2, icon: ShieldCheck },
  { step: 5, title: 'Amenities', phase: 2, icon: Sparkles },
  { step: 6, title: 'Brand Logo', phase: 3, icon: ImageIcon },
  { step: 7, title: 'Cover Hero', phase: 3, icon: Building },
  { step: 8, title: 'Entrance Photo', phase: 3, icon: DoorOpen },
  { step: 9, title: 'Facility Gallery', phase: 3, icon: LayoutGrid },
  { step: 10, title: 'Payout Rails', phase: 4, icon: CreditCard },
  { step: 11, title: 'Live App Preview', phase: 4, icon: Rocket },
];

export const PHASES = [
  { id: 1, name: 'Phase 1: Availability', steps: [1] },
  { id: 2, name: 'Phase 2: Rules & Amenities', steps: [2, 3, 4, 5] },
  { id: 3, name: 'Phase 3: Visual Media', steps: [6, 7, 8, 9] },
  { id: 4, name: 'Phase 4: Launch & Preview', steps: [10, 11] },
];

export function WizardHeader({
  currentStep,
  onSelectStep,
  lastSavedAt,
  facilityName,
}: WizardHeaderProps) {
  const currentPhase = PHASES.find((p) => p.steps.includes(currentStep)) || PHASES[0];
  const progressPercent = Math.round(((currentStep - 1) / 10) * 100);

  return (
    <div className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-4 space-y-4">
      {/* Top Bar: Facility Name, Phase, and Auto-save indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8491A3]">
            <span>PolyFit Partner Onboarding</span>
            <span>/</span>
            <span className="text-[#28D17C] font-bold">{currentPhase.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B1F33] tracking-tight mt-0.5">
            {facilityName ? facilityName : 'New Wellness Facility Branch'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Draft Save Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F7F9FC] border border-[#E2E8F0] text-[11px] font-medium text-[#526173]">
            <Save className="w-3.5 h-3.5 text-[#28D17C]" />
            <span>{lastSavedAt ? `Auto-saved at ${lastSavedAt}` : 'Draft saved locally'}</span>
          </div>

          {/* Progress Percent Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E9FAF2] text-[#008A4B] text-xs font-bold border border-[#B7F1D2]">
            <span>{progressPercent}% Complete</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#F1F4F8] h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-[#28D17C] to-[#00D2B4] h-full transition-all duration-300 rounded-full"
          style={{ width: `${Math.max(5, progressPercent)}%` }}
        />
      </div>

      {/* Horizontal Step Pills (Scrollable on small devices) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {WIZARD_STEPS.map((s) => {
          const isCurrent = s.step === currentStep;
          const isDone = s.step < currentStep;
          const Icon = s.icon;

          return (
            <button
              key={s.step}
              type="button"
              onClick={() => onSelectStep(s.step)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                isCurrent
                  ? 'bg-[#0B1F33] text-white shadow-xs'
                  : isDone
                  ? 'bg-[#E9FAF2] text-[#008A4B] hover:bg-[#D5F5E4] border border-[#B7F1D2]'
                  : 'bg-[#F7F9FC] text-[#526173] hover:bg-[#F1F4F8] border border-[#E2E8F0]'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#28D17C]" />
              ) : (
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono ${
                  isCurrent ? 'bg-[#28D17C] text-[#0B1F33] font-bold' : 'bg-[#E2E8F0] text-[#526173]'
                }`}>
                  {s.step}
                </span>
              )}
              <span className="truncate max-w-[110px]">{s.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
