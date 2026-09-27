"use client";

import Link from "next/link";
import { 
  Dumbbell, 
  Waves, 
  Sparkles, 
  MapPin, 
  Star, 
  ArrowRight, 
  Map as MapIcon, 
  CheckCircle2,
  Building2,
  HeartHandshake
} from "lucide-react";

interface NetworkPreviewProps {
  onOpenLeadForm?: (type: 'employer' | 'provider') => void;
}

const FEATURED_VENUES = [
  {
    id: "waka-kimihurura",
    name: "WAKA Fitness Kimihurura",
    district: "Kimihurura, Kigali",
    category: "Gym & Strength",
    icon: Dumbbell,
    rating: 4.9,
    reviews: 142,
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800",
    amenities: ["Olympic Racks", "Sauna & Steam", "Smoothie Bar"],
    highlight: "Kigali's Premier Functional Facility",
  },
  {
    id: "csk-rugunga",
    name: "Cercle Sportif de Kigali (CSK)",
    district: "Rugunga, Kigali",
    category: "Olympic Pool & Sports",
    icon: Waves,
    rating: 4.8,
    reviews: 215,
    image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=800",
    amenities: ["50m Olympic Pool", "Clay Tennis Courts", "Clubhouse Cafe"],
    highlight: "Historic Multi-Sport & Aquatics Hub",
  },
  {
    id: "zenith-kacyiru",
    name: "Zenith Wellness Studio",
    district: "Kacyiru, Kigali",
    category: "Yoga & Reformer Pilates",
    icon: Sparkles,
    rating: 4.9,
    reviews: 88,
    image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=800",
    amenities: ["Reformer Pilates", "Hot Yoga Studio", "Meditation Garden"],
    highlight: "Executive Mindfulness & Core Studio",
  },
  {
    id: "nyarutarama-club",
    name: "Nyarutarama Sports Club",
    district: "Nyarutarama, Kigali",
    category: "Tennis, Gym & Recovery",
    icon: Dumbbell,
    rating: 4.7,
    reviews: 110,
    image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=80&w=800",
    amenities: ["Floodlit Courts", "Technogym Cardio", "Physio Clinic"],
    highlight: "Diplomatic Quarter Fitness Standard",
  },
];

export default function NetworkPreview({ onOpenLeadForm }: NetworkPreviewProps) {
  return (
    <section id="network-preview" className="py-16 sm:py-24 bg-[#0B1F33] text-white relative overflow-hidden border-t border-white/10">
      {/* Background ambient pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#28D17C_1px,transparent_1px)] [background-size:24px_24px]"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#28D17C] mb-3">
              <Building2 className="w-3.5 h-3.5" />
              <span>Curated Kigali Network</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Top Wellness Facilities Across <br className="hidden sm:inline" />
              <span className="text-[#28D17C]">Kigali&apos;s Core Business Hubs</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
              From high-intensity functional training in Kimihurura to Olympic swimming in Rugunga, your employees enjoy premium wellness options close to their offices and homes.
            </p>
          </div>

          <div className="flex-shrink-0">
            <Link
              href="/network"
              className="inline-flex items-center gap-2 bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] px-6 py-3.5 rounded-[10px] text-sm font-bold transition-all shadow-lg shadow-[#28D17C]/15 cursor-pointer"
            >
              <MapIcon className="w-4 h-4 stroke-[2.5]" />
              <span>Explore Interactive Map & All 15+ Locations</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>
          </div>
        </div>

        {/* 4 Featured Venue Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {FEATURED_VENUES.map((venue) => {
            const Icon = venue.icon;
            return (
              <div 
                key={venue.id}
                className="group rounded-[14px] bg-[#102A43] border border-[#21405A] hover:border-[#28D17C]/50 transition-all duration-200 overflow-hidden flex flex-col shadow-lg"
              >
                {/* Image & Category Pill */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-800">
                  <img
                    src={venue.image}
                    alt={venue.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#102A43] via-transparent to-transparent opacity-80" />
                  
                  <div className="absolute top-3 left-3 bg-[#0B1F33]/85 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white flex items-center gap-1.5">
                    <Icon className="w-3 h-3 text-[#28D17C]" />
                    <span>{venue.category}</span>
                  </div>

                  <div className="absolute top-3 right-3 bg-[#0B1F33]/85 backdrop-blur-md border border-white/10 px-2 py-1 rounded-full text-[10px] font-bold text-amber-400 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{venue.rating}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-[#28D17C] uppercase tracking-wider mb-1">
                      {venue.highlight}
                    </p>
                    <h3 className="text-base font-bold text-white group-hover:text-[#28D17C] transition-colors leading-snug">
                      {venue.name}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1.5 mb-3.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{venue.district}</span>
                    </p>

                    {/* Amenities Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {venue.amenities.map((item) => (
                        <span 
                          key={item}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-[6px] bg-[#071521] text-slate-300 border border-[#21405A]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#21405A] flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-[11px] text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#28D17C]" />
                      Dynamic TOTP Pass
                    </span>
                    <Link
                      href="/network"
                      className="text-[#28D17C] hover:underline font-semibold flex items-center gap-1"
                    >
                      View on Map →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Network Bottom Banner: Partner Acquisition & Link to Full Directory */}
        <div className="rounded-[14px] bg-gradient-to-r from-[#102A43] via-[#0E2840] to-[#133554] border border-[#21405A] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[12px] bg-[#28D17C]/15 border border-[#28D17C]/30 flex items-center justify-center flex-shrink-0 text-[#28D17C]">
              <HeartHandshake className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-white">
                Own a gym, swimming pool, or studio in Rwanda?
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Join PolyFit&apos;s corporate network. Guaranteed per-visit monthly payouts, zero subscription fees, and immediate access to top corporate employers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => onOpenLeadForm?.('provider')}
              className="w-full md:w-auto bg-transparent hover:bg-white/10 text-white border border-white/20 px-5 py-2.5 rounded-[10px] text-xs sm:text-sm font-semibold transition-colors text-center cursor-pointer"
            >
              Partner With PolyFit
            </button>
            <Link
              href="/network"
              className="w-full md:w-auto bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] px-5 py-2.5 rounded-[10px] text-xs sm:text-sm font-bold transition-all text-center whitespace-nowrap cursor-pointer"
            >
              View Full Directory
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
