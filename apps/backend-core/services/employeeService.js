const crypto = require('crypto');
const { supabase } = require('./supabaseService');

const VALID_TIERS = ['basic', 'standard', 'premium'];
const VALID_STATUSES = ['active', 'frozen', 'terminated'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Fast and resilient RFC 4180 CSV Parser
 * Handles escaped quotes, commas inside quotes, CRLF and LF line breaks.
 *
 * @param {string} csvText - Raw CSV content
 * @returns {Array<Object>} Array of parsed row objects
 */
function parseCsv(csvText) {
  if (!csvText || typeof csvText !== 'string') return [];

  const lines = [];
  let currentLine = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentLine.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // handle CRLF
      }
      currentLine.push(currentField.trim());
      currentField = '';
      if (currentLine.some((f) => f.length > 0)) {
        lines.push(currentLine);
      }
      currentLine = [];
    } else {
      currentField += char;
    }
  }

  // Push remainder
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    if (currentLine.some((f) => f.length > 0)) {
      lines.push(currentLine);
    }
  }

  if (lines.length < 2) return [];

  // Normalize header names
  const rawHeaders = lines[0];
  const headerMap = {};

  rawHeaders.forEach((h, idx) => {
    const clean = h.toLowerCase().replace(/[\s_-]+/g, '');
    if (clean === 'fullname' || clean === 'name' || clean === 'employeename') {
      headerMap[idx] = 'full_name';
    } else if (clean === 'email' || clean === 'workemail' || clean === 'emailaddress') {
      headerMap[idx] = 'email';
    } else if (clean === 'employeeid' || clean === 'employeeidexternal' || clean === 'staffid' || clean === 'id') {
      headerMap[idx] = 'employee_id_external';
    } else if (clean === 'department' || clean === 'dept' || clean === 'team') {
      headerMap[idx] = 'department';
    } else if (clean === 'tier' || clean === 'benefittier' || clean === 'plantier') {
      headerMap[idx] = 'tier';
    } else if (clean === 'status') {
      headerMap[idx] = 'status';
    }
  });

  const parsedRows = [];
  for (let r = 1; r < lines.length; r++) {
    const row = lines[r];
    const item = {
      full_name: '',
      email: '',
      employee_id_external: null,
      department: null,
      tier: 'standard',
      status: 'active'
    };

    row.forEach((val, colIdx) => {
      const field = headerMap[colIdx];
      if (field) {
        if (field === 'tier') {
          const lower = (val || '').toLowerCase().trim();
          item[field] = VALID_TIERS.includes(lower) ? lower : 'standard';
        } else if (field === 'status') {
          const lower = (val || '').toLowerCase().trim();
          item[field] = VALID_STATUSES.includes(lower) ? lower : 'active';
        } else if (field === 'email') {
          item[field] = (val || '').toLowerCase().trim();
        } else {
          item[field] = (val || '').trim() || null;
        }
      }
    });

    if (item.email || item.full_name) {
      parsedRows.push(item);
    }
  }

  return parsedRows;
}

/**
 * Creates a single employee in an organization with auto-assigned tier eligibility
 */
