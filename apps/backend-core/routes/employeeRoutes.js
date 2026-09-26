const express = require('express');
const { supabase } = require('../services/supabaseService');
const { requireAuth, requireRole, requireOrgAccess } = require('../middleware/authMiddleware');
const {
  parseCsv,
  createSingleEmployee,
  processBulkImport,
  freezeEmployee,
  activateEmployee,
  terminateEmployee,
  VALID_TIERS,
  VALID_STATUSES
} = require('../services/employeeService');

// Merge params to access :orgId from parent router
const router = express.Router({ mergeParams: true });

/**
 * Middleware: ensure the user has access to :orgId
 */
const orgScope = requireOrgAccess((req) => req.params.orgId);

/**
 * POST /api/organizations/:orgId/employees
 * Add a single employee to the organization roster
 */
router.post('/', requireAuth, orgScope, requireRole('super_admin', 'polyfit_ops', 'org_admin'), async (req, res) => {
  try {
    const { orgId } = req.params;
    const { full_name, email, employee_id_external, department, tier, status, send_invite } = req.body;

    const employee = await createSingleEmployee(orgId, {
      full_name,
      email,
      employee_id_external,
      department,
      tier,
      status,
      send_invite: Boolean(send_invite),
      invited_by: req.user.id
    });

    return res.status(201).json({
      success: true,
      message: 'Employee added successfully',
      employee
    });
  } catch (error) {
    if (error.status && error.code) {
      return res.status(error.status).json({
        error: error.message,
        code: error.code,
        existingId: error.existingId
      });
    }
    console.error('[employeeRoutes/create] Error:', error);
    return res.status(500).json({
      error: 'Internal server error adding employee',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/organizations/:orgId/employees/bulk
 * High-performance Wellhub-style Bulk CSV Import
 * Processes 500+ employees in < 30 seconds
 *
 * Accepts:
 * - JSON: { csv_data: "full_name,email,employee_id,department,tier\n..." }
 * - JSON: { employees: [ { full_name, email, department, tier }, ... ] }
 * - Raw string / text/csv payload
 */
router.post('/bulk', requireAuth, orgScope, requireRole('super_admin', 'polyfit_ops', 'org_admin'), async (req, res) => {
  const startTime = Date.now();
  try {
    const { orgId } = req.params;
    const { update_existing = true, send_invites = false } = req.body || {};

    let rows = [];

    if (Array.isArray(req.body?.employees)) {
      rows = req.body.employees;
    } else if (typeof req.body?.csv_data === 'string') {
      rows = parseCsv(req.body.csv_data);
    } else if (typeof req.body === 'string') {
      rows = parseCsv(req.body);
    } else {
      return res.status(400).json({
        error: 'Expected CSV data in "csv_data" string field or an array in "employees" field',
        code: 'EMPLOYEE_BULK_MISSING_DATA'
      });
    }

    if (rows.length === 0) {
      return res.status(400).json({
        error: 'No valid employee records found in payload',
        code: 'EMPLOYEE_BULK_EMPTY'
      });
    }

    const result = await processBulkImport(orgId, rows, {
      updateExisting: Boolean(update_existing),
      sendInvites: Boolean(send_invites),
      invitedBy: req.user.id
    });

    const durationMs = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      message: `Bulk import completed in ${durationMs}ms`,
      duration_ms: durationMs,
      ...result
    });
  } catch (error) {
    if (error.status && error.code) {
      return res.status(error.status).json({
        error: error.message,
        code: error.code
      });
    }
    console.error('[employeeRoutes/bulk] Error:', error);
    return res.status(500).json({
      error: 'Internal server error processing bulk employee import',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/organizations/:orgId/employees
 * List employees with pagination and filters
 */
router.get('/', requireAuth, orgScope, async (req, res) => {
  try {
    const { orgId } = req.params;
    const { search, tier, status, department, page = 1, limit = 20 } = req.query;

    if (!supabase) {
      return res.status(503).json({
        error: 'Database service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    let query = supabase
      .from('employees')
      .select('id, org_id, user_id, full_name, email, employee_id_external, department, tier, status, created_at', {
        count: 'exact'
      })
      .eq('org_id', orgId);

    if (tier && VALID_TIERS.includes(tier.toLowerCase())) {
      query = query.eq('tier', tier.toLowerCase());
    }
    if (status && VALID_STATUSES.includes(status.toLowerCase())) {
      query = query.eq('status', status.toLowerCase());
    }
    if (department) {
      query = query.ilike('department', `%${department}%`);
    }
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,employee_id_external.ilike.%${search}%`);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    query = query.range(from, to).order('full_name', { ascending: true });

    const { data: employees, count, error } = await query;

    if (error) {
      return res.status(500).json({
        error: error.message,
        code: 'EMPLOYEE_LIST_FAILED'
      });
    }

    return res.status(200).json({
      employees: employees || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count !== null ? count : (employees || []).length,
        total_pages: count ? Math.ceil(count / limitNum) : 1
      }
    });
  } catch (error) {
    console.error('[employeeRoutes/list] Error:', error);
    return res.status(500).json({
      error: 'Internal server error listing employees',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/organizations/:orgId/employees/:id
 * Retrieve employee profile, eligibility and visit metrics
 */
router.get('/:id', requireAuth, orgScope, async (req, res) => {
  try {
    const { orgId, id } = req.params;

    if (!supabase) {
      return res.status(503).json({
        error: 'Database service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (empError || !employee) {
      return res.status(404).json({
        error: 'Employee not found in organization',
        code: 'EMPLOYEE_NOT_FOUND'
      });
    }

    // Fetch active eligibility & benefit details
    const { data: eligibility } = await supabase
      .from('eligibility')
      .select(`
        id,
        status,
        activated_at,
        expires_at,
        benefits (
          id,
          name,
          tier,
          max_monthly_visits,
          co_pay_percentage,
          allowed_provider_categories
        )
      `)
      .eq('employee_id', id)
      .eq('status', 'active')
      .maybeSingle();

    // Fetch monthly visit count
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { count: visitsThisMonth } = await supabase
      .from('visits')
      .select('id', { count: 'exact', head: true })
      .eq('employee_id', id)
      .eq('status', 'verified')
      .gte('check_in_at', startOfMonth);

    return res.status(200).json({
      employee: {
        ...employee,
        eligibility: eligibility || null,
        visits_this_month: visitsThisMonth || 0
      }
    });
  } catch (error) {
    console.error('[employeeRoutes/get] Error:', error);
    return res.status(500).json({
      error: 'Internal server error fetching employee',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * PATCH /api/organizations/:orgId/employees/:id
 * Update employee details (tier, department, status, employee_id_external)
 */
router.patch('/:id', requireAuth, orgScope, requireRole('super_admin', 'polyfit_ops', 'org_admin'), async (req, res) => {
  try {
    const { orgId, id } = req.params;
    const { full_name, department, tier, employee_id_external, status } = req.body;

    if (!supabase) {
      return res.status(503).json({
        error: 'Database service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    const { data: existing, error: findError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (findError || !existing) {
      return res.status(404).json({
        error: 'Employee not found in organization',
        code: 'EMPLOYEE_NOT_FOUND'
      });
    }

    const updatePayload = { updated_at: new Date().toISOString() };

    if (full_name !== undefined) {
      if (!full_name || !String(full_name).trim()) {
        return res.status(400).json({ error: 'full_name cannot be empty', code: 'EMPLOYEE_INVALID_NAME' });
      }
      updatePayload.full_name = String(full_name).trim();
    }

    if (department !== undefined) {
      updatePayload.department = department ? String(department).trim() : null;
    }

    if (employee_id_external !== undefined) {
      updatePayload.employee_id_external = employee_id_external ? String(employee_id_external).trim() : null;
    }

    let tierChanged = false;
    if (tier !== undefined) {
      const cleanTier = String(tier).toLowerCase().trim();
      if (!VALID_TIERS.includes(cleanTier)) {
        return res.status(400).json({
          error: `Invalid tier '${tier}'. Allowed: ${VALID_TIERS.join(', ')}`,
          code: 'EMPLOYEE_INVALID_TIER'
        });
      }
      if (cleanTier !== existing.tier) {
        updatePayload.tier = cleanTier;
        tierChanged = true;
      }
    }

    if (status !== undefined) {
      const cleanStatus = String(status).toLowerCase().trim();
      if (!VALID_STATUSES.includes(cleanStatus)) {
        return res.status(400).json({
          error: `Invalid status '${status}'. Allowed: ${VALID_STATUSES.join(', ')}`,
          code: 'EMPLOYEE_INVALID_STATUS'
        });
      }
      updatePayload.status = cleanStatus;
    }

    const { data: updatedEmployee, error: updError } = await supabase
      .from('employees')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updError) {
      return res.status(500).json({
        error: updError.message,
        code: 'EMPLOYEE_UPDATE_FAILED'
      });
    }

    // If tier changed, re-sync eligibility to new tier benefit
    if (tierChanged) {
      const { data: newBenefit } = await supabase
        .from('benefits')
        .select('id')
        .eq('org_id', orgId)
        .eq('status', 'active')
        .eq('tier', updatePayload.tier)
        .maybeSingle();

      if (newBenefit) {
        // Expire existing eligibility
        await supabase
          .from('eligibility')
          .update({ status: 'expired' })
          .eq('employee_id', id)
          .eq('status', 'active');

        // Create new active eligibility
        await supabase
          .from('eligibility')
          .insert({
            employee_id: id,
            benefit_id: newBenefit.id,
            status: updatedEmployee.status === 'active' ? 'active' : 'suspended'
          });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      employee: updatedEmployee
    });
  } catch (error) {
    console.error('[employeeRoutes/update] Error:', error);
    return res.status(500).json({
      error: 'Internal server error updating employee',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * DELETE /api/organizations/:orgId/employees/:id
 * Terminate employee (revoke all access)
 */
router.delete('/:id', requireAuth, orgScope, requireRole('super_admin', 'polyfit_ops', 'org_admin'), async (req, res) => {
  try {
    const { orgId, id } = req.params;
    const employee = await terminateEmployee(orgId, id);

    return res.status(200).json({
      success: true,
      message: 'Employee terminated and access revoked successfully',
      employee
    });
  } catch (error) {
    if (error.status && error.code) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }
    console.error('[employeeRoutes/terminate] Error:', error);
    return res.status(500).json({
      error: 'Internal server error terminating employee',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/organizations/:orgId/employees/:id/freeze
 * Freeze employee access (Wellhub-style temporary suspension)
 */
router.post('/:id/freeze', requireAuth, orgScope, requireRole('super_admin', 'polyfit_ops', 'org_admin'), async (req, res) => {
  try {
    const { orgId, id } = req.params;
    const employee = await freezeEmployee(orgId, id);

    return res.status(200).json({
      success: true,
      message: 'Employee access frozen successfully',
      employee
    });
  } catch (error) {
    if (error.status && error.code) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }
    console.error('[employeeRoutes/freeze] Error:', error);
    return res.status(500).json({
      error: 'Internal server error freezing employee',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/organizations/:orgId/employees/:id/activate
 * Reactivate employee access
 */
router.post('/:id/activate', requireAuth, orgScope, requireRole('super_admin', 'polyfit_ops', 'org_admin'), async (req, res) => {
  try {
    const { orgId, id } = req.params;
    const employee = await activateEmployee(orgId, id);

    return res.status(200).json({
      success: true,
      message: 'Employee access reactivated successfully',
      employee
    });
  } catch (error) {
    if (error.status && error.code) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }
    console.error('[employeeRoutes/activate] Error:', error);
    return res.status(500).json({
      error: 'Internal server error reactivating employee',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
