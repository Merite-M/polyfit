const express = require('express');
const { supabase } = require('../services/supabaseService');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { evaluateEmployeeEligibility } = require('../services/eligibilityService');

const router = express.Router();

/**
 * POST /api/eligibility/check
 * Real-time eligibility verification (< 200ms SLA)
 * Input: { employee_id, provider_location_id, service_category? }
 */
router.post('/check', requireAuth, async (req, res) => {
  const startTime = Date.now();
  try {
    const { employee_id, user_id, email, provider_location_id, service_category } = req.body;

    if (!provider_location_id) {
      return res.status(400).json({
        error: 'provider_location_id is required',
        code: 'ELIGIBILITY_MISSING_LOCATION'
      });
    }

    if (!employee_id && !user_id && !email) {
      return res.status(400).json({
        error: 'employee_id, user_id, or email is required',
        code: 'ELIGIBILITY_MISSING_EMPLOYEE'
      });
    }

    if (!supabase) {
      return res.status(503).json({
        error: 'Database service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    // Resolve employee record if not by direct employee_id
    let resolvedEmployeeId = employee_id;
    if (!resolvedEmployeeId) {
      let query = supabase.from('employees').select('id, org_id, status');
      if (user_id) query = query.eq('user_id', user_id);
      else if (email) query = query.eq('email', String(email).toLowerCase().trim());

      const { data: emp, error: empErr } = await query.maybeSingle();
      if (empErr || !emp) {
        return res.status(404).json({
          eligible: false,
          reason: 'Employee record not found',
          code: 'EMPLOYEE_NOT_FOUND',
          duration_ms: Date.now() - startTime
        });
      }
      resolvedEmployeeId = emp.id;
    }

    const result = await evaluateEmployeeEligibility({
      employeeId: resolvedEmployeeId,
      providerLocationId: provider_location_id,
      serviceCategory: service_category
    });

    const durationMs = Date.now() - startTime;

    return res.status(200).json({
      duration_ms: durationMs,
      ...result
    });
  } catch (error) {
    console.error('[eligibilityRoutes/check] Error:', error);
    return res.status(500).json({
      eligible: false,
      reason: 'Internal server error verifying eligibility',
      code: 'INTERNAL_ERROR',
      duration_ms: Date.now() - startTime
    });
  }
});

/**
 * GET /api/eligibility/employee/:employeeId
 * Get current active eligibility and monthly usage summary for an employee
 */
router.get('/employee/:employeeId', requireAuth, async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!supabase) {
      return res.status(503).json({
        error: 'Database service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    // Fetch employee
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, org_id, full_name, email, department, tier, status')
      .eq('id', employeeId)
      .single();

    if (empError || !employee) {
      return res.status(404).json({
        error: 'Employee not found',
        code: 'EMPLOYEE_NOT_FOUND'
      });
    }

    // Role check: org_admin can only view own org employees
    if (req.primaryRole === 'org_admin' && !req.roles.includes('super_admin')) {
      if (req.orgId !== employee.org_id) {
        return res.status(403).json({
          error: 'Unauthorized organization access',
          code: 'AUTH_FORBIDDEN_ORG'
        });
      }
    }

    // Fetch eligibility
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
          allowed_provider_categories,
          allowed_locations,
          budget_cap_per_employee
        )
      `)
      .eq('employee_id', employeeId)
      .eq('status', 'active')
      .maybeSingle();

    // Fetch visits this month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { count: visitsThisMonth } = await supabase
      .from('visits')
      .select('id', { count: 'exact', head: true })
      .eq('employee_id', employeeId)
      .eq('status', 'verified')
      .gte('check_in_at', startOfMonth);

    const benefit = eligibility?.benefits || null;
    const maxVisits = benefit?.max_monthly_visits || null;
    const usedVisits = visitsThisMonth || 0;
    const remainingVisits = maxVisits !== null ? Math.max(0, maxVisits - usedVisits) : null;

    return res.status(200).json({
      employee,
      eligibility: eligibility || null,
      quota: {
        max_monthly_visits: maxVisits,
        visits_used_this_month: usedVisits,
        remaining_visits: remainingVisits
      }
    });
  } catch (error) {
    console.error('[eligibilityRoutes/employee] Error:', error);
    return res.status(500).json({
      error: 'Internal server error retrieving employee eligibility',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/eligibility/assign
 * Explicitly assigns or changes an employee's benefit plan
 */
router.post('/assign', requireAuth, requireRole('super_admin', 'polyfit_ops', 'org_admin'), async (req, res) => {
  try {
    const { employee_id, benefit_id, expires_at } = req.body;

    if (!employee_id || !benefit_id) {
      return res.status(400).json({
        error: 'employee_id and benefit_id are required',
        code: 'ELIGIBILITY_MISSING_PARAMS'
      });
    }

    if (!supabase) {
      return res.status(503).json({
        error: 'Database service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    // Verify employee & benefit belongs to org
    const [{ data: employee }, { data: benefit }] = await Promise.all([
      supabase.from('employees').select('id, org_id, status').eq('id', employee_id).single(),
      supabase.from('benefits').select('id, org_id, status').eq('id', benefit_id).single()
    ]);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found', code: 'EMPLOYEE_NOT_FOUND' });
    }
    if (!benefit) {
      return res.status(404).json({ error: 'Benefit plan not found', code: 'BENEFIT_NOT_FOUND' });
    }
    if (employee.org_id !== benefit.org_id) {
      return res.status(400).json({
        error: 'Employee and Benefit plan belong to different organizations',
        code: 'ORG_MISMATCH'
      });
    }

    // Role check
    if (req.primaryRole === 'org_admin' && !req.roles.includes('super_admin')) {
      if (req.orgId !== employee.org_id) {
        return res.status(403).json({
          error: 'Cannot assign benefits for an organization other than your own',
          code: 'AUTH_FORBIDDEN_ORG'
        });
      }
    }

    // Expire any existing active eligibility
    await supabase
      .from('eligibility')
      .update({ status: 'expired' })
      .eq('employee_id', employee_id)
      .eq('status', 'active');

    // Create new active eligibility record
    const { data: newEligibility, error: insertError } = await supabase
      .from('eligibility')
      .insert({
        employee_id,
        benefit_id,
        status: employee.status === 'active' ? 'active' : 'suspended',
        expires_at: expires_at || null
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({
        error: insertError.message,
        code: 'ELIGIBILITY_ASSIGN_FAILED'
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Benefit successfully assigned to employee',
      eligibility: newEligibility
    });
  } catch (error) {
    console.error('[eligibilityRoutes/assign] Error:', error);
    return res.status(500).json({
      error: 'Internal server error assigning eligibility',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