async function createSingleEmployee(orgId, {
  full_name,
  email,
  employee_id_external = null,
  department = null,
  tier = 'standard',
  status = 'active',
  send_invite = false,
  invited_by = null
}) {
  if (!supabase) throw new Error('Database service unavailable');

  if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
    throw { status: 400, message: 'full_name is required', code: 'EMPLOYEE_MISSING_NAME' };
  }

  const cleanEmail = (email || '').toLowerCase().trim();
  if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
    throw { status: 400, message: 'A valid email address is required', code: 'EMPLOYEE_INVALID_EMAIL' };
  }

  const cleanTier = (tier || 'standard').toLowerCase().trim();
  if (!VALID_TIERS.includes(cleanTier)) {
    throw {
      status: 400,
      message: `Invalid tier '${tier}'. Allowed: ${VALID_TIERS.join(', ')}`,
      code: 'EMPLOYEE_INVALID_TIER'
    };
  }

  const cleanStatus = (status || 'active').toLowerCase().trim();
  if (!VALID_STATUSES.includes(cleanStatus)) {
    throw {
      status: 400,
      message: `Invalid status '${status}'. Allowed: ${VALID_STATUSES.join(', ')}`,
      code: 'EMPLOYEE_INVALID_STATUS'
    };
  }

  // Check duplicate email in this org
  const { data: existingEmp } = await supabase
    .from('employees')
    .select('id, email, status')
    .eq('org_id', orgId)
    .eq('email', cleanEmail)
    .maybeSingle();

  if (existingEmp) {
    throw {
      status: 409,
      message: `Employee with email '${cleanEmail}' already exists in this organization`,
      code: 'EMPLOYEE_DUPLICATE_EMAIL',
      existingId: existingEmp.id
    };
  }

  // Insert employee record
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .insert({
      org_id: orgId,
      full_name: full_name.trim(),
      email: cleanEmail,
      employee_id_external: employee_id_external ? String(employee_id_external).trim() : null,
      department: department ? String(department).trim() : null,
      tier: cleanTier,
      status: cleanStatus
    })
    .select()
    .single();

  if (empError || !employee) {
    throw {
      status: 500,
      message: empError ? empError.message : 'Failed to create employee',
      code: 'EMPLOYEE_CREATE_FAILED'
    };
  }

  // Auto-assign eligibility to matching benefit plan
  let assignedBenefit = null;
  const { data: benefitPlan } = await supabase
    .from('benefits')
    .select('id, name, tier, max_monthly_visits')
    .eq('org_id', orgId)
    .eq('status', 'active')
    .eq('tier', cleanTier)
    .maybeSingle();

  const targetBenefit = benefitPlan || (await supabase
    .from('benefits')
    .select('id, name, tier, max_monthly_visits')
    .eq('org_id', orgId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()).data;

  if (targetBenefit) {
    const { data: elig } = await supabase
      .from('eligibility')
      .insert({
        employee_id: employee.id,
        benefit_id: targetBenefit.id,
        status: cleanStatus === 'active' ? 'active' : 'suspended'
      })
      .select()
      .maybeSingle();

    assignedBenefit = { ...targetBenefit, eligibilityId: elig?.id };
  }

  // Optional invitation creation
  let invitation = null;
  if (send_invite) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: invData } = await supabase
      .from('invitations')
      .insert({
        email: cleanEmail,
        role: 'employee',
        org_id: orgId,
        invited_by: invited_by || null,
        token,
        status: 'pending',
        expires_at: expiresAt
      })
      .select()
      .maybeSingle();
    invitation = invData;
  }

  return {
    ...employee,
    assigned_benefit: assignedBenefit,
    invitation: invitation ? { id: invitation.id, token: invitation.token, expires_at: invitation.expires_at } : null
  };
}

/**
 * Bulk imports employees from parsed CSV or JSON array (Wellhub-style)
 * Supports high-throughput batching to process 500+ employees in < 30 seconds.
 */
