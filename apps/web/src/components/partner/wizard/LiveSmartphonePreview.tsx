'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  MapPin,
  Clock,
  Star,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  QrCode,
  Info,
  DoorOpen,
  Phone,
  MessageSquare,
  ArrowRight,
  SlidersHorizontal,
  ChevronRight,
  Compass,
  AlertCircle,
  Image as ImageIcon,
  Users
} from 'lucide-react';
import { WizardLocationState } from './types';

interface LiveSmartphonePreviewProps {
  state: WizardLocationState;
  currentStep?: number;
}

export function LiveSmartphonePreview({ state, currentStep }: LiveSmartphonePreviewProps) {
  const [activeTab, setActiveTab] = useState<'card' | 'detail' | 'pass'>('card');
  const [countdown, setCountdown] = useState<number>(28);
  const [passNumber, setPassNumber] = useState<string>('8491');

  // Auto-switch smartphone tab based on wizard current step
  useEffect(() => {
    if (!currentStep) return;
    if ([1, 5, 6, 7].includes(currentStep)) {
      setActiveTab('card');
    } else if ([2, 3, 4, 8, 9].includes(currentStep)) {
      setActiveTab('detail');
    } else if ([10, 11].includes(currentStep)) {
      setActiveTab('pass');
    }
  }, [currentStep]);

  // Dynamic TOTP countdown simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Generate new simulated random code
          setPassNumber(String(Math.floor(1000 + Math.random() * 9000)));
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check if open now based on today's operating hours
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayKey = dayNames[now.getDay()];
  const todaySched = state.operating_hours?.[todayKey];
  const isOpenToday = todaySched && !todaySched.is_closed;

  const displayShifts = todaySched?.shifts
    ?.map((s) => `${s.open} - ${s.close}`)
    .join(', ') || 'Closed';

  return (
    <div className="bg-[#0B1F33] text-white rounded-2xl border border-[#21405A] p-4 sm:p-5 shadow-2xl flex flex-col items-center select-none sticky top-20">
      {/* Top Preview Controls */}
      <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-[#21405A] text-xs">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[#28D17C]" />
          <span className="font-bold tracking-tight text-slate-200">
            Employee App Preview
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="inline-flex rounded-lg bg-[#071521] p-0.5 border border-[#21405A]">
          <button
            type="button"
            onClick={() => setActiveTab('card')}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
              activeTab === 'card'
                ? 'bg-[#28D17C] text-[#0B1F33]'
                : 'text-[#8491A3] hover:text-white'
            }`}
          >
            Feed Card
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('detail')}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
              activeTab === 'detail'
                ? 'bg-[#28D17C] text-[#0B1F33]'
                : 'text-[#8491A3] hover:text-white'
            }`}
          >
            Venue Detail
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pass')}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
              activeTab === 'pass'
                ? 'bg-[#28D17C] text-[#0B1F33]'
                : 'text-[#8491A3] hover:text-white'
            }`}
          >
            TOTP Pass
          </button>
        </div>
      </div>

      {/* iPhone 16 Frame Chassis */}
      <div className="w-[280px] sm:w-[300px] h-[580px] bg-[#071521] rounded-[44px] border-[6px] border-[#132D43] shadow-2xl overflow-hidden relative flex flex-col ring-1 ring-white/10">
        {/* Dynamic Island / Speaker Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-40 flex items-center justify-between px-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
          <div className="w-2 h-2 rounded-full bg-[#28D17C]/40 animate-pulse" />
        </div>

        {/* Phone Status Bar */}
        <div className="h-8 px-6 flex items-center justify-between text-[10px] font-semibold text-slate-400 z-30 pt-1">
          <span>09:41</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-[#28D17C]">5G</span>
            <div className="w-4 h-2 border border-slate-400 rounded-xs p-0.5 flex items-center">
              <div className="w-full h-full bg-[#28D17C] rounded-xs" />
            </div>
          </div>
        </div>

        {/* Phone Content Screen */}
        <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-none text-left">
          {/* TAB 1: FEED CARD VIEW */}
          {activeTab === 'card' && (
            <div className="space-y-3">
              {/* App Search Bar Simulation */}
              <div className="bg-[#0D2235] border border-[#21405A] rounded-xl px-2.5 py-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                <Compass className="w-3 h-3 text-[#28D17C]" />
                <span className="truncate">Search Kigali network facilities...</span>
              </div>

              {/* Discovery Card as seen by Corporate Employees */}
              <div className="bg-[#0D2235] rounded-2xl border border-[#21405A] overflow-hidden shadow-lg group">
                {/* Hero Photo Header */}
                <div className="h-32 bg-slate-800 relative">
                  <img
                    src={
                      state.cover_url ||
                      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=80&w=600'
                    }
                    alt="Venue Cover"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D2235] via-transparent to-black/40" />

                  {/* Geofence & Proximity Badge */}
                  <div className="absolute top-2 left-2 bg-[#071521]/80 backdrop-blur-xs px-2 py-0.5 rounded-full text-[9px] font-bold text-white border border-white/10 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-[#28D17C]" />
                    <span>{state.geofence_radius_meters || 100}m geofence</span>
                  </div>

                  {/* Rating Chip */}
                  <div className="absolute top-2 right-2 bg-[#071521]/80 backdrop-blur-xs px-2 py-0.5 rounded-full text-[9px] font-bold text-white border border-white/10 flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-[#F59E0B] text-[#F59E0B]" />
                    <span>4.9</span>
                  </div>

                  {/* Logo Avatar Overlay */}
                  <div className="absolute -bottom-3 left-3 w-10 h-10 rounded-xl bg-[#071521] border-2 border-[#28D17C] overflow-hidden shadow-md">
                    <img
                      src={
                        state.logo_url ||
                        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200'
                      }
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-3 pt-4 space-y-2">
                  <div className="pl-1">
                    <h3 className="text-xs font-bold text-white leading-tight truncate">
                      {state.name || 'Your Facility Name'}
                    </h3>
                    <p className="text-[10px] text-[#8491A3] truncate mt-0.5">
                      {state.city || 'Kigali'} • {state.address || 'KN 3 Ave'}
                    </p>
                  </div>

                  {/* Open Status & Today's Hours */}
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isOpenToday ? 'bg-[#28D17C]' : 'bg-[#EF4444]'
                      }`}
                    />
                    <span
                      className={`font-bold ${
                        isOpenToday ? 'text-[#28D17C]' : 'text-[#EF4444]'
                      }`}
                    >
                      {isOpenToday ? 'Open Now' : 'Closed Today'}
                    </span>
                    <span className="text-[#8491A3] truncate">
                      • {displayShifts}
                    </span>
                  </div>

                  {/* Capacity & Geofence info */}
                  <div className="flex items-center gap-2 text-[9px] text-slate-400 pl-0.5">
                    <span className="flex items-center gap-1">
                      <Users className="w-2.5 h-2.5 text-[#28D17C]" />
                      <span>Cap: {state.capacity || 120}</span>
                    </span>
                  </div>

                  {/* Amenity Badges */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(state.amenities || []).slice(0, 3).map((item, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-[#132D43] text-slate-200 border border-[#21405A]"
                      >
                        {item}
                      </span>
                    ))}
                    {(state.amenities || []).length > 3 && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-[#132D43] text-[#28D17C]">
                        +{state.amenities.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* View Details Action Button */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('detail')}
                    className="w-full py-1.5 bg-[#28D17C] text-[#0B1F33] rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 mt-2 cursor-pointer hover:bg-[#20ba6c] transition-colors"
                  >
                    <span>View Venue & Access</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DETAILED FACILITY MODAL */}
          {activeTab === 'detail' && (
            <div className="space-y-3 text-[10px]">
              {/* Back to card button */}
              <button
                type="button"
                onClick={() => setActiveTab('card')}
                className="text-[9px] text-[#28D17C] hover:underline flex items-center gap-1 cursor-pointer"
              >
                ← Back to Feed
              </button>

              {/* Cover Hero with Entrance overlay */}
              <div className="h-28 rounded-xl overflow-hidden relative">
                <img
                  src={
                    state.entrance_url ||
                    state.cover_url ||
                    'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=600'
                  }
                  alt="Entrance"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded-full text-[8px] font-bold text-white flex items-center gap-1">
                  <DoorOpen className="w-2.5 h-2.5 text-[#28D17C]" />
                  <span>Main Entrance</span>
                </div>
              </div>

              {/* Title & Address */}
              <div>
                <h3 className="text-xs font-bold text-white">
                  {state.name || 'Your Facility Name'}
                </h3>
                <p className="text-[#8491A3] mt-0.5">
                  {state.address || 'Street address'}, {state.city || 'Kigali'}
                </p>
              </div>

              {/* Direct Quick Channels (WhatsApp & Call) */}
              <div className="grid grid-cols-2 gap-1.5">
                {state.whatsapp_number && (
                  <div className="bg-[#132D43] p-1.5 rounded-lg flex items-center gap-1.5 border border-[#21405A]">
                    <MessageSquare className="w-3 h-3 text-[#25D366] shrink-0" />
                    <span className="text-[9px] font-bold text-white truncate">
                      WhatsApp Chat
                    </span>
                  </div>
                )}
                {state.phone_number && (
                  <div className="bg-[#132D43] p-1.5 rounded-lg flex items-center gap-1.5 border border-[#21405A]">
                    <Phone className="w-3 h-3 text-[#28D17C] shrink-0" />
                    <span className="text-[9px] font-bold text-white truncate">
                      {state.phone_number}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="bg-[#0D2235] p-2.5 rounded-xl border border-[#21405A] space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  About Facility
                </span>
                <p className="text-slate-300 line-clamp-3 leading-relaxed">
                  {state.description || 'Welcome to our verified partner facility...'}
                </p>
              </div>

              {/* Important Notice if typed */}
              {state.important_notice && (
                <div className="bg-amber-950/40 border border-amber-800/60 p-2 rounded-xl text-amber-200 space-y-0.5">
                  <span className="text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 text-amber-300">
                    <AlertCircle className="w-2.5 h-2.5" />
                    Front Desk Notice
                  </span>
                  <p className="text-[8.5px] line-clamp-2 leading-tight">
                    {state.important_notice}
                  </p>
                </div>
              )}

              {/* First Check-in Requirements */}
              <div className="bg-[#0D2235] p-2.5 rounded-xl border border-[#21405A] space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#28D17C]" />
                  First Visit Rules
                </span>
                <div className="space-y-1 text-[9px] text-slate-300">
                  <div className="flex justify-between">
                    <span>Booking Required:</span>
                    <span className="font-bold text-white">
                      {state.first_checkin_rules.booking_required ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Registration Form:</span>
                    <span className="font-bold text-white">
                      {state.first_checkin_rules.registration_form_required ? 'At Desk' : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Arrive Early:</span>
                    <span className="font-bold text-[#28D17C]">
                      {state.first_checkin_rules.arrive_early_minutes} mins
                    </span>
                  </div>
                </div>

                {state.recommended_gear && state.recommended_gear.length > 0 && (
                  <div className="pt-1.5 border-t border-[#21405A]/60 flex flex-wrap gap-1">
                    {state.recommended_gear.map((gear, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded text-[8px] bg-[#132D43] text-slate-300 border border-[#21405A]">
                        ✓ {gear}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Photo Gallery Strip */}
              {state.gallery_urls && state.gallery_urls.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                    <ImageIcon className="w-2.5 h-2.5 text-[#28D17C]" />
                    Facility Gallery ({state.gallery_urls.length})
                  </span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {state.gallery_urls.map((url, idx) => (
                      <div key={idx} className="w-14 h-12 rounded-lg overflow-hidden shrink-0 border border-[#21405A]">
                        <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Test Access Pass CTA */}
              <button
                type="button"
                onClick={() => setActiveTab('pass')}
                className="w-full py-2 bg-[#28D17C] text-[#0B1F33] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer hover:bg-[#20ba6c] transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Simulate Dynamic Pass</span>
              </button>
            </div>
          )}

          {/* TAB 3: DYNAMIC TOTP PASS */}
          {activeTab === 'pass' && (
            <div className="space-y-3 text-center pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('card')}
                className="text-[9px] text-[#28D17C] hover:underline flex items-center gap-1 mb-1 cursor-pointer"
              >
                ← Back to Card
              </button>

              <div className="bg-[#0D2235] rounded-2xl border border-[#21405A] p-4 space-y-3">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E9FAF2]/10 text-[#28D17C] text-[9px] font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>PolyFit Dynamic Entry Pass</span>
                </div>

                {/* QR Display Frame */}
                <div className="w-32 h-32 mx-auto bg-white rounded-xl p-2 flex items-center justify-center shadow-lg border-2 border-[#28D17C]">
                  {/* Hexagon & QR Icon Simulation */}
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#0B1F33]">
                    <QrCode className="w-20 h-20 text-[#0B1F33]" />
                    <span className="text-[8px] font-mono font-bold text-[#28D17C]">
                      PASS #{passNumber}
                    </span>
                  </div>
                </div>

                <div className="text-[10px]">
                  <p className="font-bold text-white">{state.name || 'Partner Facility'}</p>
                  <p className="text-[#8491A3] mt-0.5">Corporate Employee Access</p>
                </div>

                {/* Dynamic TOTP 30-sec Timer */}
                <div className="bg-[#071521] rounded-lg p-2 border border-[#21405A] text-[9px] space-y-1.5">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-[#28D17C]" />
                      Pass Refreshes In:
                    </span>
                    <span className="text-[#28D17C] font-mono font-bold">{countdown}s</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1 bg-[#132D43] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#28D17C] transition-all duration-1000 ease-linear rounded-full"
                      style={{ width: `${(countdown / 30) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <p className="text-[9px] text-[#8491A3]">
                Hold this pass against the front-desk scanner or present to the front desk.
              </p>
            </div>
          )}
        </div>

        {/* Phone Bottom Home Indicator */}
        <div className="h-5 flex items-center justify-center pb-1">
          <div className="w-24 h-1 bg-slate-600 rounded-full" />
        </div>
      </div>

      <div className="mt-3 text-[11px] text-[#8491A3] text-center">
        <span>Updates live in real-time as you complete steps 1 through 10.</span>
      </div>
    </div>
  );
}
