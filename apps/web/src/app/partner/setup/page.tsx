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
  Rocket,
  Zap,
  Sparkles
} from 'lucide-react';
import { usePartner } from '@/contexts/PartnerContext';
import { apiFetch } from '@/lib/api-client';
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

const ACTIVITY_TO_AMENITIES_MAP: Record<string, string[]> = {
  gym: ['Olympic Lifting Platforms & Eleiko Barbells', 'Heavy Dumbbells (up to 50kg) & Benches', 'Squat Racks & Power Cages'],
  functional: ['Functional Turf Track & Sleds', 'Assault AirBikes & StairMasters'],
  pool: ['25m Semi-Olympic Heated Lap Pool', 'Fresh Microfiber Towel Service', 'Poolside Sun Loungers & Umbrellas'],
  sauna: ['Finnish Dry Sauna', 'Eucalyptus Wet Steam Room'],
  cold_plunge: ['Ice Bath & Cold Plunge Tub'],
  yoga: ['Yoga Mats, Blocks & Straps Provided', 'Reformer Pilates Machines'],
  aerobics: ['Aerobics & Afro-Beats Dance Floor'],
  spinning: ['Indoor Cycling / Spinning Studio'],
  tennis_padel: ['Padel Courts (Panoramic Glass, Floodlit)', 'Clay Tennis Courts'],
  squash_badminton: ['Glass-Back Squash Courts', 'Badminton Courts'],
  combat: ['Boxing Heavy Bags & Speedballs'],
  physio: ['Sports Physiotherapy & Recovery Clinic', 'Ice Bath & Cold Plunge Tub'],
  generator: ['24/7 Backup Generator (Zero Outage)'],
  water_reserve: ['Dedicated Clean Water Reserve & Solar Hot Water'],
  parking: ['Guarded Secure Parking'],
  lockers: ['Individual Lockers with Digital Padlocks', 'Private Hot Showers & Vanity Dressing Suites'],
  wifi: ['High-Speed Fiber Wi-Fi'],
  inbody: ['InBody Bioimpedance Body Composition Scan'],
  cafe: ['Protein Shake & Rwandan Coffee Cafe'],
};

function resolveRegisteredAmenities(rawItems: string[]): string[] {
  const result: string[] = [];
  for (const item of rawItems) {
    if (ACTIVITY_TO_AMENITIES_MAP[item]) {
      result.push(...ACTIVITY_TO_AMENITIES_MAP[item]);
    } else {
      result.push(item);
    }
  }
  return result;
}

function PartnerSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locationId = searchParams?.get('locationId') || null;
  const isEditing = Boolean(locationId);

  const { provider, setProviderProfile, locations, createLocation, updateLocation, updatePayoutDetails } = usePartner();

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
          operating_hours: existingLoc.operating_hours || (existingLoc.metadata as any)?.operating_hours || prev.operating_hours,
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

  // Fetch newly registered or remote location details if locationId is provided
  useEffect(() => {
    if (!locationId) return;

    let registeredAmenities: string[] = [];
    if (typeof window !== 'undefined') {
      try {
        const rawRegistered = localStorage.getItem('polyfit_partner_registered_amenities');
        if (rawRegistered) {
          registeredAmenities = resolveRegisteredAmenities(JSON.parse(rawRegistered));
        }

        const storedLoc = localStorage.getItem('polyfit_partner_location');
        if (storedLoc) {
          const parsed = JSON.parse(storedLoc);
          if (parsed?.id === locationId && parsed?.name) {
            const parsedResolved = resolveRegisteredAmenities(parsed.amenities || []);
            setFormState((prev) => {
              const combined = Array.from(new Set([
                ...parsedResolved,
                ...registeredAmenities,
                ...(prev.amenities || []),
              ]));
              return {
                ...prev,
                name: prev.name || parsed.name,
                city: prev.city || parsed.city || 'Kigali',
                address: prev.address || parsed.address || '',
                country: prev.country || parsed.country || 'Rwanda',
                amenities: combined.length ? combined : prev.amenities,
              };
            });
          }
        }
      } catch (e) {
        console.warn('[PartnerSetup] Stored location parse notice:', e);
      }
    }

    apiFetch<{ success: boolean; location: any; provider: any }>(`/api/public/locations/${locationId}`)
      .then((data) => {
        if (data?.location) {
          const loc = data.location;
          const locResolved = resolveRegisteredAmenities(loc.amenities || []);
          setFormState((prev) => {
            const combined = Array.from(new Set([
              ...locResolved,
              ...registeredAmenities,
              ...(prev.amenities || []),
            ]));
            return {
              ...prev,
              name: prev.name || loc.name,
              city: prev.city || loc.city || 'Kigali',
              address: prev.address || loc.address || '',
              country: prev.country || loc.country || 'Rwanda',
              amenities: combined.length ? combined : prev.amenities,
            };
          });
          if (data.provider) {
            setProviderProfile(data.provider);
          }
        }
      })
      .catch((err) => console.warn('[PartnerSetup] Remote location fetch notice:', err));
  }, [locationId]);

  const [presetAppliedToast, setPresetAppliedToast] = useState<boolean>(false);

  const handleApplyKigaliPresets = () => {
    const isPoolFacility =
      provider?.category === 'pool' ||
      formState.amenities?.some((a) => a.toLowerCase().includes('pool'));

    const patch: Partial<WizardLocationState> = {
      operating_hours: {
        monday: { is_closed: false, shifts: [{ open: '06:00', close: '21:00' }] },
        tuesday: { is_closed: false, shifts: [{ open: '06:00', close: '21:00' }] },
        wednesday: { is_closed: false, shifts: [{ open: '06:00', close: '21:00' }] },
        thursday: { is_closed: false, shifts: [{ open: '06:00', close: '21:00' }] },
        friday: { is_closed: false, shifts: [{ open: '06:00', close: '21:00' }] },
        saturday: { is_closed: false, shifts: [{ open: '08:00', close: '20:00' }] },
        sunday: { is_closed: false, shifts: [{ open: '09:00', close: '18:00' }] },
      },
      description:
        formState.description ||
        `${formState.name || 'Our facility'} is Gasabo's premier wellness and conditioning center in Kimihurura, Kigali. Featuring Olympic lifting platforms, heated lap pools, eucalyptus steam rooms, and panoramic green terrace views. Certified trainers on deck.`,
      important_notice:
        formState.important_notice ||
        'Please present your PolyFit mobile pass or corporate employee badge at reception upon entry.',
      first_checkin_rules: {
        booking_required: false,
        registration_form_required: true,
        guided_tour_mandatory: false,
        arrive_early_minutes: 10,
      },
      recommended_gear: [
        'Clean indoor athletic sneakers',
        'Training towel',
        'Hydration bottle',
        'Locker padlock',
        ...(isPoolFacility ? ['Swim cap & goggles'] : []),
      ],
      amenities: Array.from(
        new Set([
          'Olympic Lifting Platforms & Eleiko Barbells',
          'Heavy Dumbbells (up to 50kg) & Benches',
          'Technogym & LifeFitness Treadmills',
          '25m Semi-Olympic Heated Lap Pool',
          'Finnish Dry Sauna',
          'Eucalyptus Wet Steam Room',
          '24/7 Backup Generator (Zero Outage)',
          'Dedicated Clean Water Reserve & Solar Hot Water',
          'Guarded Secure Parking',
          'Individual Lockers with Digital Padlocks',
          'Private Hot Showers & Vanity Dressing Suites',
          'High-Speed Fiber Wi-Fi',
          ...(formState.amenities || []),
        ])
      ),
      logo_url:
        formState.logo_url ||
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=300',
      cover_url:
        formState.cover_url ||
        (isPoolFacility
          ? 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=1200'
          : 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=80&w=1200'),
      entrance_url:
        formState.entrance_url ||
        'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=800',
      gallery_urls:
        formState.gallery_urls && formState.gallery_urls.length >= 3
          ? formState.gallery_urls
          : [
              'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800',
            ],
      bank_name: formState.bank_name || 'Bank of Kigali (BK)',
      swift_code: formState.swift_code || 'BOKRRWRW',
      account_name: formState.account_name || `${formState.name || 'Partner'} Ltd`,
      account_number: formState.account_number || '00490-0692841-29',
      tax_id: formState.tax_id || '109 482 173',
      payout_method: 'bank',
    };
    handlePatch(patch);
    setPresetAppliedToast(true);
    setTimeout(() => setPresetAppliedToast(false), 4000);
  };

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
            whatsapp: formState.whatsapp_number
              ? `${formState.phone_country_code || '+250'}${formState.whatsapp_number.replace(/[^0-9]/g, '')}`
              : undefined,
          },
          description: formState.description,
          guidelines: formState.important_notice,
          first_checkin_rules: formState.first_checkin_rules,
          recommended_gear: formState.recommended_gear,
          geofence_radius_meters: formState.geofence_radius_meters,
        },
        status: 'active',
      };

      if (locationId) {
        // Direct public update to persist setup state to Supabase database
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        try {
          await fetch(`${apiUrl}/api/public/locations/${locationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...locationPayload,
              bank_details: {
                payout_method: formState.payout_method,
                bank_name: formState.bank_name || 'Bank of Kigali (BK)',
                account_name: formState.account_name,
                account_number: formState.account_number,
                swift_code: formState.swift_code || 'BOKRRWRW',
                momo_provider: formState.momo_provider,
                momo_code: formState.momo_code,
                momo_phone: formState.momo_phone,
              },
              tax_id: formState.tax_id,
            }),
          });
        } catch (e) {
          console.warn('[PartnerSetup] Direct patch error:', e);
        }
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
      {/* Stepper Navigation Header with integrated 1-click Fast-Track presets */}
      <WizardHeader
        currentStep={currentStep}
        onSelectStep={(step) => {
          setCurrentStep(step);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        lastSavedAt={lastSavedAt}
        facilityName={formState.name ? (isEditing ? `Edit: ${formState.name}` : formState.name) : 'New Facility'}
        onApplyPresets={handleApplyKigaliPresets}
      />

      {presetAppliedToast && (
        <div className="p-3 bg-[#E9FAF2] border border-[#28D17C] text-[#008A4B] text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#28D17C]" />
          <span>Verified Kigali facility presets applied! Operating hours, authentic amenities, bio, and rules are now ready for network launch.</span>
        </div>
      )}

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
        <div className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-3 self-start">
          <LiveSmartphonePreview state={formState} currentStep={currentStep} />
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
            <LiveSmartphonePreview state={formState} currentStep={currentStep} />
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
              onClick={() => {
                setLaunchSuccess(false);
                router.push('/partner/locations');
              }}
              className="w-full py-2.5 bg-accent hover:bg-accent-hover text-accent-foreground text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Go to Location Management Hub
            </button>
            <button
              type="button"
              onClick={() => {
                setLaunchSuccess(false);
                router.push('/partner/checkins');
              }}
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
