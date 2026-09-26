const express = require('express');
const { supabase } = require('../services/supabaseService');
const { requireAuth, requireRole, requireOrgAccess } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * POST /api/organizations
 * Create new employer organization (super_admin only)
 */
router.post('/', requireAuth, requireRole('super_admin'), async (req, res) => {
  try {
    const {
      name,
      industry,
      logo_url,
      contact_email,
      billing_email,
      tax_id,
      country = 'Rwanda',
      status = 'active'
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        error: 'Organization name is required',
        code: 'ORG_MISSING_NAME'
      });
    }

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        error: "Status must be 'active', 'inactive', or 'suspended'",
        code: 'ORG_INVALID_STATUS'
      });
    }

    if (!supabase) {
      return res.status(503).json({
        error: 'Database service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    const { data: organization, error: insertError } = await supabase
      .from('organizations')
      .insert({
        name: name.trim(),
        industry: industry ? String(industry).trim() : null,
        logo_url: logo_url ? String(logo_url).trim() : null,
        contact_email: contact_email ? String(contact_email).toLowerCase().trim() : null,
        billing_email: billing_email ? String(billing_email).toLowerCase().trim() : null,
        tax_id: tax_id ? String(tax_id).trim() : null,
        country: country ? String(country).trim() : 'Rwanda',
        status
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({
        error: insertError.message,
        code: 'ORG_CREATE_FAILED'
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      organization
    });
  } catch (error) {
    console.error('[organizationRoutes/create] Error:', error);
    return res.status(500).json({
      error: 'Internal server error creating organization',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/organizations
 * List organizations (super_admin / polyfit_ops see all; org_admin / employee see own org)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        error: 'Database service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    const isPlatformAdmin = req.roles.includes('super_admin') || req.roles.includes('polyfit_ops');

    let query = supabase.from('organizations').select('*', { count: 'exact' });

    if (!isPlatformAdmin) {
      if (!req.orgId) {
        return res.status(403).json({
          error: 'No organization linked to user',
          code: 'AUTH_FORBIDDEN_ORG'
        });
      }
      query = query.eq('id', req.orgId);
    } else {
      // Platform admin filters
      const { status, search, page = 1, limit = 20 } = req.query;
      if (status) {
        query = query.eq('status', status);
      }
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const from = (pageNum - 1) * limitNum;
      const to = from + limitNum - 1;
      query = query.range(from, to).order('created_at', { ascending: false });
    }

    const { data: organizations, count, error } = await query;

    if (error) {
      return res.status(500).json({
        error: error.message,
        code: 'ORG_LIST_FAILED'
      });
    }

    return res.status(200).json({
      organizations: organizations || [],
      total: count !== null ? count : organizations.length
    });
  } catch (error) {
    console.error('[organizationRoutes/list] Error:', error);
    return res.status(500).json({
      error: 'Internal server error fetching organizations',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/organizations/:id
 * Retrieve organization profile and metrics
 */
router.get('/:id', requireAuth, requireOrgAccess((req) => req.params.id), async (req, res) => {
  try {
    const { id } = req.params;
    if (!supabase) {
      return res.status(503).json({
        error: 'Database service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !organization) {
      return res.status(404).json({
        error: 'Organization not found',
        code: 'ORG_NOT_FOUND'
      });
    }

    // Include summary counts
    const [empCountRes, benefitCountRes] = await Promise.all([
      supabase.from('employees').select('id', { count: 'exact', head: true }).eq('org_id', id).eq('status', 'active'),
      supabase.from('benefits').select('id', { count: 'exact', head: true }).eq('org_id', id).eq('status', 'active')
    ]);

    return res.status(200).json({
      organization: {
        ...organization,
        active_employees_count: empCountRes.count || 0,
        active_benefits_count: benefitCountRes.count || 0
      }
    });
  } catch (error) {
    console.error('[organizationRoutes/get] Error:', error);
    return res.status(500).json({
      error: 'Internal server error retrieving organization',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * PATCH /api/organizations/:id
 * Update organization profile details
 */
router.patch('/:id', requireAuth, requireOrgAccess((req) => req.params.id), requireRole('super_admin', 'polyfit_ops', 'org_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, industry, logo_url, contact_email, billing_email, tax_id, country, status } = req.body;

    if (!supabase) {
      return res.status(503).json({
        error: 'Database service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    const isPlatformAdmin = req.roles.includes('super_admin') || req.roles.includes('polyfit_ops');
    const updatePayload = { updated_at: new Date().toISOString() };

    if (name !== undefined) {
      if (!name || !String(name).trim()) {
        return res.status(400).json({ error: 'Name cannot be empty', code: 'ORG_INVALID_NAME' });
      }
      updatePayload.name = String(name).trim();
    }
    if (industry !== undefined) updatePayload.industry = industry ? String(industry).trim() : null;
    if (logo_url !== undefined) updatePayload.logo_url = logo_url ? String(logo_url).trim() : null;
    if (contact_email !== undefined) updatePayload.contact_email = contact_email ? String(contact_email).toLowerCase().trim() : null;
    if (billing_email !== undefined) updatePayload.billing_email = billing_email ? String(billing_email).toLowerCase().trim() : null;
    if (tax_id !== undefined) updatePayload.tax_id = tax_id ? String(tax_id).trim() : null;
    if (country !== undefined) updatePayload.country = country ? String(country).trim() : null;

    if (status !== undefined) {
      if (!isPlatformAdmin && status === 'suspended') {
        return res.status(403).json({
          error: 'Only platform administrators can suspend an organization',
          code: 'AUTH_FORBIDDEN_ACTION'
        });
      }
      if (!['active', 'inactive', 'suspended'].includes(status)) {
        return res.status(400).json({ error: 'Invalid organization status', code: 'ORG_INVALID_STATUS' });
      }
      updatePayload.status = status;
    }

    const { data: updatedOrg, error: updError } = await supabase
      .from('organizations')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updError) {
      return res.status(500).json({
        error: updError.message,
        code: 'ORG_UPDATE_FAILED'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Organization updated successfully',
      organization: updatedOrg
    });
  } catch (error) {
    console.error('[organizationRoutes/update] Error:', error);
    return res.status(500).json({
      error: 'Internal server error updating organization',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
