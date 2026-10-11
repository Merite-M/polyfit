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
              East Africa&apos;s B2B2C corporate wellness aggregator connecting employers, employees, and independent wellness providers through consolidated benefit infrastructure.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <MapPin className="w-3.5 h-3.5 text-accent" />
              <span>Kigali, Rwanda • Nairobi, Kenya</span>
            </div>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3 sm:mb-4">Platform</h3>
            <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm text-gray-400">
              <li>
                <Link href="/#how-it-works" className="hover:text-white transition-colors">
                  How it Works
                </Link>
              </li>
              <li>
                <Link href="/#for-companies" className="hover:text-white transition-colors">
                  For Companies
                </Link>
              </li>
              <li>
                <Link href="/#for-providers" className="hover:text-white transition-colors">
                  For Wellness Providers
                </Link>
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
                <Link href="/brand" className="text-accent hover:underline font-medium transition-colors">
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
                  ariaLabel="Wellness Providers - Open provider registration modal"
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Provider Network Join
                </LeadModalTrigger>
              </li>
              <li>
                <Link href="/#about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/#faq-section" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Access */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3 sm:mb-4">Portal Access</h3>
            <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm text-gray-400">
              <li>
                <Link href="/corporate" className="hover:text-accent transition-colors font-medium">
                  Employer HR Portal
                </Link>
              </li>
              <li>
                <Link href="/partner" className="hover:text-accent transition-colors font-medium">
                  Wellness Partner Portal
                </Link>
              </li>
              <li>
                <Link href="/operations" className="hover:text-accent transition-colors font-medium">
                  Operations Console
                </Link>
              </li>
              <li>
                <Link href="/join" className="hover:text-accent transition-colors text-xs text-gray-400">
                  Beneficiary Pass Claim
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & legal compliance */}
        <div className="pt-6 sm:pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <p>© {currentYear} PolyFit Ltd. All rights reserved. East Africa Corporate Wellness Network.</p>
          <div className="flex items-center space-x-6">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <span className="text-gray-500">•</span>
            <span className="text-accent font-medium">RRA EBM 18% VAT Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
