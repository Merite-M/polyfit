'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  ArrowRight,
  ShieldCheck,
  DoorOpen,
  Radio,
  CheckCircle2,
  Clock,
  Sparkles,
  Share2,
  MapPin,
  Sliders,
  Compass,
  Download,
  Phone,
  MessageSquare,
  QrCode
} from 'lucide-react';
import { usePartner, ProviderLocation } from '@/contexts/PartnerContext';
import { MarketingToolkitModal } from '@/components/partner/wizard/MarketingToolkitModal';

export default function PartnerLocationsPage() {
  const { provider, locations, updateLocation } = usePartner();
  const [selectedLocForToolkit, setSelectedLocForToolkit] = useState<ProviderLocation | null>(null);
  const [editingGeofenceLocId, setEditingGeofenceLocId] = useState<string | null>(null);
  const [geofenceRadius, setGeofenceRadius] = useState<number>(150);

  const handleOpenToolkit = (loc: ProviderLocation) => {
    setSelectedLocForToolkit(loc);
  };

  const handleSaveGeofence = async (locId: string) => {
    await updateLocation(locId, {
      metadata: {
        geofence_radius_meters: geofenceRadius,
      },
    });
    setEditingGeofenceLocId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8491A3]">
            <span>PolyFit Partner Network</span>
            <span>/</span>
            <span className="text-[#0B1F33]">Multi-Branch Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B1F33] tracking-tight mt-1">
            Registered Provider Branches & Facilities
          </h1>
          <p className="text-xs sm:text-sm text-[#526173] mt-0.5">
            Turnstile IoT credentials, geofence radius arrival verification, and co-branded marketing toolkits.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Marketing Toolkit Action */}
          <button
            type="button"
            onClick={() => handleOpenToolkit(locations[0] || ({} as ProviderLocation))}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0B1F33] hover:bg-[#F1F4F8] transition-colors shadow-2xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[#28D17C]" />
            <span>Marketing & PDF Signage</span>
          </button>

          {/* Add Location Button */}
          <Link
            href="/partner/setup"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Add Facility Branch</span>
          </Link>
        </div>
      </div>

      {/* Network Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-[#8491A3]">Active Branches</div>
          <div className="text-xl font-extrabold text-[#0B1F33] mt-0.5">{locations.length} Units</div>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-[#8491A3]">Arrival Verification</div>
          <div className="text-xl font-extrabold text-[#28D17C] mt-0.5">Smart Geofence</div>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-[#8491A3]">Turnstile Gate API</div>
          <div className="text-xl font-extrabold text-[#0B1F33] mt-0.5">Online (Relay)</div>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-[#8491A3]">Settlement Cycle</div>
          <div className="text-xl font-extrabold text-[#0B1F33] mt-0.5">Monthly (15th)</div>
        </div>
      </div>

      {/* Location Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {locations.map((loc) => {
          const radiusMeters = loc.metadata?.geofence_radius_meters || 150;
          const isEditingGeofence = editingGeofenceLocId === loc.id;

          return (
            <div
              key={loc.id}
              className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-4 hover:border-[#28D17C]/60 transition-colors"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#E9FAF2] text-[#28D17C] flex items-center justify-center border border-[#28D17C]/20 shadow-2xs shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#0B1F33] text-sm sm:text-base leading-tight truncate">
                      {loc.name}
                    </h3>
                    <p className="text-xs text-[#526173] mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#8491A3]" />
                      <span className="truncate">{loc.city} • {loc.address || 'Kigali'}</span>
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#E9FAF2] text-[#008A4B] border border-[#B7F1D2] shrink-0">
                  Active Gate
                </span>
              </div>

              {/* Badges strip (Amenities, Capacity, Geofence) */}
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[#526173]">
                  <Sparkles className="w-3.5 h-3.5 text-[#28D17C]" />
                  <span>{(loc.amenities || []).length} Amenities</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[#526173]">
                  <Compass className="w-3.5 h-3.5 text-[#28D17C]" />
                  <span>Geofence: {radiusMeters}m</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[#526173]">
                  <span>Capacity: {loc.capacity || 120} Max</span>
                </div>
              </div>

              {/* Turnstile IoT Credentials & Hardware Gate Relay */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 text-xs space-y-2 font-mono">
                <div className="flex justify-between items-center text-[#526173]">
                  <span>Turnstile API Auth:</span>
                  <span className="text-[#008A4B] font-semibold bg-[#E9FAF2] px-2 py-0.5 rounded text-[10px]">
                    X-PolyFit-Turnstile-Key Active
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#526173]">
                  <span>Gate Hardware Relay:</span>
                  <span className="text-[#0B1F33]">3,000ms NC/NO Pulse</span>
                </div>
                <div className="flex justify-between items-center text-[#526173]">
                  <span>Unit Identifier:</span>
                  <span className="text-[#0B1F33]">{loc.id.slice(0, 18)}...</span>
                </div>
              </div>

              {/* Geofence Configuration Inline Drawer */}
              {isEditingGeofence ? (
                <div className="bg-[#E9FAF2]/60 border border-[#B7F1D2] rounded-xl p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#065F46]">
                      Set Smart Arrival Radius: {geofenceRadius} meters
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingGeofenceLocId(null)}
                      className="text-[#526173] hover:text-[#0B1F33]"
                    >
                      Cancel
                    </button>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={500}
                    step={25}
                    value={geofenceRadius}
                    onChange={(e) => setGeofenceRadius(Number(e.target.value))}
                    className="w-full accent-[#28D17C]"
                  />
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] text-[#526173]">50m (Precise) to 500m (Broad)</span>
                    <button
                      type="button"
                      onClick={() => handleSaveGeofence(loc.id)}
                      className="px-3 py-1 bg-[#28D17C] text-[#0B1F33] font-bold rounded-lg text-xs"
                    >
                      Save Radius
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-[#F1F4F8] text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setEditingGeofenceLocId(loc.id);
                    setGeofenceRadius(loc.metadata?.geofence_radius_meters || 150);
                  }}
                  className="inline-flex items-center gap-1 text-[#526173] hover:text-[#0B1F33] font-semibold"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Configure Geofence</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenToolkit(loc)}
                    className="inline-flex items-center gap-1 text-[#008A4B] hover:text-[#0B1F33] font-bold"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Get PDF Sign</span>
                  </button>

                  <Link
                    href="/partner/setup"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0B1F33] text-white hover:bg-[#132D43] font-semibold transition-colors"
                  >
                    <span>Edit Schedule</span>
                    <ArrowRight className="w-3 h-3 text-[#28D17C]" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Marketing Toolkit Modal */}
      {selectedLocForToolkit && (
        <MarketingToolkitModal
          isOpen={Boolean(selectedLocForToolkit)}
          onClose={() => setSelectedLocForToolkit(null)}
          facilityName={selectedLocForToolkit.name || provider?.name || 'Facility'}
          facilityCity={selectedLocForToolkit.city || 'Kigali, Rwanda'}
          providerId={selectedLocForToolkit.provider_id || provider?.id}
        />
      )}
    </div>
  );
}
