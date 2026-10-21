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
  Users,
  Wifi,
  Battery
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
  const [currentTime, setCurrentTime] = useState<string>('09:41');

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

  // Keep phone clock in sync
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic TOTP countdown simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
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

  const displayShifts =
    todaySched?.shifts?.map((s) => `${s.open} - ${s.close}`).join(', ') || 'Closed';

  return (
    <div className="flex flex-col items-center sticky top-3 select-none z-20">
      {/* Top Floating View Mode Switcher */}
      <div className="w-[264px] flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-[#28D17C] animate-pulse" />
          <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] tracking-tight">
            Live iPhone 16 Pro View
          </span>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="inline-flex rounded-full bg-slate-900/90 dark:bg-card p-0.5 border border-slate-700/50 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('card')}
            className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold transition-all cursor-pointer ${
              activeTab === 'card'
                ? 'bg-[#28D17C] text-[#0B1F33] shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Feed
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('detail')}
            className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold transition-all cursor-pointer ${
              activeTab === 'detail'
                ? 'bg-[#28D17C] text-[#0B1F33] shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Detail
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pass')}
            className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold transition-all cursor-pointer ${
              activeTab === 'pass'
                ? 'bg-[#28D17C] text-[#0B1F33] shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pass
          </button>
        </div>
      </div>

      {/* Authentic Apple iPhone 16 Pro Chassis — Calibrated 395px height fits any viewport without scroll */}
      <div className="relative w-[264px] h-[395px] bg-gradient-to-b from-[#3d3e44] via-[#24252a] to-[#18191c] rounded-[42px] p-[4.5px] ring-1 ring-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.1)] flex flex-col">
        {/* Hardware Titanium Side Buttons (Outer Rim) */}
        {/* Action Button */}
        <div className="absolute -left-[3px] top-16 w-[3px] h-3.5 bg-gradient-to-r from-slate-400 to-slate-600 rounded-l-xs shadow-xs" />
        {/* Volume Up */}
        <div className="absolute -left-[3px] top-23 w-[3px] h-7 bg-gradient-to-r from-slate-400 to-slate-600 rounded-l-xs shadow-xs" />
        {/* Volume Down */}
        <div className="absolute -left-[3px] top-32 w-[3px] h-7 bg-gradient-to-r from-slate-400 to-slate-600 rounded-l-xs shadow-xs" />
        {/* Power / Siri Button */}
        <div className="absolute -right-[3px] top-23 w-[3px] h-9 bg-gradient-to-l from-slate-400 to-slate-600 rounded-r-xs shadow-xs" />
        {/* iPhone 16 Camera Control Capacitive Notch */}
        <div className="absolute -right-[2.5px] top-36 w-[2.5px] h-6 bg-slate-600/80 rounded-r-xs shadow-xs" />

        {/* OLED Screen Bezel & Container */}
        <div className="relative w-full h-full bg-black rounded-[38px] p-[2px] overflow-hidden flex flex-col">
          {/* Inner Display Surface */}
          <div className="relative w-full h-full bg-[#07131F] rounded-[36px] overflow-hidden flex flex-col border border-white/5">
            {/* Subtle Glass Surface Reflection Glare */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.05] z-30" />

            {/* Dynamic Island Pill */}
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-[70px] h-[14px] bg-black rounded-full z-40 flex items-center justify-between px-2 shadow-xs border border-white/10">
              {/* TrueDepth Camera */}
              <div className="w-2 h-2 rounded-full bg-[#0a101d] ring-1 ring-[#1e293b]/70 flex items-center justify-center">
                <div className="w-0.5 h-0.5 rounded-full bg-[#008A4B]/50" />
              </div>
              {/* Microphone / Sensor Dot */}
              <div className="w-1.5 h-1.5 rounded-full bg-[#28D17C]/70 animate-pulse" />
            </div>

            {/* iOS Status Bar */}
            <div className="h-5.5 px-3.5 flex items-center justify-between text-[8.5px] font-semibold text-slate-300 z-30 pt-0.5">
              <span className="tracking-tight">{currentTime}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-bold text-[#28D17C]">5G</span>
                <div className="w-3.5 h-2 border border-slate-300 rounded-[2px] p-[1px] flex items-center">
                  <div className="w-full h-full bg-[#28D17C] rounded-[1px]" />
                </div>
              </div>
            </div>

            {/* Phone Scrollable Screen Content */}
            <div className="flex-1 overflow-y-auto px-2 py-1.5 scrollbar-none text-left relative z-20">
            {/* TAB 1: FEED CARD VIEW */}
            {activeTab === 'card' && (
              <div className="space-y-2">
                {/* Search Bar Simulation */}
                <div className="bg-[#0D2235] border border-[#21405A] rounded-xl px-2 py-1 flex items-center gap-1.5 text-[9px] text-slate-400">
                  <Compass className="w-2.5 h-2.5 text-[#28D17C]" />
                  <span className="truncate">Search Kigali network facilities...</span>
                </div>

                {/* Discovery Card as seen by Corporate Employees */}
                <div className="bg-[#0D2235] rounded-2xl border border-[#21405A] overflow-hidden shadow-lg group">
                  {/* Hero Photo Header */}
                  <div className="h-24 bg-slate-800 relative">
                    <img
                      src={
                        state.cover_url ||
                        'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=80&w=600'
                      }
                      alt="Venue Cover"
                      className="w-full h-full object-cover transition-all duration-300"
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
                    <div className="absolute -bottom-2.5 left-3 w-9 h-9 rounded-xl bg-[#071521] border-2 border-[#28D17C] overflow-hidden shadow-md">
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
                  <div className="p-3 pt-3.5 space-y-1.5">
                    <div className="pl-0.5">
                      <h3 className="text-xs font-bold text-white leading-tight truncate">
                        {state.name || 'Your Facility Name'}
                      </h3>
                      <p className="text-[10px] text-[#8491A3] truncate mt-0.5">
                        {state.city || 'Kigali'} • {state.address || 'Kimihurura'}
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
                      <span className="text-[#8491A3] truncate text-[9px]">
                        • {displayShifts}
                      </span>
                    </div>

                    {/* Capacity Info */}
                    <div className="flex items-center gap-2 text-[9px] text-slate-400 pl-0.5">
                      <span className="flex items-center gap-1">
                        <Users className="w-2.5 h-2.5 text-[#28D17C]" />
                        <span>Cap: {state.capacity || 120}</span>
                      </span>
                    </div>

                    {/* Amenity Badges */}
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {(state.amenities || []).slice(0, 3).map((item, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-[#132D43] text-slate-200 border border-[#21405A] truncate max-w-[120px]"
                        >
                          {item}
                        </span>
                      ))}
                      {(state.amenities || []).length > 3 && (
                        <span className="px-1 py-0.5 rounded text-[8px] font-semibold bg-[#132D43] text-[#28D17C]">
                          +{(state.amenities || []).length - 3} more
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('detail')}
                      className="w-full mt-1.5 py-1.5 bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>View Venue & Access</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: VENUE DETAIL SHEET */}
            {activeTab === 'detail' && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('card')}
                  className="text-[10px] text-[#28D17C] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  ← Back to Feed
                </button>

                {/* Entrance Photo Banner */}
                <div className="h-28 rounded-xl bg-slate-800 overflow-hidden relative border border-[#21405A]">
                  <img
                    src={
                      state.entrance_url ||
                      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=600'
                    }
                    alt="Entrance"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1.5 left-2 bg-black/75 px-1.5 py-0.5 rounded text-[8px] font-bold text-white flex items-center gap-1">
                    <DoorOpen className="w-2.5 h-2.5 text-[#28D17C]" />
                    <span>Main Entrance</span>
                  </div>
                </div>

                {/* Facility Name & Location */}
                <div>
                  <h3 className="text-xs font-bold text-white leading-tight">
                    {state.name || 'Your Facility Name'}
                  </h3>
                  <p className="text-[10px] text-[#8491A3] mt-0.5">
                    {state.city || 'Kigali'}, {state.address || 'Kimihurura'}
                  </p>
                </div>

                {/* Quick Front Desk Contacts */}
                <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                  {state.whatsapp_number && (
                    <div className="bg-[#008A4B]/20 border border-[#28D17C]/30 text-white p-1.5 rounded-lg flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-[#28D17C] shrink-0" />
                      <span className="truncate">WhatsApp Chat</span>
                    </div>
                  )}
                  {state.phone_number && (
                    <div className="bg-[#132D43] border border-[#21405A] text-white p-1.5 rounded-lg flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#28D17C] shrink-0" />
                      <span className="truncate">{state.phone_number}</span>
                    </div>
                  )}
                </div>

                {/* Story / About Description */}
                <div className="bg-[#0D2235] p-2.5 rounded-xl border border-[#21405A] space-y-1">
                  <span className="text-[9px] font-bold text-[#28D17C] uppercase tracking-wider block">
                    About Facility
                  </span>
                  <p className="text-[9px] text-slate-300 line-clamp-3 leading-relaxed">
                    {state.description || 'Welcome to our verified partner facility...'}
                  </p>
                </div>

                {/* Included Amenities & Features */}
                {(state.amenities || []).length > 0 && (
                  <div className="bg-[#0D2235] p-2.5 rounded-xl border border-[#21405A] space-y-1.5 text-[9px]">
                    <span className="text-[9px] font-bold text-[#28D17C] uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-[#28D17C]" />
                      Included Amenities & Features ({(state.amenities || []).length})
                    </span>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {(state.amenities || []).map((item, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-[#132D43] text-slate-200 border border-[#21405A] flex items-center gap-1"
                        >
                          <span className="w-1 h-1 rounded-full bg-[#28D17C]" />
                          <span>{item}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Important Notice */}
                {state.important_notice && (
                  <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 p-2 rounded-xl text-[9px] text-[#F59E0B] space-y-0.5">
                    <span className="font-bold flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5" />
                      Front Desk Notice
                    </span>
                    <p className="leading-tight">{state.important_notice}</p>
                  </div>
                )}

                {/* First Visit Rules Summary */}
                <div className="bg-[#0D2235] p-2.5 rounded-xl border border-[#21405A] space-y-1.5 text-[9px]">
                  <span className="font-bold text-white flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#28D17C]" />
                    First Visit Rules
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-slate-300">
                    <div>
                      Booking Required:{' '}
                      <strong className="text-white">
                        {state.first_checkin_rules?.booking_required ? 'Yes' : 'No'}
                      </strong>
                    </div>
                    <div>
                      Registration Form:{' '}
                      <strong className="text-white">
                        {state.first_checkin_rules?.registration_form_required ? 'At Desk' : 'None'}
                      </strong>
                    </div>
                    <div>
                      Arrive Early:{' '}
                      <strong className="text-[#28D17C]">
                        {state.first_checkin_rules?.arrive_early_minutes || 10} mins
                      </strong>
                    </div>
                  </div>
                  {/* Gear chips */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(state.recommended_gear || []).map((gear, idx) => (
                      <span
                        key={idx}
                        className="text-[8px] bg-[#132D43] text-slate-200 px-1.5 py-0.5 rounded"
                      >
                        ✓ {gear}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Photo Gallery Thumbs */}
                {(state.gallery_urls || []).length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 block">
                      Facility Gallery ({(state.gallery_urls || []).length})
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      {(state.gallery_urls || []).slice(0, 3).map((img, idx) => (
                        <div
                          key={idx}
                          className="h-12 bg-slate-800 rounded-lg overflow-hidden border border-[#21405A]"
                        >
                          <img
                            src={img}
                            alt={`Gallery ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pass simulation CTA */}
                <button
                  type="button"
                  onClick={() => setActiveTab('pass')}
                  className="w-full py-1.5 bg-[#28D17C] text-[#0B1F33] rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <QrCode className="w-3 h-3" />
                  <span>Simulate Dynamic Pass</span>
                </button>
              </div>
            )}

            {/* TAB 3: DYNAMIC TOTP PASS */}
            {activeTab === 'pass' && (
              <div className="space-y-2.5 text-center pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('card')}
                  className="text-[10px] text-[#28D17C] font-semibold flex items-center gap-1 cursor-pointer text-left"
                >
                  ← Back to Card
                </button>

                {/* Access Pass Ticket Container */}
                <div className="bg-[#0D2235] rounded-2xl border-2 border-[#28D17C] p-3 shadow-xl space-y-2">
                  <div className="flex items-center justify-center gap-1 text-[9px] text-[#28D17C] font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3" />
                    <span>PolyFit Dynamic Entry Pass</span>
                  </div>

                  {/* QR Pass Code Card */}
                  <div className="bg-white p-2.5 rounded-xl text-black inline-block shadow-inner">
                    <QrCode className="w-24 h-24 mx-auto text-[#0B1F33]" />
                    <span className="text-[8px] font-mono font-bold tracking-widest block text-center text-slate-600 mt-0.5">
                      PASS #{passNumber}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white truncate">
                      {state.name || 'Your Facility Name'}
                    </h4>
                    <p className="text-[9px] text-[#8491A3]">Corporate Employee Access</p>
                  </div>

                  {/* Dynamic Refresh Timer Bar */}
                  <div className="bg-[#071521] p-1.5 rounded-lg border border-[#21405A] space-y-1">
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-[#28D17C]" />
                        Pass Refreshes In:
                      </span>
                      <span className="text-[#28D17C] font-mono font-bold">{countdown}s</span>
                    </div>
                    {/* Animated Progress Bar */}
                    <div className="w-full h-1 bg-[#132D43] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#28D17C] transition-all duration-1000 ease-linear rounded-full"
                        style={{ width: `${(countdown / 30) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[8.5px] text-[#8491A3] leading-tight">
                  Hold this pass against the front-desk scanner or present to the desk attendant.
                </p>
              </div>
            )}
          </div>

          {/* Apple Home Bar Indicator */}
          <div className="h-4 flex items-center justify-center pb-0.5">
            <div className="w-24 h-1 bg-white/40 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
