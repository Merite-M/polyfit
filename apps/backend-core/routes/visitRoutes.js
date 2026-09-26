const express = require('express');
const crypto = require('crypto');
const { supabase } = require('../services/supabaseService');
const { logAuthEvent } = require('../services/auditService');
const {
  requireAuth,
  requireRole,
  requireOrgAccess,
  requireProviderAccess
} = require('../middleware/authMiddleware');
const {
  deriveEmployeeSecret,
  generateTotp,
  verifyTotp,
  signPassPayload,
  verifySignedPassPayload,
  getSecondsRemainingInStep,
  getDistanceFromLatLonInM,
  DEFAULT_TIME_STEP_SECONDS
} = require('../services/totpService');

const router = express.Router();

/**
 * Helper: Find employee record linked to current user or specified employee_id
 */
async function getEmployeeForUser(req, requestedEmployeeId = null) {
  if (!supabase) return null;

  let query = supabase
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
    `);

  if (requestedEmployeeId && ['super_admin', 'polyfit_ops', 'org_admin'].includes(req.primaryRole)) {
    query = query.eq('id', requestedEmployeeId);
  } else {
    query = query.eq('user_id', req.user.id);
  }

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return data;
}

/**
 * Helper: Check active benefit eligibility and monthly visit quota
 */
async function evaluateEmployeeEligibility(employeeId, orgId, providerLocationId) {
  if (!supabase) return { eligible: false, reason: 'Database unavailable' };

  // 1. Fetch active eligibility record
  const { data: eligibility, error: elError } = await supabase
    .from('eligibility')
    .select(`
      id,
      status,
      expires_at,
      benefits (
        id,
        name,
        max_monthly_visits,
        co_pay_percentage,
        budget_cap_per_employee,
        allowed_locations,
        allowed_provider_categories
      )
    `)
    .eq('employee_id', employeeId)
    .eq('status', 'active')
    .maybeSingle();

  if (elError || !eligibility) {
    return { eligible: false, reason: 'No active wellness benefit eligibility found' };
  }

  if (eligibility.expires_at && new Date(eligibility.expires_at) < new Date()) {
    return { eligible: false, reason: 'Benefit eligibility has expired' };
  }

  const benefit = eligibility.benefits;

  // 2. Fetch provider location & provider details
  const { data: location, error: locError } = await supabase
    .from('provider_locations')
    .select(`
      id,
      name,
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
    return { eligible: false, reason: 'Provider location not found' };
  }

  if (location.status !== 'active') {
    return { eligible: false, reason: 'Provider location is currently inactive' };
  }

  // 3. Category & location restrictions check
  if (benefit.allowed_provider_categories && benefit.allowed_provider_categories.length > 0) {
    if (!benefit.allowed_provider_categories.includes(location.providers.category)) {
      return {
        eligible: false,
        reason: `Provider category '${location.providers.category}' is not covered by benefit plan`
      };
    }
  }

  if (benefit.allowed_locations && benefit.allowed_locations.length > 0) {
    if (!benefit.allowed_locations.includes(location.id)) {
      return {
        eligible: false,
        reason: 'This location is not included in employee benefit plan'
      };
    }
  }

  // 4. Provider contract check (Active contract between org and provider)
  const { data: contract, error: contractError } = await supabase
    .from('provider_contracts')
    .select('id, status, per_visit_rate, monthly_cap')
    .eq('org_id', orgId)
    .eq('provider_id', location.provider_id)
    .eq('status', 'active')
    .maybeSingle();

  if (contractError || !contract) {
    return {
      eligible: false,
      reason: 'No active contract between employer organization and this wellness provider'
    };
  }

  // 5. Monthly visit cap evaluation
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const { count: visitsThisMonth, error: countError } = await supabase
    .from('visits')
    .select('id', { count: 'exact', head: true })
    .eq('employee_id', employeeId)
    .eq('status', 'verified')
    .gte('check_in_at', startOfMonth);

  const usedVisits = visitsThisMonth || 0;
  if (benefit.max_monthly_visits && usedVisits >= benefit.max_monthly_visits) {
    return {
      eligible: false,
      reason: `Monthly visit allowance exhausted (${usedVisits}/${benefit.max_monthly_visits} visits used)`,
      usedVisits,
      maxVisits: benefit.max_monthly_visits
    };
  }

  return {
    eligible: true,
    benefit,
    location,
    contract,
    usedVisits,
    maxVisits: benefit.max_monthly_visits || null
  };
}

