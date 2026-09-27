"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Copy,
  Check,
  Download,
  ShieldCheck,
  BadgeCheck,
  Clock,
  AlertCircle,
  Building2,
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  ChevronRight,
  Sliders,
  ExternalLink
} from "lucide-react";
import { PolyFitLogo, IsometricHexMark, ConstellationNetworkMark } from "@/components/ui/polyfit-logo";

interface ColorToken {
  name: string;
  token: string;
  hex: string;
  rgb: string;
  hsl?: string;
  role: string;
  textLight: boolean;
  wcag?: string;
}

interface ColorGroup {
  category: string;
  items: ColorToken[];
}

// Signature Color Tokens
const COLOR_TOKENS: ColorGroup[] = [
  {
    category: "Signature Brand Anchors",
    items: [
      {
        name: "PolyFit Midnight Navy",
        token: "--pf-navy",
        hex: "#0B1F33",
        rgb: "11, 31, 51",
        hsl: "210°, 65%, 12%",
        role: "Primary Brand Anchor: Core text, headings, dark surfaces, institutional trust",
        textLight: true,
        wcag: "16.1:1 on White (AAA)"
      },
      {
        name: "PolyFit Electric Green",
        token: "--pf-green",
        hex: "#28D17C",
        rgb: "40, 209, 124",
        hsl: "150°, 68%, 49%",
        role: "Signature Kinetic Accent: Primary CTAs, verified visits, active states",
        textLight: false,
        wcag: "9.8:1 on Navy (AAA)"
      },
      {
        name: "Kinetic Teal",
        token: "--pf-teal",
        hex: "#00D2B4",
        rgb: "0, 210, 180",
        hsl: "171°, 100%, 41%",
        role: "Network Flow: Connection vectors, health balance, secondary momentum",
        textLight: false,
        wcag: "8.2:1 on Navy (AAA)"
      },
      {
        name: "Accent Lime",
        token: "--pf-lime",
        hex: "#B8F36B",
        rgb: "184, 243, 107",
        hsl: "86°, 84%, 69%",
        role: "Momentum Spark: Promotional tags, gradient blends, celebratory metrics",
        textLight: false,
        wcag: "11.4:1 on Navy (AAA)"
      },
      {
        name: "Electric Blue",
        token: "--pf-blue",
        hex: "#3B82F6",
        rgb: "59, 130, 246",
        hsl: "217°, 91%, 60%",
        role: "Informational: Secondary HR analytics, callouts, interactive hover",
        textLight: true,
        wcag: "4.5:1 on Navy (AA)"
      }
    ]
  },
  {
    category: "Canvas & Surface Architecture",
    items: [
      {
        name: "Clean Executive Canvas",
        token: "--background",
        hex: "#F7F9FC",
        rgb: "247, 249, 252",
        role: "Light Mode Background: Clean enterprise page canvas",
        textLight: false
      },
      {
        name: "Pure White Surface",
        token: "--card",
        hex: "#FFFFFF",
        rgb: "255, 255, 255",
        role: "Card & Dialog Surface: High-contrast elevated panels",
        textLight: false
      },
      {
        name: "Surface Hairline Border",
        token: "--border",
        hex: "#E2E8F0",
        rgb: "226, 232, 240",
        role: "Structural 1px hairline separation on light canvas",
        textLight: false
      },
      {
        name: "Abyssal Midnight Canvas",
        token: "--dark-background",
        hex: "#071521",
        rgb: "7, 21, 33",
        role: "Dark Mode Background: Deep contrast hero sections and kiosk views",
        textLight: true
      },
      {
        name: "Elevated Dark Surface",
        token: "--dark-surface",
        hex: "#0D2235",
        rgb: "13, 34, 53",
        role: "Dark Cards: Operations console and modal surfaces",
        textLight: true
      }
    ]
  }
];

