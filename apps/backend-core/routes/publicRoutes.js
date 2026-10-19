const express = require('express');
const { supabase } = require('@polyfit/supabase-client');
const { rateLimit } = require('express-rate-limit');

const router = express.Router();

// Strict anti-spam rate limiter for public lead forms (10 submissions per IP per hour in production)
const leadFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: process.env.NODE_ENV === 'test' ? 10000 : 10,
  skip: () => process.env.NODE_ENV === 'test',
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many submissions from this connection. Please try again later.', code: 'RATE_LIMIT_EXCEEDED' }
});

/**
 * POST /api/public/demo
 * PF-88: Inbound Demo Request & Corporate Lead Capture
 */
router.post('/demo', leadFormLimiter, async (req, res) => {
  try {
    const {
      company_name,
      contact_name,
      work_email,
      phone,
      country = 'Rwanda',
      company_size,
      message,
      interest_tier = 'Professional',
      source = 'website_demo',
      website_url_hp // Anti-spam honeypot
    } = req.body;

    // 1. Anti-spam honeypot detection
    if (website_url_hp) {
      // Silently return success to discard bot submissions without giving feedback
      return res.status(200).json({
        success: true,
        message: "We'll be in touch within 24 hours."
      });
    }

    // 2. Field validation
    if (!company_name || !company_name.trim()) {
      return res.status(400).json({ error: 'Company name is required', code: 'VALIDATION_ERROR' });
    }
    if (!contact_name || !contact_name.trim()) {
      return res.status(400).json({ error: 'Contact name is required', code: 'VALIDATION_ERROR' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!work_email || !emailRegex.test(work_email.trim())) {
      return res.status(400).json({ error: 'A valid work email is required', code: 'VALIDATION_ERROR' });
    }
    const digitsOnly = (phone || '').replace(/\D/g, '');
    if (!phone || digitsOnly.length < 8) {
      return res.status(400).json({ error: 'A valid phone number is required (at least 8 digits)', code: 'VALIDATION_ERROR' });
    }
    if (!company_size) {
      return res.status(400).json({ error: 'Company size range is required', code: 'VALIDATION_ERROR' });
    }

    // 3. Store lead in Supabase demo_requests table
    if (!supabase) {
      throw new Error('Database service unavailable');
    }

    const { data, error } = await supabase
      .from('demo_requests')
      .insert({
        company_name: company_name.trim(),
        contact_name: contact_name.trim(),
        work_email: work_email.trim().toLowerCase(),
        phone: phone.trim(),
        country: country.trim(),
        company_size: company_size.trim(),
        message: message ? message.trim() : null,
        interest_tier: interest_tier.trim(),
        source: source.trim(),
        status: 'pending'
      })
      .select('id, created_at')
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({
      success: true,
      message: "We'll be in touch within 24 hours with an itemized network proposal.",
      id: data.id,
      created_at: data.created_at
    });
  } catch (error) {
    console.error('[PublicDemo] Error submitting demo request:', error);
    return res.status(500).json({
      error: error.message || 'Failed to submit demo request',
      code: 'SUBMISSION_FAILED'
    });
  }
});

/**
 * POST /api/public/lead
 * Compatibility endpoint for legacy lead-forms widget
 */
router.post('/lead', leadFormLimiter, async (req, res) => {
  try {
    const { type, name, organization, email, phone, employees, message, business, location, website_url_hp } = req.body;

    if (website_url_hp) {
      return res.status(200).json({ success: true });
    }

    if (!supabase) {
      throw new Error('Database service unavailable');
    }

    if (type === 'employer') {
      const { data, error } = await supabase
        .from('demo_requests')
        .insert({
          company_name: organization || name,
          contact_name: name,
          work_email: (email || '').toLowerCase(),
          phone: phone || '',
          country: 'Rwanda',
          company_size: employees || '10-50',
          message: message || null,
          source: 'landing_modal_employer',
          status: 'pending'
        })
        .select('id')
        .single();

      if (error) throw error;
      return res.status(201).json({ success: true, id: data.id });
    }

    // Provider acquisition inquiry (PF-88 supply-side lead capture)
    const providerLocationInfo = location ? ` [Location: ${location}]` : '';
    const { data: provData, error: provError } = await supabase
      .from('demo_requests')
      .insert({
        company_name: business || organization || name || 'Wellness Provider Facility',
        contact_name: name,
        work_email: (email || '').toLowerCase(),
        phone: phone || '',
        country: 'Rwanda',
        company_size: req.body.locations ? `${req.body.locations} location(s)` : '1 location',
        interest_tier: 'Provider Network Onboarding',
        message: `${message || 'Provider partner inquiry'}${providerLocationInfo}`,
        source: 'landing_modal_provider',
        status: 'pending'
      })
      .select('id')
      .single();

    if (provError) throw provError;

    return res.status(201).json({
      success: true,
      id: provData.id,
      message: "Provider inquiry received. Our network onboarding team will reach out within 24 hours."
    });
  } catch (error) {
    console.error('[PublicLead] Error submitting lead:', error);
    return res.status(500).json({ error: error.message || 'Failed to submit lead', code: 'SUBMISSION_FAILED' });
  }
});

/**
 * GET /api/public/organizations/:slug
 * Retrieve public corporate profile, allowed domains, and default benefit plan
 */
router.get('/organizations/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({ error: 'Organization slug is required', code: 'SLUG_REQUIRED' });
    }

    if (!supabase) {
      return res.status(503).json({ error: 'Database service unavailable', code: 'SERVICE_UNAVAILABLE' });
    }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug, allowed_domains, industry, logo_url')
      .eq('slug', slug.toLowerCase().trim())
      .maybeSingle();

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found', code: 'ORG_NOT_FOUND' });
    }

    // Fetch active default/standard benefit plan
    const { data: benefits } = await supabase
      .from('benefits')
      .select('id, name, tier, max_monthly_visits, co_pay_percentage, allowed_provider_categories')
      .eq('org_id', org.id)
      .eq('status', 'active')
      .order('max_monthly_visits', { ascending: false });

    const defaultPlan = (benefits && benefits.find(b => b.tier === 'standard')) || (benefits && benefits[0]) || {
      name: 'Standard Corporate Wellness Plan',
      tier: 'standard',
      max_monthly_visits: 8,
      co_pay_percentage: 15,
      allowed_provider_categories: ['gym', 'pool', 'studio']
    };

    return res.status(200).json({
      organization: org,
      defaultPlan,
      plans: benefits || []
    });
  } catch (error) {
    console.error('[publicRoutes/getOrg] Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to retrieve organization', code: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /api/public/organizations/:slug/join
 * Self-service corporate employee pass activation with domain restriction
 */
router.post('/organizations/:slug/join', leadFormLimiter, async (req, res) => {
  try {
    const { slug } = req.params;
    const { full_name, email, employee_id_external, department } = req.body;

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ error: 'Full name is required', code: 'VALIDATION_ERROR' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'A valid work email is required', code: 'VALIDATION_ERROR' });
    }

    if (!supabase) {
      return res.status(503).json({ error: 'Database service unavailable', code: 'SERVICE_UNAVAILABLE' });
    }

    // 1. Verify organization exists
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug, allowed_domains')
      .eq('slug', slug.toLowerCase().trim())
      .maybeSingle();

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found', code: 'ORG_NOT_FOUND' });
    }

    // 2. Validate corporate domain if configured
    const cleanEmail = email.trim().toLowerCase();
    const emailDomain = cleanEmail.split('@')[1];
    if (org.allowed_domains && org.allowed_domains.length > 0) {
      const isAllowed = org.allowed_domains.some((d) => d.toLowerCase() === emailDomain);
      if (!isAllowed) {
        return res.status(400).json({
          error: `Email domain @${emailDomain} is not authorized. Must use official company email (@${org.allowed_domains.join(', @')}).`,
          code: 'UNAUTHORIZED_DOMAIN'
        });
      }
    }

    // 3. Find default/standard benefit plan
    const { data: benefits } = await supabase
      .from('benefits')
      .select('id, name, tier, max_monthly_visits, co_pay_percentage, allowed_provider_categories')
      .eq('org_id', org.id)
      .eq('status', 'active')
      .order('max_monthly_visits', { ascending: false });

    const defaultPlan = (benefits && benefits.find(b => b.tier === 'standard')) || (benefits && benefits[0]);
    const planTier = defaultPlan ? defaultPlan.tier : 'standard';

    // 4. Check if employee already exists by email OR by staff ID
    const cleanStaffId = employee_id_external && typeof employee_id_external === 'string' ? employee_id_external.trim() : null;
    let existingEmp = null;

    if (cleanStaffId) {
      const { data: matchedEmp } = await supabase
        .from('employees')
        .select('*')
        .eq('org_id', org.id)
        .or(`email.eq.${cleanEmail},employee_id_external.ilike.${cleanStaffId}`)
        .maybeSingle();
      existingEmp = matchedEmp;
    } else {
      const { data: matchedEmp } = await supabase
        .from('employees')
        .select('*')
        .eq('org_id', org.id)
        .eq('email', cleanEmail)
        .maybeSingle();
      existingEmp = matchedEmp;
    }

    const wasAlreadyEnrolled = !!(existingEmp && existingEmp.status === 'active');
    let employee = existingEmp;

    if (!employee) {
      const { data: newEmp, error: insertError } = await supabase
        .from('employees')
        .insert({
          org_id: org.id,
          full_name: full_name.trim(),
          email: cleanEmail,
          employee_id_external: cleanStaffId,
          department: department ? department.trim() : 'General',
          tier: planTier,
          status: 'active'
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }
      employee = newEmp;
    } else {
      // If inactive or if external staff ID was provided and missing in profile, update it
      const updates = {};
      if (employee.status !== 'active') {
        updates.status = 'active';
      }
      if (!employee.employee_id_external && cleanStaffId) {
        updates.employee_id_external = cleanStaffId;
      }

      if (Object.keys(updates).length > 0) {
        const { data: updatedEmp, error: updateError } = await supabase
          .from('employees')
          .update(updates)
          .eq('id', employee.id)
          .select()
          .single();
        if (!updateError && updatedEmp) {
          employee = updatedEmp;
        }
      }
    }

    // 5. Ensure active eligibility record
    if (defaultPlan) {
      await supabase
        .from('eligibility')
        .upsert(
          {
            employee_id: employee.id,
            benefit_id: defaultPlan.id,
            status: 'active',
            activated_at: new Date().toISOString()
          },
          { onConflict: 'employee_id,benefit_id' }
        );
    }

    // 6. Generate Mobile Pass Activation Token / Code for smartphone app linking
    const activationCode = (
      employee.employee_id_external ||
      cleanStaffId ||
      `PF-${employee.id.replace(/-/g, '').substring(0, 6).toUpperCase()}`
    );

    return res.status(200).json({
      success: true,
      is_already_enrolled: wasAlreadyEnrolled,
      activation_code: activationCode,
      message: wasAlreadyEnrolled
        ? `You are already enrolled with ${org.name}! Your wellness pass is ready for use on the PolyFit Mobile App.`
        : `Wellness pass activated for ${org.name}`,
      employee: {
        id: employee.id,
        full_name: employee.full_name,
        email: employee.email,
        employee_id_external: employee.employee_id_external || cleanStaffId,
        department: employee.department,
        tier: employee.tier,
        status: employee.status
      },
      plan: defaultPlan || {
        name: 'Standard Corporate Wellness Plan',
        tier: 'standard',
        max_monthly_visits: 8,
        co_pay_percentage: 15
      },
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug
      }
    });
  } catch (error) {
    console.error('[publicRoutes/join] Error activating employee pass:', error);
    return res.status(500).json({
      error: error.message || 'Failed to activate employee pass',
      code: 'JOIN_FAILED'
    });
  }
});

