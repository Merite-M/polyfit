const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { rateLimit } = require('express-rate-limit');

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

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

module.exports = router;
