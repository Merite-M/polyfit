'use client';

import React, { useRef } from 'react';
import {
  Image as ImageIcon,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Sparkles
} from 'lucide-react';
import { WizardLocationState } from './types';

interface Step6Props {
  state: WizardLocationState;
  onChange: (patch: Partial<WizardLocationState>) => void;
}

const PRESET_LOGOS = [
  {
    name: 'Dynamic Hex Gym',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=300',
  },
  {
    name: 'Aquatic Center',
    url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=300',
  },
  {
    name: 'Mind-Body Yoga',
    url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=300',
  },
  {
    name: 'Luxury Spa',
    url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=300',
  },
];

export function Step6LogoUpload({ state, onChange }: Step6Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onChange({ logo_url: event.target.result as string });
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
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Step 6 of 11 • Partner Brand Logo</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#0B1F33]">
          Upload Square Brand Logo or Icon
        </h2>
        <p className="text-xs sm:text-sm text-[#526173] mt-1">
          A clean square avatar (1:1 aspect ratio, min 250×250px) representing your facility in employee search feeds and checked-in visitor tickets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Upload Zone (8 cols) */}
        <div className="md:col-span-8 bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-4 shadow-xs">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#CBD5E1] hover:border-[#28D17C] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#F8FAFC] hover:bg-[#E9FAF2]/30"
          >
            <div className="w-12 h-12 rounded-full bg-white shadow-xs flex items-center justify-center text-[#28D17C] mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#0B1F33]">
              Click to browse or drag & drop your logo
            </p>
            <p className="text-[11px] text-[#8491A3] mt-1">
              Supports PNG, JPG, or SVG. Maximum file size: 5MB.
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
              Or paste direct Image URL:
            </label>
            <input
              type="url"
              placeholder="https://yourbrand.com/logo.png"
              value={state.logo_url}
              onChange={(e) => onChange({ logo_url: e.target.value })}
              className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#CBD5E1] rounded-lg text-xs font-mono text-[#0B1F33] focus:ring-1 focus:ring-[#28D17C]"
            />
          </div>

          {/* Presets */}
          <div>
            <span className="text-[11px] font-bold text-[#8491A3] uppercase tracking-wider block mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#28D17C]" />
              Quick Presets for Evaluation:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_LOGOS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => onChange({ logo_url: preset.url })}
                  className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#E9FAF2] text-xs font-medium text-[#0B1F33] flex items-center gap-2 transition-colors"
                >
                  <img src={preset.url} alt={preset.name} className="w-4 h-4 rounded-full object-cover" />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Logo Preview Box (4 cols) */}
        <div className="md:col-span-4 bg-white rounded-xl border border-[#E2E8F0] p-5 flex flex-col items-center justify-center text-center shadow-xs">
          <span className="text-xs font-bold text-[#8491A3] uppercase tracking-wider mb-4">
            Logo Live Preview
          </span>

          <div className="w-28 h-28 rounded-2xl border-2 border-[#28D17C] overflow-hidden shadow-md bg-slate-900 flex items-center justify-center relative group">
            {state.logo_url ? (
              <img
                src={state.logo_url}
                alt="Brand logo preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-10 h-10 text-[#8491A3]" />
            )}
          </div>

          <p className="text-xs font-bold text-[#0B1F33] mt-3">
            {state.name || 'Facility Name'}
          </p>
          <p className="text-[10px] text-[#28D17C] font-semibold mt-0.5">
            Verified Partner
          </p>

          {state.logo_url && (
            <button
              type="button"
              onClick={() => onChange({ logo_url: '' })}
              className="mt-3 text-xs text-[#EF4444] hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Logo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