/**
 * GET /api/public/platform-config
 * Unified live platform settings, verified network statistics, and corporate pricing plans.
 * Single source of truth for Marketing Website, Corporate Portal, and Operations.
 */
router.get('/platform-config', async (req, res) => {
  try {
    let settingsMap = {
      anti_passback_window_minutes: 180,
      geofence_radius_meters: 200,
      totp_step_seconds: 60,
      max_device_resets_monthly: 2,
      platform_fee_percentage: 15
    };

    let networkCounts = {
      providers_count: 91,
      locations_count: 180,
      organizations_count: 29,
      verified_visits_count: 1420
    };

    if (supabase) {
      try {
        const { data: dbSettings } = await supabase
          .from('platform_settings')
          .select('key, value');
        if (Array.isArray(dbSettings)) {
          dbSettings.forEach((s) => {
            if (s && s.key) {
              settingsMap[s.key] = typeof s.value === 'string' && !isNaN(Number(s.value))
                ? Number(s.value)
                : s.value;
            }
          });
        }

        const [provRes, locRes, orgRes, visRes] = await Promise.allSettled([
          supabase.from('providers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('provider_locations').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('visits').select('id', { count: 'exact', head: true }).eq('status', 'verified'),
        ]);

        if (provRes.status === 'fulfilled' && typeof provRes.value.count === 'number' && provRes.value.count > 0) {
          networkCounts.providers_count = provRes.value.count;
        }
        if (locRes.status === 'fulfilled' && typeof locRes.value.count === 'number' && locRes.value.count > 0) {
          networkCounts.locations_count = locRes.value.count;
        }
        if (orgRes.status === 'fulfilled' && typeof orgRes.value.count === 'number' && orgRes.value.count > 0) {
          networkCounts.organizations_count = orgRes.value.count;
        }
        if (visRes.status === 'fulfilled' && typeof visRes.value.count === 'number' && visRes.value.count > 0) {
          networkCounts.verified_visits_count = visRes.value.count;
        }
      } catch (err) {
        console.warn('[PublicConfig] Error fetching live DB counts, using canonical defaults:', err.message);
      }
    }

    let pricingTiers = [];

    if (supabase) {
      try {
        const { data: dbPlans } = await supabase
          .from('master_plans')
          .select('*')
          .eq('status', 'active')
          .eq('is_exclusive', false)
          .order('max_monthly_visits', { ascending: true });

        if (Array.isArray(dbPlans) && dbPlans.length > 0) {
          pricingTiers = dbPlans.map((p) => ({
            id: p.tier,
            tier: p.tier,
            name: p.name,
            badge: p.badge || (p.tier === 'premium' ? 'Most Popular' : p.tier === 'executive' ? 'All Access' : p.tier === 'starter' ? 'Growing Teams' : 'Essential'),
            description: p.description,
            target: p.target_audience || `${p.max_monthly_visits} visits / month`,
            visits: p.max_monthly_visits,
            pricing: {
              RWF: {
                monthly: Number(p.monthly_price_rwf),
                annual: Number(p.annual_price_rwf),
                period: '/ employee / mo'
              },
              USD: {
                monthly: Number(p.monthly_price_usd),
                annual: Number(p.annual_price_usd),
                period: '/ employee / mo'
              }
            },
            popular: Boolean(p.is_popular),
            ctaText: p.tier === 'executive' ? 'Contact Executive Sales' : `Start ${p.name}`,
            ctaVariant: p.is_popular ? 'primary' : 'secondary',
            features: Array.isArray(p.features) && p.features.length > 0 ? p.features : [
              `${p.max_monthly_visits} verified visits per month`,
              `Access to ${p.tier === 'basic' ? '30+' : p.tier === 'starter' ? '50+' : p.tier === 'premium' ? '80+' : 'all'} network facilities`,
              'Single consolidated RRA EBM 18% VAT invoice',
              'Dynamic anti-passback mobile passes',
              'Aggregated utilization analytics & reporting',
              'Corporate concierge support'
            ],
            notIncluded: Array.isArray(p.not_included) ? p.not_included : []
          }));
        }
      } catch (err) {
        console.warn('[PublicConfig] Error fetching live master_plans, using canonical fallbacks:', err.message);
      }
    }

    if (pricingTiers.length === 0) {
      pricingTiers = [
        {
          id: 'basic',
          tier: 'basic',
          name: 'Basic',
          badge: 'Essential',
          description: 'Essential corporate fitness benefit covering verified partner facilities and wellness centers.',
          target: 'Field staff & shift teams',
          visits: 4,
          pricing: {
            RWF: { monthly: 10000, annual: 8500, period: '/ employee / mo' },
            USD: { monthly: 8, annual: 7, period: '/ employee / mo' }
          },
          popular: false,
          ctaText: 'Start Basic Plan',
          ctaVariant: 'secondary',
          features: [
            '4 verified visits per month',
            'Access to 30+ vetted wellness providers & facilities',
            'Consolidated monthly RRA EBM 18% VAT invoice',
            'Dynamic anti-passback mobile web passes',
            'Monthly aggregated utilization report (PDF/CSV)',
            'Standard employee roster upload (CSV)',
            'Standard email support (24h SLA)'
          ],
          notIncluded: [
            'Olympic pools & aquatic access',
            'Yoga & Reformer Pilates studios',
            'Thermal spas & clinical physiotherapy',
            'Dedicated wellness concierge'
          ]
        },
        {
          id: 'starter',
          tier: 'starter',
          name: 'Starter',
          badge: 'Growing Teams',
          description: 'Active lifestyle plan combining fitness facilities and Olympic lap swimming pools across Kigali and East Africa.',
          target: 'Up to 50 employees',
          visits: 8,
          pricing: {
            RWF: { monthly: 18000, annual: 15300, period: '/ employee / mo' },
            USD: { monthly: 14, annual: 12, period: '/ employee / mo' }
          },
          popular: false,
          ctaText: 'Start Starter Plan',
          ctaVariant: 'secondary',
          features: [
            '8 verified visits per month',
            'Access to 50+ network facilities & Olympic lap pools',
            'Single consolidated RRA EBM monthly invoice',
            'Dual check-in modality (turnstile QR & desk plaque)',
            'Live department utilization telemetry',
            'Standard employee roster upload (CSV)',
            'Priority support (12h SLA)'
          ],
          notIncluded: [
            'Yoga & Reformer Pilates studios',
            'Thermal spas & clinical physiotherapy',
            'Dedicated wellness concierge'
          ]
        },
        {
          id: 'premium',
          tier: 'premium',
          name: 'Premium',
          badge: 'Most Popular',
          description: 'Comprehensive multi-category package covering fitness facilities, Olympic pools, hot yoga, and reformer pilates studios.',
          target: '50 to 500 employees',
          visits: 12,
          pricing: {
            RWF: { monthly: 32000, annual: 27200, period: '/ employee / mo' },
            USD: { monthly: 24, annual: 20, period: '/ employee / mo' }
          },
          popular: true,
          ctaText: 'Request Premium Pilot',
          ctaVariant: 'primary',
          features: [
            '12 verified visits per month',
            'Full Multi-Category Network (80+ venues)',
            'Fitness Facilities, Olympic Pools, Yoga, Pilates & Studios',
            'Automated RRA EBM 18% VAT compliant invoicing',
            'Instant Anti-Passback biometric & geo lock',
            'Live check-in telemetry & department heatmaps',
            'Bulk CSV & automated employee onboarding',
            'Priority support via WhatsApp & Email (4h SLA)',
            'Quarterly corporate wellness impact review'
          ],
          notIncluded: [
            'Thermal spas & clinical physiotherapy'
          ]
        },
        {
          id: 'executive',
          tier: 'executive',
          name: 'Executive',
          badge: 'All Access',
          description: 'All-inclusive executive benefit with unrestricted access to fitness clubs, luxury pools, boutique studios, thermal spas, and physiotherapy.',
          target: 'Leadership & VIP cohorts',
          visits: 16,
          pricing: {
            RWF: { monthly: 50000, annual: 42500, period: '/ employee / mo' },
            USD: { monthly: 38, annual: 32, period: '/ employee / mo' }
          },
          popular: false,
          ctaText: 'Contact Executive Sales',
          ctaVariant: 'secondary',
          features: [
            '16 verified visits per month',
            'Unrestricted all-category access across entire network',
            'Fitness Facilities, Olympic Pools, Reformer Pilates, Physio Clinics & Spas',
            'Zero employee co-pay (100% employer sponsored)',
            'Dedicated PolyFit VIP wellness concierge',
            'Custom corporate health challenges & executive reviews',
            'Direct HRIS integration & automated webhook sync',
            'Full tax audit trail & RRA EBM certificate'
          ],
          notIncluded: []
        }
      ];
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      settings: settingsMap,
      network: networkCounts,
      pricing: pricingTiers,
      currency_rate: { RWF_PER_USD: 1350 }
    });
  } catch (err) {
    console.error('[publicRoutes/platform-config] Error:', err);
    return res.status(500).json({
      error: 'Failed to retrieve platform configuration',
      code: 'CONFIG_FETCH_FAILED'
    });
  }
});

