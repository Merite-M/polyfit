'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Zap,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  RefreshCw,
  QrCode,
  KeyRound,
  RotateCcw,
  Building,
  UserCheck
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';
import { apiFetch, APIError } from '@/lib/api-client';

interface VerificationResult {
  status: 'success' | 'rejected' | 'anti_passback' | 'tier_ineligible';
  message: string;
  latencyMs: number;
  timestamp: string;
  employee?: {
    id: string;
    full_name: string;
    email: string;
  };
  organization?: {
    id: string;
    name: string;
  };
  visit?: {
    id: string;
    check_in_at: string;
    verification_method: string;
  };
  details?: {
    minutes_remaining?: number;
    cooldown_window_minutes?: number;
    last_visit_at?: string;
    tier_name?: string;
  };
}

interface FrontDeskAccessTerminalProps {
  onVerificationSuccess: (visitId: string) => void;
  onOpenDispute: (fakeVisit: any) => void;
  onOpenManualBackup: () => void;
}

export function FrontDeskAccessTerminal({
  onVerificationSuccess,
  onOpenDispute,
  onOpenManualBackup
}: FrontDeskAccessTerminalProps) {
  const { selectedLocation, selectedLocationId, locations } = usePartner();
  
  // Verification modalities
  const [activeMode, setActiveMode] = useState<'totp' | 'turnstile'>('totp');
  const [totpDigits, setTotpDigits] = useState(['', '', '', '', '', '']);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [employeeIdentifier, setEmployeeIdentifier] = useState('');
  const [audioFeedback, setAudioFeedback] = useState(true);
  
  // State
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [lastLatency, setLastLatency] = useState<number | null>(null);

  // Input refs for automatic focus progression
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Subtle web audio feedback synthesizer (zero external mp3 assets)
  const playSound = useCallback((type: 'success' | 'error') => {
    if (!audioFeedback || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'success') {
        // High, bright double chime (C6 -> G6)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, now);
        osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else {
        // Low cautionary double buzz (220Hz -> 140Hz)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.25);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch {
      // AudioContext unavailable or autoplay blocked
    }
  }, [audioFeedback]);

  // Handle individual digit input
  const handleDigitChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned) {
      const newDigits = [...totpDigits];
      newDigits[index] = '';
      setTotpDigits(newDigits);
      return;
    }

    // If pasted full 6-digit code
    if (cleaned.length >= 6) {
      const pasteDigits = cleaned.slice(0, 6).split('');
      setTotpDigits(pasteDigits);
      inputRefs.current[5]?.focus();
      triggerTotpVerification(pasteDigits.join(''));
      return;
    }

    const singleDigit = cleaned.slice(-1);
    const newDigits = [...totpDigits];
    newDigits[index] = singleDigit;
    setTotpDigits(newDigits);

    // Auto-advance cursor to next input
    if (singleDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are populated
    if (index === 5 && singleDigit) {
      const fullCode = newDigits.join('');
      if (fullCode.length === 6) {
        triggerTotpVerification(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !totpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      const fullCode = totpDigits.join('');
      if (fullCode.length === 6) {
        triggerTotpVerification(fullCode);
      }
    } else if (e.key === 'Escape') {
      resetForm();
    }
  };

  const resetForm = () => {
    setTotpDigits(['', '', '', '', '', '']);
    setTurnstileToken('');
    setEmployeeIdentifier('');
    setResult(null);
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 50);
  };

  // Perform TOTP pass verification
  const triggerTotpVerification = async (passCode: string) => {
    if (isVerifying) return;
    const targetLocationId = selectedLocationId !== 'all' ? selectedLocationId : locations[0]?.id;
    if (!targetLocationId) {
      setResult({
        status: 'rejected',
        message: 'Please select a facility location first before verifying visits',
        latencyMs: 0,
        timestamp: new Date().toLocaleTimeString()
      });
      return;
    }

    const startTime = performance.now();
    setIsVerifying(true);
    setResult(null);

    try {
      const payload: Record<string, any> = {
        token: passCode,
        provider_location_id: targetLocationId
      };

      if (employeeIdentifier.trim()) {
        payload.employee_identifier = employeeIdentifier.trim();
      }

      const res = await apiFetch<any>('/api/visits/verify-totp', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const elapsed = Math.round(performance.now() - startTime);
      setLastLatency(elapsed);
      playSound('success');

      setResult({
        status: 'success',
        message: res?.message || 'Access Authorized • Gate Unlocked',
        latencyMs: elapsed,
        timestamp: new Date().toLocaleTimeString(),
        employee: res?.employee,
        organization: res?.organization,
        visit: res?.visit
      });

      if (res?.visit?.id) {
        onVerificationSuccess(res.visit.id);
      }
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - startTime);
      setLastLatency(elapsed);
      playSound('error');

      const isAntiPassback =
        err?.code === 'ANTI_PASSBACK_COOLDOWN' ||
        err?.message?.toLowerCase().includes('anti-passback') ||
        err?.status === 409;

      const isTierIneligible =
        err?.code === 'INELIGIBLE_FOR_VISIT' ||
        err?.message?.toLowerCase().includes('tier') ||
        err?.status === 403;

      let statusType: VerificationResult['status'] = 'rejected';
      if (isAntiPassback) statusType = 'anti_passback';
      else if (isTierIneligible) statusType = 'tier_ineligible';

      setResult({
        status: statusType,
        message: err?.message || 'Invalid or expired pass code. Request employee to refresh pass.',
        latencyMs: elapsed,
        timestamp: new Date().toLocaleTimeString(),
        details: err?.details || {
          minutes_remaining: err?.minutes_remaining,
          cooldown_window_minutes: err?.cooldown_window_minutes
        }
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Perform turnstile hardware bypass verification
  const triggerTurnstileVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken.trim() && !employeeIdentifier.trim()) return;

    const targetLocationId = selectedLocationId !== 'all' ? selectedLocationId : locations[0]?.id;
    const startTime = performance.now();
    setIsVerifying(true);
    setResult(null);

    try {
      const res = await apiFetch<any>('/api/visits/verify-turnstile', {
        method: 'POST',
        body: JSON.stringify({
          turnstile_id: 'TURNSTILE_01',
          qr_token: turnstileToken.trim() || undefined,
          employee_identifier: employeeIdentifier.trim() || undefined,
          provider_location_id: targetLocationId
        })
      });

      const elapsed = Math.round(performance.now() - startTime);
      setLastLatency(elapsed);
      playSound('success');

      setResult({
        status: 'success',
        message: res?.message || 'Turnstile Plaque Validated • Entry Logged',
        latencyMs: elapsed,
        timestamp: new Date().toLocaleTimeString(),
        employee: res?.employee,
        organization: res?.organization,
        visit: res?.visit
      });

      if (res?.visit?.id) {
        onVerificationSuccess(res.visit.id);
      }
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - startTime);
      setLastLatency(elapsed);
      playSound('error');

      setResult({
        status: err?.status === 409 ? 'anti_passback' : 'rejected',
        message: err?.message || 'Turnstile bypass verification failed.',
        latencyMs: elapsed,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#0B1F33] to-[#132E4A] rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-[#28D17C]/30 relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#28D17C]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00D2B4]/5 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />

      {/* Terminal Header */}
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#28D17C]/20 text-[#28D17C] flex items-center justify-center border border-[#28D17C]/30 shadow-xs">
            <ScanLine className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Front-Desk Rapid Access Terminal
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#28D17C]/20 text-[#28D17C] border border-[#28D17C]/40 font-mono">
                <Zap className="w-2.5 h-2.5" />
                Sub-200ms Engine
              </span>
            </div>
            <p className="text-xs text-[#8491A3]">
              Active Gate: <span className="text-[#28D17C] font-semibold">{selectedLocation?.name || 'All Locations'}</span> • Peak Rush Verification Mode
            </p>
          </div>
        </div>

        {/* Audio Toggle & Modality Switcher */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setAudioFeedback(!audioFeedback)}
            title={audioFeedback ? 'Disable sound chime' : 'Enable sound chime'}
            className={`p-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              audioFeedback
                ? 'bg-[#28D17C]/15 border-[#28D17C]/40 text-[#28D17C]'
                : 'bg-white/5 border-white/10 text-[#8491A3] hover:text-white'
            }`}
          >
            {audioFeedback ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="text-[11px] hidden sm:inline">Chime</span>
          </button>

          <button
            type="button"
            onClick={onOpenManualBackup}
            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 transition-colors flex items-center gap-1.5"
            title="Open comprehensive manual checkin modal"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#00D2B4]" />
            <span className="hidden sm:inline">Manual Override</span>
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="relative mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Verification Controls */}
        <div className="lg:col-span-7 space-y-4">
          {/* Modality Tabs */}
          <div className="flex items-center gap-2 bg-black/30 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => {
                setActiveMode('totp');
                resetForm();
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeMode === 'totp'
                  ? 'bg-[#28D17C] text-[#0B1F33] font-bold shadow-xs'
                  : 'text-[#8491A3] hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Dynamic 6-Digit Code</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('turnstile');
                resetForm();
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeMode === 'turnstile'
                  ? 'bg-[#28D17C] text-[#0B1F33] font-bold shadow-xs'
                  : 'text-[#8491A3] hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Turnstile / Counter Plaque</span>
            </button>
          </div>

          {/* Mode 1: TOTP Fast Digits */}
          {activeMode === 'totp' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#8491A3] mb-2">
                  Enter 6-digit rotating pass from employee's mobile app:
                </label>
                <div className="flex items-center justify-between gap-2 max-w-sm">
                  {totpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={idx === 0 ? 6 : 1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      autoFocus={idx === 0}
                      disabled={isVerifying}
                      className="w-12 h-14 sm:w-13 sm:h-16 text-center text-2xl sm:text-3xl font-black font-mono bg-black/40 border-2 border-white/20 focus:border-[#28D17C] focus:bg-black/60 rounded-xl text-white outline-none transition-all shadow-inner focus:ring-2 focus:ring-[#28D17C]/40"
                    />
                  ))}
                </div>
              </div>

              {/* Optional Identifier Assist for Fast Filtering */}
              <div className="pt-1">
                <input
                  type="text"
                  placeholder="Optional: Beneficiary email or ID (if multiple candidates)"
                  value={employeeIdentifier}
                  onChange={(e) => setEmployeeIdentifier(e.target.value)}
                  className="w-full max-w-sm px-3 py-2 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[#526173] focus:border-[#28D17C] outline-none"
                />
              </div>

              <div className="flex items-center gap-3 text-[11px] text-[#8491A3] pt-1">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#28D17C]" />
                  Auto-submits on 6th digit
                </span>
                <span>•</span>
                <span>Press Esc to reset</span>
                <span>•</span>
                {lastLatency !== null && (
                  <span className="font-mono text-[#28D17C]">
                    Last RTT: {lastLatency}ms
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Mode 2: Turnstile Plaque Scanner */}
          {activeMode === 'turnstile' && (
            <form onSubmit={triggerTurnstileVerification} className="space-y-3 max-w-md">
              <div>
                <label className="block text-xs font-medium text-[#8491A3] mb-1">
                  Scan QR code token from employee's badge / counter plaque:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. PF-VISIT-TURNSTILE-90D0..."
                    value={turnstileToken}
                    onChange={(e) => setTurnstileToken(e.target.value)}
                    autoFocus
                    disabled={isVerifying}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono bg-black/40 border border-white/20 focus:border-[#28D17C] rounded-xl text-white placeholder:text-[#526173] outline-none transition-all"
                  />
                  <QrCode className="w-4 h-4 text-[#8491A3] absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8491A3] mb-1">
                  Employee identifier (Email or UUID):
                </label>
                <input
                  type="text"
                  placeholder="e.g. aime.mugisha@bk.rw"
                  value={employeeIdentifier}
                  onChange={(e) => setEmployeeIdentifier(e.target.value)}
                  disabled={isVerifying}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-black/40 border border-white/20 focus:border-[#28D17C] rounded-xl text-white placeholder:text-[#526173] outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isVerifying || (!turnstileToken.trim() && !employeeIdentifier.trim())}
                  className="px-4 py-2 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] disabled:opacity-40 text-[#0B1F33] font-bold text-xs sm:text-sm transition-all flex items-center gap-2"
                >
                  {isVerifying ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  <span>Validate Turnstile Entry</span>
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#8491A3] hover:text-white transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: Live Result Telemetry & Pass Status */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          {/* Waiting Idle State */}
          {!result && !isVerifying && (
            <div className="bg-black/20 rounded-xl p-5 border border-dashed border-white/10 text-center flex flex-col items-center justify-center min-h-[160px]">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#8491A3] mb-2">
                <ScanLine className="w-5 h-5 animate-pulse" />
              </div>
              <p className="text-xs font-semibold text-white">
                Terminal Ready for Member Entry
              </p>
              <p className="text-[11px] text-[#8491A3] mt-1 max-w-xs">
                Ask beneficiary to open PolyFit Mobile App and read the 6-digit dynamic pass code.
              </p>
            </div>
          )}

          {/* Verifying Spinner State */}
          {isVerifying && (
            <div className="bg-black/30 rounded-xl p-5 border border-[#28D17C]/40 text-center flex flex-col items-center justify-center min-h-[160px] animate-pulse">
              <RefreshCw className="w-8 h-8 text-[#28D17C] animate-spin mb-2" />
              <p className="text-sm font-bold text-white">
                Verifying Against Supabase PostgreSQL...
              </p>
              <p className="text-[11px] text-[#28D17C] font-mono mt-0.5">
                Evaluating Anti-Passback &amp; Benefit Tier
              </p>
            </div>
          )}

          {/* Success Result Card */}
          {result && result.status === 'success' && (
            <div className="bg-[#28D17C]/15 border-2 border-[#28D17C] rounded-xl p-4.5 text-white shadow-lg space-y-3 animate-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#28D17C] text-[#0B1F33] flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#28D17C]">
                      ACCESS GRANTED
                    </h3>
                    <p className="text-[11px] text-white/80 font-mono">
                      {result.message}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#28D17C]/30 text-[#28D17C] font-mono">
                    ⚡ {result.latencyMs}ms SLA
                  </span>
                  <div className="text-[10px] text-[#8491A3] mt-0.5">
                    {result.timestamp}
                  </div>
                </div>
              </div>

              {/* Beneficiary Details Pill */}
              <div className="bg-black/40 rounded-lg p-2.5 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#8491A3]">Beneficiary:</span>
                  <strong className="text-white font-bold">
                    {result.employee?.full_name || 'Corporate Beneficiary'}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8491A3]">Employer:</span>
                  <span className="text-[#28D17C] font-semibold">
                    {result.organization?.name || 'Bank of Kigali'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8491A3]">Turnstile Relay:</span>
                  <span className="text-white font-mono text-[11px]">
                    Relay Open Pulsed (3000ms)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="w-full py-1.5 rounded-lg bg-[#28D17C] text-[#0B1F33] font-bold text-xs hover:bg-[#22BC6E] transition-colors"
              >
                Verify Next Member
              </button>
            </div>
          )}

          {/* Anti-Passback Rejection Card */}
          {result && result.status === 'anti_passback' && (
            <div className="bg-[#EF4444]/15 border-2 border-[#EF4444] rounded-xl p-4.5 text-white shadow-lg space-y-3 animate-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#EF4444] text-white flex items-center justify-center font-bold">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#EF4444]">
                      ANTI-PASSBACK ACTIVE
                    </h3>
                    <p className="text-[11px] text-white/90">
                      Double check-in prohibited within cooldown window.
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EF4444]/30 text-[#EF4444] font-mono">
                  {result.latencyMs}ms
                </span>
              </div>

              <div className="bg-black/40 rounded-lg p-2.5 text-xs text-white/90 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#8491A3]">Rule:</span>
                  <span className="font-semibold text-[#EF4444]">
                    180-min Anti-Passback Policy
                  </span>
                </div>
                <div className="text-[11px] text-white/80 pt-0.5">
                  {result.message}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onOpenDispute({
                      id: result.visit?.id || 'anti-passback-flag',
                      employees: result.employee,
                      check_in_at: new Date().toISOString()
                    });
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] border border-[#EF4444]/40 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Flag Dispute</span>
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Tier Ineligible Rejection Card */}
          {result && result.status === 'tier_ineligible' && (
            <div className="bg-[#F59E0B]/15 border-2 border-[#F59E0B] rounded-xl p-4.5 text-white shadow-lg space-y-3 animate-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#F59E0B] text-[#0B1F33] flex items-center justify-center font-bold">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#F59E0B]">
                      TIER INELIGIBLE
                    </h3>
                    <p className="text-[11px] text-white/90">
                      Corporate tier excludes this facility category.
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F59E0B]/30 text-[#F59E0B] font-mono">
                  {result.latencyMs}ms
                </span>
              </div>

              <div className="bg-black/40 rounded-lg p-2.5 text-xs text-white/90">
                <p>{result.message}</p>
                <p className="text-[10px] text-[#8491A3] mt-1">
                  Advise employee to request a tier upgrade via their employer's PolyFit Corporate portal.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="w-full py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {/* Generic Rejected Card */}
          {result && result.status === 'rejected' && (
            <div className="bg-white/5 border border-white/15 rounded-xl p-4.5 text-white space-y-3">
              <div className="flex items-center gap-2 text-[#EF4444]">
                <AlertTriangle className="w-4 h-4" />
                <h4 className="text-xs font-bold">Verification Failed</h4>
              </div>
              <p className="text-xs text-white/80">{result.message}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-1.5 rounded-lg bg-[#28D17C] text-[#0B1F33] font-bold text-xs"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={onOpenManualBackup}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
                >
                  Manual Backup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
