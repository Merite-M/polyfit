'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Plus,
  Search,
  Dumbbell,
  Waves,
  HeartHandshake,
  Trophy,
  Stethoscope
} from 'lucide-react';
import { WizardLocationState, AMENITY_CATEGORIES } from './types';

interface Step5Props {
  state: WizardLocationState;
  onChange: (patch: Partial<WizardLocationState>) => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'General & Comfort': Dumbbell,
  'Aquatic & Thermal': Waves,
  'Studio & Mind-Body': HeartHandshake,
  'Racquet & Court Sports': Trophy,
  'Health & Assessment': Stethoscope,
};

export function Step5MultiCategoryAmenities({ state, onChange }: Step5Props) {
  const [searchFilter, setSearchFilter] = useState('');
  const [customAmenity, setCustomAmenity] = useState('');

  const selectedAmenities = state.amenities || [];

  const handleToggleAmenity = (item: string) => {
    if (selectedAmenities.includes(item)) {
      onChange({ amenities: selectedAmenities.filter((a) => a !== item) });
    } else {
      onChange({ amenities: [...selectedAmenities, item] });
    }
  };

  const handleAddCustom = () => {
    if (!customAmenity.trim()) return;
    const clean = customAmenity.trim();
    if (!selectedAmenities.includes(clean)) {
      onChange({ amenities: [...selectedAmenities, clean] });
    }
    setCustomAmenity('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E9FAF2] text-[#008A4B] text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 5 of 11 • Multi-Category Amenities</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#0B1F33]">
          Facility Features & Wellness Amenities
        </h2>
        <p className="text-xs sm:text-sm text-[#526173] mt-1">
          PolyFit supports gyms, Olympic pools, yoga & pilates studios, padel courts, and thermal recovery clinics. Selected tags appear on your discovery card.
        </p>
      </div>

      {/* Search & Custom Amenity Bar */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search amenities (e.g. sauna, pool)..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#F7F9FC] border border-[#CBD5E1] rounded-lg text-xs sm:text-sm text-[#0B1F33] focus:ring-1 focus:ring-[#28D17C]"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Add custom amenity..."
            value={customAmenity}
            onChange={(e) => setCustomAmenity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
            className="flex-1 sm:w-48 px-3 py-2 bg-[#F7F9FC] border border-[#CBD5E1] rounded-lg text-xs text-[#0B1F33] focus:ring-1 focus:ring-[#28D17C]"
          />
          <button
            type="button"
            onClick={handleAddCustom}
            className="px-3 py-2 bg-[#0B1F33] hover:bg-[#132D43] text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Categorized Amenities Grid */}
      <div className="space-y-5">
        {AMENITY_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.category] || Sparkles;
          const matchingItems = cat.items.filter((item) =>
            item.toLowerCase().includes(searchFilter.toLowerCase())
          );

          if (matchingItems.length === 0) return null;

          return (
            <div
              key={cat.category}
              className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#E9FAF2] text-[#28D17C] flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-[#0B1F33]">{cat.category}</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {matchingItems.map((item) => {
                  const isChecked = selectedAmenities.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleToggleAmenity(item)}
                      className={`p-2.5 rounded-lg border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[#E9FAF2] border-[#28D17C] text-[#0B1F33] font-semibold'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#526173] hover:bg-[#F1F4F8]'
                      }`}
                    >
                      <span className="truncate pr-1">{item}</span>
                      {isChecked ? (
                        <CheckCircle2 className="w-4 h-4 text-[#28D17C] shrink-0" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-[#CBD5E1] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Amenities Pill Summary */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-[#526173]">
          Selected Amenities ({selectedAmenities.length}):
        </span>
        {selectedAmenities.length === 0 ? (
          <span className="text-xs text-[#8491A3] italic">No amenities selected yet.</span>
        ) : (
          selectedAmenities.map((amenity) => (
            <span
              key={amenity}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-[#28D17C]/40 text-[#0B1F33] shadow-2xs"
            >
              <span>{amenity}</span>
              <button
                type="button"
                onClick={() => handleToggleAmenity(amenity)}
                className="hover:text-[#EF4444]"
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
}
