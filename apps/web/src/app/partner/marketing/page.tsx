'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Download,
  Printer,
  Sparkles,
  QrCode,
  ShieldCheck,
  Building2,
  Copy,
  Check,
  FileText,
  ExternalLink,
  ArrowRight,
  Layers,
  Share2
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';
import { apiFetch } from '@/lib/api-client';
import { jsPDF } from 'jspdf';

interface MarketingAssetsResponse {
  success: boolean;
  partner_id?: string;
  provider_name?: string;
  partnerBadgeSvg?: string;
  frontDeskSignageSvg?: string;
  windowDecalSvg?: string;
  socialMediaCopy?: {
    instagram?: string;
    linkedin?: string;
    whatsapp_broadcast?: string;
  };
  brandGuidelines?: {
    primary_color?: string;
    secondary_color?: string;
    partner_accent?: string;
    typography?: string;
  };
}

export default function PartnerMarketingPage() {
  const { provider } = usePartner();
  const [assets, setAssets] = useState<MarketingAssetsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    async function loadAssets() {
      if (!provider?.id) return;
      try {
        setIsLoading(true);
        const data = await apiFetch<MarketingAssetsResponse>(
          `/api/providers/${provider.id}/marketing-assets`
        );
        setAssets(data);
      } catch (err) {
        console.warn('[PartnerMarketing] Marketing assets fetch note:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAssets();
  }, [provider?.id]);

  const handleCopyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownloadSvg = (svgContent: string, filename: string) => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGeneratePlaquePdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const facilityName = provider?.name || 'FitLife Gym Kigali';

    // Top Dark Blue Brand Strip
    doc.setFillColor(11, 31, 51);
    doc.rect(0, 0, 210, 297, 'F');

    // Header Card
    doc.setFillColor(19, 45, 70);
    doc.roundedRect(15, 15, 180, 267, 8, 8, 'F');

    // Emerald Border
    doc.setDrawColor(40, 209, 124);
    doc.setLineWidth(1.5);
    doc.roundedRect(18, 18, 174, 261, 6, 6, 'D');

    // Logo & Header
    doc.setTextColor(40, 209, 124);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text('POLYFIT', 105, 38, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(132, 145, 163);
    doc.text('CORPORATE WELLNESS NETWORK • VERIFIED PARTNER', 105, 46, { align: 'center' });

    // Venue Badge
    doc.setFillColor(11, 31, 51);
    doc.roundedRect(30, 56, 150, 22, 4, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(facilityName.toUpperCase(), 105, 70, { align: 'center' });

    // QR Simulated Standee Center
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(55, 88, 100, 100, 6, 6, 'F');

    doc.setTextColor(11, 31, 51);
    doc.setFontSize(12);
    doc.text('SCAN OR PRESENT TOTP', 105, 134, { align: 'center' });
    doc.setFontSize(8.5);
    doc.setTextColor(82, 97, 115);
    doc.text('FRONT DESK CHECK-IN STATION', 105, 142, { align: 'center' });

    // Step-by-Step Instructions
    doc.setFillColor(15, 38, 60);
    doc.roundedRect(28, 198, 154, 46, 4, 4, 'F');

    doc.setFontSize(9.5);
    doc.setTextColor(40, 209, 124);
    doc.setFont('helvetica', 'bold');
    doc.text('HOW TO CHECK IN WITH YOUR BENEFIT:', 36, 208);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('1. Open your PolyFit Mobile Employee App', 36, 217);
    doc.text('2. Present your 6-digit rotating TOTP pass or dynamic QR code', 36, 225);
    doc.text('3. Front desk validates entry in < 2 seconds for automated billing', 36, 233);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(132, 145, 163);
    doc.text('PolyFit Aggregator Platform • Kigali, Rwanda • support@polyfit.rw', 105, 266, { align: 'center' });

    doc.save(`${facilityName.toLowerCase().replace(/\s+/g, '_')}_counter_plaque_A4.pdf`);
  };

  const facilityName = provider?.name || 'FitLife Gym Kigali';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8491A3]">
            <span>PolyFit Partner Network</span>
            <span>/</span>
            <span className="text-[#0B1F33]">Collateral Center</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B1F33] tracking-tight mt-1">
            Marketing Collateral &amp; Front-Desk Standees
          </h1>
          <p className="text-xs sm:text-sm text-[#526173] mt-0.5">
            Download high-resolution acrylic counter plaques, verified entrance decals, and social announcement kits.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleGeneratePlaquePdf}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] font-bold text-xs sm:text-sm transition-all shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Front-Desk Plaque (A4 PDF)</span>
          </button>
        </div>
      </div>

      {/* Main Asset Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Acrylic Counter Plaque */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0B1F33] text-[#28D17C] flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0B1F33]">
                    Acrylic Front-Desk Counter Plaque
                  </h3>
                  <p className="text-xs text-[#8491A3]">
                    Turnstile &amp; Reception Counter Standee (A4 / A5)
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E9FAF2] text-[#008A4B] border border-[#B7F1D2]">
                Print Ready
              </span>
            </div>

            {/* Plaque Preview Box */}
            <div className="mt-6 bg-[#0B1F33] text-white p-6 rounded-2xl border-2 border-[#28D17C]/40 text-center max-w-md mx-auto shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#28D17C] via-[#00D2B4] to-[#28D17C]" />
              
              <div className="text-xl font-extrabold text-[#28D17C] tracking-tight">POLYFIT</div>
              <div className="text-[10px] text-[#8491A3] font-bold tracking-widest uppercase mt-0.5">
                Verified Wellness Provider
              </div>

              <div className="mt-4 py-2 px-4 rounded-lg bg-white/10 font-bold text-sm text-white inline-block">
                {facilityName}
              </div>

              <div className="my-6 w-32 h-32 mx-auto bg-white rounded-xl p-3 flex flex-col items-center justify-center shadow-md">
                <QrCode className="w-20 h-20 text-[#0B1F33]" />
                <span className="text-[8px] font-bold font-mono text-[#0B1F33] mt-1">TOTP CHECK-IN</span>
              </div>

              <div className="bg-white/5 rounded-xl p-3 text-left space-y-1 text-[11px]">
                <div className="text-[#28D17C] font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>How to enter:</span>
                </div>
                <p className="text-slate-300">1. Open PolyFit Beneficiary App</p>
                <p className="text-slate-300">2. Tap "Check-in Pass" for 6-digit TOTP</p>
                <p className="text-slate-300">3. Present code at desk or scan turnstile</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[#526173]">
              Standard acrylic standee sizing for front-desk counters.
            </span>
            <div className="flex items-center gap-2">
              {assets?.frontDeskSignageSvg && (
                <button
                  onClick={() => handleDownloadSvg(assets.frontDeskSignageSvg!, 'polyfit_counter_signage.svg')}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F1F4F8] text-[#0B1F33] text-xs font-semibold border border-[#E2E8F0] transition-colors"
                >
                  Download SVG
                </button>
              )}
              <button
                onClick={handleGeneratePlaquePdf}
                className="px-4 py-2 rounded-xl bg-[#0B1F33] hover:bg-[#132D43] text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-[#28D17C]" />
                <span>Download Plaque PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Partner Network Verified Decal */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#E2E8F0]">
              <div className="w-9 h-9 rounded-xl bg-[#E9FAF2] text-[#008A4B] flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0B1F33]">
                  Entrance &amp; Window Decal
                </h3>
                <p className="text-xs text-[#8491A3]">Door Sticker (15cm x 15cm)</p>
              </div>
            </div>

            <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-[#0B1F33] to-[#132D43] text-center text-white border border-[#28D17C]/30 shadow-md">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#28D17C]/20 border border-[#28D17C] flex items-center justify-center mb-3">
                <ShieldCheck className="w-8 h-8 text-[#28D17C]" />
              </div>
              <h4 className="font-bold text-base text-white">POLYFIT NETWORK</h4>
              <p className="text-xs text-[#28D17C] font-semibold mt-0.5">VERIFIED WELLNESS PARTNER</p>
              <div className="mt-4 pt-4 border-t border-white/10 text-[11px] text-slate-300">
                Corporate employee wellness pass accepted here with dynamic digital TOTP verification.
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
            <button
              onClick={() => {
                if (assets?.windowDecalSvg) {
                  handleDownloadSvg(assets.windowDecalSvg, 'polyfit_entrance_decal.svg');
                } else {
                  handleGeneratePlaquePdf();
                }
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-[#F1F4F8] text-[#0B1F33] text-xs font-bold border border-[#E2E8F0] transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5 text-[#526173]" />
              <span>Download Window Decal (SVG)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Social Media & Corporate Partner Kit */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#E2E8F0]">
          <Share2 className="w-5 h-5 text-[#28D17C]" />
          <div>
            <h3 className="text-sm font-bold text-[#0B1F33]">
              Corporate Announcement &amp; Social Copy Kit
            </h3>
            <p className="text-xs text-[#8491A3]">
              Ready-to-post announcements for WhatsApp concierge, LinkedIn, and Instagram.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Channel 1: WhatsApp Concierge */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0B1F33]">WhatsApp Member Broadcast</span>
              <button
                onClick={() =>
                  handleCopyText(
                    'whatsapp',
                    `Exciting News! ${facilityName} is now an official partner of the PolyFit Corporate Wellness Network. Corporate employees at partnered employers (Bank of Kigali, MTN, etc.) can now train at our facilities using dynamic TOTP passes on the PolyFit App. Ask our front desk for assistance!`
                  )
                }
                className="text-[11px] font-bold text-[#28D17C] hover:text-[#22BC6E] inline-flex items-center gap-1"
              >
                {copiedKey === 'whatsapp' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'whatsapp' ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>
            <p className="text-xs text-[#526173] leading-relaxed">
              "Exciting News! {facilityName} is now an official partner of the PolyFit Corporate Wellness Network. Corporate employees at partnered employers (Bank of Kigali, MTN, etc.) can now train at our facilities using dynamic TOTP passes on the PolyFit App. Ask our front desk for assistance!"
            </p>
          </div>

          {/* Channel 2: LinkedIn & Corporate B2B */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0B1F33]">LinkedIn &amp; Corporate B2B</span>
              <button
                onClick={() =>
                  handleCopyText(
                    'linkedin',
                    `We are proud to announce our partnership with PolyFit, Rwanda's premier corporate wellness aggregator. Through this partnership, leading corporate teams enjoy verified access to our premium fitness and wellness facilities in Kigali with real-time digital attendance tracking.`
                  )
                }
                className="text-[11px] font-bold text-[#28D17C] hover:text-[#22BC6E] inline-flex items-center gap-1"
              >
                {copiedKey === 'linkedin' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'linkedin' ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>
            <p className="text-xs text-[#526173] leading-relaxed">
              "We are proud to announce our partnership with PolyFit, Rwanda's premier corporate wellness aggregator. Through this partnership, leading corporate teams enjoy verified access to our premium fitness and wellness facilities in Kigali with real-time digital attendance tracking."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
