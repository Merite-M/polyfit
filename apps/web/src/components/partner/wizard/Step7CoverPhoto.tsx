'use client';

import React, { useRef } from 'react';
import {
  Building,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Sparkles,
  Eye
} from 'lucide-react';
import { WizardLocationState } from './types';

interface Step7Props {
  state: WizardLocationState;
  onChange: (patch: Partial<WizardLocationState>) => void;
}

const PRESET_COVERS = [
  {
    name: 'Modern Conditioning Floor',
    url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=80&w=1200',
  },
  {
    name: 'Heated Lap Pool & Cabanas',
    url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=1200',
  },
  {
    name: 'Sunlit Pilates Reformer Studio',
    url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=1200',
  },
  {
    name: 'Clay Tennis & Courts',
    url: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&q=80&w=1200',
  },
];

export function Step7CoverPhoto({ state, onChange }: Step7Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onChange({ cover_url: event.target.result as string });
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
          <Building className="w-3.5 h-3.5" />
          <span>Step 7 of 11 • Featured Hero Cover</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#0B1F33]">
          Featured Cover Hero Photo
        </h2>
        <p className="text-xs sm:text-sm text-[#526173] mt-1">
          A high-resolution landscape photo (16:9 ratio, min 1200×675px) that serves as the hero header on employee discovery cards and search feeds.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-4 shadow-xs">
        {/* Upload Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#CBD5E1] hover:border-[#28D17C] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#F8FAFC] hover:bg-[#E9FAF2]/30"
        >
          <div className="w-12 h-12 rounded-full bg-white shadow-xs flex items-center justify-center text-[#28D17C] mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-xs sm:text-sm font-bold text-[#0B1F33]">
            Click to upload your featured cover hero image
          </p>
          <p className="text-[11px] text-[#8491A3] mt-1">
            Horizontal high-resolution photo (16:9 aspect ratio recommended, max 10MB)
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
            Or paste direct high-resolution image URL:
          </label>
          <input
            type="url"
            placeholder="https://images.unsplash.com/..."
            value={state.cover_url}
            onChange={(e) => onChange({ cover_url: e.target.value })}
            className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#CBD5E1] rounded-lg text-xs font-mono text-[#0B1F33] focus:ring-1 focus:ring-[#28D17C]"
          />
        </div>

        {/* Preset Gallery */}
        <div>
          <span className="text-[11px] font-bold text-[#8491A3] uppercase tracking-wider block mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#28D17C]" />
            Quick Presets for Evaluation:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PRESET_COVERS.map((preset) => (
              <div
                key={preset.name}
                onClick={() => onChange({ cover_url: preset.url })}
                className={`relative rounded-lg overflow-hidden border cursor-pointer group transition-all ${
                  state.cover_url === preset.url
                    ? 'ring-2 ring-[#28D17C] border-[#28D17C]'
                    : 'border-[#E2E8F0] hover:border-[#28D17C]'
                }`}
              >
                <img
                  src={preset.url}
                  alt={preset.name}
                  className="w-full h-20 object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 flex items-end p-1.5">
                  <span className="text-[10px] text-white font-semibold leading-tight truncate">
                    {preset.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Card Preview */}
        {state.cover_url && (
          <div className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0B1F33] flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#28D17C]" />
                Cover Hero Live Preview
              </span>
              <button
                type="button"
                onClick={() => onChange({ cover_url: '' })}
                className="text-xs text-[#EF4444] hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove Cover</span>
              </button>
            </div>

            <div className="relative h-48 sm:h-56 rounded-xl overflow-hidden shadow-md">
              <img
                src={state.cover_url}
                alt="Featured cover hero preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F33]/80 via-transparent to-transparent flex items-end p-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#28D17C] bg-[#0B1F33]/60 px-2 py-0.5 rounded">
                    Featured Discovery Hero
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {state.name || 'Your Facility Name'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {state.city} • {state.address || 'Kigali, Rwanda'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
