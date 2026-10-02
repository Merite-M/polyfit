'use client';

import React, { useState } from 'react';
import {
  X,
  Download,
  Share2,
  Copy,
  CheckCircle2,
  Sparkles,
  QrCode,
  FileText,
  Printer,
  ExternalLink
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useDialog } from '@/lib/use-dialog';

interface MarketingToolkitModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityName: string;
  facilityCity: string;
  providerId?: string;
}

export function MarketingToolkitModal({
  isOpen,
  onClose,
  facilityName,
  facilityCity,
  providerId = 'default',
}: MarketingToolkitModalProps) {
  const [activeTab, setActiveTab] = useState<'badge' | 'signage' | 'social'>('signage');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Native <dialog> ref — driven by useDialog hook for top-layer & discrete transitions
  const dialogRef = useDialog(isOpen, onClose);

  const cleanName = facilityName || 'Wellness Partner Facility';

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Download SVG Partner Badge
  const downloadBadgeSvg = () => {
    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 180" width="500" height="180">
  <defs>
    <linearGradient id="polyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B1F33" />
      <stop offset="100%" stop-color="#142C44" />
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#28D17C" />
    </linearGradient>
  </defs>
  <rect width="500" height="180" rx="16" fill="url(#polyGrad)" stroke="#10B981" stroke-width="2" />
  
  <!-- PolyFit Hex Mark -->
  <polygon points="50,45 75,30 100,45 100,75 75,90 50,75" fill="none" stroke="url(#emeraldGrad)" stroke-width="5" />
  <circle cx="75" cy="60" r="10" fill="#10B981" />
  
  <!-- Text Content -->
  <text x="120" y="55" font-family="Inter, sans-serif" font-weight="800" font-size="24" fill="#FFFFFF">POLYFIT</text>
  <text x="225" y="55" font-family="Inter, sans-serif" font-weight="500" font-size="14" fill="#10B981">NETWORK</text>
  
  <text x="120" y="85" font-family="Inter, sans-serif" font-weight="700" font-size="15" fill="#F8FAFC">OFFICIAL CORPORATE PARTNER</text>
  <text x="120" y="115" font-family="Inter, sans-serif" font-weight="600" font-size="20" fill="url(#emeraldGrad)">${cleanName}</text>
  <text x="120" y="140" font-family="Inter, sans-serif" font-weight="500" font-size="12" fill="#94A3B8">${facilityCity} • VERIFIED FACILITY</text>
</svg>`.trim();

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `polyfit-partner-badge-${cleanName.toLowerCase().replace(/\s+/g, '-')}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate and Download Printable A4 Front-Desk Counter PDF Standee
  const downloadSignagePdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Dark Navy Header Band
    doc.setFillColor(11, 31, 51);
    doc.rect(0, 0, 210, 50, 'F');

    // Brand Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text('POLYFIT CHECK-IN', 105, 25, { align: 'center' });

    doc.setFontSize(13);
    doc.setTextColor(40, 209, 124);
    doc.text('Corporate Wellness Network • Front Desk Entry Pass', 105, 36, { align: 'center' });

    // Welcome Headline
    doc.setTextColor(11, 31, 51);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(`Welcome to ${cleanName}`, 105, 75, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(82, 97, 115);
    doc.text(`Verified Facility • ${facilityCity || 'Kigali, Rwanda'}`, 105, 83, { align: 'center' });

    // QR Center Display Box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(50, 95, 110, 110, 6, 6, 'FD');

    // Inner QR Dashed Box
    doc.setDrawColor(40, 209, 124);
    doc.setLineWidth(1);
    doc.roundedRect(60, 105, 90, 90, 4, 4, 'D');

    doc.setTextColor(11, 31, 51);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('SCAN TOTP PASS HERE', 105, 145, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('via PolyFit Mobile App', 105, 155, { align: 'center' });

    // 3 Step Instructions
    doc.setTextColor(11, 31, 51);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('1. Open your PolyFit Mobile App', 40, 225);
    doc.text('2. Tap "Check-in Pass" to generate your dynamic TOTP QR', 40, 237);
    doc.text('3. Present pass to reception staff for verified entry', 40, 249);

    // Footer Help Line
    doc.setFontSize(9);
    doc.setTextColor(132, 145, 163);
    doc.text('Questions or check-in support? Contact: support@polyfit.africa • Kigali, Rwanda', 105, 280, {
      align: 'center',
    });

    doc.save(`polyfit-desk-signage-${cleanName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  const instagramCaption = `🎉 Exciting news! We have officially joined the @PolyFit corporate wellness network!

Eligible corporate employees can now access ${cleanName} seamlessly with their PolyFit dynamic mobile pass.

🏋️‍♂️ Access Olympic conditioning, pools, and wellness amenities.
📍 Located at ${facilityCity}.
💼 Ask your HR department about your PolyFit corporate wellness benefit!

#PolyFit #CorporateWellness #KigaliFitness #RwandaWellness #HealthyWorkforce`;

  const linkedinCaption = `${cleanName} is proud to partner with PolyFit to deliver verified wellness benefits to forward-thinking employers in Rwanda.

Through the PolyFit corporate network, employees at leading organizations can train at our facilities using digital TOTP verification and automated employer-funded benefits.

Together, we are building a healthier, more active workforce across East Africa.

#CorporateWellness #EmployeeBenefits #PolyFit #HealthInfrastructure #Kigali`;


  return (
    /* Native <dialog> with pf-native-dialog + pf-dialog-lg classes.
       SVG fill attributes in downloadBadgeSvg() retain raw hex — SVG attributes
       cannot use Tailwind utilities. All JSX-level tokens use design system vars. */
    <dialog
      ref={dialogRef}
      className="pf-native-dialog pf-dialog-lg w-full flex flex-col max-h-[90dvh] overflow-hidden"
      aria-labelledby="toolkit-modal-title"
      onClose={onClose}
    >
        {/* Modal Header */}
        <div className="bg-primary text-primary-foreground p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent text-accent-foreground flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 id="toolkit-modal-title" className="text-base font-bold text-white leading-tight">
                Co-Branded Marketing & Signage Toolkit
              </h2>
              <p className="text-xs text-white/70">
                Official PolyFit assets for {cleanName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Tab Controls */}
      <div className="flex border-b border-border bg-muted px-5 pt-3 gap-3 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('signage')}
          className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'signage'
              ? 'border-accent text-primary'
              : 'border-transparent text-muted-foreground hover:text-primary'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Printable Reception Signage (PDF)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('badge')}
          className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'badge'
              ? 'border-accent text-primary'
              : 'border-transparent text-muted-foreground hover:text-primary'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Digital Partner Badge (SVG)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('social')}
          className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'social'
              ? 'border-accent text-primary'
              : 'border-transparent text-muted-foreground hover:text-primary'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Social Launch Copy</span>
        </button>
      </div>

      {/* Modal Content */}
      <div className="p-6 overflow-y-auto flex-1 space-y-4">
        {/* TAB 1: FRONT DESK SIGNAGE */}
        {activeTab === 'signage' && (
          <div className="space-y-4">
            <div className="bg-muted border border-border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-primary">
                  Official Reception Desk Standee (A4 Format)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Ready-to-print PDF designed for acrylic front desk standees at your reception counter. Guides employees on scanning their TOTP pass.
                </p>
              </div>

              <button
                type="button"
                onClick={downloadSignagePdf}
                className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-accent-foreground text-xs font-bold rounded-xl flex items-center gap-2 shrink-0 shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download A4 PDF</span>
              </button>
            </div>

            {/* PDF Mock Visual Preview */}
            <div className="border border-border rounded-xl p-6 bg-muted text-center space-y-3 max-w-sm mx-auto shadow-inner">
              <div className="bg-primary text-primary-foreground p-2.5 rounded-lg">
                <div className="text-xs font-bold uppercase tracking-wider text-accent">
                  POLYFIT CHECK-IN
                </div>
                <div className="text-[10px] text-primary-foreground/60">Corporate Wellness Network</div>
              </div>

              <div className="text-xs font-bold text-primary">{cleanName}</div>

              <div className="w-24 h-24 mx-auto border-2 border-dashed border-accent rounded-lg flex items-center justify-center bg-card">
                <QrCode className="w-16 h-16 text-primary" />
              </div>

              <p className="text-[10px] text-muted-foreground">
                1. Open PolyFit App • 2. Present Pass • 3. Seamless Entry
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: DIGITAL SVG BADGE */}
        {activeTab === 'badge' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-primary">
                  Official &quot;We&apos;re on PolyFit&quot; Website Badge
                </h3>
                <p className="text-xs text-muted-foreground">
                  Display on your homepage header, footer, or Linktree.
                </p>
              </div>

              <button
                type="button"
                onClick={downloadBadgeSvg}
                className="px-3.5 py-2 bg-primary hover:opacity-90 text-primary-foreground rounded-lg text-xs font-bold flex items-center gap-1.5 transition-opacity cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-accent" />
                <span>Download SVG</span>
              </button>
            </div>

            {/* Badge Visual Container — hex colors here are intentional brand colors inside a CSS preview */}
            <div className="p-4 bg-primary rounded-xl flex items-center justify-center">
              <div className="border border-accent bg-gradient-to-r from-primary to-primary/80 rounded-xl p-4 flex items-center gap-4 text-primary-foreground max-w-md w-full">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent to-secondary flex items-center justify-center text-accent-foreground font-bold text-lg">
                  P
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <span>POLYFIT</span>
                    <span className="text-accent">NETWORK</span>
                  </div>
                  <div className="text-[10px] text-primary-foreground/50 uppercase tracking-wider font-semibold">
                    OFFICIAL CORPORATE PARTNER
                  </div>
                  <div className="text-xs font-bold text-accent truncate">
                    {cleanName}
                  </div>
                </div>
              </div>
            </div>

            {/* Embed Code Snippet */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-muted-foreground">
                  Website HTML Embed Code
                </label>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      `<a href="https://polyfit.africa" target="_blank"><img src="https://polyfit.africa/badges/partner.svg" alt="${cleanName} on PolyFit" width="280" /></a>`,
                      'embed'
                    )
                  }
                  className="text-xs font-semibold text-success hover:underline flex items-center gap-1"
                >
                  {copiedKey === 'embed' ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-accent" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-2.5 bg-muted border border-border rounded-lg text-[11px] font-mono text-primary overflow-x-auto">
                {`<a href="https://polyfit.africa" target="_blank"><img src="https://polyfit.africa/badges/partner.svg" alt="${cleanName} on PolyFit" width="280" /></a>`}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 3: SOCIAL MEDIA COPY */}
        {activeTab === 'social' && (
          <div className="space-y-4">
            {/* Instagram Announcement */}
            <div className="bg-muted border border-border rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" style={{ color: '#E1306C' }} />
                  Instagram Announcement Caption
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(instagramCaption, 'instagram')}
                  className="text-xs font-bold text-success hover:underline flex items-center gap-1"
                >
                  {copiedKey === 'instagram' ? 'Copied!' : 'Copy Caption'}
                </button>
              </div>
              {/* readOnly social copy textarea — pf-textarea-sm for auto-size */}
              <textarea
                readOnly
                value={instagramCaption}
                className="pf-textarea-sm w-full p-2.5 bg-card border border-border rounded-lg text-xs text-primary font-sans"
              />
            </div>

            {/* LinkedIn Announcement */}
            <div className="bg-muted border border-border rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" style={{ color: '#0A66C2' }} />
                  LinkedIn B2B Partner Post
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(linkedinCaption, 'linkedin')}
                  className="text-xs font-bold text-success hover:underline flex items-center gap-1"
                >
                  {copiedKey === 'linkedin' ? 'Copied!' : 'Copy Post'}
                </button>
              </div>
              <textarea
                readOnly
                value={linkedinCaption}
                className="pf-textarea-sm w-full p-2.5 bg-card border border-border rounded-lg text-xs text-primary font-sans"
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal Footer */}
      <div className="p-4 bg-muted border-t border-border flex justify-end shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-card border border-border text-primary rounded-lg text-xs font-bold hover:bg-muted transition-colors"
        >
          Close Toolkit
        </button>
      </div>
    </dialog>
  );
}
