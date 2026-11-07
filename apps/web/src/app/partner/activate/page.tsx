'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PartnerAuthFlow } from '@/components/partner/auth/PartnerAuthFlow';

function PartnerActivateContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <PartnerAuthFlow
          initialMode="activate"
          initialToken={token}
          initialEmail={email}
        />
      </div>
    </div>
  );
}

export default function PartnerActivatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#28D17C] border-t-transparent animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Verifying Partner Invitation...</p>
          </div>
        </div>
      }
    >
      <PartnerActivateContent />
    </Suspense>
  );
}