/**
 * GET /api/public/pricing
 * Direct endpoint for marketing pricing matrix
 */
router.get('/pricing', (req, res) => {
  return res.redirect(307, '/api/public/platform-config');
});

/**
 * GET /api/public/verify-company
 * Instant corporate eligibility search for public site & employee onboarding
 */
router.get('/verify-company', async (req, res) => {
  try {
    const query = (req.query.query || req.query.email || req.query.domain || '').toString().trim().toLowerCase();
    if (!query) {
      return res.status(400).json({ error: 'Search query or work email domain is required', code: 'QUERY_REQUIRED' });
    }

    const domain = query.includes('@') ? query.split('@')[1] : query;

    if (!supabase) {
      return res.status(503).json({ error: 'Database service unavailable', code: 'SERVICE_UNAVAILABLE' });
    }

    // Search organizations by allowed_domains or slug or name
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug, allowed_domains, industry, logo_url, status')
      .eq('status', 'active');

    if (orgError) throw orgError;

    const matchedOrg = (orgs || []).find((o) => {
      if (Array.isArray(o.allowed_domains) && o.allowed_domains.some((d) => d.toLowerCase() === domain)) {
        return true;
      }
      if (o.slug && o.slug.toLowerCase() === domain) return true;
      if (o.name && o.name.toLowerCase().includes(domain)) return true;
      return false;
    });

    if (!matchedOrg) {
      return res.status(200).json({
        enrolled: false,
        domain,
        message: `Your company (@${domain}) is not yet enrolled in PolyFit. Contact your HR team or request a corporate wellness pilot.`
      });
    }

    // Fetch active standard benefit for this employer
    const { data: benefits } = await supabase
      .from('benefits')
      .select('id, name, tier, max_monthly_visits, co_pay_percentage, allowed_provider_categories')
      .eq('org_id', matchedOrg.id)
      .eq('status', 'active')
      .order('max_monthly_visits', { ascending: false });

    const activeBenefit = (benefits && benefits.find((b) => b.tier === 'standard')) || (benefits && benefits[0]) || {
      name: `${matchedOrg.name} Corporate Wellness Plan`,
      tier: 'standard',
      max_monthly_visits: 10,
      co_pay_percentage: 0,
      allowed_provider_categories: ['gym', 'pool', 'studio']
    };

    const subsidyPercentage = 100 - (activeBenefit.co_pay_percentage || 0);

    return res.status(200).json({
      enrolled: true,
      domain,
      organization: {
        id: matchedOrg.id,
        name: matchedOrg.name,
        slug: matchedOrg.slug,
        industry: matchedOrg.industry,
        logo_url: matchedOrg.logo_url
      },
      benefit: {
        id: activeBenefit.id,
        name: activeBenefit.name,
        tier: activeBenefit.tier,
        max_monthly_visits: activeBenefit.max_monthly_visits,
        subsidy_percentage: subsidyPercentage,
        co_pay_percentage: activeBenefit.co_pay_percentage,
        is_fully_sponsored: subsidyPercentage === 100,
        allowed_categories: activeBenefit.allowed_provider_categories || ['gym', 'pool', 'studio']
      },
      claim_url: `/join/${matchedOrg.slug}`
    });
  } catch (err) {
    console.error('[publicRoutes/verify-company] Error:', err);
    return res.status(500).json({ error: 'Failed to verify company', code: 'VERIFY_FAILED' });
  }
});

