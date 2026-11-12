'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PartnerAuthFlow } from '@/components/partner/auth/PartnerAuthFlow';

function PartnerLoginContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1F33] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-x-hidden selection:bg-[#28D17C]/20 selection:text-[#0B1F33]">
      {/* Ambient Longevity & Wellness Glow */}
      <div className="absolute top-0 inset-x-0 h-96 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(40,209,124,0.12),rgba(0,210,180,0.05)_50%,transparent_80%)] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <PartnerAuthFlow
          initialMode={token ? 'activate' : 'lookup'}
          initialEmail={email}
          initialToken={token}
        />
      </div>
    </div>
  );
}

export default function PartnerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#28D17C] border-t-transparent animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Loading Partner Portal...</p>
          </div>
        </div>
      }
    >
      <PartnerLoginContent />
    </Suspense>
  );
}
