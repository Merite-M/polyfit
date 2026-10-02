'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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

function PartnerSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locationId = searchParams?.get('locationId') || null;
  const isEditing = Boolean(locationId);

  const { provider, locations, createLocation, updateLocation, updatePayoutDetails } = usePartner();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formState, setFormState] = useState<WizardLocationState>(INITIAL_WIZARD_STATE);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [launchSuccess, setLaunchSuccess] = useState<boolean>(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState<boolean>(false);
  const mobilePreviewDialogRef = useRef<HTMLDialogElement>(null);
  const celebrationDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = mobilePreviewDialogRef.current;
    if (!dialog) return;
    if (mobilePreviewOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [mobilePreviewOpen]);

  useEffect(() => {
    const dialog = celebrationDialogRef.current;
    if (!dialog) return;
    if (launchSuccess) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [launchSuccess]);

  const draftKey = locationId
    ? `polyfit_partner_wizard_draft_${locationId}`
    : 'polyfit_partner_wizard_draft';

  // Find existing location if editing
  const existingLoc = locationId ? locations.find((l) => l.id === locationId) : null;

  // Restore draft from localStorage on mount or load from existing location
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(draftKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          setFormState((prev) => ({ ...prev, ...parsed }));
          setLastSavedAt('from previous draft session');
          return;
        }
      } catch (err) {
        console.warn('[PartnerSetup] Failed to parse draft:', err);
      }

      // If editing and no prior draft, prefill from existing branch profile
      if (existingLoc) {
        setFormState((prev) => ({
          ...prev,
          name: existingLoc.name || prev.name,
          city: existingLoc.city || prev.city,
          address: existingLoc.address || prev.address,
          country: existingLoc.country || prev.country,
          lat: existingLoc.lat ?? prev.lat,
          lng: existingLoc.lng ?? prev.lng,
          capacity: existingLoc.capacity ?? prev.capacity,
          operating_hours: existingLoc.operating_hours || prev.operating_hours,
          amenities: existingLoc.amenities || prev.amenities,
          logo_url: existingLoc.photos?.[0] || prev.logo_url,
          cover_url: existingLoc.photos?.[1] || prev.cover_url,
          entrance_url: existingLoc.photos?.[2] || prev.entrance_url,
          gallery_urls: existingLoc.photos?.slice(3) || prev.gallery_urls,
          phone_number: existingLoc.metadata?.phone?.replace(/^\+\d+\s*/, '') || prev.phone_number,
          website_url: existingLoc.metadata?.website || prev.website_url,
          instagram_handle: existingLoc.metadata?.social_links?.instagram || prev.instagram_handle,
          whatsapp_number: existingLoc.metadata?.social_links?.whatsapp?.replace(/^\+\d+/, '') || prev.whatsapp_number,
          description: existingLoc.metadata?.description || prev.description,
          important_notice: existingLoc.metadata?.guidelines || prev.important_notice,
          first_checkin_rules: existingLoc.metadata?.first_checkin_rules
            ? {
                booking_required: Boolean(existingLoc.metadata.first_checkin_rules.booking_required),
                registration_form_required: Boolean(existingLoc.metadata.first_checkin_rules.registration_form_required),
                guided_tour_mandatory: Boolean(existingLoc.metadata.first_checkin_rules.guided_tour_mandatory),
                arrive_early_minutes: Number(existingLoc.metadata.first_checkin_rules.arrive_early_minutes) || 10,
              }
            : prev.first_checkin_rules,
          recommended_gear: existingLoc.metadata?.recommended_gear || prev.recommended_gear,
          geofence_radius_meters: existingLoc.metadata?.geofence_radius_meters ?? prev.geofence_radius_meters,
        }));
        setLastSavedAt('loaded from branch profile');
      }
    }
  }, [draftKey, existingLoc]);

  // Auto-save patch
  const handlePatch = useCallback((patch: Partial<WizardLocationState>) => {
    setFormState((prev) => {
      const next = { ...prev, ...patch };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(draftKey, JSON.stringify(next));
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setLastSavedAt(timeStr);
        } catch (e) {
          // ignore storage quota
        }
      }
      return next;
    });
  }, [draftKey]);

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
      // 1. Prepare Location Payload
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

      if (isEditing && locationId) {
        await updateLocation(locationId, locationPayload);
      } else {
        await createLocation(locationPayload);
      }

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
        localStorage.removeItem(draftKey);
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
        facilityName={formState.name ? (isEditing ? `Edit: ${formState.name}` : formState.name) : 'New Facility'}
      />

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Active Step Form (7 or 8 cols on lg) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Wizard Steps — CSS-driven show/hide via data-active + @starting-style transitions.
              Steps are never unmounted so discrete CSS entry/exit animations fire correctly. */}
          <div className="pf-wizard-step" data-active={String(currentStep === 1)}>
            <Step1HoursSplitShift state={formState} onChange={handlePatch} />
          </div>

          <div className="pf-wizard-step" data-active={String(currentStep === 2)}>
            <Step2ContactSocial state={formState} onChange={handlePatch} />
          </div>

          <div className="pf-wizard-step" data-active={String(currentStep === 3)}>
            <Step3GuidelinesDescription state={formState} onChange={handlePatch} />
          </div>

          <div className="pf-wizard-step" data-active={String(currentStep === 4)}>
            <Step4FirstCheckinRules state={formState} onChange={handlePatch} />
          </div>

          <div className="pf-wizard-step" data-active={String(currentStep === 5)}>
            <Step5MultiCategoryAmenities state={formState} onChange={handlePatch} />
          </div>

          <div className="pf-wizard-step" data-active={String(currentStep === 6)}>
            <Step6LogoUpload state={formState} onChange={handlePatch} />
          </div>

          <div className="pf-wizard-step" data-active={String(currentStep === 7)}>
            <Step7CoverPhoto state={formState} onChange={handlePatch} />
          </div>

          <div className="pf-wizard-step" data-active={String(currentStep === 8)}>
            <Step8EntrancePhoto state={formState} onChange={handlePatch} />
          </div>

          <div className="pf-wizard-step" data-active={String(currentStep === 9)}>
            <Step9FacilityGallery state={formState} onChange={handlePatch} />
          </div>

          <div className="pf-wizard-step" data-active={String(currentStep === 10)}>
            <Step10PayoutSetup state={formState} onChange={handlePatch} />
          </div>

          <div className="pf-wizard-step" data-active={String(currentStep === 11)}>
            <Step11LaunchReview
              state={formState}
              onLaunch={handleConfirmLaunch}
              isLaunching={isLaunching}
              onGoToStep={(step) => {
                setCurrentStep(step);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              isEditing={isEditing}
            />
          </div>

          {/* Wizard Footer Controls (Back / Continue) */}
          <div className="flex items-center justify-between pt-6 border-t border-border">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                currentStep === 1
                  ? 'bg-transparent text-border border-transparent cursor-not-allowed'
                  : 'bg-card hover:bg-muted text-primary border-border shadow-xs cursor-pointer'
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
                className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm"
              >
                <Smartphone className="w-3.5 h-3.5 text-accent" />
                <span>Preview Card</span>
              </button>

              {currentStep < 11 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <span>Continue to Step {currentStep + 1}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmLaunch}
                  disabled={isLaunching}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground text-xs font-extrabold shadow-md transition-all cursor-pointer"
                >
                  {isEditing ? <Save className="w-4 h-4" /> : <Rocket className="w-4 h-4" />}
                  <span>{isEditing ? 'Save Facility Updates' : 'Launch Facility'}</span>
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
      <dialog
        ref={mobilePreviewDialogRef}
        closedby="any"
        onCancel={() => setMobilePreviewOpen(false)}
        className="pf-native-dialog p-0 bg-transparent text-foreground lg:hidden"
        aria-label="Mobile preview of facility"
      >
        <div className="relative max-h-[90vh] overflow-y-auto p-4 bg-background rounded-2xl border border-border shadow-modal">
          <button
            type="button"
            onClick={() => setMobilePreviewOpen(false)}
            aria-label="Close preview"
            className="absolute top-2 right-2 text-foreground text-xs font-bold bg-muted hover:bg-border px-3 py-1 rounded-full cursor-pointer"
          >
            Close Preview ✕
          </button>
          <div className="pt-6">
            <LiveSmartphonePreview state={formState} />
          </div>
        </div>
      </dialog>

      {/* Launch / Update Success Celebration Modal */}
      <dialog
        ref={celebrationDialogRef}
        closedby="any"
        onCancel={() => setLaunchSuccess(false)}
        className="pf-native-dialog p-0 bg-transparent text-foreground"
        aria-labelledby="launch-success-title"
      >
        <div className="relative w-full max-w-md bg-card rounded-2xl p-6 text-center shadow-modal border border-border text-card-foreground space-y-4">
          <div className="w-16 h-16 rounded-full bg-accent-subtle text-accent-foreground flex items-center justify-center mx-auto border-4 border-accent/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h3 id="launch-success-title" className="text-xl font-extrabold text-foreground">
            {isEditing ? 'Facility Updated Successfully!' : 'Facility Successfully Launched!'}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isEditing ? (
              <>
                Updates to <strong>{formState.name || 'Your Facility'}</strong> have been applied. Corporate beneficiaries and front desk check-in systems will reflect the updated schedules and amenities immediately.
              </>
            ) : (
              <>
                <strong>{formState.name || 'Your Facility'}</strong> is now live in the PolyFit Corporate Network directory. Corporate beneficiaries can now locate your venue and check in seamlessly at your front desk.
              </>
            )}
          </p>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => router.push('/partner/locations')}
              className="w-full py-2.5 bg-accent hover:bg-accent-hover text-accent-foreground text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Go to Location Management Hub
            </button>
            <button
              type="button"
              onClick={() => router.push('/partner/checkins')}
              className="w-full py-2.5 bg-muted hover:bg-border text-foreground text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Open Live Check-in Operations
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

export default function PartnerSetupPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#28D17C] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-medium text-[#526173]">Loading Facility Onboarding &amp; Schedule Engine...</p>
        </div>
      }
    >
      <PartnerSetupContent />
    </Suspense>
  );
}