// Typography Tokens
const TYPOGRAPHY_SCALE = [
  {
    token: "display-2xl",
    size: "60px / 3.75rem",
    lineHeight: "66px / 1.1",
    weight: "700 Bold",
    tracking: "-0.025em",
    usage: "Marketing Hero Headlines",
    sample: "A Smarter Corporate Wellness Benefit."
  },
  {
    token: "display-xl",
    size: "48px / 3.00rem",
    lineHeight: "56px / 1.15",
    weight: "700 Bold",
    tracking: "-0.02em",
    usage: "Portal H1 & Major Splash Headers",
    sample: "Corporate Wellness Network Dashboard"
  },
  {
    token: "headline-lg",
    size: "36px / 2.25rem",
    lineHeight: "44px / 1.2",
    weight: "700 Bold",
    tracking: "-0.015em",
    usage: "Major Section Headers (H2)",
    sample: "Connecting Employers to Quality Providers"
  },
  {
    token: "headline-md",
    size: "24px / 1.50rem",
    lineHeight: "32px / 1.3",
    weight: "700 Bold",
    tracking: "-0.01em",
    usage: "Module & Card Section Titles",
    sample: "Employee Benefit Utilization Summary"
  },
  {
    token: "headline-sm",
    size: "20px / 1.25rem",
    lineHeight: "28px / 1.35",
    weight: "600 SemiBold",
    tracking: "-0.005em",
    usage: "Subsection Headers & Modal Titles",
    sample: "Configure Subsidy Tier Allocation"
  },
  {
    token: "body-lg",
    size: "18px / 1.125rem",
    lineHeight: "28px / 1.55",
    weight: "400 Regular",
    tracking: "0",
    usage: "Hero Subcopy & Lead Paragraphs",
    sample: "One integrated contract unlocks 50+ vetted gyms, swimming pools, and wellness facilities across East Africa."
  },
  {
    token: "body-base",
    size: "16px / 1.00rem",
    lineHeight: "24px / 1.5",
    weight: "400 Regular",
    tracking: "0",
    usage: "Standard Interface Copy & Form Inputs",
    sample: "Employees scan a dynamic TOTP QR code at check-in. The visit is logged and verified with zero manual paperwork."
  },
  {
    token: "caption",
    size: "12px / 0.75rem",
    lineHeight: "16px / 1.35",
    weight: "600 SemiBold",
    tracking: "+0.02em",
    usage: "Status Chips, Timestamps & Metadata",
    sample: "VERIFIED CHECK-IN • RRA EBM COMPLIANT"
  },
  {
    token: "mono-id",
    size: "12px / 0.75rem",
    lineHeight: "16px / 1.35",
    weight: "500 Medium (JetBrains Mono)",
    tracking: "0",
    usage: "Member IDs, RWF Currency & Cryptographic Hashes",
    sample: "RWF 145,000 • TOTP: 849-204 • HASH: 0x7e41ed5e"
  }
];

// Anti-Pattern Directives
const DIRECTIVES = [
  { rule: "Never use pure black (#000000)", desc: "Always anchor typography and dark panels in PolyFit Midnight Navy (#0B1F33)." },
  { rule: "Never use white text on PolyFit Green", desc: "Green (#28D17C) requires dark navy (#0B1F33) text to guarantee WCAG AAA contrast." },
  { rule: "No legacy gym software terminology", desc: "Always use Beneficiary, Corporate Benefit, Verified Visit, Wellness Provider, and Settlement." },
  { rule: "No solid block inside the 'P' counter", desc: "The center loop of the 'P' is clean, unencumbered hexagonal negative space." },
  { rule: "Strict 14px Card & 10px Button Radii", desc: "Never invent arbitrary corner radiuses. Badges are strictly 9999px full pills." },
  { rule: "Inter & JetBrains Mono Exclusively", desc: "Do not introduce ad-hoc fonts like Roboto, Montserrat, or AI-style display typefaces." }
];

