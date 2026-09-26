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
  description = null
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
      status: 'active'
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

  return benefit;
}

/**
 * Lists benefit plans for an organization with active enrollment stats
 */
async function getBenefitPlans(orgId) {
  if (!supabase) throw new Error('Database service unavailable');

  const { data: benefits, error } = await supabase
    .from('benefits')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) {
    throw { status: 500, message: error.message, code: 'BENEFIT_LIST_FAILED' };
  }

  // Enrich with enrolled employee counts
  const { data: enrollments } = await supabase
    .from('eligibility')
    .select('benefit_id, status')
    .eq('status', 'active');

  const enrollmentCount = new Map();
  if (enrollments) {
    enrollments.forEach((e) => {
      enrollmentCount.set(e.benefit_id, (enrollmentCount.get(e.benefit_id) || 0) + 1);
    });
  }

  return benefits.map((b) => ({
    ...b,
    enrolled_count: enrollmentCount.get(b.id) || 0
  }));
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
    if (!['active', 'inactive', 'archived'].includes(cleanStatus)) {
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

module.exports = {
  createBenefitPlan,
  getBenefitPlans,
  getBenefitPlanById,
  updateBenefitPlan,
  VALID_PROVIDER_CATEGORIES
};
