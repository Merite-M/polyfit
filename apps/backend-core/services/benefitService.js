const { supabase } = require('./supabaseService');
const { VALID_TIERS } = require('./employeeService');

const VALID_PROVIDER_CATEGORIES = ['gym', 'pool', 'studio', 'clinic', 'wellness_center'];

/**
 * Creates a new Benefit Plan for an organization (multi-tier support)
 */
async function createBenefitPlan(orgId, {
  name,
  tier = null,
  max_monthly_visits = 4,
  co_pay_percentage = 0,
  allowed_provider_categories = VALID_PROVIDER_CATEGORIES,
  allowed_locations = null,
  budget_cap_per_employee = null,
  is_family_eligible = false,
  description = null,
  status = 'active',
  effective_timing = 'immediate'
}) {
  if (!supabase) throw new Error('Database service unavailable');

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw { status: 400, message: 'Benefit plan name is required', code: 'BENEFIT_MISSING_NAME' };
  }

  let cleanTier = null;
  if (tier) {
    cleanTier = String(tier).toLowerCase().trim();
    if (!VALID_TIERS.includes(cleanTier)) {
      throw {
        status: 400,
        message: `Invalid benefit tier '${tier}'. Allowed: ${VALID_TIERS.join(', ')}`,
        code: 'BENEFIT_INVALID_TIER'
      };
    }
  }

  const visits = parseInt(max_monthly_visits, 10);
  if (isNaN(visits) || visits < 0) {
    throw { status: 400, message: 'max_monthly_visits must be a non-negative integer', code: 'BENEFIT_INVALID_VISITS' };
  }

  const copay = parseFloat(co_pay_percentage);
  if (isNaN(copay) || copay < 0 || copay > 100) {
    throw { status: 400, message: 'co_pay_percentage must be between 0 and 100', code: 'BENEFIT_INVALID_COPAY' };
  }

  let cleanCategories = VALID_PROVIDER_CATEGORIES;
  if (Array.isArray(allowed_provider_categories)) {
    const invalid = allowed_provider_categories.filter((c) => !VALID_PROVIDER_CATEGORIES.includes(c));
    if (invalid.length > 0) {
      throw {
        status: 400,
        message: `Invalid provider categories: [${invalid.join(', ')}]. Allowed: ${VALID_PROVIDER_CATEGORIES.join(', ')}`,
        code: 'BENEFIT_INVALID_CATEGORIES'
      };
    }
    cleanCategories = allowed_provider_categories;
  }

  let budgetCap = null;
  if (budget_cap_per_employee !== null && budget_cap_per_employee !== undefined) {
    budgetCap = parseFloat(budget_cap_per_employee);
    if (isNaN(budgetCap) || budgetCap < 0) {
      throw { status: 400, message: 'budget_cap_per_employee must be non-negative', code: 'BENEFIT_INVALID_BUDGET' };
    }
  }

  const cleanStatus = ['active', 'draft', 'inactive'].includes(String(status).toLowerCase().trim())
    ? String(status).toLowerCase().trim()
    : 'active';

  const { data: benefit, error: insertError } = await supabase
    .from('benefits')
    .insert({
      org_id: orgId,
      name: name.trim(),
      tier: cleanTier,
      max_monthly_visits: visits,
      co_pay_percentage: copay,
      allowed_provider_categories: cleanCategories,
      allowed_locations: Array.isArray(allowed_locations) && allowed_locations.length > 0 ? allowed_locations : null,
      budget_cap_per_employee: budgetCap,
      is_family_eligible: Boolean(is_family_eligible),
      description: description ? String(description).trim() : null,
      status: cleanStatus
    })
    .select()
    .single();

  if (insertError || !benefit) {
    throw {
      status: 500,
      message: insertError ? insertError.message : 'Failed to create benefit plan',
      code: 'BENEFIT_CREATE_FAILED'
    };
  }

  return {
    ...benefit,
    effective_timing,
    effective_date: effective_timing === 'next_billing_cycle'
      ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
      : new Date().toISOString()
  };
}

/**
 * Lists benefit plans for an organization with active enrollment stats and department distribution
 */
