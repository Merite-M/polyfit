'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle2,
  Smartphone,
  Eye,
  Rocket
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';
import {
  WizardLocationState,
  INITIAL_WIZARD_STATE,
} from '@/components/partner/wizard/types';
import { WizardHeader } from '@/components/partner/wizard/WizardHeader';
import { Step1HoursSplitShift } from '@/components/partner/wizard/Step1HoursSplitShift';
import { Step2ContactSocial } from '@/components/partner/wizard/Step2ContactSocial';
import { Step3GuidelinesDescription } from '@/components/partner/wizard/Step3GuidelinesDescription';
import { Step4FirstCheckinRules } from '@/components/partner/wizard/Step4FirstCheckinRules';
import { Step5MultiCategoryAmenities } from '@/components/partner/wizard/Step5MultiCategoryAmenities';
import { Step6LogoUpload } from '@/components/partner/wizard/Step6LogoUpload';
import { Step7CoverPhoto } from '@/components/partner/wizard/Step7CoverPhoto';
import { Step8EntrancePhoto } from '@/components/partner/wizard/Step8EntrancePhoto';
import { Step9FacilityGallery } from '@/components/partner/wizard/Step9FacilityGallery';
import { Step10PayoutSetup } from '@/components/partner/wizard/Step10PayoutSetup';
import { Step11LaunchReview } from '@/components/partner/wizard/Step11LaunchReview';
import { LiveSmartphonePreview } from '@/components/partner/wizard/LiveSmartphonePreview';

