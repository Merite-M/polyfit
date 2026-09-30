'use client';

import React, { useRef, useState } from 'react';
import {
  LayoutGrid,
  Plus,
  Trash2,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import { WizardLocationState } from './types';

interface Step9Props {
  state: WizardLocationState;
  onChange: (patch: Partial<WizardLocationState>) => void;
}

const PRESET_GALLERY_PHOTOS = [
  {
    name: 'Free Weights & Dumbbells',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800',
  },
  {
    name: 'Cardio Row & Treadmills',
    url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=80&w=800',
  },
  {
    name: 'Reformer Pilates Studio',
    url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=800',
  },
  {
    name: 'Thermal Sauna & Relaxation',
    url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800',
  },
  {
    name: 'Olympic Lap Pool',
    url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=800',
  },
  {
    name: 'Clay Tennis Courts',
    url: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&q=80&w=800',
  },
];

export function Step9FacilityGallery({ state, onChange }: Step9Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');

  const currentGallery = state.gallery_urls || [];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            onChange({
              gallery_urls: [...(state.gallery_urls || []), event.target.result as string],
            });
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    onChange({
      gallery_urls: [...currentGallery, urlInput.trim()],
    });
    setUrlInput('');
  };

  const handleRemovePhoto = (idx: number) => {
    onChange({
      gallery_urls: currentGallery.filter((_, i) => i !== idx),
    });
  };

  const handleAddPreset = (url: string) => {
    if (!currentGallery.includes(url)) {
      onChange({ gallery_urls: [...currentGallery, url] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E9FAF2] text-[#008A4B] text-xs font-bold uppercase tracking-wider mb-2">
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Step 9 of 11 • Facility Photo Gallery</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#0B1F33]">
          Multi-Photo Facility Showcase
        </h2>
        <p className="text-xs sm:text-sm text-[#526173] mt-1">
          Upload 3 to 10 photos showcasing your strength equipment, cardio floor, studios, locker rooms, and recovery zones.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-5 shadow-xs">
        {/* Upload & Add Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#0B1F33] hover:bg-[#132D43] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-[#28D17C]" />
            <span>Upload Photos from Device</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />

          <div className="flex gap-2 w-full sm:w-auto flex-1 max-w-md">
            <input
              type="url"
              placeholder="Or paste image URL..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
              className="flex-1 px-3 py-2 bg-[#F7F9FC] border border-[#CBD5E1] rounded-lg text-xs font-mono text-[#0B1F33] focus:ring-1 focus:ring-[#28D17C]"
            />
            <button
              type="button"
              onClick={handleAddUrl}
              className="px-3.5 py-2 bg-[#F1F4F8] hover:bg-[#E9FAF2] text-[#0B1F33] rounded-lg text-xs font-bold border border-[#E2E8F0] transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Current Gallery Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0B1F33]">
              Active Gallery Photos ({currentGallery.length})
            </span>
            <span className="text-[11px] text-[#8491A3]">
              Click trash icon to delete
            </span>
          </div>

          {currentGallery.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-[#CBD5E1] rounded-xl text-center text-xs text-[#8491A3]">
              No gallery photos added yet. Select presets below or upload from your device.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {currentGallery.map((url, idx) => (
                <div
                  key={idx}
                  className="relative rounded-lg overflow-hidden border border-[#E2E8F0] group h-28 bg-slate-900"
                >
                  <img
                    src={url}
                    alt={`Facility gallery photo ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="p-1.5 rounded-full bg-[#EF4444] text-white hover:scale-110 transition-transform"
                      title="Delete photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-white font-mono">
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preset Gallery Suggestions */}
        <div className="pt-4 border-t border-[#E2E8F0]">
          <span className="text-[11px] font-bold text-[#8491A3] uppercase tracking-wider block mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#28D17C]" />
            Quick Presets for Evaluation:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {PRESET_GALLERY_PHOTOS.map((preset) => {
              const isAdded = currentGallery.includes(preset.url);
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleAddPreset(preset.url)}
                  disabled={isAdded}
                  className={`relative rounded-lg overflow-hidden border text-left cursor-pointer group transition-all ${
                    isAdded ? 'opacity-40 cursor-not-allowed border-[#28D17C]' : 'hover:border-[#28D17C]'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-16 object-cover"
                  />
                  <div className="p-1 bg-[#F8FAFC]">
                    <span className="text-[9px] font-semibold text-[#0B1F33] block truncate">
                      {preset.name}
                    </span>
                  </div>
                  {isAdded && (
                    <div className="absolute top-1 right-1 bg-[#28D17C] text-[#0B1F33] rounded-full p-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