export default function BrandPage() {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("light");
  const [logoSize, setLogoSize] = useState<number>(48);
  const [customText, setCustomText] = useState<string>("One Benefit. Many Providers. Healthier Teams.");

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(identifier);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1F33] selection:bg-[#28D17C]/20 selection:text-[#0B1F33] font-sans pb-32">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-[#F7F9FC]/90 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <PolyFitLogo theme="light" iconSize={32} showSubtitle={false} />
            </Link>
            <span className="hidden sm:inline-block h-4 w-[1px] bg-[#E2E8F0]" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E9FAF2] text-[#008A4B] border border-[#B7F1D2]">
                Design System v1.0
              </span>
              <span className="text-xs text-[#526173]">Stitch Canonical Synced</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-medium text-[#526173] hover:text-[#0B1F33] px-3 py-1.5 rounded-[8px] transition-colors"
            >
              Back to Home
            </Link>
            <a
              href="https://linear.app/polyfitltd"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold bg-[#0B1F33] text-white px-3.5 py-2 rounded-[10px] hover:bg-[#142C44] transition-colors"
            >
              Linear Backlog <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-12 pb-16 border-b border-[#E2E8F0] bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(#28D17C_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B1F33]/5 border border-[#0B1F33]/10 text-xs font-semibold text-[#0B1F33] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#28D17C]" />
            The PolyFit Visual Constitution
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0B1F33] max-w-4xl leading-[1.1]">
            Corporate Wellness <span className="text-[#28D17C]">Network</span> Design System
          </h1>

          <p className="mt-4 text-lg text-[#526173] max-w-2xl leading-relaxed">
            Live specifications, mathematical logo geometry, and tokens for PolyFit. Built to guarantee institutional trust, kinetic vitality, and strict WCAG AAA contrast across all apps.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 text-xs font-medium">
            <a href="#logos" className="px-3.5 py-2 rounded-[10px] bg-[#F1F4F8] hover:bg-[#E2E8F0] text-[#0B1F33] transition-colors">
              1. Logo System
            </a>
            <a href="#colors" className="px-3.5 py-2 rounded-[10px] bg-[#F1F4F8] hover:bg-[#E2E8F0] text-[#0B1F33] transition-colors">
              2. Color Tokens
            </a>
            <a href="#typography" className="px-3.5 py-2 rounded-[10px] bg-[#F1F4F8] hover:bg-[#E2E8F0] text-[#0B1F33] transition-colors">
              3. Typography Scale
            </a>
            <a href="#components" className="px-3.5 py-2 rounded-[10px] bg-[#F1F4F8] hover:bg-[#E2E8F0] text-[#0B1F33] transition-colors">
              4. UI Components
            </a>
            <a href="#collateral" className="px-3.5 py-2 rounded-[10px] bg-[#F1F4F8] hover:bg-[#E2E8F0] text-[#0B1F33] transition-colors">
              5. Real-World Applications
            </a>
            <a href="#directives" className="px-3.5 py-2 rounded-[10px] bg-[#F1F4F8] hover:bg-[#E2E8F0] text-[#0B1F33] transition-colors">
              6. Strict Directives
            </a>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-20">

        {/* SECTION 1: LOGO SYSTEM */}
        <section id="logos" className="scroll-mt-24 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2E8F0] pb-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0B1F33] tracking-tight">
                1. Dual Logo Architecture
              </h2>
              <p className="text-sm text-[#526173] mt-1">
                The primary 3D Isometric Hexagonal 'P' paired with the Constellation Connected Nodes digital motif.
              </p>
            </div>

            {/* Interactive Theme & Size Controls */}
            <div className="flex items-center gap-3 bg-white p-2 rounded-[12px] border border-[#E2E8F0] shadow-xs">
              <div className="flex items-center gap-1 bg-[#F1F4F8] p-1 rounded-[8px]">
                <button
                  onClick={() => setPreviewTheme("light")}
                  className={`p-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-1 transition-colors ${
                    previewTheme === "light" ? "bg-white shadow-xs text-[#0B1F33]" : "text-[#526173]"
                  }`}
                  aria-label="Light mode preview"
                >
                  <Sun className="w-3.5 h-3.5" /> Light
                </button>
                <button
                  onClick={() => setPreviewTheme("dark")}
                  className={`p-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-1 transition-colors ${
                    previewTheme === "dark" ? "bg-[#0B1F33] shadow-xs text-white" : "text-[#526173]"
                  }`}
                  aria-label="Dark mode preview"
                >
                  <Moon className="w-3.5 h-3.5" /> Dark
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 px-2 text-xs text-[#526173]">
                <Sliders className="w-3.5 h-3.5" />
                <input
                  type="range"
                  min="32"
                  max="72"
                  value={logoSize}
                  onChange={(e) => setLogoSize(Number(e.target.value))}
                  className="w-20 accent-[#28D17C] cursor-pointer"
                />
                <span className="w-8 font-mono">{logoSize}px</span>
              </div>
            </div>
          </div>

          {/* Logo Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card A: 3D Isometric Hexagonal P */}
            <div className={`p-8 rounded-[14px] border transition-all duration-200 ${
              previewTheme === "dark" ? "bg-[#071521] border-[#21405A] text-white" : "bg-white border-[#E2E8F0] text-[#0B1F33]"
            } shadow-xs space-y-6`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#28D17C]/15 text-[#28D17C]">
                  Primary Corporate Mark
                </span>
                <span className="text-xs font-mono opacity-60">30° True Isometric</span>
              </div>

              {/* Live Preview */}
              <div className="h-44 flex items-center justify-center border border-dashed rounded-[12px] p-6 transition-colors border-current/15">
                <PolyFitLogo
                  theme={previewTheme}
                  iconSize={logoSize}
                  showSubtitle={true}
                />
              </div>

              <div className="space-y-2 text-xs text-current/80 leading-relaxed">
                <p className="font-semibold text-current">Mathematical Construction:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>30° axonometric projection representing hexagonal network connectivity.</li>
                  <li><strong>Clean Open Counter:</strong> No internal clutter or faceted cube inside the loop.</li>
                  <li>Shaded with 4 planes: Top Radiant Green (#28D17C), Outer Left Emerald (#22C55E), Right Emerald (#10B981), Inner Midnight Navy (#0B1F33).</li>
                </ul>
              </div>
            </div>

            {/* Card B: Constellation Connected Nodes P */}
            <div className={`p-8 rounded-[14px] border transition-all duration-200 ${
              previewTheme === "dark" ? "bg-[#071521] border-[#21405A] text-white" : "bg-white border-[#E2E8F0] text-[#0B1F33]"
            } shadow-xs space-y-6`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#00D2B4]/15 text-[#00D2B4]">
                  Secondary Digital Motif
                </span>
                <span className="text-xs font-mono opacity-60">14 Connected Nodes</span>
              </div>

              {/* Live Preview */}
              <div className="h-44 flex items-center justify-center border border-dashed rounded-[12px] p-6 transition-colors border-current/15">
                <PolyFitLogo
                  variant="constellation"
                  theme={previewTheme}
                  iconSize={logoSize}
                  showSubtitle={true}
                />
              </div>

              <div className="space-y-2 text-xs text-current/80 leading-relaxed">
                <p className="font-semibold text-current">Network Pass & Telemetry Motif:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>14 luminous vertices with glowing vector connections.</li>
                  <li>Used for the mobile employee check-in pass, QR generation, and real-time dashboard telemetry.</li>
                  <li>Symbolizes the benefit flow: <em>Employer ──► PolyFit ──► Network Providers</em>.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: COLOR TOKENS */}
        <section id="colors" className="scroll-mt-24 space-y-8">
          <div className="border-b border-[#E2E8F0] pb-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0B1F33] tracking-tight">
              2. Vibrant Ecosystem Color System
            </h2>
            <p className="text-sm text-[#526173] mt-1">
              Curated corporate wellness palette anchored in Midnight Navy (#0B1F33) and Electric Green (#28D17C), enriched with Kinetic Teal and Lime.
            </p>
          </div>

          <div className="space-y-10">
            {COLOR_TOKENS.map((group) => (
              <div key={group.category} className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#526173]">
                  {group.category}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {group.items.map((c) => (
                    <div
                      key={c.name}
                      className="bg-white rounded-[14px] border border-[#E2E8F0] overflow-hidden shadow-xs hover:shadow-md transition-shadow group"
                    >
                      {/* Swatch */}
                      <div
                        className="h-28 p-4 flex flex-col justify-between relative transition-transform duration-200"
                        style={{ backgroundColor: c.hex }}
                      >
                        <div className="flex justify-between items-start">
                          <span
                            className="font-mono text-xs font-bold px-2 py-0.5 rounded-[6px]"
                            style={{
                              backgroundColor: c.textLight ? "rgba(255,255,255,0.15)" : "rgba(11,31,51,0.12)",
                              color: c.textLight ? "#FFFFFF" : "#0B1F33"
                            }}
                          >
                            {c.hex}
                          </span>

                          <button
                            onClick={() => copyToClipboard(c.hex, c.name)}
                            className="p-1.5 rounded-[6px] transition-transform active:scale-90"
                            style={{
                              backgroundColor: c.textLight ? "rgba(255,255,255,0.2)" : "rgba(11,31,51,0.15)",
                              color: c.textLight ? "#FFFFFF" : "#0B1F33"
                            }}
                            title="Copy HEX code"
                            aria-label={`Copy ${c.name} hex code`}
                          >
                            {copiedToken === c.name ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {c.wcag && (
                          <div
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] self-start"
                            style={{
                              backgroundColor: c.textLight ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.7)",
                              color: c.textLight ? "#FFFFFF" : "#0B1F33"
                            }}
                          >
                            {c.wcag}
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="p-4 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-[#0B1F33]">{c.name}</h4>
                          <span className="font-mono text-[11px] text-[#526173]">{c.token}</span>
                        </div>
                        <p className="text-xs text-[#526173] leading-relaxed">{c.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Gradient Showcase */}
          <div className="bg-white p-6 rounded-[14px] border border-[#E2E8F0] space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#526173]">
              Network Momentum Gradients
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-[10px] pf-gradient-flow text-[#0B1F33] font-bold text-sm shadow-xs flex flex-col justify-between h-24">
                <span>Kinetic Flow</span>
                <span className="text-[11px] font-mono opacity-80">#28D17C → #00D2B4</span>
              </div>
              <div className="p-4 rounded-[10px] pf-gradient-vitality text-[#0B1F33] font-bold text-sm shadow-xs flex flex-col justify-between h-24">
                <span>Vitality Boost</span>
                <span className="text-[11px] font-mono opacity-80">#28D17C → #B8F36B</span>
              </div>
              <div className="p-4 rounded-[10px] pf-gradient-executive text-white font-bold text-sm shadow-xs flex flex-col justify-between h-24">
                <span>Executive Surface</span>
                <span className="text-[11px] font-mono opacity-80">#0D2235 → #071521</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: TYPOGRAPHY SCALE */}
        <section id="typography" className="scroll-mt-24 space-y-8">
          <div className="border-b border-[#E2E8F0] pb-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0B1F33] tracking-tight">
              3. Typography Scale & Constitution
            </h2>
            <p className="text-sm text-[#526173] mt-1">
              Primary typeface: <strong>Inter</strong> for clean corporate communication. Monospace: <strong>JetBrains Mono</strong> for data, IDs, and financial amounts.
            </p>
          </div>

          {/* Live Editable Text Input */}
          <div className="bg-white p-4 rounded-[14px] border border-[#E2E8F0] flex flex-col sm:flex-row items-center gap-3">
            <span className="text-xs font-bold text-[#526173] whitespace-nowrap">Test your headline:</span>
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full bg-[#F7F9FC] border border-[#E2E8F0] rounded-[8px] px-3 py-2 text-sm text-[#0B1F33] focus:outline-none focus:border-[#28D17C]"
              placeholder="Type anything to test the type scale..."
            />
          </div>

          {/* Type Scale Table */}
          <div className="bg-white rounded-[14px] border border-[#E2E8F0] divide-y divide-[#E2E8F0] overflow-hidden shadow-xs">
            {TYPOGRAPHY_SCALE.map((t) => (
              <div key={t.token} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-[#F7F9FC]/60 transition-colors">
                <div className="w-full lg:w-72 space-y-1 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#0B1F33]">{t.token}</span>
                    <span className="text-[11px] font-medium text-[#526173]">({t.size})</span>
                  </div>
                  <div className="text-xs text-[#526173]">{t.weight} • Line: {t.lineHeight}</div>
                  <div className="text-[11px] text-[#28D17C] font-semibold">{t.usage}</div>
                </div>

                <div className="w-full overflow-hidden">
                  <p
                    className="font-bold text-[#0B1F33] truncate"
                    style={{
                      fontSize: t.size.split(" ")[0],
                      lineHeight: t.lineHeight.split(" ")[0],
                      letterSpacing: t.tracking,
                      fontFamily: t.token === "mono-id" ? "var(--font-mono)" : "var(--font-sans)"
                    }}
                  >
                    {customText || t.sample}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: LIVE UI COMPONENTS */}
        <section id="components" className="scroll-mt-24 space-y-8">
          <div className="border-b border-[#E2E8F0] pb-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0B1F33] tracking-tight">
              4. Interactive Component Gallery
            </h2>
            <p className="text-sm text-[#526173] mt-1">
              Production-grade buttons, verified visit chips, metric tiles, and cards adhering to the 14px/10px radius constitution.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Buttons & Status Chips */}
            <div className="bg-white p-6 rounded-[14px] border border-[#E2E8F0] space-y-6 shadow-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#526173]">
                Buttons (10px Radius)
              </h3>
              
              <div className="flex flex-wrap items-center gap-3">
                <button className="bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] font-bold text-sm px-5 py-2.5 rounded-[10px] transition-all shadow-xs hover:shadow-sm active:scale-95">
                  Primary Action
                </button>
                <button className="bg-white hover:bg-[#F7F9FC] border border-[#0B1F33] text-[#0B1F33] font-semibold text-sm px-5 py-2.5 rounded-[10px] transition-all active:scale-95">
                  Secondary Outlined
                </button>
                <button className="bg-transparent hover:bg-[#F1F4F8] text-[#0B1F33] font-semibold text-sm px-4 py-2.5 rounded-[10px] transition-colors">
                  Ghost Button
                </button>
                <button className="bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold text-sm px-4 py-2.5 rounded-[10px] transition-colors">
                  Destructive
                </button>
              </div>

              <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#526173]">
                  Status Badges & Chips (9999px Full Pill)
                </h3>
                
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E9FAF2] text-[#008A4B] border border-[#B7F1D2]">
                    <BadgeCheck className="w-3.5 h-3.5" /> Verified Visit
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E0F9F5] text-[#007A68] border border-[#A7F3E5]">
                    <ShieldCheck className="w-3.5 h-3.5" /> Standard Tier
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                    <Clock className="w-3.5 h-3.5" /> Pending Approval
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]">
                    <AlertCircle className="w-3.5 h-3.5" /> Dispute Flagged
                  </span>
                </div>
              </div>
            </div>

            {/* Metric Tile (14px Card Radius) */}
            <div className="bg-white p-6 rounded-[14px] border border-[#E2E8F0] space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#526173]">
                  Executive Metric Card (14px Radius)
                </h3>
                <span className="text-xs font-mono text-[#008A4B] bg-[#E9FAF2] px-2 py-0.5 rounded-[6px] font-semibold">
                  +18.4% MoM
                </span>
              </div>

              <div className="p-5 rounded-[12px] bg-[#F7F9FC] border border-[#E2E8F0] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-[#526173] uppercase tracking-wide">
                    Monthly Network Utilization
                  </span>
                  <span className="font-mono text-xs text-[#0B1F33]">Bank of Kigali</span>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-[#0B1F33]">4,892</span>
                  <span className="text-xs text-[#526173]">verified visits this cycle</span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="h-2 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#28D17C] to-[#00D2B4] rounded-full" style={{ width: "74%" }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#526173] font-mono">
                    <span>74% budget utilized</span>
                    <span>Max: 6,500 visits</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                  <span className="text-[#526173]">Tax Invoice Status:</span>
                  <span className="font-semibold text-[#008A4B] flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" /> 18% VAT EBM Cleared
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: REAL WORLD MOCKUPS (BRAND 1 & BRAND 2) */}
        <section id="collateral" className="scroll-mt-24 space-y-8">
          <div className="border-b border-[#E2E8F0] pb-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0B1F33] tracking-tight">
              5. Real-World Applications & Collateral
            </h2>
            <p className="text-sm text-[#526173] mt-1">
              Direct photographic documentation from Brand Board 1 & 2: Architectural glass facades, business stationery, app icons, and merch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-[14px] border border-[#E2E8F0] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#0B1F33]">Brand Board 1: Corporate Applications</h3>
                <span className="text-xs text-[#526173] font-mono">Stitch Asset Ref</span>
              </div>
              <div className="relative rounded-[12px] overflow-hidden border border-[#E2E8F0] aspect-[16/10] bg-[#0B1F33]">
                <Image
                  src="/brand/brand_1.png"
                  alt="PolyFit Brand Board 1: Corporate stationery, architectural signage, and app icon"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-xs text-[#526173] leading-relaxed">
                Demonstrates the 3D isometric P on dark glass corporate facades, 400gsm tactile navy/white business cards, and Inter typography branding.
              </p>
            </div>

            <div className="bg-white p-6 rounded-[14px] border border-[#E2E8F0] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#0B1F33]">Brand Board 2: Concept & Physical Merch</h3>
                <span className="text-xs text-[#526173] font-mono">Stitch Asset Ref</span>
              </div>
              <div className="relative rounded-[12px] overflow-hidden border border-[#E2E8F0] aspect-[16/10] bg-[#0B1F33]">
                <Image
                  src="/brand/brand_2.png"
                  alt="PolyFit Brand Board 2: Mathematical formula, water bottle merch, and kinetic wave"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-xs text-[#526173] leading-relaxed">
                Highlights the geometric concept formula (Network Hexagon + Letter P + Connection = PolyFit Mark), matte merchandise, and kinetic wave backgrounds.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 6: STRICT DIRECTIVES */}
        <section id="directives" className="scroll-mt-24 space-y-8">
          <div className="border-b border-[#E2E8F0] pb-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0B1F33] tracking-tight">
              6. Non-Negotiable Brand Directives
            </h2>
            <p className="text-sm text-[#526173] mt-1">
              Guiding principles enforced across all PolyFit engineers, designers, and autonomous coding agents.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {DIRECTIVES.map((d, index) => (
              <div key={d.rule} className="bg-white p-5 rounded-[14px] border border-[#E2E8F0] shadow-xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    ✕
                  </span>
                  <h3 className="font-bold text-sm text-[#0B1F33]">{d.rule}</h3>
                </div>
                <p className="text-xs text-[#526173] leading-relaxed pl-7">{d.desc}</p>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
