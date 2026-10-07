import Link from "next/link";
import { MapPin } from "lucide-react";
import { PolyFitLogo } from "@/components/ui/polyfit-logo";
import { LeadModalTrigger } from "./lead-modal-trigger";

interface FooterProps {
  onOpenLeadForm?: (type: 'employer' | 'provider') => void;
}

export default function Footer({ onOpenLeadForm }: FooterProps = {}) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="pf-defer-section bg-slate-900 text-white border-t border-white/10" aria-label="Site Footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 mb-10 sm:mb-12">
          {/* Brand Col (2 cols on md) */}
          <div className="sm:col-span-2">
            <div className="mb-4">
              <PolyFitLogo theme="dark" iconSize={36} />
            </div>
            <p className="text-xs sm:text-sm text-gray-400 max-w-sm mb-4 leading-relaxed">
              Corporate fitness & wellness network connecting employers, employees, and participating fitness providers.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Kigali, Rwanda</span>
            </div>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3 sm:mb-4">Platform</h3>
            <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm text-gray-400">
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How it Works
                </a>
              </li>
              <li>
                <a href="#for-companies" className="hover:text-white transition-colors">
                  For Companies
                </a>
              </li>
              <li>
                <a href="#for-providers" className="hover:text-white transition-colors">
                  For Providers
                </a>
              </li>
              <li>
                <Link href="/network" className="hover:text-white transition-colors">
                  Partner Network Map
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Pricing & Plan Tiers
                </Link>
              </li>
              <li>
                <Link href="/brand" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                  Brand & Design System
                </Link>
              </li>
            </ul>
          </div>

          {/* For Business */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3 sm:mb-4">Get Started</h3>
            <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm text-gray-400">
              <li>
                <Link href="/demo" className="hover:text-white transition-colors">
                  Request Corporate Demo
                </Link>
              </li>
              <li>
                <LeadModalTrigger
                  type="employer"
                  ariaLabel="Employers - Open inquiry modal"
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Employer Inquiries
                </LeadModalTrigger>
              </li>
              <li>
                <LeadModalTrigger
                  type="provider"
                  ariaLabel="Fitness Providers - Open provider registration modal"
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Fitness Providers
                </LeadModalTrigger>
              </li>
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Access */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3 sm:mb-4">Portal Access</h3>
            <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm text-gray-400">
              <li>
                <Link href="/reception" className="hover:text-emerald-400 transition-colors">
                  Reception Desk
                </Link>
              </li>
              <li>
                <Link href="/admin/corporate" className="hover:text-emerald-400 transition-colors">
                  Corporate Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 sm:pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <p>© {currentYear} PolyFit Ltd. All rights reserved.</p>
          <div className="flex space-x-6">
            <span className="text-gray-400">East Africa Corporate Wellness Network</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