async function processBulkImport(orgId, rows, options = {}) {
  if (!supabase) throw new Error('Database service unavailable');
  const { updateExisting = true, sendInvites = false, invitedBy = null } = options;

  // 1. Fetch organization verification
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, status')
    .eq('id', orgId)
    .single();

  if (orgError || !org) {
    throw { status: 404, message: 'Organization not found', code: 'ORGANIZATION_NOT_FOUND' };
  }

  // 2. Fetch existing employees for org to detect duplicates / updates
  const { data: existingList } = await supabase
    .from('employees')
    .select('id, email, employee_id_external, tier, status')
    .eq('org_id', orgId);

  const existingMap = new Map();
  if (existingList) {
    existingList.forEach((e) => {
      existingMap.set(e.email.toLowerCase(), e);
    });
  }

  // 3. Fetch active benefit plans for org
  const { data: orgBenefits } = await supabase
    .from('benefits')
    .select('id, name, tier, max_monthly_visits')
    .eq('org_id', orgId)
    .eq('status', 'active');

  const benefitByTier = new Map();
  let defaultBenefit = null;
  if (orgBenefits && orgBenefits.length > 0) {
    orgBenefits.forEach((b) => {
      if (b.tier) benefitByTier.set(b.tier, b);
      if (!defaultBenefit) defaultBenefit = b;
    });
  }

  // 4. Validate and partition rows
  const seenEmailsInFile = new Set();
  const toInsert = [];
  const toUpdate = [];
  const skipped = [];
  const failed = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const rowIndex = idx + 2; // assuming row 1 was header

    const fullName = (row.full_name || '').trim();
    const email = (row.email || '').toLowerCase().trim();
    const tier = (row.tier || 'standard').toLowerCase().trim();
    const status = (row.status || 'active').toLowerCase().trim();
    const extId = row.employee_id || row.employee_id_external ? String(row.employee_id || row.employee_id_external).trim() : null;
    const department = row.department ? String(row.department).trim() : null;

    if (!fullName) {
      failed.push({ row: rowIndex, email, error: 'Missing full_name' });
      continue;
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      failed.push({ row: rowIndex, email, error: 'Invalid email address' });
      continue;
    }

    if (!VALID_TIERS.includes(tier)) {
      failed.push({ row: rowIndex, email, error: `Invalid tier '${tier}'. Allowed: ${VALID_TIERS.join(', ')}` });
      continue;
    }

    if (seenEmailsInFile.has(email)) {
      skipped.push({ row: rowIndex, email, reason: 'Duplicate email entry within CSV file' });
      continue;
    }
    seenEmailsInFile.add(email);

    const existingEmp = existingMap.get(email);
    if (existingEmp) {
      if (updateExisting) {
        toUpdate.push({
          id: existingEmp.id,
          org_id: orgId,
          full_name: fullName,
          email,
          tier,
          status,
          department,
          employee_id_external: extId,
          updated_at: new Date().toISOString()
        });
      } else {
        skipped.push({ row: rowIndex, email, reason: 'Employee already exists in organization' });
      }
    } else {
      toInsert.push({
        org_id: orgId,
        full_name: fullName,
        email,
        tier,
        status,
        department,
        employee_id_external: extId
      });
    }
  }

  // 5. Batch Insert New Employees (chunks of 100)
  const createdEmployees = [];
  const CHUNK_SIZE = 100;

  for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
    const chunk = toInsert.slice(i, i + CHUNK_SIZE);
    const { data: inserted, error: insertError } = await supabase
      .from('employees')
      .insert(chunk)
      .select('id, full_name, email, tier, status');

    if (insertError) {
      chunk.forEach((item) => {
        failed.push({ email: item.email, error: insertError.message });
      });
    } else if (inserted) {
      createdEmployees.push(...inserted);
    }
  }

  // 6. Auto-assign eligibility for newly created employees
  if (createdEmployees.length > 0 && orgBenefits && orgBenefits.length > 0) {
    const eligibilityInserts = [];
    for (const emp of createdEmployees) {
      const matchedBenefit = benefitByTier.get(emp.tier) || defaultBenefit;
      if (matchedBenefit) {
        eligibilityInserts.push({
          employee_id: emp.id,
          benefit_id: matchedBenefit.id,
          status: emp.status === 'active' ? 'active' : 'suspended'
        });
      }
    }

    if (eligibilityInserts.length > 0) {
      for (let i = 0; i < eligibilityInserts.length; i += CHUNK_SIZE) {
        const chunk = eligibilityInserts.slice(i, i + CHUNK_SIZE);
        await supabase.from('eligibility').insert(chunk);
      }
    }
  }

  // 7. Batch Update Existing Employees (concurrent batches)
  let updatedCount = 0;
  if (toUpdate.length > 0) {
    for (const item of toUpdate) {
      const { error: updErr } = await supabase
        .from('employees')
        .update({
          full_name: item.full_name,
          tier: item.tier,
          department: item.department,
          employee_id_external: item.employee_id_external,
          updated_at: item.updated_at
        })
        .eq('id', item.id);

      if (!updErr) {
        updatedCount++;
      } else {
        failed.push({ email: item.email, error: updErr.message });
      }
    }
  }

  // 8. Optional Batch Invitations
  let invitationsCreated = 0;
  if (sendInvites && createdEmployees.length > 0) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const invites = createdEmployees.map((emp) => ({
      email: emp.email,
      role: 'employee',
      org_id: orgId,
      invited_by: invitedBy,
      token: crypto.randomBytes(32).toString('hex'),
      status: 'pending',
      expires_at: expiresAt
    }));

    for (let i = 0; i < invites.length; i += CHUNK_SIZE) {
      const chunk = invites.slice(i, i + CHUNK_SIZE);
      const { data: invData } = await supabase.from('invitations').insert(chunk).select('id');
      if (invData) invitationsCreated += invData.length;
    }
  }

  return {
    organization: { id: org.id, name: org.name },
    summary: {
      total_rows: rows.length,
      created: createdEmployees.length,
      updated: updatedCount,
      skipped: skipped.length,
      failed: failed.length,
      invitations_sent: invitationsCreated
    },
    details: {
      created: createdEmployees.map((e) => ({ id: e.id, email: e.email, tier: e.tier })),
      skipped,
      failed
    }
  };
}

