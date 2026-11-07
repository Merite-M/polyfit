'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PartnerAuthFlow } from '@/components/partner/auth/PartnerAuthFlow';

function PartnerLoginContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
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