/**
 * Helper to slugify company/business names safely
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * POST /api/public/partner/register
 * Dedicated, multi-step self-service onboarding for wellness providers & facilities.
 * Captures Rwandan fitness categories, rack rates, commercial acceptance, and creates initial location.
 */
router.post('/partner/register', leadFormLimiter, async (req, res) => {
  try {
    const {
      business_name,
      legal_name,
      contact_name,
      contact_email,
      phone,
      location = 'Kigali',
      categories = ['gym'],
      facility_count = '1',
      standard_rack_rate_rwf = 40000,
      payout_method = 'bank',
      bank_name,
      account_number,
      momo_number,
      terms_accepted,
      source = 'partner_self_onboarding'
    } = req.body;

    if (!business_name || !business_name.trim()) {
      return res.status(400).json({ error: 'Wellness facility business name is required', code: 'VALIDATION_ERROR' });
    }
    if (!contact_name || !contact_name.trim()) {
      return res.status(400).json({ error: 'Contact person full name is required', code: 'VALIDATION_ERROR' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contact_email || !emailRegex.test(contact_email.trim())) {
      return res.status(400).json({ error: 'A valid contact email address is required', code: 'VALIDATION_ERROR' });
    }
    const digitsOnly = (phone || '').replace(/\D/g, '');
    if (!phone || digitsOnly.length < 8) {
      return res.status(400).json({ error: 'A valid contact phone number is required (at least 8 digits)', code: 'VALIDATION_ERROR' });
    }
    if (!terms_accepted) {
      return res.status(400).json({ error: 'You must review and agree to the PolyFit Partner Agreement & Terms to proceed', code: 'TERMS_NOT_ACCEPTED' });
    }

    if (!supabase) {
      return res.status(503).json({ error: 'Database service unavailable', code: 'SERVICE_UNAVAILABLE' });
    }

    const cleanEmail = contact_email.trim().toLowerCase();
    const cleanBusinessName = business_name.trim();

    // Determine primary category enum for PostgreSQL enum: 'gym' | 'pool' | 'studio' | 'clinic' | 'wellness_center'
    const categoryList = Array.isArray(categories) ? categories : [categories];
    let primaryCategory = 'gym';
    if (categoryList.some(c => c.toLowerCase().includes('pool') || c.toLowerCase().includes('swimming'))) {
      primaryCategory = 'pool';
    } else if (categoryList.some(c => c.toLowerCase().includes('yoga') || c.toLowerCase().includes('pilates') || c.toLowerCase().includes('studio'))) {
      primaryCategory = 'studio';
    } else if (categoryList.some(c => c.toLowerCase().includes('physio') || c.toLowerCase().includes('clinic'))) {
      primaryCategory = 'clinic';
    } else if (categoryList.some(c => c.toLowerCase().includes('sauna') || c.toLowerCase().includes('spa') || c.toLowerCase().includes('wellness'))) {
      primaryCategory = 'wellness_center';
    }

    // Check if provider already exists
    const { data: existingProvider } = await supabase
      .from('providers')
      .select('id, name, status')
      .or(`contact_email.eq.${cleanEmail},name.ilike.${cleanBusinessName}`)
      .maybeSingle();

    let provider = existingProvider;

    if (!provider) {
      const { data: newProvider, error: provError } = await supabase
        .from('providers')
        .insert({
          name: cleanBusinessName,
          category: primaryCategory,
          status: 'active',
          contact_email: cleanEmail,
          settlement_email: cleanEmail,
          pricing_expectations: {
            standard_rack_rate_rwf: Number(standard_rack_rate_rwf) || 40000,
            guaranteed_reimbursement_rate_rwf: 5000,
            settlement_cycle: 'Net-15',
            zero_cash_policy: true
          },
          onboarding_details: {
            contact_name: contact_name.trim(),
            legal_name: legal_name ? legal_name.trim() : cleanBusinessName,
            phone: phone.trim(),
            location: location.trim(),
            categories: categoryList,
            facility_count,
            payout_method,
            terms_accepted_at: new Date().toISOString(),
            source
          },
          bank_details: payout_method === 'bank' ? {
            bank_name: bank_name || 'Bank of Kigali',
            account_number: account_number || '',
            account_name: cleanBusinessName
          } : {
            provider: 'MTN Mobile Money Rwanda',
            momo_number: momo_number || phone.trim()
          }
        })
        .select()
        .single();

      if (provError) {
        console.error('[PartnerRegister] Error creating provider:', provError);
        throw provError;
      }
      provider = newProvider;
    }

    // Create or retrieve initial location branch
    const { data: existingLocations } = await supabase
      .from('provider_locations')
      .select('id, name')
      .eq('provider_id', provider.id);

    let locationRecord = existingLocations && existingLocations[0];

    if (!locationRecord) {
      const { data: newLocation, error: locError } = await supabase
        .from('provider_locations')
        .insert({
          provider_id: provider.id,
          name: `${cleanBusinessName} - ${location.trim() || 'Central Branch'}`,
          address: `${location.trim() || 'Kigali'}, Rwanda`,
          city: location.trim() || 'Kigali',
          country: 'Rwanda',
          status: 'active',
          amenities: categoryList,
          metadata: {
            contact_person: contact_name.trim(),
            contact_phone: phone.trim(),
            onboarding_wizard_step: 1
          }
        })
        .select()
        .single();

      if (!locError && newLocation) {
        locationRecord = newLocation;
      }
    }

    // Also register lead entry in demo_requests for super admin cross-visibility
    try {
      await supabase.from('demo_requests').insert({
        company_name: cleanBusinessName,
        contact_name: contact_name.trim(),
        work_email: cleanEmail,
        phone: phone.trim(),
        country: 'Rwanda',
        company_size: `${facility_count} location(s)`,
        interest_tier: 'Provider Network Onboarded',
        message: `Registered as ${primaryCategory} in ${location}. Accepted Net-15 commercial agreement.`,
        source: 'partner_register_flow',
        status: 'approved'
      });
    } catch (leadErr) {
      console.warn('[PartnerRegister] Lead sync notice:', leadErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Wellness provider facility onboarded successfully! Welcome to the PolyFit Network.',
      provider: {
        id: provider.id,
        name: provider.name,
        category: provider.category,
        contact_email: provider.contact_email,
        status: provider.status
      },
      location: locationRecord ? {
        id: locationRecord.id,
        name: locationRecord.name
      } : null,
      redirect_url: locationRecord ? `/partner/setup?locationId=${locationRecord.id}&welcome=true` : '/partner/locations'
    });
  } catch (error) {
    console.error('[PartnerRegister] Unexpected error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to complete partner facility registration',
      code: 'REGISTRATION_FAILED'
    });
  }
});

/**
 * GET /api/public/locations/:id
 * Retrieve location & parent provider profile for onboarding wizard and public facility lookup
 */
router.get('/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Location ID is required', code: 'ID_REQUIRED' });
    }
    if (!supabase) {
      return res.status(503).json({ error: 'Database service unavailable', code: 'SERVICE_UNAVAILABLE' });
    }

    const { data: location, error: locError } = await supabase
      .from('provider_locations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (locError || !location) {
      return res.status(404).json({ error: 'Facility location not found', code: 'LOCATION_NOT_FOUND' });
    }

    let provider = null;
    if (location.provider_id) {
      const { data: provData } = await supabase
        .from('providers')
        .select('id, name, category, contact_email, settlement_email, tax_id, bank_details, status')
        .eq('id', location.provider_id)
        .maybeSingle();
      provider = provData;
    }

    return res.status(200).json({
      success: true,
      location,
      provider
    });
  } catch (error) {
    console.error('[PublicLocations] Error fetching location:', error);
    return res.status(500).json({
      error: error.message || 'Failed to retrieve location details',
      code: 'LOCATION_FETCH_FAILED'
    });
  }
});

