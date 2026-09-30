'use client';

import React from 'react';
import Link from 'next/link';
import {
  CreditCard,
  BarChart3,
  Building2,
  Cpu,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';

interface OperationalActionCardsProps {
  onOpenPayoutModal: () => void;
}

export function OperationalActionCards({ onOpenPayoutModal }: OperationalActionCardsProps) {
  const { provider, dashboardData, locations } = usePartner();

  const isPayoutConfigured = dashboardData?.provider?.is_payout_configured ?? false;
  const bankMethod = provider?.bank_details?.payout_method === 'momo' ? 'MTN / Airtel MoMo' : 'Bank Account (BK)';

  const actionCards = [
    {
      id: 'payout',
      title: 'Bank & MoMo Account',
      description: isPayoutConfigured
        ? `Configured via ${bankMethod}. Guaranteeing monthly disbursements.`
        : 'Connect bank account or MoMo code to receive disbursements on the 15th.',
      icon: CreditCard,
      iconColor: 'text-[#28D17C]',
      iconBg: 'bg-[#28D17C]/15',
      badge: isPayoutConfigured ? 'Connected' : 'Action Needed',
      badgeType: isPayoutConfigured ? 'success' : 'warning',
      actionType: 'modal',
      actionLabel: isPayoutConfigured ? 'Update Account' : 'Set Up Payout',
      onClick: onOpenPayoutModal
    },
    {
      id: 'reports',
      title: 'Reports & Audit Suite',
      description: 'Wellhub 4-tab reporting: payment per visitor, check-in audit log, and RRA EBM settlement statements.',
      icon: BarChart3,
      iconColor: 'text-[#3B82F6]',
      iconBg: 'bg-[#3B82F6]/15',
      badge: '4-Tab Audit',
      badgeType: 'neutral',
      actionType: 'link',
      href: '/partner/reports',
      actionLabel: 'Open Reports Suite'
    },
    {
      id: 'premises',
      title: 'Premises & Activities',
      description: `Configure ${locations.length} branch hours, photos, amenities, split-shifts, and arrival guidelines.`,
      icon: Building2,
      iconColor: 'text-[#8B5CF6]',
      iconBg: 'bg-[#8B5CF6]/15',
      badge: `${locations.length} Branches`,
      badgeType: 'neutral',
      actionType: 'link',
      href: '/partner/locations',
      actionLabel: 'Manage Branches'
    },
    {
      id: 'integrations',
      title: 'Turnstile & Scanner IoT',
      description: 'Manage counter kiosk cameras, cloud relays, webhooks, and IoT turnstile credentials.',
      icon: Cpu,
      iconColor: 'text-[#06B6D4]',
      iconBg: 'bg-[#06B6D4]/15',
      badge: 'Relay Live',
      badgeType: 'success',
      actionType: 'link',
      href: '/partner/locations',
      actionLabel: 'Configure IoT'
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[#8491A3] uppercase tracking-wider">
          Primary Operational Modules
        </h3>
        <span className="text-[11px] text-[#526173]">Direct portal shortcuts</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actionCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.id}
              className="bg-white rounded-2xl border border-[#E2E8F0] p-4.5 flex flex-col justify-between hover:border-[#CBD5E1] hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      card.badgeType === 'success'
                        ? 'bg-[#E9FAF2] text-[#008A4B] border border-[#B7F1D2]'
                        : card.badgeType === 'warning'
                        ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                        : 'bg-[#F1F4F8] text-[#526173] border border-[#E2E8F0]'
                    }`}
                  >
                    {card.badge}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-[#0B1F33] group-hover:text-[#28D17C] transition-colors">
                  {card.title}
                </h4>

                <p className="text-xs text-[#526173] mt-1.5 line-clamp-2 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="mt-4 pt-3.5 border-t border-[#F1F4F8]">
                {card.actionType === 'modal' ? (
                  <button
                    onClick={card.onClick}
                    className="w-full inline-flex items-center justify-between text-xs font-bold text-[#0B1F33] hover:text-[#008A4B] transition-colors py-1"
                  >
                    <span>{card.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#8491A3] group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ) : (
                  <Link
                    href={card.href || '#'}
                    className="w-full inline-flex items-center justify-between text-xs font-bold text-[#0B1F33] hover:text-[#008A4B] transition-colors py-1"
                  >
                    <span>{card.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#8491A3] group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
