const { supabase } = require('./supabaseService');

const VALID_CONTRACT_STATUSES = ['draft', 'active', 'suspended', 'terminated'];

/**
 * Creates a new contract between an employer organization and a wellness provider.
 * Enforces business rules and validates entities exist before creation.
 *
 * @param {Object} params
 * @param {string} params.orgId - UUID of employer organization
 * @param {string} params.providerId - UUID of wellness provider
 * @param {number} params.perVisitRate - Agreed reimbursement rate per verified visit (RWF/KES)
 * @param {number} [params.monthlyCap] - Max visits reimbursable per month under this contract
 * @param {Object} [params.accessHours] - Permitted access days/hours JSON
 * @param {string} [params.effectiveFrom] - Contract start date (YYYY-MM-DD)
 * @param {string} [params.effectiveTo] - Contract end date (YYYY-MM-DD)
 * @param {string} [params.status='draft'] - Contract status
 * @returns {Promise<Object>} Created contract record
 */
async function createContract({
  orgId,
  providerId,
  perVisitRate,
  monthlyCap = null,
  accessHours = null,
  effectiveFrom = null,
  effectiveTo = null,
  status = 'draft'
}) {
  if (!supabase) {
    throw new Error('Database service unavailable');
  }

  if (!orgId) {
    const error = new Error('Organization ID is required');
    error.code = 'CONTRACT_MISSING_ORG_ID';
    error.statusCode = 400;
    throw error;
  }

  if (!providerId) {
    const error = new Error('Provider ID is required');
    error.code = 'CONTRACT_MISSING_PROVIDER_ID';
    error.statusCode = 400;
    throw error;
  }

  const rate = Number(perVisitRate);
  if (isNaN(rate) || rate < 0) {
    const error = new Error('per_visit_rate must be a non-negative number');
    error.code = 'CONTRACT_INVALID_RATE';
    error.statusCode = 400;
    throw error;
  }

  if (!VALID_CONTRACT_STATUSES.includes(status)) {
    const error = new Error(`Status must be one of [${VALID_CONTRACT_STATUSES.join(', ')}]`);
    error.code = 'CONTRACT_INVALID_STATUS';
    error.statusCode = 400;
    throw error;
  }

  // Validate Organization exists
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, status')
    .eq('id', orgId)
    .maybeSingle();

  if (orgError) {
    const error = new Error(`Error verifying organization: ${orgError.message}`);
    error.statusCode = 500;
    throw error;
  }
  if (!org) {
    const error = new Error(`Organization with ID ${orgId} not found`);
    error.code = 'CONTRACT_ORG_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  // Validate Provider exists
  const { data: provider, error: providerError } = await supabase
    .from('providers')
    .select('id, name, status, category')
    .eq('id', providerId)
    .maybeSingle();

  if (providerError) {
    const error = new Error(`Error verifying provider: ${providerError.message}`);
    error.statusCode = 500;
    throw error;
  }
  if (!provider) {
    const error = new Error(`Provider with ID ${providerId} not found`);
    error.code = 'CONTRACT_PROVIDER_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  const startDate = effectiveFrom || new Date().toISOString().split('T')[0];

  const insertPayload = {
    org_id: orgId,
    provider_id: providerId,
    per_visit_rate: rate,
    monthly_cap: monthlyCap !== null && monthlyCap !== undefined ? Number(monthlyCap) : null,
    access_hours: accessHours || null,
    effective_from: startDate,
    effective_to: effectiveTo || null,
    status
  };

  const { data: contract, error: insertError } = await supabase
    .from('provider_contracts')
    .insert(insertPayload)
    .select(`
      *,
      organization:organizations(id, name, status),
      provider:providers(id, name, category, status)
    `)
    .single();

  if (insertError) {
    const error = new Error(`Failed to create contract: ${insertError.message}`);
    error.code = 'CONTRACT_CREATE_FAILED';
    error.statusCode = 500;
    throw error;
  }

  return contract;
}

/**
 * Lists contracts with role-scoped security filtering.
 *
 * @param {Object} options
 * @param {string[]} options.userRoles - User's platform roles
 * @param {string} [options.userOrgId] - User's orgId if org_admin
 * @param {string} [options.userProviderId] - User's providerId if provider_admin
 * @param {string} [options.filterOrgId] - Admin filter by orgId
 * @param {string} [options.filterProviderId] - Admin filter by providerId
 * @param {string} [options.status] - Filter by status
 * @param {number} [options.page=1]
 * @param {number} [options.limit=50]
 * @returns {Promise<{contracts: Array, total: number, page: number, limit: number}>}
 */
async function listContracts({
  userRoles = [],
  userOrgId = null,
  userProviderId = null,
  filterOrgId = null,
  filterProviderId = null,
  status = null,
  page = 1,
  limit = 50
}) {
  if (!supabase) {
    throw new Error('Database service unavailable');
  }

  const isPlatformAdmin = userRoles.includes('super_admin') || userRoles.includes('polyfit_ops');
  const isOrgAdmin = userRoles.includes('org_admin');
  const isProviderAdmin = userRoles.includes('provider_admin');

  let query = supabase
    .from('provider_contracts')
    .select(`
      *,
      organization:organizations(id, name, status),
      provider:providers(id, name, category, status)
    `, { count: 'exact' });

  // Apply role security scoping
  if (!isPlatformAdmin) {
    if (isOrgAdmin && userOrgId) {
      query = query.eq('org_id', userOrgId);
    } else if (isProviderAdmin && userProviderId) {
      query = query.eq('provider_id', userProviderId);
    } else {
      // Forbidden or empty access
      return { contracts: [], total: 0, page, limit };
    }
  } else {
    // Admin explicit filters
    if (filterOrgId) query = query.eq('org_id', filterOrgId);
    if (filterProviderId) query = query.eq('provider_id', filterProviderId);
  }

  if (status && VALID_CONTRACT_STATUSES.includes(status)) {
    query = query.eq('status', status);
  }

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data: contracts, error, count } = await query;

  if (error) {
    const err = new Error(`Failed to list contracts: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  return {
    contracts: contracts || [],
    total: count || 0,
    page: safePage,
    limit: safeLimit
  };
}

/**
 * Retrieves a single contract by ID with authorization verification.
 *
 * @param {string} contractId
 * @param {Object} authInfo - User role & context
 * @returns {Promise<Object>}
 */
async function getContractById(contractId, { userRoles = [], userOrgId = null, userProviderId = null } = {}) {
  if (!supabase) {
    throw new Error('Database service unavailable');
  }

  const { data: contract, error } = await supabase
    .from('provider_contracts')
    .select(`
      *,
      organization:organizations(id, name, status, contact_email),
      provider:providers(id, name, category, status, contact_email)
    `)
    .eq('id', contractId)
    .maybeSingle();

  if (error) {
    const err = new Error(`Error fetching contract: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  if (!contract) {
    const err = new Error(`Contract with ID ${contractId} not found`);
    err.code = 'CONTRACT_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  // Scoped authorization check
  const isPlatformAdmin = userRoles.includes('super_admin') || userRoles.includes('polyfit_ops');
  if (!isPlatformAdmin) {
    const isAllowedOrg = userOrgId && contract.org_id === userOrgId;
    const isAllowedProvider = userProviderId && contract.provider_id === userProviderId;

    if (!isAllowedOrg && !isAllowedProvider) {
      const err = new Error('Forbidden: You do not have access to this contract');
      err.code = 'CONTRACT_FORBIDDEN';
      err.statusCode = 403;
      throw err;
    }
  }

  return contract;
}

/**
 * Updates contract terms (rates, caps, access hours, dates).
 *
 * @param {string} contractId
 * @param {Object} updates
 * @returns {Promise<Object>} Updated contract
 */
async function updateContract(contractId, updates = {}) {
  if (!supabase) {
    throw new Error('Database service unavailable');
  }

  const allowedFields = ['per_visit_rate', 'monthly_cap', 'access_hours', 'effective_from', 'effective_to', 'status'];
  const updatePayload = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      if (field === 'per_visit_rate') {
        const rate = Number(updates[field]);
        if (isNaN(rate) || rate < 0) {
          const err = new Error('per_visit_rate must be a non-negative number');
          err.code = 'CONTRACT_INVALID_RATE';
          err.statusCode = 400;
          throw err;
        }
        updatePayload.per_visit_rate = rate;
      } else if (field === 'monthly_cap') {
        updatePayload.monthly_cap = updates[field] !== null ? Number(updates[field]) : null;
      } else if (field === 'status') {
        if (!VALID_CONTRACT_STATUSES.includes(updates.status)) {
          const err = new Error(`Status must be one of [${VALID_CONTRACT_STATUSES.join(', ')}]`);
          err.code = 'CONTRACT_INVALID_STATUS';
          err.statusCode = 400;
          throw err;
        }
        updatePayload.status = updates.status;
      } else {
        updatePayload[field] = updates[field];
      }
    }
  }

  updatePayload.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('provider_contracts')
    .update(updatePayload)
    .eq('id', contractId)
    .select(`
      *,
      organization:organizations(id, name, status),
      provider:providers(id, name, category, status)
    `)
    .maybeSingle();

  if (error) {
    const err = new Error(`Failed to update contract: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  if (!updated) {
    const err = new Error(`Contract with ID ${contractId} not found`);
    err.code = 'CONTRACT_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  return updated;
}

/**
 * Activates a provider contract.
 *
 * @param {string} contractId
 * @returns {Promise<Object>}
 */
async function activateContract(contractId) {
  return updateContract(contractId, { status: 'active' });
}

/**
 * Terminates a provider contract.
 *
 * @param {string} contractId
 * @returns {Promise<Object>}
 */
async function terminateContract(contractId) {
  return updateContract(contractId, { status: 'terminated' });
}

module.exports = {
  VALID_CONTRACT_STATUSES,
  createContract,
  listContracts,
  getContractById,
  updateContract,
  activateContract,
  terminateContract
};