/**
 * PATCH /api/public/locations/:id
 * Update facility location profile, amenities, photos, operating hours, and parent provider payout details during onboarding
 */
router.patch('/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Location ID is required', code: 'ID_REQUIRED' });
    }
    if (!supabase) {
      return res.status(503).json({ error: 'Database service unavailable', code: 'SERVICE_UNAVAILABLE' });
    }

    const {
      name,
      address,
      city,
      country,
      lat,
      lng,
      capacity,
      operating_hours,
      amenities,
      photos,
      metadata,
      status,
      bank_details,
      tax_id
    } = req.body;

    const locUpdates = {};
    if (name !== undefined) locUpdates.name = name;
    if (address !== undefined) locUpdates.address = address;
    if (city !== undefined) locUpdates.city = city;
    if (country !== undefined) locUpdates.country = country;
    if (lat !== undefined) locUpdates.lat = lat;
    if (lng !== undefined) locUpdates.lng = lng;
    if (capacity !== undefined) locUpdates.capacity = capacity;
    if (operating_hours !== undefined) locUpdates.operating_hours = operating_hours;
    if (amenities !== undefined) locUpdates.amenities = amenities;
    if (photos !== undefined) locUpdates.photos = photos;
    if (metadata !== undefined) locUpdates.metadata = metadata;
    if (status !== undefined) locUpdates.status = status;

    const { data: updatedLoc, error: updateError } = await supabase
      .from('provider_locations')
      .update(locUpdates)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('[PublicLocations] Error updating location:', updateError);
      return res.status(500).json({ error: updateError.message, code: 'LOCATION_UPDATE_FAILED' });
    }

    // Also update provider bank_details and tax_id if provided
    if (updatedLoc.provider_id && (bank_details !== undefined || tax_id !== undefined)) {
      const provUpdates = {};
      if (bank_details !== undefined) provUpdates.bank_details = bank_details;
      if (tax_id !== undefined) provUpdates.tax_id = tax_id;

      await supabase
        .from('providers')
        .update(provUpdates)
        .eq('id', updatedLoc.provider_id);
    }

    return res.status(200).json({
      success: true,
      message: 'Facility location updated successfully',
      location: updatedLoc
    });
  } catch (error) {
    console.error('[PublicLocations] Patch error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to update location',
      code: 'LOCATION_UPDATE_FAILED'
    });
  }
});

