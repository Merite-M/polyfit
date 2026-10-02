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
import { useDialog } from '@/lib/use-dialog';

interface FacilityUnitsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FacilityUnitsModal({ isOpen, onClose }: FacilityUnitsModalProps) {
  const { locations, selectedLocationId, setSelectedLocationId, provider } = usePartner();
  const [searchQuery, setSearchQuery] = useState('');

  // Native <dialog> — top-layer, Escape key, focus trap all native.
  const dialogRef = useDialog(isOpen, onClose);

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
    /* Native <dialog> with pf-native-dialog class drives @starting-style entry +
       allow-discrete exit animations. Previously was a combined div.fixed.inset-0
       that merged backdrop and card — the worst pattern for overlays. */
    <dialog
      ref={dialogRef}
      className="pf-native-dialog pf-dialog-lg w-full flex flex-col max-h-[85dvh] overflow-hidden"
      role="dialog"
      aria-labelledby="facility-modal-title"
      onClose={onClose}
    >
      {/* Modal Header */}
      <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-gradient-to-r from-muted to-card shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-primary">
            <Building2 className="w-5 h-5 text-success" />
          </div>
          <div>
            <h2 id="facility-modal-title" className="text-base font-bold text-primary tracking-tight">
              Switch Operating Facility Unit
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {provider?.name || 'Partner Facility'} Multi-Branch Network
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-subdued hover:text-primary hover:bg-muted transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-6 py-3.5 border-b border-border bg-muted shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 text-subdued absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search facility name, branch, or city (e.g. Kigali, Nyarutarama)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-card border border-border text-primary placeholder:text-subdued focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {/* Facilities List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {/* Option: All Locations (Network Aggregation) */}
        <div
          onClick={() => handleSelectLocation('all')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
            selectedLocationId === 'all'
              ? 'bg-accent-subtle border-accent shadow-xs'
              : 'bg-card border-border hover:border-border/70 hover:bg-muted'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                selectedLocationId === 'all'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              ALL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary">
                  All Locations (Aggregated Network View)
                </span>
                <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  {locations.length} Units
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Consolidated multi-branch check-ins, total revenue, and overall corporate load.
              </p>
            </div>
          </div>

          {selectedLocationId === 'all' && (
            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-accent-foreground shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          )}
        </div>

        <div className="pt-2 pb-1 px-1 text-[11px] font-semibold text-subdued uppercase tracking-wider">
          Individual Facility Units
        </div>

        {filteredLocations.map((loc, idx) => {
          const isSelected = selectedLocationId === loc.id;
          const unitNumber = `#85193${idx + 1}`;

          return (
            <div
              key={loc.id}
              onClick={() => handleSelectLocation(loc.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                isSelected
                  ? 'bg-accent-subtle border-accent shadow-xs'
                  : 'bg-card border-border hover:border-border/70 hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    isSelected
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-muted text-muted-foreground group-hover:bg-border'
                  }`}
                >
                  U{idx + 1}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-primary truncate">
                      {loc.name}
                    </h4>
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
                      Unit {unitNumber}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-success font-semibold bg-accent-subtle px-1.5 py-0.5 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      Active
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-subdued" />
                      {loc.address || loc.city || 'Kigali, Rwanda'}
                    </span>
                    {loc.capacity && (
                      <span className="flex items-center gap-1 shrink-0">
                        <Users className="w-3 h-3 text-subdued" />
                        Cap: {loc.capacity}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="ml-2 shrink-0">
                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-accent-foreground">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <ChevronRight className="w-4 h-4 text-subdued group-hover:text-primary transition-colors" />
                )}
              </div>
            </div>
          );
        })}

        {filteredLocations.length === 0 && (
          <div className="text-center py-8">
            <Building2 className="w-8 h-8 text-subdued mx-auto opacity-50 mb-2" />
            <p className="text-xs font-semibold text-primary">No facility units found</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Try searching with a different branch name or city.</p>
          </div>
        )}
      </div>

      {/* Modal Footer */}
      <div className="px-6 py-3.5 border-t border-border bg-muted flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Radio className="w-3.5 h-3.5 text-accent animate-pulse" />
          <span>Turnstile &amp; GPS Geofence Synchronized</span>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          Done
        </button>
      </div>
    </dialog>
  );
}