// ─── 1. Generate TOTP Access Pass ───────────────────────────────────────────
router.post('/generate-pass', requireAuth, async (req, res) => {
  try {
    const { provider_location_id, employee_id, lat, lng } = req.body;

    if (!provider_location_id) {
      return res.status(400).json({
        error: 'provider_location_id is required',
        code: 'VISIT_MISSING_LOCATION'
      });
    }

    if (!supabase) {
      return res.status(503).json({
        error: 'Database service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    // 1. Identify employee
    const employee = await getEmployeeForUser(req, employee_id);
    if (!employee) {
      return res.status(404).json({
        error: 'No active employee profile linked to user',
        code: 'EMPLOYEE_NOT_FOUND'
      });
    }

    if (employee.status !== 'active') {
      return res.status(403).json({
        error: `Employee account status is '${employee.status}'. Active account required`,
        code: 'EMPLOYEE_INACTIVE'
      });
    }

    // 2. Evaluate Eligibility & Cap
    const eligibilityResult = await evaluateEmployeeEligibility(
      employee.id,
      employee.org_id,
      provider_location_id
    );

    if (!eligibilityResult.eligible) {
      return res.status(403).json({
        error: eligibilityResult.reason,
        code: 'INELIGIBLE_FOR_VISIT',
        details: eligibilityResult
      });
    }

    const { location, benefit, usedVisits, maxVisits } = eligibilityResult;

    // 3. Geofence Check (PostGIS verify_geofence RPC or fallback)
    let geofencePassed = true;
    let distanceMeters = null;

    if (lat !== undefined && lng !== undefined) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      // Attempt PostGIS RPC
      const { data: geoData, error: geoError } = await supabase.rpc('verify_geofence', {
        p_location_id: provider_location_id,
        p_user_lat: userLat,
        p_user_lng: userLng
      });

      if (!geoError && geoData && geoData.length > 0) {
        geofencePassed = geoData[0].within_geofence;
        distanceMeters = geoData[0].distance_meters;
      } else if (location.lat && location.lng) {
        // Fallback using Haversine calculation from @polyfit/shared-utils
        distanceMeters = Math.round(
          getDistanceFromLatLonInM(userLat, userLng, Number(location.lat), Number(location.lng))
        );
        geofencePassed = distanceMeters <= 200;
      }

      if (!geofencePassed) {
        return res.status(403).json({
          error: `Geofence check failed: You are ${distanceMeters}m away (maximum allowed: 200m)`,
          code: 'GEOFENCE_OUT_OF_BOUNDS',
          distance_meters: distanceMeters,
          max_allowed_radius_meters: 200
        });
      }
    }

    // 4. Generate RFC 6238 TOTP
    const employeeSecret = deriveEmployeeSecret(employee.id);
    const totpToken = generateTotp(employeeSecret);
    const secondsRemaining = getSecondsRemainingInStep();
    const expiresAt = new Date(Date.now() + secondsRemaining * 1000).toISOString();

    // 5. Anti-screenshot dynamic watermark & signed payload
    const watermarkHash = crypto
      .createHash('sha256')
      .update(`${employee.id}-${Date.now()}`)
      .digest('hex')
      .slice(0, 12);

    const passData = {
      employee_id: employee.id,
      org_id: employee.org_id,
      provider_location_id,
      token: totpToken,
      expires_at: expiresAt,
      timestamp: Date.now()
    };

    const qrPayload = signPassPayload(passData);

    return res.status(200).json({
      success: true,
      token: totpToken,
      qr_payload: qrPayload,
      step_seconds: DEFAULT_TIME_STEP_SECONDS,
      expires_in_seconds: secondsRemaining,
      expires_at: expiresAt,
      watermark: {
        employee_name: employee.full_name,
        org_name: employee.organizations?.name || 'PolyFit Partner',
        anti_screenshot_hash: watermarkHash,
        verified_at: new Date().toISOString()
      },
      quota: {
        used_this_month: usedVisits,
        max_monthly_visits: maxVisits,
        remaining_visits: maxVisits ? Math.max(0, maxVisits - usedVisits) : 'Unlimited'
      },
      location: {
        id: location.id,
        name: location.name,
        distance_meters: distanceMeters
      }
    });
  } catch (error) {
    console.error('[visitRoutes/generate-pass] error:', error);
    return res.status(500).json({
      error: 'Failed to generate visit pass',
      code: 'VISIT_PASS_GENERATION_FAILED'
    });
  }
});

// ─── 2. Verify TOTP Visit (Provider-Side Scanner / Reception) ─────────────────
router.post('/verify', requireAuth, requireRole('super_admin', 'polyfit_ops', 'provider_admin'), async (req, res) => {
  try {
    const {
      token,
      employee_id,
      provider_location_id,
      qr_payload,
      device_fingerprint,
      geo_lat,
      geo_lng
    } = req.body;

    if (!supabase) {
      return res.status(503).json({
        error: 'Database service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    let resolvedEmployeeId = employee_id;
    let resolvedLocationId = provider_location_id;
    let resolvedToken = token;

    // Decode QR payload if provided
    if (qr_payload) {
      const decoded = verifySignedPassPayload(qr_payload);
      if (!decoded) {
        return res.status(400).json({
          error: 'Tampered or invalid QR pass signature',
          code: 'QR_SIGNATURE_INVALID'
        });
      }
      resolvedEmployeeId = decoded.employee_id;
      resolvedLocationId = resolvedLocationId || decoded.provider_location_id;
      resolvedToken = resolvedToken || decoded.token;
    }

    if (!resolvedEmployeeId || !resolvedLocationId || !resolvedToken) {
      return res.status(400).json({
        error: 'employee_id, provider_location_id, and token are required',
        code: 'VERIFY_MISSING_FIELDS'
      });
    }

    // Provider tenancy check
    if (req.primaryRole === 'provider_admin' && !req.roles.includes('super_admin') && !req.roles.includes('polyfit_ops')) {
      const { data: locCheck } = await supabase
        .from('provider_locations')
        .select('provider_id')
        .eq('id', resolvedLocationId)
        .single();

      if (!locCheck || locCheck.provider_id !== req.providerId) {
        return res.status(403).json({
          error: 'Unauthorized: Cannot verify visits for another provider facility',
          code: 'AUTH_FORBIDDEN_PROVIDER'
        });
      }
    }

    // 1. Validate RFC 6238 TOTP
    const employeeSecret = deriveEmployeeSecret(resolvedEmployeeId);
    const { valid } = verifyTotp(resolvedToken, employeeSecret);

    if (!valid) {
      return res.status(400).json({
        error: 'Invalid or expired TOTP token. Please ask employee to refresh pass',
        code: 'INVALID_TOTP_TOKEN'
      });
    }

    // 2. Anti-Passback Check (30-minute cooldown window)
    const { data: apData, error: apError } = await supabase.rpc('check_anti_passback', {
      p_employee_id: resolvedEmployeeId,
      p_provider_location_id: resolvedLocationId
    });

    if (!apError && apData && apData.length > 0 && !apData[0].allowed) {
      return res.status(409).json({
        error: `Anti-passback cooldown active: Re-entry allowed in ${apData[0].minutes_remaining} minutes`,
        code: 'ANTI_PASSBACK_COOLDOWN',
        last_visit_at: apData[0].last_visit_at,
        minutes_remaining: apData[0].minutes_remaining,
        cooldown_window_minutes: apData[0].cooldown_window_minutes
      });
    }

    // 3. Re-verify eligibility & fetch employee info
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, full_name, email, org_id, organizations(id, name)')
      .eq('id', resolvedEmployeeId)
      .single();

    if (empError || !employee) {
      return res.status(404).json({
        error: 'Employee record not found',
        code: 'EMPLOYEE_NOT_FOUND'
      });
    }

    const eligibilityCheck = await evaluateEmployeeEligibility(
      employee.id,
      employee.org_id,
      resolvedLocationId
    );

    if (!eligibilityCheck.eligible) {
      return res.status(403).json({
        error: eligibilityCheck.reason,
        code: 'INELIGIBLE_FOR_VISIT'
      });
    }

    // 4. Insert Verified Visit Record
    const tokenHash = crypto.createHash('sha256').update(resolvedToken).digest('hex');
    const { data: newVisit, error: insertError } = await supabase
      .from('visits')
      .insert({
        employee_id: employee.id,
        org_id: employee.org_id,
        provider_location_id: resolvedLocationId,
        verification_method: 'totp_qr',
        status: 'verified',
        check_in_at: new Date().toISOString(),
        totp_token_hash: tokenHash,
        device_fingerprint: device_fingerprint || null,
        geo_lat: geo_lat ? parseFloat(geo_lat) : null,
        geo_lng: geo_lng ? parseFloat(geo_lng) : null
      })
      .select()
      .single();

    if (insertError) {
      return res.status(400).json({
        error: insertError.message,
        code: 'VISIT_RECORDING_FAILED'
      });
    }

    await logAuthEvent({
      userId: req.user.id,
      eventType: 'visit_verified',
      metadata: {
        visit_id: newVisit.id,
        employee_id: employee.id,
        provider_location_id: resolvedLocationId,
        verification_method: 'totp_qr'
      },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Visit verified and recorded successfully',
      visit: newVisit,
      employee: {
        id: employee.id,
        full_name: employee.full_name,
        email: employee.email
      },
      organization: {
        id: employee.organizations?.id,
        name: employee.organizations?.name
      },
      location: {
        id: eligibilityCheck.location.id,
        name: eligibilityCheck.location.name
      }
    });
  } catch (error) {
    console.error('[visitRoutes/verify] error:', error);
    return res.status(500).json({
      error: 'Failed to verify visit',
      code: 'VISIT_VERIFICATION_INTERNAL_ERROR'
    });
  }
});

// ─── 3. Manual Check-In (Wellhub Partner Portal pattern) ──────────────────────
router.post('/manual-checkin', requireAuth, requireRole('super_admin', 'polyfit_ops', 'provider_admin'), async (req, res) => {
  try {
    const {
      employee_id,
      employee_email,
      provider_location_id,
      reason,
      device_fingerprint,
      geo_lat,
      geo_lng
    } = req.body;

    if (!provider_location_id || (!employee_id && !employee_email)) {
      return res.status(400).json({
        error: 'provider_location_id and employee_id (or employee_email) are required',
        code: 'MANUAL_CHECKIN_MISSING_FIELDS'
      });
    }

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        error: 'A valid reason for manual check-in is required (minimum 5 characters)',
        code: 'MANUAL_CHECKIN_REASON_REQUIRED'
      });
    }

    if (!supabase) {
      return res.status(503).json({
        error: 'Database service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    // Provider tenancy check
    if (req.primaryRole === 'provider_admin' && !req.roles.includes('super_admin') && !req.roles.includes('polyfit_ops')) {
      const { data: locCheck } = await supabase
        .from('provider_locations')
        .select('provider_id')
        .eq('id', provider_location_id)
        .single();

      if (!locCheck || locCheck.provider_id !== req.providerId) {
        return res.status(403).json({
          error: 'Unauthorized: Cannot perform manual check-in for another provider facility',
          code: 'AUTH_FORBIDDEN_PROVIDER'
        });
      }
    }

    // Find employee
    let employeeQuery = supabase
      .from('employees')
      .select('id, full_name, email, org_id, organizations(id, name)');

    if (employee_id) {
      employeeQuery = employeeQuery.eq('id', employee_id);
    } else {
      employeeQuery = employeeQuery.eq('email', employee_email.trim().toLowerCase());
    }

    const { data: employee, error: empError } = await employeeQuery.maybeSingle();
    if (empError || !employee) {
      return res.status(404).json({
        error: 'Employee not found',
        code: 'EMPLOYEE_NOT_FOUND'
      });
    }

    // Eligibility check
    const eligibilityCheck = await evaluateEmployeeEligibility(
      employee.id,
      employee.org_id,
      provider_location_id
    );

    if (!eligibilityCheck.eligible) {
      return res.status(403).json({
        error: eligibilityCheck.reason,
        code: 'INELIGIBLE_FOR_VISIT'
      });
    }

    // Anti-passback check
    const { data: apData, error: apError } = await supabase.rpc('check_anti_passback', {
      p_employee_id: employee.id,
      p_provider_location_id: provider_location_id
    });

    if (!apError && apData && apData.length > 0 && !apData[0].allowed) {
      return res.status(409).json({
        error: `Anti-passback cooldown active: Re-entry allowed in ${apData[0].minutes_remaining} minutes`,
        code: 'ANTI_PASSBACK_COOLDOWN',
        minutes_remaining: apData[0].minutes_remaining
      });
    }

    // Record manual visit
    const { data: newVisit, error: insertError } = await supabase
      .from('visits')
      .insert({
        employee_id: employee.id,
        org_id: employee.org_id,
        provider_location_id,
        verification_method: 'manual',
        status: 'verified',
        check_in_at: new Date().toISOString(),
        device_fingerprint: device_fingerprint || null,
        geo_lat: geo_lat ? parseFloat(geo_lat) : null,
        geo_lng: geo_lng ? parseFloat(geo_lng) : null
      })
      .select()
      .single();

    if (insertError) {
      return res.status(400).json({
        error: insertError.message,
        code: 'VISIT_RECORDING_FAILED'
      });
    }

    await logAuthEvent({
      userId: req.user.id,
      eventType: 'visit_manual_checkin',
      metadata: {
        visit_id: newVisit.id,
        employee_id: employee.id,
        provider_location_id,
        reason
      },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Manual check-in recorded successfully',
      visit: newVisit,
      employee: {
        id: employee.id,
        full_name: employee.full_name,
        email: employee.email
      },
      organization: {
        id: employee.organizations?.id,
        name: employee.organizations?.name
      },
      manual_reason: reason
    });
  } catch (error) {
    console.error('[visitRoutes/manual-checkin] error:', error);
    return res.status(500).json({
      error: 'Failed to record manual check-in',
      code: 'VISIT_MANUAL_CHECKIN_FAILED'
    });
  }
});

// ─── 4. Raise Dispute on Visit ───────────────────────────────────────────────
router.post('/:id/dispute', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        error: 'Reason for dispute is required (minimum 5 characters)',
        code: 'DISPUTE_REASON_REQUIRED'
      });
    }

    if (!supabase) {
      return res.status(503).json({
        error: 'Database service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    const { data: visit, error: visitError } = await supabase
      .from('visits')
      .select(`
        id,
        status,
        employee_id,
        org_id,
        provider_location_id,
        provider_locations(provider_id)
      `)
      .eq('id', id)
      .maybeSingle();

    if (visitError || !visit) {
      return res.status(404).json({
        error: 'Visit not found',
        code: 'VISIT_NOT_FOUND'
      });
    }

    let raisedByRole = 'employee';
    if (['super_admin', 'polyfit_ops'].includes(req.primaryRole)) {
      raisedByRole = 'admin';
    } else if (req.primaryRole === 'provider_admin') {
      raisedByRole = 'provider';
    }

    // Insert dispute record
    const { data: dispute, error: disputeError } = await supabase
      .from('visit_disputes')
      .insert({
        visit_id: visit.id,
        raised_by_role: raisedByRole,
        reason: reason.trim(),
        status: 'open'
      })
      .select()
      .single();

    if (disputeError) {
      return res.status(400).json({
        error: disputeError.message,
        code: 'DISPUTE_CREATION_FAILED'
      });
    }

    // Mark visit status as disputed
    await supabase
      .from('visits')
      .update({ status: 'disputed' })
      .eq('id', visit.id);

    return res.status(201).json({
      success: true,
      message: 'Dispute submitted successfully and is under investigation',
      dispute
    });
  } catch (error) {
    console.error('[visitRoutes/:id/dispute] error:', error);
    return res.status(500).json({
      error: 'Failed to submit dispute',
      code: 'DISPUTE_INTERNAL_ERROR'
    });
  }
});

// ─── 5. Resolve Dispute (Admin Only) ─────────────────────────────────────────
router.patch('/:id/dispute', requireAuth, requireRole('super_admin', 'polyfit_ops'), async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, notes } = req.body;

    const allowedResolutions = ['resolved_approved', 'resolved_rejected'];
    if (!allowedResolutions.includes(resolution)) {
      return res.status(400).json({
        error: `Invalid resolution. Must be one of [${allowedResolutions.join(', ')}]`,
        code: 'DISPUTE_INVALID_RESOLUTION'
      });
    }

    if (!supabase) {
      return res.status(503).json({
        error: 'Database service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    // Update dispute record
    const { data: updatedDispute, error: disputeError } = await supabase
      .from('visit_disputes')
      .update({
        status: resolution,
        resolved_at: new Date().toISOString(),
        resolved_by: req.user.id
      })
      .eq('visit_id', id)
      .select()
      .single();

    if (disputeError) {
      return res.status(400).json({
        error: disputeError.message,
        code: 'DISPUTE_RESOLUTION_FAILED'
      });
    }

    // Update corresponding visit status
    const targetVisitStatus = resolution === 'resolved_approved' ? 'verified' : 'rejected';
    await supabase
      .from('visits')
      .update({ status: targetVisitStatus })
      .eq('id', id);

    return res.status(200).json({
      success: true,
      message: `Dispute resolved with status '${resolution}'`,
      dispute: updatedDispute,
      visit_status: targetVisitStatus,
      notes: notes || null
    });
  } catch (error) {
    console.error('[visitRoutes/:id/dispute-patch] error:', error);
    return res.status(500).json({
      error: 'Failed to resolve dispute',
      code: 'DISPUTE_INTERNAL_ERROR'
    });
  }
});

// ─── 6. Query Visit History (Role-Scoped) ────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const {
      employee_id,
      provider_location_id,
      org_id,
      status,
      from_date,
      to_date,
      page = 1,
      limit = 20
    } = req.query;

    if (!supabase) {
      return res.status(503).json({
        error: 'Database service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('visits')
      .select(`
        id,
        check_in_at,
        check_out_at,
        status,
        verification_method,
        employee_id,
        provider_location_id,
        org_id,
        employees (
          id,
          full_name,
          email,
          department
        ),
        organizations (
          id,
          name
        ),
        provider_locations (
          id,
          name,
          city,
          providers (
            id,
            name,
            category
          )
        )
      `, { count: 'exact' });

    // Enforce Actor Scoping
    if (req.primaryRole === 'employee') {
      const emp = await getEmployeeForUser(req);
      if (!emp) return res.status(200).json({ visits: [], total: 0, page: pageNum, limit: limitNum });
      query = query.eq('employee_id', emp.id);
    } else if (req.primaryRole === 'org_admin') {
      query = query.eq('org_id', req.orgId);
    } else if (req.primaryRole === 'provider_admin') {
      // Must filter to locations belonging to provider
      const { data: locs } = await supabase
        .from('provider_locations')
        .select('id')
        .eq('provider_id', req.providerId);
      const locIds = locs?.map((l) => l.id) || [];
      query = query.in('provider_location_id', locIds.length > 0 ? locIds : ['00000000-0000-0000-0000-000000000000']);
    } else if (['super_admin', 'polyfit_ops'].includes(req.primaryRole)) {
      // Super admin / ops can filter by any provided param
      if (org_id) query = query.eq('org_id', org_id);
      if (provider_location_id) query = query.eq('provider_location_id', provider_location_id);
      if (employee_id) query = query.eq('employee_id', employee_id);
    }

    if (status) query = query.eq('status', status);
    if (from_date) query = query.gte('check_in_at', from_date);
    if (to_date) query = query.lte('check_in_at', to_date);

    query = query
      .order('check_in_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data: visits, count, error } = await query;

    if (error) {
      return res.status(400).json({
        error: error.message,
        code: 'VISIT_QUERY_FAILED'
      });
    }

    return res.status(200).json({
      visits: visits || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil((count || 0) / limitNum)
    });
  } catch (error) {
    console.error('[visitRoutes/get-all] error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve visit history',
      code: 'VISIT_QUERY_INTERNAL_ERROR'
    });
  }
});

// ─── 7. Get Single Visit Details ─────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!supabase) {
      return res.status(503).json({
        error: 'Database service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    const { data: visit, error } = await supabase
      .from('visits')
      .select(`
        id,
        check_in_at,
        check_out_at,
        status,
        verification_method,
        employee_id,
        provider_location_id,
        org_id,
        employees (
          id,
          full_name,
          email,
          department
        ),
        organizations (
          id,
          name
        ),
        provider_locations (
          id,
          name,
          address,
          city,
          providers (
            id,
            name,
            category
          )
        ),
        visit_disputes (
          id,
          status,
          reason,
          raised_by_role,
          created_at,
          resolved_at
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error || !visit) {
      return res.status(404).json({
        error: 'Visit not found',
        code: 'VISIT_NOT_FOUND'
      });
    }

    // Role-based visibility check
    if (req.primaryRole === 'org_admin' && visit.org_id !== req.orgId) {
      return res.status(403).json({ error: 'Unauthorized', code: 'AUTH_FORBIDDEN_ORG' });
    }
    if (req.primaryRole === 'provider_admin') {
      const visitProviderId = visit.provider_locations?.providers?.id;
      if (visitProviderId !== req.providerId) {
        return res.status(403).json({ error: 'Unauthorized', code: 'AUTH_FORBIDDEN_PROVIDER' });
      }
    }

    return res.status(200).json({ visit });
  } catch (error) {
    console.error('[visitRoutes/get-single] error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve visit',
      code: 'VISIT_INTERNAL_ERROR'
    });
  }
});

module.exports = router;