/**
 * POST /api/public/corporate/register
 * Dedicated, multi-step self-service onboarding for corporate employers & HR leaders.
 * Configures corporate organization profile, auto-generates slug, creates benefit tier, and enables employee self-join.
 */
router.post('/corporate/register', leadFormLimiter, async (req, res) => {
  try {
    const {
      company_name,
      contact_name,
      work_email,
      phone,
      industry = 'Corporate & Professional Services',
      headcount = '25-50',
      selected_plan_tier = 'standard',
      subsidy_percentage = 100,
      billing_currency = 'RWF',
      terms_accepted,
      source = 'corporate_self_onboarding'
    } = req.body;

    if (!company_name || !company_name.trim()) {
      return res.status(400).json({ error: 'Company or organization name is required', code: 'VALIDATION_ERROR' });
    }
    if (!contact_name || !contact_name.trim()) {
      return res.status(400).json({ error: 'Contact person full name is required', code: 'VALIDATION_ERROR' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!work_email || !emailRegex.test(work_email.trim())) {
      return res.status(400).json({ error: 'A valid work email address is required', code: 'VALIDATION_ERROR' });
    }
    const digitsOnly = (phone || '').replace(/\D/g, '');
    if (!phone || digitsOnly.length < 8) {
      return res.status(400).json({ error: 'A valid contact phone number is required (at least 8 digits)', code: 'VALIDATION_ERROR' });
    }
    if (!terms_accepted) {
      return res.status(400).json({ error: 'You must review and agree to the Corporate Wellness Agreement to proceed', code: 'TERMS_NOT_ACCEPTED' });
    }

    if (!supabase) {
      return res.status(503).json({ error: 'Database service unavailable', code: 'SERVICE_UNAVAILABLE' });
    }

    const cleanCompanyName = company_name.trim();
    const cleanEmail = work_email.trim().toLowerCase();
    const emailDomain = cleanEmail.split('@')[1];

    // Block common generic freemail domains for employer onboarding
    const freemailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
    if (freemailDomains.includes(emailDomain)) {
      return res.status(400).json({
        error: 'Corporate employer registration requires an official company domain email (e.g. name@company.rw), not a personal free email.',
        code: 'CORPORATE_DOMAIN_REQUIRED'
      });
    }

    let baseSlug = slugify(cleanCompanyName);
    if (!baseSlug) baseSlug = slugify(emailDomain.split('.')[0]) || 'corporate';

    // Parse contracted seats numeric estimate
    let numericSeats = 30;
    if (typeof headcount === 'number') {
      numericSeats = headcount;
    } else if (typeof headcount === 'string') {
      const match = headcount.match(/\d+/);
      if (match) numericSeats = parseInt(match[0], 10);
      if (headcount.includes('500+')) numericSeats = 500;
      else if (headcount.includes('200')) numericSeats = 200;
    }

    // Check if organization already exists
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id, name, slug, allowed_domains, status')
      .or(`slug.eq.${baseSlug},contact_email.eq.${cleanEmail}`)
      .maybeSingle();

    let organization = existingOrg;

    if (!organization) {
      // Ensure unique slug
      let finalSlug = baseSlug;
      const { data: slugConflict } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', finalSlug)
        .maybeSingle();

      if (slugConflict) {
        finalSlug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;
      }

      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: cleanCompanyName,
          slug: finalSlug,
          industry: industry.trim(),
          allowed_domains: [emailDomain],
          contact_email: cleanEmail,
          billing_email: cleanEmail,
          status: 'active',
          contracted_seats: numericSeats,
          headcount_tier: typeof headcount === 'string' ? headcount : `${numericSeats} employees`,
          country: 'Rwanda'
        })
        .select()
        .single();

      if (orgError) {
        console.error('[CorporateRegister] Error creating organization:', orgError);
        throw orgError;
      }
      organization = newOrg;
    }

    // Configure corporate benefit plan
    const tierNameMap = {
      basic: 'Basic Corporate Pass',
      starter: 'Starter Active Pass',
      premium: 'Premium Multi-Category Pass',
      executive: 'Executive VIP All-Access Pass'
    };

    const tierVisitsMap = {
      basic: 4,
      starter: 8,
      premium: 12,
      executive: 16
    };

    const tierCategoriesMap = {
      basic: ['gym'],
      starter: ['gym', 'pool'],
      premium: ['gym', 'pool', 'studio', 'sauna'],
      executive: ['gym', 'pool', 'studio', 'sauna', 'clinic', 'wellness']
    };

    const resolvedTier = selected_plan_tier in tierNameMap ? selected_plan_tier : 'standard';
    const planVisits = tierVisitsMap[resolvedTier] || 8;
    const planName = `${cleanCompanyName} - ${tierNameMap[resolvedTier] || 'Corporate Wellness Plan'}`;
    const coPayPercent = Math.max(0, 100 - (Number(subsidy_percentage) || 100));

    // Check if benefit plan already created
    const { data: existingBenefits } = await supabase
      .from('benefits')
      .select('id, name, tier')
      .eq('org_id', organization.id);

    let benefit = existingBenefits && existingBenefits[0];

    if (!benefit) {
      const { data: newBenefit, error: benError } = await supabase
        .from('benefits')
        .insert({
          org_id: organization.id,
          name: planName,
          tier: resolvedTier,
          max_monthly_visits: planVisits,
          co_pay_percentage: coPayPercent,
          allowed_provider_categories: tierCategoriesMap[resolvedTier] || ['gym', 'pool', 'studio'],
          status: 'active'
        })
        .select()
        .single();

      if (!benError && newBenefit) {
        benefit = newBenefit;
      }
    }

    // Lead capture in demo_requests for Super Admin pipeline
    try {
      await supabase.from('demo_requests').insert({
        company_name: cleanCompanyName,
        contact_name: contact_name.trim(),
        work_email: cleanEmail,
        phone: phone.trim(),
        country: 'Rwanda',
        company_size: typeof headcount === 'string' ? headcount : `${numericSeats} employees`,
        interest_tier: resolvedTier,
        message: `Self-registered corporate client with ${numericSeats} seats on ${resolvedTier} tier (${subsidy_percentage}% subsidized). Join link: /join/${organization.slug}`,
        source: 'corporate_register_flow',
        status: 'approved'
      });
    } catch (leadErr) {
      console.warn('[CorporateRegister] Lead sync notice:', leadErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Corporate wellness program created successfully! Your employee enrollment link is active.',
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        allowed_domains: organization.allowed_domains,
        contracted_seats: organization.contracted_seats
      },
      benefit: benefit ? {
        id: benefit.id,
        tier: benefit.tier,
        name: benefit.name,
        max_visits: planVisits,
        subsidy_percentage: Number(subsidy_percentage) || 100
      } : null,
      employee_join_link: `/join/${organization.slug}`,
      redirect_url: `/corporate?org=${organization.slug}&welcome=true`
    });
  } catch (error) {
    console.error('[CorporateRegister] Unexpected error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to complete corporate client registration',
      code: 'REGISTRATION_FAILED'
    });
  }
});

module.exports = router;

