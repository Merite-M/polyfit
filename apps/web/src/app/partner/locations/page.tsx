'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, ArrowRight, ShieldCheck, DoorOpen, Radio, CheckCircle2 } from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';

export default function PartnerLocationsPage() {
  const { locations } = usePartner();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8491A3]">
            <span>PolyFit Partner Network</span>
            <span>/</span>
            <span className="text-[#0B1F33]">Facility & Hardware Terminals</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B1F33] tracking-tight mt-1">
            Registered Provider Branches
          </h1>
          <p className="text-xs sm:text-sm text-[#526173] mt-0.5">
            Turnstile IoT credentials, entrance hardware, and physical branch locations.
          </p>
        </div>

        <Link
          href="/partner/checkins"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0B1F33] hover:bg-[#F1F4F8] transition-colors"
        >
          <span>Live Check-in Operations</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#28D17C]" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((loc) => (
          <div key={loc.id} className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#E9FAF2] text-[#28D17C] flex items-center justify-center border border-[#28D17C]/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0B1F33] text-sm">{loc.name}</h3>
                  <p className="text-xs text-[#526173]">{loc.city} • {loc.address}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E9FAF2] text-[#0B1F33] border border-[#28D17C]/30">
                Active Gate
              </span>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-[#526173]">
                <span>Turnstile API Auth:</span>
                <span className="text-[#28D17C] font-semibold">Configured (X-PolyFit-Turnstile-Key)</span>
              </div>
              <div className="flex justify-between text-[#526173]">
                <span>Hardware Gate Relay:</span>
                <span className="text-[#0B1F33]">3,000ms NC/NO Pulse</span>
              </div>
              <div className="flex justify-between text-[#526173]">
                <span>Branch Identifier:</span>
                <span className="text-[#0B1F33]">{loc.id.slice(0, 13)}...</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
