const { supabase } = require('./supabaseService');

/**
 * Real-time Eligibility Verification Engine (PF-82 & PF-79)
 * Evaluates whether an employee is eligible to access a provider location under their benefit plan.
 *
 * Checks:
 * 1. Employee existence and active status (rejects 'frozen' and 'terminated')
 * 2. Organization existence and active status
 * 3. Active benefit plan resolution (explicit eligibility record or tier-matching benefit plan fallback)
 * 4. Provider location and provider active status
 * 5. Provider category allowed by benefit plan
 * 6. Provider location allowed by benefit plan
 * 7. Active provider contract between organization and provider
 * 8. Monthly visit allowance / quota exhaustion
 *
 * @param {Object} params
 * @param {string} params.employeeId - UUID of employee
 * @param {string} params.orgId - UUID of organization
 * @param {string} params.providerLocationId - UUID of provider location
 * @param {string} [params.serviceCategory] - Optional service category override
 * @param {Object} [params.preloadedEmployee] - Optional pre-fetched employee record
 * @returns {Promise<Object>} Verification result with eligibility status and breakdown
 */
async function evaluateEmployeeEligibility(arg1, arg2, arg3, arg4, arg5) {
  let employeeId, orgId, providerLocationId, serviceCategory, preloadedEmployee;
  if (typeof arg1 === 'object' && arg1 !== null) {
    ({ employeeId, orgId, providerLocationId, serviceCategory, preloadedEmployee = null } = arg1);
  } else {
    employeeId = arg1;
    orgId = arg2;
    providerLocationId = arg3;
    serviceCategory = arg4;
    preloadedEmployee = arg5 || null;
  }
  if (!supabase) {
    return {
      eligible: false,
      reason: 'Database service temporarily unavailable',
      code: 'DB_UNAVAILABLE'
    };
  }

  // 1. Fetch or verify employee
  let employee = preloadedEmployee;
  if (!employee) {
    const { data: empData, error: empError } = await supabase
      .from('employees')
      .select(`
        id,
        org_id,
        user_id,
        full_name,
        email,
        department,
        tier,
        status,
        organizations (
          id,
          name,
          status
        )
      `)
      .eq('id', employeeId)
      .maybeSingle();

    if (empError || !empData) {
      return {
        eligible: false,
        reason: 'Employee not found',
        code: 'EMPLOYEE_NOT_FOUND'
      };
    }
    employee = empData;
  }

  // Check employee status
  if (employee.status !== 'active') {
    return {
      eligible: false,
      reason: `Employee account status is '${employee.status}'. Active status required`,
      code: employee.status === 'frozen' ? 'EMPLOYEE_FROZEN' : 'EMPLOYEE_INACTIVE',
      employeeStatus: employee.status
    };
  }

  const effectiveOrgId = orgId || employee.org_id;

  // Check organization status
  const org = employee.organizations;
  if (org && org.status !== 'active') {
    return {
      eligible: false,
      reason: `Employer organization status is '${org.status}'. Active organization required`,
      code: 'ORGANIZATION_INACTIVE'
    };
  }

  // 2. Resolve Benefit (Explicit eligibility record first, then tier-based fallback)
  let benefit = null;
  let eligibilityRecord = null;

  const { data: eligibility, error: elError } = await supabase
    .from('eligibility')
    .select(`
      id,
      status,
      expires_at,
      benefits (
        id,
        org_id,
        name,
        tier,
        max_monthly_visits,
        co_pay_percentage,
        budget_cap_per_employee,
        allowed_locations,
        allowed_provider_categories,
        status
      )
    `)
    .eq('employee_id', employee.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!elError && eligibility && eligibility.benefits) {
    const isExpired = eligibility.expires_at && new Date(eligibility.expires_at) < new Date();
    if (!isExpired && eligibility.benefits.status !== 'inactive') {
      benefit = eligibility.benefits;
      eligibilityRecord = eligibility;
    }
  }

  // If no explicit active eligibility record, fallback to tier-matching benefit plan
  if (!benefit) {
    let benefitQuery = supabase
      .from('benefits')
      .select('*')
      .eq('org_id', effectiveOrgId)
      .eq('status', 'active');

    if (employee.tier) {
      benefitQuery = benefitQuery.eq('tier', employee.tier);
    }

    const { data: tierBenefit } = await benefitQuery.limit(1).maybeSingle();
    if (tierBenefit) {
      benefit = tierBenefit;
    } else {
      // Fallback to any active benefit for org (e.g. standard/default plan)
      const { data: defaultBenefit } = await supabase
        .from('benefits')
        .select('*')
        .eq('org_id', effectiveOrgId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (defaultBenefit) {
        benefit = defaultBenefit;
      }
    }
  }

  if (!benefit) {
    return {
      eligible: false,
      reason: 'No active wellness benefit plan configured for employee or organization',
      code: 'NO_ACTIVE_BENEFIT'
    };
  }

  // 3. Fetch Provider Location & Parent Provider
  const { data: location, error: locError } = await supabase
    .from('provider_locations')
    .select(`
      id,
      name,
      address,
      lat,
      lng,
      geo,
      status,
      provider_id,
      providers (
        id,
        name,
        category,
        status
      )
    `)
    .eq('id', providerLocationId)
    .maybeSingle();

  if (locError || !location) {
    return {
      eligible: false,
      reason: 'Provider location not found',
      code: 'LOCATION_NOT_FOUND'
    };
  }

  if (location.status !== 'active') {
    return {
      eligible: false,
      reason: 'Provider location is currently inactive',
      code: 'LOCATION_INACTIVE'
    };
  }

  const provider = location.providers;
  if (!provider || provider.status !== 'active') {
    return {
      eligible: false,
      reason: 'Wellness provider is currently inactive',
      code: 'PROVIDER_INACTIVE'
    };
  }

  // 4. Allowed Category Check
  const effectiveCategory = serviceCategory || provider.category;
  if (benefit.allowed_provider_categories && benefit.allowed_provider_categories.length > 0) {
    if (!benefit.allowed_provider_categories.includes(effectiveCategory)) {
      return {
        eligible: false,
        reason: `Provider category '${effectiveCategory}' is not covered by ${benefit.name}`,
        code: 'CATEGORY_NOT_ALLOWED',
        allowedCategories: benefit.allowed_provider_categories,
        requestedCategory: effectiveCategory
      };
    }
  }

  // 5. Allowed Location Check
  if (benefit.allowed_locations && benefit.allowed_locations.length > 0) {
    if (!benefit.allowed_locations.includes(location.id)) {
      return {
        eligible: false,
        reason: 'This provider location is not included in employee benefit plan',
        code: 'LOCATION_NOT_ALLOWED',
        allowedLocations: benefit.allowed_locations,
        requestedLocationId: location.id
      };
    }
  }

  // 6. Active Provider Contract Check
  const { data: contract, error: contractError } = await supabase
    .from('provider_contracts')
    .select('id, status, per_visit_rate, monthly_cap')
    .eq('org_id', effectiveOrgId)
    .eq('provider_id', location.provider_id)
    .eq('status', 'active')
    .maybeSingle();

  if (contractError || !contract) {
    return {
      eligible: false,
      reason: 'No active contract between employer organization and this wellness provider',
      code: 'NO_ACTIVE_CONTRACT'
    };
  }

  // 7. Monthly Visit Quota Evaluation
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const { count: visitsThisMonth } = await supabase
    .from('visits')
    .select('id', { count: 'exact', head: true })
    .eq('employee_id', employee.id)
    .eq('status', 'verified')
    .gte('check_in_at', startOfMonth);

  const usedVisits = visitsThisMonth || 0;
  const maxVisits = benefit.max_monthly_visits !== null && benefit.max_monthly_visits !== undefined
    ? benefit.max_monthly_visits
    : null;

  if (maxVisits !== null && usedVisits >= maxVisits) {
    return {
      eligible: false,
      reason: `Monthly visit allowance exhausted (${usedVisits}/${maxVisits} visits used)`,
      code: 'VISIT_QUOTA_EXHAUSTED',
      usedVisits,
      maxVisits,
      remainingVisits: 0
    };
  }

  const remainingVisits = maxVisits !== null ? Math.max(0, maxVisits - usedVisits) : null;

  return {
    eligible: true,
    reason: 'Employee is eligible for visit',
    employee: {
      id: employee.id,
      full_name: employee.full_name,
      email: employee.email,
      tier: employee.tier,
      department: employee.department
    },
    organization: org ? { id: org.id, name: org.name } : { id: effectiveOrgId },
    provider: {
      id: provider.id,
      name: provider.name,
      category: provider.category
    },
    location: {
      id: location.id,
      name: location.name,
      address: location.address
    },
    benefit: {
      id: benefit.id,
      name: benefit.name,
      tier: benefit.tier || null,
      co_pay_percentage: benefit.co_pay_percentage || 0,
      max_monthly_visits: maxVisits,
      budget_cap_per_employee: benefit.budget_cap_per_employee || null
    },
    contract: {
      id: contract.id,
      per_visit_rate: contract.per_visit_rate
    },
    monthly_allowance: maxVisits,
    visits_used_this_month: usedVisits,
    remaining_visits: remainingVisits
  };
}

module.exports = {
  evaluateEmployeeEligibility
};
