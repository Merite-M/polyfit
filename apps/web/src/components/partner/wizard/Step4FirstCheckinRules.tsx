'use client';

import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ShoppingBag,
  Plus,
  X
} from 'lucide-react';
import { WizardLocationState } from './types';

interface Step4Props {
  state: WizardLocationState;
  onChange: (patch: Partial<WizardLocationState>) => void;
}

const DEFAULT_GEAR_SUGGESTIONS = [
  'Clean indoor athletic sneakers',
  'Training sweat towel',
  'Reusable hydration bottle',
  'Locker padlock',
  'Yoga mat',
  'Swim cap & goggles',
  'Grippy pilates socks',
  'Valid National ID or Company Badge',
];

export function Step4FirstCheckinRules({ state, onChange }: Step4Props) {
  const rules = state.first_checkin_rules;

  const handleToggleRule = (key: keyof typeof rules) => {
    onChange({
      first_checkin_rules: {
        ...rules,
        [key]: !rules[key],
      },
    });
  };

  const handleSetEarlyMins = (mins: number) => {
    onChange({
      first_checkin_rules: {
        ...rules,
        arrive_early_minutes: mins,
      },
    });
  };

  const handleToggleGear = (gear: string) => {
    const current = state.recommended_gear || [];
    if (current.includes(gear)) {
      onChange({ recommended_gear: current.filter((g) => g !== gear) });
    } else {
      onChange({ recommended_gear: [...current, gear] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E9FAF2] text-[#008A4B] text-xs font-bold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Step 4 of 11 • First Check-in Requirements</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#0B1F33]">
          First-Time Visitor Procedures & Recommended Gear
        </h2>
        <p className="text-xs sm:text-sm text-[#526173] mt-1">
          Help corporate employees prepare for their first check-in. Clarify registration forms, guided tours, and mandatory equipment.
        </p>
      </div>

      {/* 4 Yes/No Operational Questions (Wellhub Benchmark) */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-5 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-[#0B1F33]">Front Desk Check-in Requirements</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Question 1: Booking Required */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-[#0B1F33]">Advance Booking Required?</h4>
              <p className="text-[11px] text-[#526173]">Must employees book a spot prior to arrival?</p>
            </div>
            <div className="inline-flex rounded-lg bg-[#E2E8F0] p-0.5">
              <button
                type="button"
                onClick={() => handleToggleRule('booking_required')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  rules.booking_required ? 'bg-[#0B1F33] text-white shadow-xs' : 'text-[#526173]'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => handleToggleRule('booking_required')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  !rules.booking_required ? 'bg-white text-[#0B1F33] shadow-xs' : 'text-[#526173]'
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* Question 2: First-time Registration Form */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-[#0B1F33]">First-Time Registration Form?</h4>
              <p className="text-[11px] text-[#526173]">Paper or digital waiver form on 1st visit?</p>
            </div>
            <div className="inline-flex rounded-lg bg-[#E2E8F0] p-0.5">
              <button
                type="button"
                onClick={() => handleToggleRule('registration_form_required')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  rules.registration_form_required ? 'bg-[#0B1F33] text-white shadow-xs' : 'text-[#526173]'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => handleToggleRule('registration_form_required')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  !rules.registration_form_required ? 'bg-white text-[#0B1F33] shadow-xs' : 'text-[#526173]'
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* Question 3: Guided Tour Mandatory */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-[#0B1F33]">Mandatory Facility Orientation Tour?</h4>
              <p className="text-[11px] text-[#526173]">Does a staff member walk them through equipment?</p>
            </div>
            <div className="inline-flex rounded-lg bg-[#E2E8F0] p-0.5">
              <button
                type="button"
                onClick={() => handleToggleRule('guided_tour_mandatory')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  rules.guided_tour_mandatory ? 'bg-[#0B1F33] text-white shadow-xs' : 'text-[#526173]'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => handleToggleRule('guided_tour_mandatory')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  !rules.guided_tour_mandatory ? 'bg-white text-[#0B1F33] shadow-xs' : 'text-[#526173]'
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* Question 4: Arrive Early Minutes */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-[#0B1F33]">Recommended Early Arrival</h4>
              <p className="text-[11px] text-[#526173]">Buffer for front-desk pass verification</p>
            </div>
            <div className="flex items-center gap-1">
              {[0, 5, 10, 15, 20].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleSetEarlyMins(mins)}
                  className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${
                    rules.arrive_early_minutes === mins
                      ? 'bg-[#28D17C] text-[#0B1F33]'
                      : 'bg-white text-[#526173] hover:bg-[#F1F4F8] border border-[#E2E8F0]'
                  }`}
                >
                  {mins === 0 ? 'None' : `${mins}m`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Workout Gear Checklist */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-[#28D17C]" />
          <div>
            <h3 className="text-sm font-bold text-[#0B1F33]">What Beneficiaries Should Bring</h3>
            <p className="text-xs text-[#526173]">Select all items required or recommended at your venue.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {DEFAULT_GEAR_SUGGESTIONS.map((gear) => {
            const isSelected = (state.recommended_gear || []).includes(gear);
            return (
              <button
                key={gear}
                type="button"
                onClick={() => handleToggleGear(gear)}
                className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#E9FAF2] border-[#28D17C] text-[#0B1F33] font-semibold'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#526173] hover:bg-[#F1F4F8]'
                }`}
              >
                <span className="text-xs">{gear}</span>
                {isSelected ? (
                  <CheckCircle2 className="w-4 h-4 text-[#28D17C] shrink-0" />
                ) : (
                  <Plus className="w-4 h-4 text-[#94A3B8] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
