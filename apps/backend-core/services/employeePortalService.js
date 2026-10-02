const crypto = require('crypto');
const { supabase } = require('./supabaseService');
const {
  deriveEmployeeSecret,
  signPassPayload,
  DEFAULT_TIME_STEP_SECONDS,
  getDistanceFromLatLonInM
} = require('./totpService');

const VALID_CATEGORIES = ['gym', 'pool', 'studio', 'clinic', 'wellness_center'];

/**
 * Helper: Calculate start of current month and week in UTC
 */
function getDateBoundaries() {
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

  // Next month reset date
  const resetDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();

  // Start of current week (Monday)
  const day = now.getUTCDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diffToMonday);
  monday.setUTCHours(0, 0, 0, 0);
  const startOfWeek = monday.toISOString();

  // 4 weeks ago for streak calculation
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString();

  return { startOfMonth, resetDate, startOfWeek, fourWeeksAgo };
}

/**
 * Resolves the employee record for the authenticated user
 * Handles user_id matching, automatic self-healing email binding, and administrative preview
 *
 * @param {Object} req - Express request
 * @param {string} [requestedEmployeeId] - Optional employee UUID for admin preview
 * @returns {Promise<{ employee: Object|null, error?: string, status?: number, code?: string }>}
 */
async function getEmployeeForAuthUser(req, requestedEmployeeId = null) {
  if (!supabase) {
    return {
      employee: null,
      error: 'Database service temporarily unavailable',
      status: 503,
      code: 'DB_UNAVAILABLE'
    };
  }

  const userId = req.user?.id;
  const userEmail = req.user?.email;

  if (!userId) {
    return {
      employee: null,
      error: 'Authentication required',
      status: 401,
      code: 'AUTH_REQUIRED'
    };
  }

  // Admin impersonation/preview path
  if (requestedEmployeeId) {
    const isPrivileged = ['super_admin', 'polyfit_ops', 'org_admin'].includes(req.primaryRole);
    if (!isPrivileged) {
      return {
        employee: null,
        error: 'Unauthorized to access another employee profile',
        status: 403,
        code: 'FORBIDDEN_EMPLOYEE_ACCESS'
      };
    }

    let query = supabase
      .from('employees')
      .select(`
        id,
        org_id,
        user_id,
        full_name,
        email,
        employee_id_external,
        department,
        tier,
        status,
        created_at,
        updated_at,
        organizations (
          id,
          name,
          status
        )
      `)
      .eq('id', requestedEmployeeId);

    // If org_admin, enforce tenancy
    if (req.primaryRole === 'org_admin' && req.orgId) {
      query = query.eq('org_id', req.orgId);
    }

    const { data: adminTarget, error: adminErr } = await query.maybeSingle();
    if (adminErr || !adminTarget) {
      return {
        employee: null,
        error: 'Target employee record not found',
        status: 404,
        code: 'EMPLOYEE_NOT_FOUND'
      };
    }

    return { employee: adminTarget };
  }

  // 1. Direct match by user_id
  const { data: directEmp, error: directErr } = await supabase
    .from('employees')
    .select(`
      id,
      org_id,
      user_id,
      full_name,
      email,
      employee_id_external,
      department,
      tier,
      status,
      created_at,
      updated_at,
      organizations (
        id,
        name,
        status
      )
    `)
    .eq('user_id', userId)
    .maybeSingle();

  if (!directErr && directEmp) {
    return { employee: directEmp };
  }

  // 2. Fallback to match by work email and self-heal user_id link
  if (userEmail) {
    const { data: emailEmp, error: emailErr } = await supabase
      .from('employees')
      .select(`
        id,
        org_id,
        user_id,
        full_name,
        email,
        employee_id_external,
        department,
        tier,
        status,
        created_at,
        updated_at,
        organizations (
          id,
          name,
          status
        )
      `)
      .ilike('email', userEmail.trim())
      .maybeSingle();

    if (!emailErr && emailEmp) {
      // Bind user_id if null
      if (!emailEmp.user_id) {
        await supabase
          .from('employees')
          .update({ user_id: userId, updated_at: new Date().toISOString() })
          .eq('id', emailEmp.id);
        emailEmp.user_id = userId;
      }
      return { employee: emailEmp };
    }
  }

  return {
    employee: null,
    error: 'No corporate employee benefit profile is associated with your account',
    status: 404,
    code: 'EMPLOYEE_PROFILE_NOT_FOUND'
  };
}

