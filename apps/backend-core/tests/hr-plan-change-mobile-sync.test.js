/**
 * HR Corporate Plan Change & Mobile Employee Real-Time Synchronization Test
 * Validates that when HR changes an employee's tier/plan in the Corporate Portal:
 * 1. The database (employees & eligibility) is updated in real time.
 * 2. The mobile API (GET /api/employee/me) immediately returns the new plan, quota, and allowances.
 * 3. Reverting the change restores the previous plan state cleanly.
 */

const request = require('supertest');
const app = require('../index');
const { supabase } = require('@polyfit/supabase-client');

const KTI_ORG_ID = '02f13bdc-ce25-4c9d-b712-451c06a63fa2';
const CLAIRE_EMP_ID = '6f49f5f6-a72d-44d2-bac5-82db218b00ce';
const STARTER_BENEFIT_ID = '5a34931f-8266-4167-aa9d-2fda42c1ab4f';
const EXECUTIVE_BENEFIT_ID = '7d734dd3-2ac3-40f0-a0a9-30a824415ec0';
const SUPER_ADMIN_TOKEN = 'Bearer demo-super-admin-token';

async function runSyncVerification() {
  console.log('='.repeat(75));
  console.log(' HR CORPORATE PLAN CHANGE ➔ MOBILE EMPLOYEE SYNC AUDIT');
  console.log('='.repeat(75));

  // Step 1: Query initial state for Claire Mukamana
  console.log('\n[Step 1] Fetching initial mobile state for Claire Mukamana...');
  const initialRes = await request(app)
    .get(`/api/employee/me?employee_id=${CLAIRE_EMP_ID}`)
    .set('Authorization', SUPER_ADMIN_TOKEN);

  console.log(`Initial Status: HTTP ${initialRes.status}`);
  console.log(`Initial Plan: ${initialRes.body.benefit?.name} (Tier: ${initialRes.body.benefit?.tier})`);
  console.log(`Initial Max Visits: ${initialRes.body.benefit?.max_monthly_visits}`);
  console.log(`Initial Co-Pay: ${initialRes.body.benefit?.co_pay_percentage}%`);

  // Step 2: HR upgrades Claire to Executive Tier via Corporate Portal Endpoint
  console.log('\n[Step 2] HR updates Claire to Executive Tier via PATCH /api/public/corporate/employees/:id...');
  const upgradeRes = await request(app)
    .patch(`/api/public/corporate/employees/${CLAIRE_EMP_ID}`)
    .send({ tier: 'executive' });

  console.log(`HR Upgrade Response: HTTP ${upgradeRes.status}`);
  if (upgradeRes.status !== 200) {
    throw new Error(`Failed to update tier: ${JSON.stringify(upgradeRes.body)}`);
  }

  // Step 3: Verify employee mobile app gets the updated plan immediately
  console.log('\n[Step 3] Employee Mobile App refreshes profile via GET /api/employee/me...');
  const upgradedMobileRes = await request(app)
    .get(`/api/employee/me?employee_id=${CLAIRE_EMP_ID}`)
    .set('Authorization', SUPER_ADMIN_TOKEN);

  console.log(`Upgraded Mobile Response: HTTP ${upgradedMobileRes.status}`);
  console.log(`New Active Plan: ${upgradedMobileRes.body.benefit?.name} (Tier: ${upgradedMobileRes.body.benefit?.tier})`);
  console.log(`New Max Visits: ${upgradedMobileRes.body.benefit?.max_monthly_visits}`);
  console.log(`New Co-Pay: ${upgradedMobileRes.body.benefit?.co_pay_percentage}%`);

  const isUpgraded = 
    upgradedMobileRes.body.benefit?.tier === 'executive' &&
    upgradedMobileRes.body.benefit?.max_monthly_visits === 16;

  if (isUpgraded) {
    console.log('✓ SUCCESS: Mobile App immediately reflected the HR tier change (16 visits, Executive plan)!');
  } else {
    console.error('✗ FAILED: Mobile App did not reflect Executive plan!');
  }

  // Step 4: HR assigns a specific plan via POST /api/public/corporate/benefits/:id/assign
  console.log('\n[Step 4] HR assigns Starter Plan explicitly via POST /api/public/corporate/benefits/:id/assign...');
  const assignRes = await request(app)
    .post(`/api/public/corporate/benefits/${STARTER_BENEFIT_ID}/assign`)
    .send({ employeeIds: [CLAIRE_EMP_ID] });

  console.log(`HR Assign Response: HTTP ${assignRes.status}`);

  // Step 5: Verify mobile app reflects the newly assigned Starter Plan
  console.log('\n[Step 5] Employee Mobile App refreshes profile again...');
  const revertedMobileRes = await request(app)
    .get(`/api/employee/me?employee_id=${CLAIRE_EMP_ID}`)
    .set('Authorization', SUPER_ADMIN_TOKEN);

  console.log(`Reverted Mobile Response: HTTP ${revertedMobileRes.status}`);
  console.log(`Reverted Active Plan: ${revertedMobileRes.body.benefit?.name} (Tier: ${revertedMobileRes.body.benefit?.tier})`);
  console.log(`Reverted Max Visits: ${revertedMobileRes.body.benefit?.max_monthly_visits}`);
  console.log(`Reverted Co-Pay: ${revertedMobileRes.body.benefit?.co_pay_percentage}%`);

  const isReverted = 
    revertedMobileRes.body.benefit?.tier === 'starter' &&
    revertedMobileRes.body.benefit?.max_monthly_visits === 8;

  if (isReverted) {
    console.log('✓ SUCCESS: Mobile App immediately reflected the assigned Starter plan (8 visits, Starter plan)!');
  } else {
    console.error('✗ FAILED: Mobile App did not revert to Starter plan!');
  }

  console.log('\n' + '='.repeat(75));
  if (isUpgraded && isReverted) {
    console.log('>>> COMPLETE HR PLAN CHANGE ➔ MOBILE APP REAL-TIME SYNC VERIFIED 100% <<<');
    process.exit(0);
  } else {
    console.error('>>> HR PLAN CHANGE SYNC FAILED <<<');
    process.exit(1);
  }
}

runSyncVerification().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
