'use client';

import React, { useRef } from 'react';
import {
  DoorOpen,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Sparkles,
  MapPin,
  Info
} from 'lucide-react';
import { WizardLocationState } from './types';

interface Step8Props {
  state: WizardLocationState;
  onChange: (patch: Partial<WizardLocationState>) => void;
}

const PRESET_ENTRANCES = [
  {
    name: 'Modern Tower Entrance',
    url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=800',
  },
  {
    name: 'Revolving Doors & Reception Atrium',
    url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=80&w=800',
  },
  {
    name: 'Outdoor Club Archway & Gate',
    url: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&q=80&w=800',
  },
];

export function Step8EntrancePhoto({ state, onChange }: Step8Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onChange({ entrance_url: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E9FAF2] text-[#008A4B] text-xs font-bold uppercase tracking-wider mb-2">
          <DoorOpen className="w-3.5 h-3.5" />
          <span>Step 8 of 11 • Entrance & Locator Photo</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#0B1F33]">
          Facility Entrance & Front Door Photo
        </h2>
        <p className="text-xs sm:text-sm text-[#526173] mt-1">
          A photo of the building exterior, parking entrance, or revolving doors so corporate employees arriving on site easily locate the right entrance.
        </p>
      </div>

      {/* Helpful Operational Notice */}
      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 flex items-start gap-3 text-xs text-[#1E40AF]">
        <Info className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block">Why is the Entrance Photo Critical?</span>
          <p>
            In Kigali business districts like KCT, CHIC, or Nyarutarama, facilities are often inside multi-floor commercial complexes. Showing the street-level entrance or elevator lobby prevents first-time visitor confusion and late check-in disputes.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-4 shadow-xs">
        {/* Upload Box */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#CBD5E1] hover:border-[#28D17C] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#F8FAFC] hover:bg-[#E9FAF2]/30"
        >
          <div className="w-12 h-12 rounded-full bg-white shadow-xs flex items-center justify-center text-[#28D17C] mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-xs sm:text-sm font-bold text-[#0B1F33]">
            Click to upload your facility entrance photo
          </p>
          <p className="text-[11px] text-[#8491A3] mt-1">
            Photo of building exterior, revolving door, or security gate (max 10MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#526173] mb-1">
            Or paste direct Entrance Photo URL:
          </label>
          <input
            type="url"
            placeholder="https://..."
            value={state.entrance_url}
            onChange={(e) => onChange({ entrance_url: e.target.value })}
            className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#CBD5E1] rounded-lg text-xs font-mono text-[#0B1F33] focus:ring-1 focus:ring-[#28D17C]"
          />
        </div>

        {/* Quick Presets */}
        <div>
          <span className="text-[11px] font-bold text-[#8491A3] uppercase tracking-wider block mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#28D17C]" />
            Quick Presets for Evaluation:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {PRESET_ENTRANCES.map((preset) => (
              <div
                key={preset.name}
                onClick={() => onChange({ entrance_url: preset.url })}
                className={`relative rounded-lg overflow-hidden border cursor-pointer group transition-all ${
                  state.entrance_url === preset.url
                    ? 'ring-2 ring-[#28D17C] border-[#28D17C]'
                    : 'border-[#E2E8F0] hover:border-[#28D17C]'
                }`}
              >
                <img
                  src={preset.url}
                  alt={preset.name}
                  className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                  <span className="text-[10px] text-white font-semibold leading-tight truncate">
                    {preset.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Preview */}
        {state.entrance_url && (
          <div className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0B1F33] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#28D17C]" />
                Entrance Photo Preview (As Seen by Arriving Employees)
              </span>
              <button
                type="button"
                onClick={() => onChange({ entrance_url: '' })}
                className="text-xs text-[#EF4444] hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove Entrance Photo</span>
              </button>
            </div>

            <div className="relative h-48 sm:h-56 rounded-xl overflow-hidden shadow-md">
              <img
                src={state.entrance_url}
                alt="Entrance preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-[#0B1F33]/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <DoorOpen className="w-3.5 h-3.5 text-[#28D17C]" />
                <span>Main Entrance Guide</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
