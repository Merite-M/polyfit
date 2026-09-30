'use client';

import React, { useState } from 'react';
import {
  Building2,
  X,
  Check,
  MapPin,
  Users,
  Radio,
  Search,
  SlidersHorizontal,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { usePartner, ProviderLocation } from '@/contexts/PartnerContext';

interface FacilityUnitsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FacilityUnitsModal({ isOpen, onClose }: FacilityUnitsModalProps) {
  const { locations, selectedLocationId, setSelectedLocationId, provider } = usePartner();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredLocations = locations.filter((loc) => {
    const q = searchQuery.toLowerCase();
    return (
      loc.name.toLowerCase().includes(q) ||
      (loc.city && loc.city.toLowerCase().includes(q)) ||
      (loc.address && loc.address.toLowerCase().includes(q))
    );
  });

  const handleSelectLocation = (id: string) => {
    setSelectedLocationId(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="facility-modal-title"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between bg-gradient-to-r from-[#F7F9FC] to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#28D17C]/15 border border-[#28D17C]/30 flex items-center justify-center text-[#0B1F33]">
              <Building2 className="w-5 h-5 text-[#008A4B]" />
            </div>
            <div>
              <h2 id="facility-modal-title" className="text-base font-bold text-[#0B1F33] tracking-tight">
                Switch Operating Facility Unit
              </h2>
              <p className="text-xs text-[#526173] mt-0.5">
                {provider?.name || 'Partner Facility'} Multi-Branch Network
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8491A3] hover:text-[#0B1F33] hover:bg-[#F1F4F8] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3.5 border-b border-[#E2E8F0] bg-[#FAFCFF]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8491A3] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search facility name, branch, or city (e.g. Kigali, Nyarutarama)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white border border-[#E2E8F0] text-[#0B1F33] placeholder:text-[#8491A3] focus:outline-none focus:ring-2 focus:ring-[#28D17C]"
            />
          </div>
        </div>

        {/* Facilities List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {/* Option 1: All Locations (Network Aggregation) */}
          <div
            onClick={() => handleSelectLocation('all')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedLocationId === 'all'
                ? 'bg-[#E9FAF2] border-[#28D17C] shadow-xs'
                : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                  selectedLocationId === 'all'
                    ? 'bg-[#28D17C] text-[#0B1F33]'
                    : 'bg-[#F1F4F8] text-[#526173]'
                }`}
              >
                ALL
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#0B1F33]">
                    All Locations (Aggregated Network View)
                  </span>
                  <span className="text-[10px] font-semibold bg-[#0B1F33] text-white px-2 py-0.5 rounded-full">
                    {locations.length} Units
                  </span>
                </div>
                <p className="text-[11px] text-[#526173] mt-0.5">
                  Consolidated multi-branch check-ins, total revenue, and overall corporate load.
                </p>
              </div>
            </div>

            {selectedLocationId === 'all' && (
              <div className="w-6 h-6 rounded-full bg-[#28D17C] flex items-center justify-center text-[#0B1F33] shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </div>

          <div className="pt-2 pb-1 px-1 text-[11px] font-semibold text-[#8491A3] uppercase tracking-wider">
            Individual Facility Units
          </div>

          {filteredLocations.map((loc, idx) => {
            const isSelected = selectedLocationId === loc.id;
            // Generate clean unit reference code e.g. #851931
            const unitNumber = `#85193${idx + 1}`;

            return (
              <div
                key={loc.id}
                onClick={() => handleSelectLocation(loc.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                  isSelected
                    ? 'bg-[#E9FAF2] border-[#28D17C] shadow-xs'
                    : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      isSelected
                        ? 'bg-[#28D17C] text-[#0B1F33]'
                        : 'bg-[#F1F4F8] text-[#526173] group-hover:bg-[#E2E8F0]'
                    }`}
                  >
                    U{idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-[#0B1F33] truncate">
                        {loc.name}
                      </h4>
                      <span className="text-[10px] font-mono text-[#526173] bg-[#F1F4F8] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                        Unit {unitNumber}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#008A4B] font-semibold bg-[#E9FAF2] px-1.5 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#28D17C]"></span>
                        Active
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[#526173] mt-1">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-[#8491A3]" />
                        {loc.address || loc.city || 'Kigali, Rwanda'}
                      </span>
                      {loc.capacity && (
                        <span className="flex items-center gap-1 shrink-0">
                          <Users className="w-3 h-3 text-[#8491A3]" />
                          Cap: {loc.capacity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="ml-2 shrink-0">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-[#28D17C] flex items-center justify-center text-[#0B1F33]">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#8491A3] group-hover:text-[#0B1F33] transition-colors" />
                  )}
                </div>
              </div>
            );
          })}

          {filteredLocations.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="w-8 h-8 text-[#8491A3] mx-auto opacity-50 mb-2" />
              <p className="text-xs font-semibold text-[#0B1F33]">No facility units found</p>
              <p className="text-[11px] text-[#526173] mt-0.5">Try searching with a different branch name or city.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#E2E8F0] bg-[#F7F9FC] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#526173]">
            <Radio className="w-3.5 h-3.5 text-[#28D17C] animate-pulse" />
            <span>Turnstile & GPS Geofence Synchronized</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#0B1F33] text-white text-xs font-semibold hover:bg-[#132D43] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
