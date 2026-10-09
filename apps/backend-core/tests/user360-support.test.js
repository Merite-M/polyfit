const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { supabase } = require('@polyfit/supabase-client');
const app = require('../index');

describe('Super Admin User 360 Support, Device Lock Reset, RBAC & Audit Trail (PF-122)', () => {
  let sampleEmployeeId = null;
  let lockedEmployeeId = null;

  test('GET /api/operations/support/beneficiaries returns paginated beneficiaries directory with device telemetry', async () => {
    const res = await request(app)
      .get('/api/operations/support/beneficiaries?limit=10')
      .expect('Content-Type', /json/)
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.strictEqual(typeof res.body.count, 'number');
    assert.strictEqual(Array.isArray(res.body.beneficiaries), true);
    assert.ok(res.body.beneficiaries.length > 0);

    const first = res.body.beneficiaries[0];
    sampleEmployeeId = first.id;
    assert.ok(first.id);
    assert.ok(first.fullName);
    assert.ok(first.email);
    assert.ok(first.tier);
    assert.ok(first.status);
    assert.ok(first.orgName);
    assert.ok(first.device);
    assert.strictEqual(typeof first.device.isBound, 'boolean');
    assert.strictEqual(typeof first.currentMonthVisits, 'number');
    assert.strictEqual(typeof first.maxMonthlyVisits, 'number');
    assert.strictEqual(typeof first.quotaUsedPct, 'number');

    // Find employee with reset count >= 2 for lock test
    const locked = res.body.beneficiaries.find((b) => b.device.resetCount >= 2);
    if (locked) {
      lockedEmployeeId = locked.id;
    }
  });

  test('GET /api/operations/support/beneficiaries supports text search and tier filtering', async () => {
    const res = await request(app)
      .get('/api/operations/support/beneficiaries?q=mugisha&tier=standard')
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.beneficiaries));
    if (res.body.beneficiaries.length > 0) {
      assert.strictEqual(res.body.beneficiaries[0].tier, 'standard');
    }
  });

  test('GET /api/operations/support/beneficiaries/:id returns comprehensive User 360 cockpit data', async () => {
    assert.ok(sampleEmployeeId, 'Sample employee ID must be populated');

    const res = await request(app)
      .get(`/api/operations/support/beneficiaries/${sampleEmployeeId}`)
      .expect('Content-Type', /json/)
      .expect(200);

    assert.strictEqual(res.body.success, true);

    // 1. Beneficiary Profile
    assert.ok(res.body.beneficiary);
    assert.strictEqual(res.body.beneficiary.id, sampleEmployeeId);
    assert.ok(res.body.beneficiary.organization);

    // 2. Benefit Plan & Quota
    assert.ok(res.body.benefit);
    assert.ok(res.body.quota);
    assert.strictEqual(typeof res.body.quota.used, 'number');
    assert.strictEqual(typeof res.body.quota.limit, 'number');
    assert.strictEqual(typeof res.body.quota.remaining, 'number');
    assert.strictEqual(typeof res.body.quota.percentage, 'number');

    // 3. Device Binding Telemetry
    assert.ok(res.body.device);
    assert.strictEqual(typeof res.body.device.isBound, 'boolean');
    assert.strictEqual(typeof res.body.device.resetsUsed30d, 'number');
    assert.strictEqual(typeof res.body.device.maxAllowedResets, 'number');
    assert.strictEqual(typeof res.body.device.resetsRemaining, 'number');
    assert.strictEqual(typeof res.body.device.isLockedOut, 'boolean');

    // 4. Simulated Beneficiary Mobile Pass
    assert.ok(res.body.simulatedPass);
    assert.ok(res.body.simulatedPass.token);
    assert.strictEqual(res.body.simulatedPass.token.length, 6);
    assert.ok(res.body.simulatedPass.qrPayload);
    assert.strictEqual(typeof res.body.simulatedPass.secondsRemaining, 'number');
    assert.ok(res.body.simulatedPass.watermark);
    assert.ok(Array.isArray(res.body.simulatedPass.eligibleVenues));

    // 5. TOTP Clock Drift Diagnostics
    assert.ok(res.body.totpDiagnostics);
    assert.ok(res.body.totpDiagnostics.serverTime);
    assert.strictEqual(typeof res.body.totpDiagnostics.estimatedDriftMs, 'number');
    assert.ok(res.body.totpDiagnostics.secretDerivationPreview);

    // 6. Recent Historical Visits
    assert.ok(Array.isArray(res.body.recentVisits));
  });

  test('POST /api/operations/support/beneficiaries/:id/device-reset clears hardware binding and increments reset count', async () => {
    assert.ok(sampleEmployeeId);

    // Prime sample employee to ensure room under 30d limit and bound hardware
    await supabase.from('employees').update({
      device_reset_count: 0,
      device_fingerprint: 'test-fingerprint-fp122',
      device_model: 'iPhone 15 Pro',
      last_device_reset_at: null
    }).eq('id', sampleEmployeeId);

    const res = await request(app)
      .post(`/api/operations/support/beneficiaries/${sampleEmployeeId}/device-reset`)
      .send({ reason: 'Legitimate phone replacement (iPhone upgrade)' })
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.message.includes('successfully cleared'));
    assert.strictEqual(typeof res.body.resetsUsed, 'number');

    // Verify detail reflects cleared device binding
    const verifyRes = await request(app)
      .get(`/api/operations/support/beneficiaries/${sampleEmployeeId}`)
      .expect(200);

    assert.strictEqual(verifyRes.body.device.isBound, false);
    assert.strictEqual(verifyRes.body.device.fingerprint, null);
  });

  test('POST /api/operations/support/beneficiaries/:id/device-reset enforces 30-day anti-abuse rate limit (max 2) unless manager override is provided', async () => {
    const targetId = lockedEmployeeId || sampleEmployeeId;
    assert.ok(targetId);

    // Seed target employee with 2 recent resets within the 30-day window
    await supabase.from('employees').update({
      device_reset_count: 2,
      last_device_reset_at: new Date().toISOString(),
      device_fingerprint: 'locked-fingerprint-fp122'
    }).eq('id', targetId);

    // Attempt without manager override -> should be rejected with 400
    const rejectRes = await request(app)
      .post(`/api/operations/support/beneficiaries/${targetId}/device-reset`)
      .send({ reason: 'Trying 3rd reset without override', isManagerOverride: false })
      .expect(400);

    assert.strictEqual(rejectRes.body.code, 'DEVICE_RESET_LIMIT_EXCEEDED');
    assert.ok(rejectRes.body.error.includes('maximum of 2 device resets'));

    // Attempt with manager override -> should succeed
    const overrideRes = await request(app)
      .post(`/api/operations/support/beneficiaries/${targetId}/device-reset`)
      .send({ reason: 'Executive manager approval for stolen device replacement', isManagerOverride: true })
      .expect(200);

    assert.strictEqual(overrideRes.body.success, true);
    assert.ok(overrideRes.body.resetsUsed >= 3);
  });

  test('PATCH /api/operations/support/beneficiaries/:id/status updates employee status with audit record', async () => {
    assert.ok(sampleEmployeeId);

    const res = await request(app)
      .patch(`/api/operations/support/beneficiaries/${sampleEmployeeId}/status`)
      .send({ status: 'frozen', reason: 'Temporary medical leave' })
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.employee.status, 'frozen');

    // Restore to active
    await request(app)
      .patch(`/api/operations/support/beneficiaries/${sampleEmployeeId}/status`)
      .send({ status: 'active', reason: 'Medical leave concluded' })
      .expect(200);
  });

  test('PATCH /api/operations/support/beneficiaries/:id/tier overrides employee benefit tier', async () => {
    assert.ok(sampleEmployeeId);

    const res = await request(app)
      .patch(`/api/operations/support/beneficiaries/${sampleEmployeeId}/tier`)
      .send({ tier: 'executive', reason: 'Promotion to executive leadership' })
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.employee.tier, 'executive');

    // Revert to standard
    await request(app)
      .patch(`/api/operations/support/beneficiaries/${sampleEmployeeId}/tier`)
      .send({ tier: 'standard', reason: 'Revert test tier' })
      .expect(200);
  });

  test('GET /api/operations/audit-logs returns immutable operational audit trail with event filtering', async () => {
    const res = await request(app)
      .get('/api/operations/audit-logs?limit=25')
      .expect('Content-Type', /json/)
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.strictEqual(typeof res.body.count, 'number');
    assert.ok(Array.isArray(res.body.logs));
    assert.ok(res.body.logs.length > 0);

    // Verify recent device_lock_reset event exists in audit trail
    const resetEvent = res.body.logs.find((l) => l.event_type === 'device_lock_reset');
    assert.ok(resetEvent, 'device_lock_reset event must be recorded in immutable audit log');
    assert.ok(resetEvent.metadata);
  });

  test('GET /api/operations/settings returns dynamic platform settings knobs and numeric bounds', async () => {
    const res = await request(app)
      .get('/api/operations/settings')
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.settings);
    assert.strictEqual(typeof res.body.settings.anti_passback_window_minutes, 'number');
    assert.strictEqual(typeof res.body.settings.totp_step_seconds, 'number');
    assert.strictEqual(typeof res.body.settings.geofence_radius_meters, 'number');
    assert.strictEqual(typeof res.body.settings.max_device_resets_monthly, 'number');
    assert.ok(res.body.meta);
  });

  test('PATCH /api/operations/settings updates platform settings knob with boundary validation', async () => {
    // Valid update
    const validRes = await request(app)
      .patch('/api/operations/settings')
      .send({ key: 'anti_passback_window_minutes', value: 180 })
      .expect(200);

    assert.strictEqual(validRes.body.success, true);
    assert.strictEqual(validRes.body.key, 'anti_passback_window_minutes');
    assert.strictEqual(validRes.body.value, 180);

    // Out-of-bounds update (< 60) -> should fail
    const invalidRes = await request(app)
      .patch('/api/operations/settings')
      .send({ key: 'anti_passback_window_minutes', value: 10 })
      .expect(400);

    assert.ok(invalidRes.body.error.includes('must be between 60 and 360'));
  });

  test('GET /api/operations/team returns internal operator team directory and 4-tier RBAC permissions matrix', async () => {
    const res = await request(app)
      .get('/api/operations/team')
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.roleMatrix));
    assert.strictEqual(res.body.roleMatrix.length, 4);

    const roles = res.body.roleMatrix.map((r) => r.role);
    assert.ok(roles.includes('super_admin'));
    assert.ok(roles.includes('polyfit_ops'));
    assert.ok(roles.includes('finance_manager'));
    assert.ok(roles.includes('support_agent'));

    assert.ok(Array.isArray(res.body.operators));
    assert.ok(res.body.operators.length >= 4);
  });

  test('POST /api/operations/team/roles updates operator role assignment and logs audit record', async () => {
    const res = await request(app)
      .post('/api/operations/team/roles')
      .send({
        userId: 'usr-ops-support-04',
        email: 'solange.m@polyfit.rw',
        operatorName: 'Solange Mukamana',
        role: 'polyfit_ops'
      })
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.role, 'polyfit_ops');
  });
});
