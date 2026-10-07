const express = require('express');
const { supabase } = require('@polyfit/supabase-client');
const { rateLimit } = require('express-rate-limit');

const router = express.Router();

// Strict anti-spam rate limiter for public lead forms (10 submissions per IP per hour)
const leadFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
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
          source: 'landing_modal',
          status: 'pending'
        })
        .select('id')
        .single();

      if (error) throw error;
      return res.status(201).json({ success: true, id: data.id });
    }

    // For provider inquiries, record in provider applications if applicable
    return res.status(200).json({
      success: true,
      message: "Provider inquiry received. Our network onboarding team will reach out."
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

    // 4. Check if employee already exists
    const { data: existingEmp } = await supabase
      .from('employees')
      .select('*')
      .eq('org_id', org.id)
      .eq('email', cleanEmail)
      .maybeSingle();

    let employee = existingEmp;

    if (!employee) {
      const { data: newEmp, error: insertError } = await supabase
        .from('employees')
        .insert({
          org_id: org.id,
          full_name: full_name.trim(),
          email: cleanEmail,
          employee_id_external: employee_id_external ? employee_id_external.trim() : null,
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
    } else if (employee.status !== 'active') {
      const { data: updatedEmp, error: updateError } = await supabase
        .from('employees')
        .update({ status: 'active' })
        .eq('id', employee.id)
        .select()
        .single();
      if (!updateError && updatedEmp) {
        employee = updatedEmp;
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

    return res.status(200).json({
      success: true,
      message: `Wellness pass activated for ${org.name}`,
      employee: {
        id: employee.id,
        full_name: employee.full_name,
        email: employee.email,
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

module.exports = router;