async function getBenefitPlans(orgId, filters = {}) {
  if (!supabase) throw new Error('Database service unavailable');

  let query = supabase
    .from('benefits')
    .select('*')
    .eq('org_id', orgId);

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  const { data: benefits, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw { status: 500, message: error.message, code: 'BENEFIT_LIST_FAILED' };
  }

  // Enrich with enrolled employee counts and department breakdown
  const { data: enrollments } = await supabase
    .from('eligibility')
    .select('benefit_id, employee_id, status, employees(id, department, tier, status)')
    .eq('status', 'active');

  const enrollmentCount = new Map();
  const departmentDistribution = new Map();

  if (enrollments) {
    enrollments.forEach((e) => {
      enrollmentCount.set(e.benefit_id, (enrollmentCount.get(e.benefit_id) || 0) + 1);

      if (e.employees && e.employees.department) {
        const dept = e.employees.department;
        const currentMap = departmentDistribution.get(e.benefit_id) || {};
        currentMap[dept] = (currentMap[dept] || 0) + 1;
        departmentDistribution.set(e.benefit_id, currentMap);
      }
    });
  }

  return (benefits || []).map((b) => {
    const enrolled = enrollmentCount.get(b.id) || 0;
    const depts = departmentDistribution.get(b.id) || {};
    const visits = b.max_monthly_visits !== null && b.max_monthly_visits !== undefined ? b.max_monthly_visits : 6;
    const copayPct = Number(b.co_pay_percentage || 0);
    // Estimated liability = enrolled * visits * 5000 RWF avg * (1 - copay%)
    const estGross = enrolled * visits * 5000;
    const estCopay = Math.round(estGross * (copayPct / 100));
    const estLiability = estGross - estCopay;

    return {
      ...b,
      enrolled_count: enrolled,
      departments: Object.keys(depts),
      department_counts: depts,
      estimated_monthly_liability: estLiability
    };
  });
}

/**
 * Gets a single benefit plan by ID
 */
async function getBenefitPlanById(orgId, benefitId) {
  if (!supabase) throw new Error('Database service unavailable');

  const { data: benefit, error } = await supabase
    .from('benefits')
    .select('*')
    .eq('id', benefitId)
    .eq('org_id', orgId)
    .single();

  if (error || !benefit) {
    throw { status: 404, message: 'Benefit plan not found', code: 'BENEFIT_NOT_FOUND' };
  }

  const { count: enrolledCount } = await supabase
    .from('eligibility')
    .select('id', { count: 'exact', head: true })
    .eq('benefit_id', benefitId)
    .eq('status', 'active');

  return {
    ...benefit,
    enrolled_count: enrolledCount || 0
  };
}

/**
 * Updates a benefit plan's rules and tiers
 */
async function updateBenefitPlan(orgId, benefitId, updates) {
  if (!supabase) throw new Error('Database service unavailable');

  const { data: existing, error: findError } = await supabase
    .from('benefits')
    .select('*')
    .eq('id', benefitId)
    .eq('org_id', orgId)
    .single();

  if (findError || !existing) {
    throw { status: 404, message: 'Benefit plan not found', code: 'BENEFIT_NOT_FOUND' };
  }

  const updatePayload = { updated_at: new Date().toISOString() };

  if (updates.name !== undefined) {
    if (!updates.name || !String(updates.name).trim()) {
      throw { status: 400, message: 'Benefit name cannot be empty', code: 'BENEFIT_INVALID_NAME' };
    }
    updatePayload.name = String(updates.name).trim();
  }

  if (updates.tier !== undefined) {
    if (updates.tier === null) {
      updatePayload.tier = null;
    } else {
      const cleanTier = String(updates.tier).toLowerCase().trim();
      if (!VALID_TIERS.includes(cleanTier)) {
        throw { status: 400, message: `Invalid tier '${updates.tier}'`, code: 'BENEFIT_INVALID_TIER' };
      }
      updatePayload.tier = cleanTier;
    }
  }

  if (updates.max_monthly_visits !== undefined) {
    const visits = parseInt(updates.max_monthly_visits, 10);
    if (isNaN(visits) || visits < 0) {
      throw { status: 400, message: 'max_monthly_visits must be >= 0', code: 'BENEFIT_INVALID_VISITS' };
    }
    updatePayload.max_monthly_visits = visits;
  }

  if (updates.co_pay_percentage !== undefined) {
    const copay = parseFloat(updates.co_pay_percentage);
    if (isNaN(copay) || copay < 0 || copay > 100) {
      throw { status: 400, message: 'co_pay_percentage must be 0-100', code: 'BENEFIT_INVALID_COPAY' };
    }
    updatePayload.co_pay_percentage = copay;
  }

  if (updates.allowed_provider_categories !== undefined) {
    if (Array.isArray(updates.allowed_provider_categories)) {
      const invalid = updates.allowed_provider_categories.filter((c) => !VALID_PROVIDER_CATEGORIES.includes(c));
      if (invalid.length > 0) {
        throw { status: 400, message: `Invalid categories: [${invalid.join(', ')}]`, code: 'BENEFIT_INVALID_CATEGORIES' };
      }
      updatePayload.allowed_provider_categories = updates.allowed_provider_categories;
    }
  }

  if (updates.allowed_locations !== undefined) {
    updatePayload.allowed_locations = Array.isArray(updates.allowed_locations) ? updates.allowed_locations : null;
  }

  if (updates.budget_cap_per_employee !== undefined) {
    if (updates.budget_cap_per_employee === null) {
      updatePayload.budget_cap_per_employee = null;
    } else {
      const cap = parseFloat(updates.budget_cap_per_employee);
      if (isNaN(cap) || cap < 0) {
        throw { status: 400, message: 'budget_cap_per_employee must be >= 0', code: 'BENEFIT_INVALID_BUDGET' };
      }
      updatePayload.budget_cap_per_employee = cap;
    }
  }

  if (updates.is_family_eligible !== undefined) {
    updatePayload.is_family_eligible = Boolean(updates.is_family_eligible);
  }

  if (updates.description !== undefined) {
    updatePayload.description = updates.description ? String(updates.description).trim() : null;
  }

  if (updates.status !== undefined) {
    const cleanStatus = String(updates.status).toLowerCase().trim();
    if (!['active', 'draft', 'inactive', 'archived'].includes(cleanStatus)) {
      throw { status: 400, message: 'Invalid status', code: 'BENEFIT_INVALID_STATUS' };
    }
    updatePayload.status = cleanStatus;
  }

  const { data: updated, error: updError } = await supabase
    .from('benefits')
    .update(updatePayload)
    .eq('id', benefitId)
    .select()
    .single();

  if (updError) {
    throw { status: 500, message: updError.message, code: 'BENEFIT_UPDATE_FAILED' };
  }

  return updated;
}

