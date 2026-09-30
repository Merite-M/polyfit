'use client';

import React from 'react';
import {
  Phone,
  MessageSquare,
  Globe,
  Mail,
  HelpCircle,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { WizardLocationState } from './types';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface Step2Props {
  state: WizardLocationState;
  onChange: (patch: Partial<WizardLocationState>) => void;
}

const COUNTRY_CODES = [
  { code: '+250', country: 'Rwanda 🇷🇼' },
  { code: '+254', country: 'Kenya 🇰🇪' },
  { code: '+256', country: 'Uganda 🇺🇬' },
  { code: '+255', country: 'Tanzania 🇹🇿' },
  { code: '+257', country: 'Burundi 🇧🇮' },
  { code: '+243', country: 'DR Congo 🇨🇩' },
];

export function Step2ContactSocial({ state, onChange }: Step2Props) {
  // Format WhatsApp preview link
  const cleanPhone = (state.whatsapp_number || state.phone_number).replace(/[^0-9]/g, '');
  const cleanCode = state.phone_country_code.replace(/[^0-9]/g, '');
  const whatsappUrl = cleanPhone ? `https://wa.me/${cleanCode}${cleanPhone}` : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E9FAF2] text-[#008A4B] text-xs font-bold uppercase tracking-wider mb-2">
          <Phone className="w-3.5 h-3.5" />
          <span>Step 2 of 11 • Contact & Direct Channels</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#0B1F33]">
          How Corporate Employees Reach Your Front Desk
        </h2>
        <p className="text-xs sm:text-sm text-[#526173] mt-1">
          Use the contact channels where your reception is most responsive. In East Africa, WhatsApp Business and Instagram ensure rapid visitor answers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Reception Phone Number */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E9FAF2] text-[#28D17C] flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#0B1F33]">Reception Counter Phone</h3>
              <p className="text-[11px] text-[#526173]">Direct phone for entry questions</p>
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={state.phone_country_code}
              onChange={(e) => onChange({ phone_country_code: e.target.value })}
              className="px-2.5 py-2 bg-[#F7F9FC] border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#0B1F33] focus:ring-1 focus:ring-[#28D17C]"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.country.split(' ')[0]})
                </option>
              ))}
            </select>

            <input
              type="tel"
              placeholder="788 000 000"
              value={state.phone_number}
              onChange={(e) => onChange({ phone_number: e.target.value })}
              className="flex-1 px-3 py-2 bg-[#F7F9FC] border border-[#CBD5E1] rounded-lg text-xs sm:text-sm text-[#0B1F33] font-mono focus:ring-1 focus:ring-[#28D17C]"
            />
          </div>
        </div>

        {/* WhatsApp Business Link */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E9FAF2] text-[#25D366] flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#0B1F33]">WhatsApp Business Desk</h3>
              <p className="text-[11px] text-[#526173]">Allows 1-tap chat from mobile app</p>
            </div>
          </div>

          <div className="flex gap-2">
            <span className="inline-flex items-center px-2.5 py-1.5 bg-[#F1F4F8] border border-[#CBD5E1] rounded-lg text-xs font-mono text-[#526173]">
              {state.phone_country_code}
            </span>
            <input
              type="tel"
              placeholder="WhatsApp number (e.g. 788 123 456)"
              value={state.whatsapp_number}
              onChange={(e) => onChange({ whatsapp_number: e.target.value })}
              className="flex-1 px-3 py-2 bg-[#F7F9FC] border border-[#CBD5E1] rounded-lg text-xs sm:text-sm text-[#0B1F33] font-mono focus:ring-1 focus:ring-[#28D17C]"
            />
          </div>

          {whatsappUrl && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#008A4B]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tap-to-chat active:</span>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="underline font-mono truncate max-w-[180px] hover:text-[#0B1F33]"
              >
                {whatsappUrl}
              </a>
            </div>
          )}
        </div>

        {/* Instagram Profile */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FDF2F8] text-[#DB2777] flex items-center justify-center">
              <InstagramIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#0B1F33]">Instagram Handle</h3>
              <p className="text-[11px] text-[#526173]">Most active visual showcase</p>
            </div>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">
              @
            </span>
            <input
              type="text"
              placeholder="fitlife_kigali"
              value={state.instagram_handle}
              onChange={(e) => onChange({ instagram_handle: e.target.value.replace('@', '') })}
              className="w-full pl-7 pr-3 py-2 bg-[#F7F9FC] border border-[#CBD5E1] rounded-lg text-xs sm:text-sm text-[#0B1F33] focus:ring-1 focus:ring-[#28D17C]"
            />
          </div>
          <p className="text-[10px] text-[#8491A3]">
            Displays the Instagram badge in the facility card discovery sheet.
          </p>
        </div>

        {/* Official Website / Social Link */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#0B1F33]">Website or Social Link</h3>
              <p className="text-[11px] text-[#526173]">Where your facility is most active</p>
            </div>
          </div>

          <input
            type="url"
            placeholder="https://fitlife.rw or https://linktr.ee/..."
            value={state.website_url}
            onChange={(e) => onChange({ website_url: e.target.value })}
            className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#CBD5E1] rounded-lg text-xs sm:text-sm text-[#0B1F33] focus:ring-1 focus:ring-[#28D17C]"
          />
          <p className="text-[10px] text-[#8491A3]">
            Tip: <i>&quot;Use the one where you&apos;re most active!&quot;</i> (Linktree, Facebook, or Portal).
          </p>
        </div>
      </div>
    </div>
  );
}