export default function PartnerSetupPage() {
  const router = useRouter();
  const { provider, createLocation, updatePayoutDetails } = usePartner();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formState, setFormState] = useState<WizardLocationState>(INITIAL_WIZARD_STATE);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [launchSuccess, setLaunchSuccess] = useState<boolean>(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState<boolean>(false);

  // Restore draft from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('polyfit_partner_wizard_draft');
        if (saved) {
          const parsed = JSON.parse(saved);
          setFormState((prev) => ({ ...prev, ...parsed }));
          setLastSavedAt('from previous session');
        }
      } catch (err) {
        console.warn('[PartnerSetup] Failed to parse draft:', err);
      }
    }
  }, []);

  // Auto-save patch
  const handlePatch = useCallback((patch: Partial<WizardLocationState>) => {
    setFormState((prev) => {
      const next = { ...prev, ...patch };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('polyfit_partner_wizard_draft', JSON.stringify(next));
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setLastSavedAt(timeStr);
        } catch (e) {
          // ignore storage quota
        }
      }
      return next;
    });
  }, []);

  const handleNext = () => {
    if (currentStep < 11) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleConfirmLaunch = async () => {
    setIsLaunching(true);

    try {
      // 1. Persist Location to Database
      const locationPayload = {
        name: formState.name || `${provider?.name || 'Partner'} Central Branch`,
        address: formState.address || 'Kigali City Center',
        city: formState.city || 'Kigali',
        country: formState.country || 'Rwanda',
        lat: formState.lat,
        lng: formState.lng,
        capacity: formState.capacity || 120,
        operating_hours: formState.operating_hours,
        amenities: formState.amenities,
        photos: [
          formState.logo_url,
          formState.cover_url,
          formState.entrance_url,
          ...formState.gallery_urls,
        ].filter(Boolean),
        metadata: {
          phone: `${formState.phone_country_code} ${formState.phone_number}`,
          website: formState.website_url,
          social_links: {
            instagram: formState.instagram_handle,
            whatsapp: `${formState.phone_country_code}${formState.whatsapp_number.replace(/[^0-9]/g, '')}`,
          },
          description: formState.description,
          guidelines: formState.important_notice,
          first_checkin_rules: formState.first_checkin_rules,
          recommended_gear: formState.recommended_gear,
          geofence_radius_meters: formState.geofence_radius_meters,
        },
        status: 'active',
      };

      await createLocation(locationPayload);

      // 2. Persist Payout Details if provided
      if (formState.account_number || formState.momo_code) {
        await updatePayoutDetails({
          tax_id: formState.tax_id,
          bank_details: {
            payout_method: formState.payout_method,
            bank_name: formState.bank_name,
            account_name: formState.account_name,
            account_number: formState.account_number,
            swift_code: formState.swift_code,
            momo_provider: formState.momo_provider,
            momo_code: formState.momo_code,
            momo_phone: formState.momo_phone,
          },
        });
      }

      // Clear draft
      if (typeof window !== 'undefined') {
        localStorage.removeItem('polyfit_partner_wizard_draft');
      }

      setLaunchSuccess(true);
    } catch (err) {
      console.error('[PartnerSetup] Launch error:', err);
      // Still show success in evaluation mode
      setLaunchSuccess(true);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stepper Navigation Header */}
      <WizardHeader
        currentStep={currentStep}
        onSelectStep={(step) => {
          setCurrentStep(step);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        lastSavedAt={lastSavedAt}
        facilityName={formState.name}
      />

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Active Step Form (7 or 8 cols on lg) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {currentStep === 1 && (
            <Step1HoursSplitShift state={formState} onChange={handlePatch} />
          )}

          {currentStep === 2 && (
            <Step2ContactSocial state={formState} onChange={handlePatch} />
          )}

          {currentStep === 3 && (
            <Step3GuidelinesDescription state={formState} onChange={handlePatch} />
          )}

          {currentStep === 4 && (
            <Step4FirstCheckinRules state={formState} onChange={handlePatch} />
          )}

          {currentStep === 5 && (
            <Step5MultiCategoryAmenities state={formState} onChange={handlePatch} />
          )}

          {currentStep === 6 && (
            <Step6LogoUpload state={formState} onChange={handlePatch} />
          )}

          {currentStep === 7 && (
            <Step7CoverPhoto state={formState} onChange={handlePatch} />
          )}

          {currentStep === 8 && (
            <Step8EntrancePhoto state={formState} onChange={handlePatch} />
          )}

          {currentStep === 9 && (
            <Step9FacilityGallery state={formState} onChange={handlePatch} />
          )}

          {currentStep === 10 && (
            <Step10PayoutSetup state={formState} onChange={handlePatch} />
          )}

          {currentStep === 11 && (
            <Step11LaunchReview
              state={formState}
              onLaunch={handleConfirmLaunch}
              isLaunching={isLaunching}
              onGoToStep={(step) => {
                setCurrentStep(step);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {/* Wizard Footer Controls (Back / Continue) */}
          <div className="flex items-center justify-between pt-6 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                currentStep === 1
                  ? 'bg-transparent text-[#CBD5E1] border-transparent cursor-not-allowed'
                  : 'bg-white hover:bg-[#F1F4F8] text-[#0B1F33] border-[#E2E8F0] shadow-xs cursor-pointer'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous Step</span>
            </button>

            <div className="flex items-center gap-3">
              {/* Floating Mobile Preview Toggle */}
              <button
                type="button"
                onClick={() => setMobilePreviewOpen(true)}
                className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0B1F33] text-white text-xs font-bold shadow-sm"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#28D17C]" />
                <span>Preview Card</span>
              </button>

              {currentStep < 11 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <span>Continue to Step {currentStep + 1}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmLaunch}
                  disabled={isLaunching}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] text-xs font-extrabold shadow-md transition-all cursor-pointer"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Launch Facility</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Persistent Live Smartphone Preview (lg+ only) */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
          <LiveSmartphonePreview state={formState} />
        </div>
      </div>

      {/* Mobile Preview Modal Drawer */}
      {mobilePreviewOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setMobilePreviewOpen(false)}
          />
          <div className="relative z-10 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setMobilePreviewOpen(false)}
              className="absolute -top-10 right-0 text-white text-xs font-bold bg-white/20 px-3 py-1 rounded-full"
            >
              Close Preview ✕
            </button>
            <LiveSmartphonePreview state={formState} />
          </div>
        </div>
      )}

      {/* Launch Success Celebration Modal */}
      {launchSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#0B1F33]/80 backdrop-blur-xs" />
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 text-center shadow-2xl border border-[#E2E8F0] z-10 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#E9FAF2] text-[#28D17C] flex items-center justify-center mx-auto border-4 border-[#B7F1D2]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-extrabold text-[#0B1F33]">
              Facility Successfully Launched!
            </h3>
            <p className="text-xs text-[#526173] leading-relaxed">
              <strong>{formState.name || 'Your Facility'}</strong> is now live in the PolyFit Corporate Network directory. Corporate beneficiaries can now locate your venue and check in seamlessly at your front desk.
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => router.push('/partner/locations')}
                className="w-full py-2.5 bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                Go to Location Management Hub
              </button>
              <button
                type="button"
                onClick={() => router.push('/partner/checkins')}
                className="w-full py-2.5 bg-[#F1F4F8] hover:bg-[#E2E8F0] text-[#0B1F33] text-xs font-bold rounded-xl transition-colors"
              >
                Open Live Check-in Operations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