/**
 * Assigns employees to a benefit plan (individually or bulk by department)
 */
async function assignBenefitPlan(orgId, benefitId, { employeeIds = [], departments = [], effectiveTiming = 'immediate' } = {}) {
  if (!supabase) throw new Error('Database service unavailable');

  const { data: benefit, error: benErr } = await supabase
    .from('benefits')
    .select('*')
    .eq('id', benefitId)
    .eq('org_id', orgId)
    .single();

  if (benErr || !benefit) {
    throw { status: 404, message: 'Benefit plan not found', code: 'BENEFIT_NOT_FOUND' };
  }

  const matchedEmployeeIds = new Set();

  // 1. Resolve by departments if provided
  if (Array.isArray(departments) && departments.length > 0) {
    const { data: deptEmps } = await supabase
      .from('employees')
      .select('id, department, status')
      .eq('org_id', orgId)
      .in('department', departments)
      .neq('status', 'terminated');

    if (deptEmps) {
      deptEmps.forEach((e) => matchedEmployeeIds.add(e.id));
    }
  }

  // 2. Resolve by individual employee IDs if provided
  if (Array.isArray(employeeIds) && employeeIds.length > 0) {
    const { data: indEmps } = await supabase
      .from('employees')
      .select('id, status')
      .eq('org_id', orgId)
      .in('id', employeeIds)
      .neq('status', 'terminated');

    if (indEmps) {
      indEmps.forEach((e) => matchedEmployeeIds.add(e.id));
    }
  }

  const targetIds = Array.from(matchedEmployeeIds);
  if (targetIds.length === 0) {
    return {
      success: true,
      assigned_count: 0,
      message: 'No active employees matched the assignment criteria',
      benefit
    };
  }

  // Update employee tier if plan has a tier
  if (benefit.tier) {
    await supabase
      .from('employees')
      .update({ tier: benefit.tier, updated_at: new Date().toISOString() })
      .in('id', targetIds);
  }

  // Expire existing active eligibility
  await supabase
    .from('eligibility')
    .update({ status: 'expired' })
    .in('employee_id', targetIds)
    .eq('status', 'active');

  const activatedAt = effectiveTiming === 'next_billing_cycle'
    ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
    : new Date().toISOString();

  const newRecords = targetIds.map((empId) => ({
    employee_id: empId,
    benefit_id: benefitId,
    status: 'active',
    activated_at: activatedAt
  }));

  const { error: insErr } = await supabase
    .from('eligibility')
    .insert(newRecords);

  if (insErr) {
    throw { status: 500, message: insErr.message, code: 'BENEFIT_ASSIGN_FAILED' };
  }

  return {
    success: true,
    assigned_count: targetIds.length,
    benefit_id: benefitId,
    benefit_name: benefit.name,
    tier: benefit.tier,
    effective_timing: effectiveTiming,
    effective_date: activatedAt,
    employee_ids: targetIds,
    departments: departments || []
  };
}

/**
 * Calculates organization budget forecast based on headcount, tier distributions, and contract rates
 */