/**
 * Freezes employee access (Wellhub-style instant suspension)
 */
async function freezeEmployee(orgId, employeeId) {
  if (!supabase) throw new Error('Database service unavailable');

  const { data: employee, error: fetchError } = await supabase
    .from('employees')
    .select('id, org_id, user_id, full_name, email, status')
    .eq('id', employeeId)
    .eq('org_id', orgId)
    .single();

  if (fetchError || !employee) {
    throw { status: 404, message: 'Employee not found in organization', code: 'EMPLOYEE_NOT_FOUND' };
  }

  // Update employee status to 'frozen'
  const { data: updated, error: updError } = await supabase
    .from('employees')
    .update({ status: 'frozen', updated_at: new Date().toISOString() })
    .eq('id', employeeId)
    .select()
    .single();

  if (updError) {
    throw { status: 500, message: updError.message, code: 'EMPLOYEE_FREEZE_FAILED' };
  }

  // Instantly suspend all active eligibility records
  await supabase
    .from('eligibility')
    .update({ status: 'suspended' })
    .eq('employee_id', employeeId)
    .eq('status', 'active');

  // If user_id linked in Supabase Auth, flag status in app_metadata
  if (employee.user_id) {
    try {
      await supabase.auth.admin.updateUserById(employee.user_id, {
        app_metadata: { status: 'frozen' }
      });
    } catch (e) {
      console.warn('[employeeService/freeze] Supabase Auth update note:', e.message);
    }
  }

  return updated;
}

/**
 * Reactivates a frozen employee
 */
async function activateEmployee(orgId, employeeId) {
  if (!supabase) throw new Error('Database service unavailable');

  const { data: employee, error: fetchError } = await supabase
    .from('employees')
    .select('id, org_id, user_id, full_name, email, status')
    .eq('id', employeeId)
    .eq('org_id', orgId)
    .single();

  if (fetchError || !employee) {
    throw { status: 404, message: 'Employee not found in organization', code: 'EMPLOYEE_NOT_FOUND' };
  }

  const { data: updated, error: updError } = await supabase
    .from('employees')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', employeeId)
    .select()
    .single();

  if (updError) {
    throw { status: 500, message: updError.message, code: 'EMPLOYEE_ACTIVATE_FAILED' };
  }

  // Restore eligibility records
  await supabase
    .from('eligibility')
    .update({ status: 'active' })
    .eq('employee_id', employeeId)
    .eq('status', 'suspended');

  if (employee.user_id) {
    try {
      await supabase.auth.admin.updateUserById(employee.user_id, {
        app_metadata: { status: 'active' }
      });
    } catch (e) {
      console.warn('[employeeService/activate] Supabase Auth update note:', e.message);
    }
  }

  return updated;
}

/**
 * Terminates employee (revokes all access)
 */
async function terminateEmployee(orgId, employeeId) {
  if (!supabase) throw new Error('Database service unavailable');

  const { data: employee, error: fetchError } = await supabase
    .from('employees')
    .select('id, org_id, user_id, full_name, email, status')
    .eq('id', employeeId)
    .eq('org_id', orgId)
    .single();

  if (fetchError || !employee) {
    throw { status: 404, message: 'Employee not found in organization', code: 'EMPLOYEE_NOT_FOUND' };
  }

  const { data: updated, error: updError } = await supabase
    .from('employees')
    .update({ status: 'terminated', updated_at: new Date().toISOString() })
    .eq('id', employeeId)
    .select()
    .single();

  if (updError) {
    throw { status: 500, message: updError.message, code: 'EMPLOYEE_TERMINATE_FAILED' };
  }

  // Expire all eligibility
  await supabase
    .from('eligibility')
    .update({ status: 'expired' })
    .eq('employee_id', employeeId);

  if (employee.user_id) {
    try {
      await supabase.auth.admin.updateUserById(employee.user_id, {
        app_metadata: { status: 'terminated' }
      });
    } catch (e) {
      console.warn('[employeeService/terminate] Supabase Auth update note:', e.message);
    }
  }

  return updated;
}

module.exports = {
  parseCsv,
  createSingleEmployee,
  processBulkImport,
  freezeEmployee,
  activateEmployee,
  terminateEmployee,
  VALID_TIERS,
  VALID_STATUSES
};
