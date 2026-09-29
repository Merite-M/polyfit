'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PartnerRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/partner/checkins');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#28D17C] border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-[#526173]">Loading Partner Operations...</p>
      </div>
    </div>
  );
}