/**
 * Resolves the active corporate benefit plan for an employee
 * Checks explicit eligibility record first, falls back to organization tier matching plan
 */
async function resolveActiveBenefit(employee) {
  if (!supabase || !employee) return null;

  // 1. Check explicit active eligibility
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
        budget_cap_per_employee,
        is_family_eligible
      )
    `)
    .eq('employee_id', employee.id)
    .eq('status', 'active')
    .maybeSingle();

  if (eligibility && eligibility.benefits) {
    return {
      ...eligibility.benefits,
      eligibility_id: eligibility.id,
      eligibility_status: eligibility.status,
      activated_at: eligibility.activated_at
    };
  }

  // 2. Fallback: match benefit plan by tier for employee org_id
  const empTier = (employee.tier || 'standard').toLowerCase();
  const { data: tierBenefit } = await supabase
    .from('benefits')
    .select(`
      id,
      name,
      tier,
      max_monthly_visits,
      co_pay_percentage,
      allowed_provider_categories,
      allowed_locations,
      budget_cap_per_employee,
      is_family_eligible
    `)
    .eq('org_id', employee.org_id)
    .eq('status', 'active')
    .eq('tier', empTier)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (tierBenefit) {
    return {
      ...tierBenefit,
      eligibility_id: null,
      eligibility_status: 'active',
      activated_at: employee.created_at
    };
  }

  // 3. System default fallback benefit object
  return {
    id: null,
    name: `${empTier.toUpperCase()} Corporate Benefit`,
    tier: empTier,
    max_monthly_visits: empTier === 'basic' ? 8 : empTier === 'standard' ? 12 : empTier === 'premium' ? 20 : null,
    co_pay_percentage: 0.00,
    allowed_provider_categories: VALID_CATEGORIES,
    allowed_locations: null,
    budget_cap_per_employee: null,
    is_family_eligible: false,
    eligibility_id: null,
    eligibility_status: 'active',
    activated_at: employee.created_at
  };
}

/**
 * GET /api/employee/me
 * Full Profile & Corporate Benefit Status (Tab 3: Me)
 */
async function getEmployeeMe(employee) {
  const { startOfMonth, resetDate } = getDateBoundaries();

  // Resolve active benefit & count current month visits in parallel
  const [benefit, visitsResult] = await Promise.all([
    resolveActiveBenefit(employee),
    supabase
      .from('visits')
      .select('id', { count: 'exact', head: true })
      .eq('employee_id', employee.id)
      .eq('status', 'verified')
      .gte('check_in_at', startOfMonth)
  ]);

  const usedVisits = visitsResult.count || 0;
  const maxVisits = benefit?.max_monthly_visits ?? null;
  const remainingVisits = maxVisits !== null ? Math.max(0, maxVisits - usedVisits) : 'unlimited';
  const coPayPct = Number(benefit?.co_pay_percentage || 0);

  return {
    success: true,
    employee: {
      id: employee.id,
      full_name: employee.full_name,
      email: employee.email,
      department: employee.department || null,
      employee_id_external: employee.employee_id_external || null,
      tier: employee.tier || 'standard',
      status: employee.status || 'active',
      enrolled: employee.status === 'active',
      joined_at: employee.created_at
    },
    organization: {
      id: employee.organizations?.id || employee.org_id,
      name: employee.organizations?.name || 'Corporate Employer',
      domain: employee.email ? employee.email.split('@')[1] : null
    },
    benefit: {
      id: benefit?.id || null,
      name: benefit?.name || 'Corporate Wellness Tier',
      tier: benefit?.tier || employee.tier || 'standard',
      max_monthly_visits: maxVisits,
      used_visits: usedVisits,
      remaining_visits: remainingVisits,
      reset_date: resetDate,
      is_unlimited: maxVisits === null,
      co_pay_percentage: coPayPct,
      subsidy_percentage: Math.max(0, 100 - coPayPct),
      allowed_provider_categories: benefit?.allowed_provider_categories || VALID_CATEGORIES
    }
  };
}

/**
 * GET /api/employee/dashboard
 * High-performance single-roundtrip aggregator (< 150ms SLA)
 * Returns benefit quota, streak, recent visits, cooldown state, and 24h offline cryptographic pass seed.
 */
async function getEmployeeDashboard(employee) {
  const startTime = Date.now();
  const { startOfMonth, resetDate, startOfWeek, fourWeeksAgo } = getDateBoundaries();

  // Run all telemetry queries in parallel for sub-150ms execution
  const [
    benefit,
    monthVisitsRes,
    weekVisitsRes,
    recentVisitsRes,
    cooldownRes,
    streakHistoryRes
  ] = await Promise.all([
    // 1. Benefit & eligibility
    resolveActiveBenefit(employee),

    // 2. Visits this calendar month
    supabase
      .from('visits')
      .select('id', { count: 'exact', head: true })
      .eq('employee_id', employee.id)
      .eq('status', 'verified')
      .gte('check_in_at', startOfMonth),

    // 3. Visits this current week
    supabase
      .from('visits')
      .select('id', { count: 'exact', head: true })
      .eq('employee_id', employee.id)
      .eq('status', 'verified')
      .gte('check_in_at', startOfWeek),

    // 4. Last 5 verified visits with facility and provider details
    supabase
      .from('visits')
      .select(`
        id,
        check_in_at,
        check_out_at,
        verification_method,
        status,
        provider_locations (
          id,
          name,
          city,
          address,
          providers (
            id,
            name,
            category
          )
        )
      `)
      .eq('employee_id', employee.id)
      .order('check_in_at', { ascending: false })
      .limit(5),

    // 5. Check anti-passback cooldown (last check-in in the last 45 minutes)
    supabase
      .from('visits')
      .select('check_in_at, provider_locations(name)')
      .eq('employee_id', employee.id)
      .eq('status', 'verified')
      .gte('check_in_at', new Date(Date.now() - 45 * 60 * 1000).toISOString())
      .order('check_in_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // 6. Streak history (visits in last 4 weeks)
    supabase
      .from('visits')
      .select('check_in_at')
      .eq('employee_id', employee.id)
      .eq('status', 'verified')
      .gte('check_in_at', fourWeeksAgo)
      .order('check_in_at', { ascending: true })
  ]);

  const usedVisits = monthVisitsRes.count || 0;
  const visitsThisWeek = weekVisitsRes.count || 0;
  const maxVisits = benefit?.max_monthly_visits ?? null;
  const remainingVisits = maxVisits !== null ? Math.max(0, maxVisits - usedVisits) : 'unlimited';
  const quotaPercentage = maxVisits ? Math.min(100, Math.round((usedVisits / maxVisits) * 100)) : 0;
  const coPayPct = Number(benefit?.co_pay_percentage || 0);

  // Calculate anti-passback cooldown
  const cooldownWindowMinutes = 30;
  let inCooldown = false;
  let cooldownRemainingSeconds = 0;
  let lastRecentCheckIn = null;

  if (cooldownRes.data?.check_in_at) {
    const lastCheckInMs = new Date(cooldownRes.data.check_in_at).getTime();
    const elapsedSeconds = Math.floor((Date.now() - lastCheckInMs) / 1000);
    const cooldownWindowSeconds = cooldownWindowMinutes * 60;
    if (elapsedSeconds < cooldownWindowSeconds) {
      inCooldown = true;
      cooldownRemainingSeconds = cooldownWindowSeconds - elapsedSeconds;
      lastRecentCheckIn = {
        at: cooldownRes.data.check_in_at,
        facility: cooldownRes.data.provider_locations?.name || 'In-Network Facility'
      };
    }
  }

  // Calculate active week streak
  const streakVisits = streakHistoryRes.data || [];
  const activeWeeks = new Set();
  streakVisits.forEach((v) => {
    const vDate = new Date(v.check_in_at);
    const weekNum = Math.floor((Date.now() - vDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    activeWeeks.add(weekNum);
  });
  const activeWeeksStreak = activeWeeks.size;
  const habitGoal = 3; // Standard recommended weekly sessions
  const habitProgressPercentage = Math.min(100, Math.round((visitsThisWeek / habitGoal) * 100));

  // 24-hour cryptographic offline seed provisioning (for Tab 1: Pass vault)
  const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const seedPayload = {
    employee_id: employee.id,
    org_id: employee.org_id,
    valid_until: validUntil,
    step_seconds: DEFAULT_TIME_STEP_SECONDS,
    issued_at: Date.now()
  };
  const offlineSeedToken = signPassPayload(seedPayload);
  const watermarkText = `${employee.full_name} • ${employee.organizations?.name || 'PolyFit'}`;

  // Format clean recent visits list
  const recentVisits = (recentVisitsRes.data || []).map((v) => ({
    id: v.id,
    check_in_at: v.check_in_at,
    check_out_at: v.check_out_at,
    status: v.status,
    verification_method: v.verification_method,
    location_id: v.provider_locations?.id || null,
    location_name: v.provider_locations?.name || 'Partner Facility',
    city: v.provider_locations?.city || 'Kigali',
    address: v.provider_locations?.address || null,
    provider_name: v.provider_locations?.providers?.name || 'Wellness Provider',
    category: v.provider_locations?.providers?.category || 'gym'
  }));

  const lastVisit = recentVisits[0] || null;
  const durationMs = Date.now() - startTime;

  return {
    success: true,
    telemetry: {
      execution_ms: durationMs,
      cached: false
    },
    employee: {
      id: employee.id,
      full_name: employee.full_name,
      email: employee.email,
      department: employee.department || null,
      tier: employee.tier || 'standard',
      status: employee.status || 'active'
    },
    organization: {
      id: employee.organizations?.id || employee.org_id,
      name: employee.organizations?.name || 'Corporate Employer',
      domain: employee.email ? employee.email.split('@')[1] : null
    },
    benefit: {
      id: benefit?.id || null,
      name: benefit?.name || 'Corporate Wellness Tier',
      tier: benefit?.tier || employee.tier || 'standard',
      max_monthly_visits: maxVisits,
      used_visits: usedVisits,
      remaining_visits: remainingVisits,
      quota_percentage: quotaPercentage,
      reset_date: resetDate,
      is_unlimited: maxVisits === null,
      co_pay_percentage: coPayPct,
      allowed_categories: benefit?.allowed_provider_categories || VALID_CATEGORIES
    },
    streak: {
      visits_this_week: visitsThisWeek,
      active_weeks_streak: activeWeeksStreak,
      habit_goal: habitGoal,
      habit_progress_percentage: habitProgressPercentage,
      last_visit_at: lastVisit ? lastVisit.check_in_at : null
    },
    recent_visits: recentVisits,
    offline_seed: {
      seed_token: offlineSeedToken,
      employee_id: employee.id,
      org_id: employee.org_id,
      valid_until: validUntil,
      step_seconds: DEFAULT_TIME_STEP_SECONDS,
      watermark_text: watermarkText
    },
    pass_status: {
      can_generate_pass: employee.status === 'active' && (maxVisits === null || usedVisits < maxVisits),
      in_cooldown: inCooldown,
      cooldown_remaining_seconds: cooldownRemainingSeconds,
      cooldown_window_minutes: cooldownWindowMinutes,
      last_check_in: lastRecentCheckIn
    }
  };
}

/**
 * GET /api/employee/visits
 * Paginated visit history with category and date filtering (Tab 3: Me)
 */
async function getEmployeeVisits(employeeId, options = {}) {
  if (!supabase) {
    throw { status: 503, message: 'Database service unavailable', code: 'DB_UNAVAILABLE' };
  }

  const { page = 1, limit = 20, category = 'all', status = null } = options;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const from = (pageNum - 1) * limitNum;
  const to = from + limitNum - 1;

  let query = supabase
    .from('visits')
    .select(`
      id,
      check_in_at,
      check_out_at,
      verification_method,
      status,
      totp_token_hash,
      provider_locations (
        id,
        name,
        city,
        address,
        providers (
          id,
          name,
          category
        )
      )
    `, { count: 'exact' })
    .eq('employee_id', employeeId);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  query = query.range(from, to).order('check_in_at', { ascending: false });

  const { data: visits, count, error } = await query;
  if (error) {
    throw { status: 500, message: error.message, code: 'VISITS_FETCH_FAILED' };
  }

  // Filter by category in memory if requested (across joined provider)
  let filtered = visits || [];
  if (category && category !== 'all') {
    filtered = filtered.filter((v) => v.provider_locations?.providers?.category === category.toLowerCase());
  }

  const formattedVisits = filtered.map((v) => ({
    id: v.id,
    check_in_at: v.check_in_at,
    check_out_at: v.check_out_at,
    status: v.status,
    verification_method: v.verification_method,
    location_id: v.provider_locations?.id || null,
    location_name: v.provider_locations?.name || 'Partner Facility',
    city: v.provider_locations?.city || 'Kigali',
    address: v.provider_locations?.address || null,
    provider_name: v.provider_locations?.providers?.name || 'Wellness Provider',
    category: v.provider_locations?.providers?.category || 'gym'
  }));

  const total = count !== null ? count : formattedVisits.length;

  return {
    visits: formattedVisits,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      total_pages: Math.ceil(total / limitNum) || 1
    }
  };
}

/**
 * GET /api/employee/network
 * In-Network Wellness Provider Facilities (Tab 2: Explore Network)
 * Scoped to categories allowed by the employee's corporate benefit tier
 */
async function getEmployeeNetwork(employee, options = {}) {
  if (!supabase) {
    throw { status: 503, message: 'Database service unavailable', code: 'DB_UNAVAILABLE' };
  }

  const { category = 'all', city = null, search = null, lat = null, lng = null } = options;
  const benefit = await resolveActiveBenefit(employee);
  const allowedCategories = benefit?.allowed_provider_categories || VALID_CATEGORIES;

  let query = supabase
    .from('provider_locations')
    .select(`
      id,
      name,
      city,
      address,
      country,
      lat,
      lng,
      operating_hours,
      amenities,
      photos,
      status,
      providers (
        id,
        name,
        category,
        status
      )
    `)
    .eq('status', 'active');

  if (city) {
    query = query.ilike('city', `%${city.trim()}%`);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,address.ilike.%${search}%`);
  }

  const { data: locations, error } = await query;
  if (error) {
    throw { status: 500, message: error.message, code: 'NETWORK_FETCH_FAILED' };
  }

  // Filter only in-network providers (active and within allowed categories)
  let eligibleFacilities = (locations || []).filter((loc) => {
    const prov = loc.providers;
    if (!prov || prov.status !== 'active') return false;
    if (!allowedCategories.includes(prov.category)) return false;
    if (category && category !== 'all' && prov.category !== category.toLowerCase()) return false;
    return true;
  });

  // Calculate distance if lat/lng supplied
  const userLat = lat ? parseFloat(lat) : null;
  const userLng = lng ? parseFloat(lng) : null;

  const results = eligibleFacilities.map((loc) => {
    let distanceMeters = null;
    if (userLat && userLng && loc.lat && loc.lng) {
      distanceMeters = Math.round(
        getDistanceFromLatLonInM(userLat, userLng, parseFloat(loc.lat), parseFloat(loc.lng))
      );
    }

    return {
      id: loc.id,
      name: loc.name,
      city: loc.city,
      address: loc.address,
      country: loc.country || 'Rwanda',
      latitude: loc.lat ? parseFloat(loc.lat) : null,
      longitude: loc.lng ? parseFloat(loc.lng) : null,
      amenities: loc.amenities || [],
      photos: loc.photos || [],
      operating_hours: loc.operating_hours || null,
      distance_meters: distanceMeters,
      provider: {
        id: loc.providers.id,
        name: loc.providers.name,
        category: loc.providers.category
      },
      plan_access: {
        included: true,
        tier_required: benefit?.tier || 'standard'
      }
    };
  });

  // Sort by distance if user location provided, otherwise alphabetical by facility name
  if (userLat && userLng) {
    results.sort((a, b) => (a.distance_meters || 9999999) - (b.distance_meters || 9999999));
  } else {
    results.sort((a, b) => a.name.localeCompare(b.name));
  }

  return {
    facilities: results,
    total_in_network: results.length,
    plan_tier: benefit?.tier || 'standard',
    allowed_categories: allowedCategories
  };
}

module.exports = {
  getEmployeeForAuthUser,
  resolveActiveBenefit,
  getEmployeeMe,
  getEmployeeDashboard,
  getEmployeeVisits,
  getEmployeeNetwork
};