async function calculateBenefitForecast(orgId, options = {}) {
  if (!supabase) throw new Error('Database service unavailable');

  // Fetch org plans
  const { data: plans } = await supabase
    .from('benefits')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  // Fetch org employees
  const { data: employees } = await supabase
    .from('employees')
    .select('id, tier, department, status')
    .eq('org_id', orgId)
    .neq('status', 'terminated');

  // Fetch active enrollments
  const { data: enrollments } = await supabase
    .from('eligibility')
    .select('benefit_id, employee_id, status')
    .eq('status', 'active');

  const enrollmentCounts = new Map();
  if (enrollments) {
    enrollments.forEach((e) => {
      enrollmentCounts.set(e.benefit_id, (enrollmentCounts.get(e.benefit_id) || 0) + 1);
    });
  }

  // Fetch average contract rate for this org or network average (~5,000 RWF)
  let effectiveAvgRate = options.avgRate || 5000;
  if (!options.avgRate) {
    const { data: contracts } = await supabase
      .from('provider_contracts')
      .select('per_visit_rate')
      .eq('org_id', orgId)
      .eq('status', 'active');

    if (contracts && contracts.length > 0) {
      const sum = contracts.reduce((acc, c) => acc + Number(c.per_visit_rate || 0), 0);
      effectiveAvgRate = Math.round(sum / contracts.length);
    }
  }

  const totalHeadcount = employees ? employees.length : 0;

  // Build tier breakdown
  const tierForecasts = (plans || []).map((p) => {
    const enrolled = enrollmentCounts.get(p.id) || 0;
    const visitsPerMonth = p.max_monthly_visits !== null && p.max_monthly_visits !== undefined
      ? Number(p.max_monthly_visits)
      : 6;
    const copayPct = Number(p.co_pay_percentage || 0);

    const projectedVisits = enrolled * visitsPerMonth;
    const grossWellnessValue = projectedVisits * effectiveAvgRate;
    const employeeCopayTotal = Math.round(grossWellnessValue * (copayPct / 100));
    const employerNetLiability = Math.max(0, grossWellnessValue - employeeCopayTotal);

    return {
      benefit_id: p.id,
      name: p.name,
      tier: p.tier || 'standard',
      enrolled_headcount: enrolled,
      max_monthly_visits: visitsPerMonth,
      co_pay_percentage: copayPct,
      budget_cap_per_employee: p.budget_cap_per_employee ? Number(p.budget_cap_per_employee) : null,
      projected_monthly_visits: projectedVisits,
      gross_wellness_value: grossWellnessValue,
      employee_copay_total: employeeCopayTotal,
      employer_net_liability: employerNetLiability,
      pmpm_subsidy: enrolled > 0 ? Math.round(employerNetLiability / enrolled) : 0
    };
  });

  const totalProjectedVisits = tierForecasts.reduce((acc, t) => acc + t.projected_monthly_visits, 0);
  const totalGrossValue = tierForecasts.reduce((acc, t) => acc + t.gross_wellness_value, 0);
  const totalEmployeeCopay = tierForecasts.reduce((acc, t) => acc + t.employee_copay_total, 0);
  const totalEmployerLiability = tierForecasts.reduce((acc, t) => acc + t.employer_net_liability, 0);

  // Rwanda 30% Corporate Income Tax (CIT) welfare deduction
  const rwandaCitTaxShield = Math.round(totalEmployerLiability * 0.30);
  const netAfterTaxLiability = totalEmployerLiability - rwandaCitTaxShield;
  const overallPmpm = totalHeadcount > 0 ? Math.round(totalEmployerLiability / totalHeadcount) : 0;

  return {
    organization_id: orgId,
    currency: 'RWF',
    avg_visit_rate: effectiveAvgRate,
    total_headcount: totalHeadcount,
    total_projected_visits: totalProjectedVisits,
    total_gross_value: totalGrossValue,
    total_employee_copay: totalEmployeeCopay,
    total_employer_liability: totalEmployerLiability,
    pmpm_subsidy: overallPmpm,
    tax_incentive: {
      jurisdiction: 'Rwanda',
      corporate_income_tax_rate: 0.30,
      tax_shield_amount: rwandaCitTaxShield,
      net_after_tax_liability: netAfterTaxLiability,
      legal_reference: 'RRA Law on Corporate Income Tax (Employee Health & Welfare Expenses)'
    },
    tier_breakdown: tierForecasts
  };
}

module.exports = {
  createBenefitPlan,
  getBenefitPlans,
  getBenefitPlanById,
  updateBenefitPlan,
  assignBenefitPlan,
  calculateBenefitForecast,
  VALID_PROVIDER_CATEGORIES
};
