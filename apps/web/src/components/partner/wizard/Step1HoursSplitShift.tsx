'use client';

import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  Copy,
  Building2,
  MapPin,
  CheckCircle,
  AlertCircle,
  Compass
} from 'lucide-react';
import {
  WizardLocationState,
  DAYS_OF_WEEK,
  KIGALI_DISTRICT_PRESETS,
  SplitShift,
} from './types';

interface Step1Props {
  state: WizardLocationState;
  onChange: (patch: Partial<WizardLocationState>) => void;
}

export function Step1HoursSplitShift({ state, onChange }: Step1Props) {
  const [activeDay, setActiveDay] = useState<string>('monday');
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  const currentDaySchedule = state.operating_hours[activeDay] || {
    is_closed: false,
    shifts: [{ open: '06:00', close: '21:00' }],
  };

  const handleToggleClosed = () => {
    const updated = {
      ...state.operating_hours,
      [activeDay]: {
        ...currentDaySchedule,
        is_closed: !currentDaySchedule.is_closed,
      },
    };
    onChange({ operating_hours: updated });
  };

  const handleShiftChange = (shiftIndex: number, field: 'open' | 'close', value: string) => {
    const updatedShifts = [...currentDaySchedule.shifts];
    updatedShifts[shiftIndex] = {
      ...updatedShifts[shiftIndex],
      [field]: value,
    };
    const updated = {
      ...state.operating_hours,
      [activeDay]: {
        ...currentDaySchedule,
        shifts: updatedShifts,
      },
    };
    onChange({ operating_hours: updated });
  };

  const handleAddSplitShift = () => {
    if (currentDaySchedule.shifts.length >= 3) return;
    const lastShift = currentDaySchedule.shifts[currentDaySchedule.shifts.length - 1];
    const newShift: SplitShift = {
      open: '16:00',
      close: '21:00',
    };
    const updated = {
      ...state.operating_hours,
      [activeDay]: {
        ...currentDaySchedule,
        shifts: [...currentDaySchedule.shifts, newShift],
      },
    };
    onChange({ operating_hours: updated });
  };

  const handleRemoveShift = (shiftIndex: number) => {
    if (currentDaySchedule.shifts.length <= 1) return;
    const updatedShifts = currentDaySchedule.shifts.filter((_, idx) => idx !== shiftIndex);
    const updated = {
      ...state.operating_hours,
      [activeDay]: {
        ...currentDaySchedule,
        shifts: updatedShifts,
      },
    };
    onChange({ operating_hours: updated });
  };

  const handleApplyToAllDays = () => {
    const targetSchedule = { ...currentDaySchedule };
    const newHours: Record<string, typeof targetSchedule> = {};
    DAYS_OF_WEEK.forEach((d) => {
      newHours[d.key] = {
        is_closed: targetSchedule.is_closed,
        shifts: targetSchedule.shifts.map((s) => ({ ...s })),
      };
    });
    onChange({ operating_hours: newHours });
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handlePresetDistrict = (preset: typeof KIGALI_DISTRICT_PRESETS[0]) => {
    onChange({
      city: 'Kigali',
      address: preset.name.split(' (')[0],
      lat: preset.lat,
      lng: preset.lng,
    });
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E9FAF2] text-[#008A4B] text-xs font-bold uppercase tracking-wider mb-2">
          <Clock className="w-3.5 h-3.5" />
          <span>Step 1 of 11 • Operating Hours & Split-Shifts</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#0B1F33]">
          Facility Identity & Operating Schedule
        </h2>
        <p className="text-xs sm:text-sm text-[#526173] mt-1">
          Configure when corporate employees can visit your venue. Support morning and evening split-shifts (e.g. 06:00-11:00 AM and 16:00-21:00 PM).
        </p>
      </div>

      {/* Basic Facility Identity (Name & Address) */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-5 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-[#0B1F33] flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#28D17C]" />
          <span>Facility Name & Location</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
              Facility Branch Name <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. FitLife Kigali Central (Unit #851)"
              value={state.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-lg text-xs sm:text-sm text-[#0B1F33] focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
              Physical Street Address <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. KN 3 Ave, Kigali City Tower Level 2"
              value={state.address}
              onChange={(e) => onChange({ address: e.target.value })}
              className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-lg text-xs sm:text-sm text-[#0B1F33] focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
            />
          </div>
        </div>

        {/* District Quick-Pills for Kigali */}
        <div>
          <label className="block text-xs font-semibold text-[#526173] mb-1.5 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#28D17C]" />
            <span>Kigali District Coordinates Presets (Auto-fills GPS):</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {KIGALI_DISTRICT_PRESETS.slice(0, 6).map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handlePresetDistrict(preset)}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#F1F4F8] hover:bg-[#E9FAF2] text-[#0B1F33] border border-[#E2E8F0] transition-colors"
              >
                {preset.name.split(' (')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Operating Hours Scheduler Box */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-5 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#0B1F33]">Weekly Schedule & Access Hours</h3>
            <p className="text-xs text-[#526173]">Select a day to configure open/close hours and split-shifts.</p>
          </div>

          {/* Apply to All Days Shortcut */}
          <button
            type="button"
            onClick={handleApplyToAllDays}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              copyFeedback
                ? 'bg-[#28D17C] text-[#0B1F33]'
                : 'bg-[#F1F4F8] hover:bg-[#E9FAF2] text-[#0B1F33] border border-[#E2E8F0]'
            }`}
          >
            {copyFeedback ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Applied to all 7 days!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#28D17C]" />
                <span>Apply this schedule to all days</span>
              </>
            )}
          </button>
        </div>

        {/* Day Pill Selectors (Mon - Sun) */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {DAYS_OF_WEEK.map((d) => {
            const isSelected = activeDay === d.key;
            const daySched = state.operating_hours[d.key];
            const isClosed = daySched?.is_closed;

            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setActiveDay(d.key)}
                className={`py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0B1F33] text-white ring-2 ring-[#28D17C] shadow-sm'
                    : 'bg-[#F8FAFC] hover:bg-[#F1F4F8] text-[#526173] border border-[#E2E8F0]'
                }`}
              >
                <span className="text-xs sm:text-sm font-bold">{d.label}</span>
                <span
                  className={`text-[10px] mt-0.5 font-medium ${
                    isClosed
                      ? 'text-[#EF4444]'
                      : isSelected
                      ? 'text-[#28D17C]'
                      : 'text-[#008A4B]'
                  }`}
                >
                  {isClosed ? 'Closed' : `${daySched?.shifts.length || 1} shift`}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Day Detail Card */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#28D17C]" />
              <h4 className="text-sm font-bold text-[#0B1F33] capitalize">
                {DAYS_OF_WEEK.find((d) => d.key === activeDay)?.fullLabel} Hours
              </h4>
            </div>

            {/* Closed toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-[#526173]">
              <input
                type="checkbox"
                checked={currentDaySchedule.is_closed}
                onChange={handleToggleClosed}
                className="w-4 h-4 rounded text-[#EF4444] focus:ring-[#EF4444]"
              />
              <span>Mark facility as closed on this day</span>
            </label>
          </div>

          {!currentDaySchedule.is_closed ? (
            <div className="space-y-3">
              {currentDaySchedule.shifts.map((shift, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-[#E2E8F0] rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#E9FAF2] text-[#008A4B] text-[11px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-[#0B1F33]">
                      {idx === 0 ? 'Morning / Primary Shift' : `Split Shift #${idx + 1}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#8491A3] font-medium">From:</span>
                      <input
                        type="time"
                        value={shift.open}
                        onChange={(e) => handleShiftChange(idx, 'open', e.target.value)}
                        className="px-2 py-1 bg-[#F7F9FC] border border-[#CBD5E1] rounded text-xs font-semibold text-[#0B1F33] focus:ring-1 focus:ring-[#28D17C]"
                      />
                    </div>

                    <span className="text-[#8491A3] font-bold">—</span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[#8491A3] font-medium">To:</span>
                      <input
                        type="time"
                        value={shift.close}
                        onChange={(e) => handleShiftChange(idx, 'close', e.target.value)}
                        className="px-2 py-1 bg-[#F7F9FC] border border-[#CBD5E1] rounded text-xs font-semibold text-[#0B1F33] focus:ring-1 focus:ring-[#28D17C]"
                      />
                    </div>

                    {currentDaySchedule.shifts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveShift(idx)}
                        className="p-1 rounded text-[#EF4444] hover:bg-[#FEE2E2] transition-colors ml-1"
                        title="Remove split shift"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {currentDaySchedule.shifts.length < 3 && (
                <button
                  type="button"
                  onClick={handleAddSplitShift}
                  className="w-full py-2.5 px-3 border border-dashed border-[#28D17C] rounded-lg text-xs font-bold text-[#008A4B] bg-[#E9FAF2]/50 hover:bg-[#E9FAF2] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#28D17C]" />
                  <span>Add Split Shift (e.g. Afternoon / Evening Peak 16:00 - 21:00)</span>
                </button>
              )}
            </div>
          ) : (
            <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-lg p-3 text-xs text-[#991B1B] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#EF4444]" />
              <span>Facility is closed on {DAYS_OF_WEEK.find((d) => d.key === activeDay)?.fullLabel}. Check-ins will be blocked in employee app.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
