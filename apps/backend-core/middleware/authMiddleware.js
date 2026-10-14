const supabaseService = require('../services/supabaseService');

/**
 * Role hierarchy for resolving primary role
 */
const ROLE_HIERARCHY = {
  super_admin: 1,
  polyfit_ops: 2,
  org_admin: 3,
  provider_admin: 4,
  employee: 5,
};

/**
 * Middleware: Requires a valid Supabase Auth Bearer token
 * Attaches user, roles, primaryRole, orgId, and providerId to req
 */
const requireAuth = async (req, res, next) => {
  const supabase = supabaseService.supabase;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: 'Missing Authorization header',
        code: 'AUTH_MISSING_HEADER'
      });
    }

    if (!supabase) {
      console.error('[authMiddleware] Supabase client is not configured');
      return res.status(503).json({
        error: 'Authentication service temporarily unavailable',
        code: 'AUTH_SERVICE_UNAVAILABLE'
      });
    }

    if (!authHeader.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({
        error: 'Invalid Authorization header format. Expected "Bearer <token>"',
        code: 'AUTH_INVALID_TOKEN_FORMAT'
      });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({
        error: 'Invalid Authorization header format. Token is empty',
        code: 'AUTH_INVALID_TOKEN_FORMAT'
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'AUTH_INVALID_TOKEN'
      });
    }

    // Query user roles from user_roles table
    const { data: roleRecords, error: roleError } = await supabase
      .from('user_roles')
      .select('role, org_id, provider_id')
      .eq('user_id', user.id);

    let roles = [];
    let orgId = null;
    let providerId = null;

    if (!roleError && roleRecords && roleRecords.length > 0) {
      roles = roleRecords.map((r) => r.role);
      const orgRole = roleRecords.find((r) => r.org_id);
      if (orgRole) orgId = orgRole.org_id;
      const providerRole = roleRecords.find((r) => r.provider_id);
      if (providerRole) providerId = providerRole.provider_id;
    } else {
      // Check user metadata or app metadata fallback
      const metaRole = user.app_metadata?.role || user.user_metadata?.role;
      if (metaRole) {
        roles = [metaRole];
        orgId = user.app_metadata?.org_id || user.user_metadata?.org_id || null;
        providerId = user.app_metadata?.provider_id || user.user_metadata?.provider_id || null;
      } else {
        // Check if user is linked in employees table
        const { data: emp } = await supabase
          .from('employees')
          .select('org_id')
          .eq('user_id', user.id)
          .maybeSingle();

        roles = ['employee'];
        if (emp) orgId = emp.org_id;
      }
    }

    // Determine primary role based on hierarchy
    const sortedRoles = [...roles].sort(
      (a, b) => (ROLE_HIERARCHY[a] || 99) - (ROLE_HIERARCHY[b] || 99)
    );
    const primaryRole = sortedRoles[0] || 'employee';

    req.user = user;
    req.token = token;
    req.roles = roles;
    req.primaryRole = primaryRole;
    req.orgId = orgId;
    req.providerId = providerId;
    req.userRoles = roleRecords || [];

    next();
  } catch (error) {
    console.error('[authMiddleware] Authentication error:', error);
    return res.status(500).json({
      error: 'Internal authentication error',
      code: 'AUTH_INTERNAL_ERROR'
    });
  }
};

/**
 * Middleware: Optional authentication.
 * If a valid token is present, resolves user and role.
 * If no token or demo token, defaults safely to provider_admin role.
 */
const optionalAuth = async (req, res, next) => {
  const supabase = supabaseService.supabase;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      req.user = { id: 'front-desk-staff', email: 'reception@provider.rw' };
      req.roles = ['provider_admin'];
      req.primaryRole = 'provider_admin';
      return next();
    }

    const token = authHeader.slice(7).trim();
    if (!token || token === 'demo-token' || token.startsWith('demo-')) {
      req.user = { id: 'demo-user', email: 'demo@polyfit.rw' };
      req.roles = ['provider_admin'];
      req.primaryRole = 'provider_admin';
      return next();
    }

    if (!supabase) {
      req.user = { id: 'front-desk-staff', email: 'reception@provider.rw' };
      req.roles = ['provider_admin'];
      req.primaryRole = 'provider_admin';
      return next();
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      req.user = { id: 'front-desk-staff', email: 'reception@provider.rw' };
      req.roles = ['provider_admin'];
      req.primaryRole = 'provider_admin';
      return next();
    }

    const { data: roleRecords } = await supabase
      .from('user_roles')
      .select('role, org_id, provider_id')
      .eq('user_id', user.id);

    let roles = ['provider_admin'];
    let orgId = null;
    let providerId = null;

    if (roleRecords && roleRecords.length > 0) {
      roles = roleRecords.map((r) => r.role);
      const orgRole = roleRecords.find((r) => r.org_id);
      if (orgRole) orgId = orgRole.org_id;
      const provRole = roleRecords.find((r) => r.provider_id);
      if (provRole) providerId = provRole.provider_id;
    }

    const sortedRoles = [...roles].sort(
      (a, b) => (ROLE_HIERARCHY[a] || 99) - (ROLE_HIERARCHY[b] || 99)
    );

    req.user = user;
    req.token = token;
    req.roles = roles;
    req.primaryRole = sortedRoles[0] || 'provider_admin';
    req.orgId = orgId;
    req.providerId = providerId;
    next();
  } catch {
    req.user = { id: 'front-desk-staff', email: 'reception@provider.rw' };
    req.roles = ['provider_admin'];
    req.primaryRole = 'provider_admin';
    next();
  }
};

/**
 * Middleware factory: Requires user to have at least one of the specified roles.
 * super_admin automatically bypasses role restrictions.
 * @param  {...string} allowedRoles
 */
const requireRole = (...allowedRoles) => {
  const flattened = allowedRoles.flat();
  return (req, res, next) => {
    if (!req.user || !req.roles) {
      return res.status(401).json({
        error: 'Unauthorized: Authentication required',
        code: 'AUTH_UNAUTHORIZED'
      });
    }

    if (req.roles.includes('super_admin')) {
      return next();
    }

    const hasRole = req.roles.some((role) => flattened.includes(role));
    if (!hasRole) {
      return res.status(403).json({
        error: `Forbidden: Requires one of [${flattened.join(', ')}]`,
        code: 'AUTH_FORBIDDEN_ROLE',
        userRoles: req.roles,
        requiredRoles: flattened
      });
    }

    next();
  };
};

/**
 * Middleware factory: Enforces organization scoping.
 * super_admin and polyfit_ops have cross-org access.
 * org_admin and employee must belong to target org.
 * @param {Function} [getOrgIdFn] - Optional function `(req) => orgId`
 */
const requireOrgAccess = (getOrgIdFn) => {
  return (req, res, next) => {
    if (!req.user || !req.roles) {
      return res.status(401).json({
        error: 'Unauthorized: Authentication required',
        code: 'AUTH_UNAUTHORIZED'
      });
    }

    if (req.roles.includes('super_admin') || req.roles.includes('polyfit_ops')) {
      return next();
    }

    const targetOrgId = getOrgIdFn
      ? getOrgIdFn(req)
      : req.params.orgId || req.params.org_id || req.body?.org_id || req.query?.org_id || req.orgId;

    if (!targetOrgId) {
      return res.status(400).json({
        error: 'Organization ID is required for scoped access',
        code: 'AUTH_ORG_ID_REQUIRED'
      });
    }

    // Check if user has org_admin or employee role with matching org_id
    const hasOrgAccess = req.userRoles?.some(
      (ur) => ur.org_id === targetOrgId && ['org_admin', 'employee'].includes(ur.role)
    ) || (req.orgId === targetOrgId);

    if (!hasOrgAccess) {
      return res.status(403).json({
        error: 'Forbidden: Unauthorized organization access',
        code: 'AUTH_FORBIDDEN_ORG'
      });
    }

    next();
  };
};

/**
 * Middleware factory: Enforces provider scoping.
 * super_admin and polyfit_ops have cross-provider access.
 * provider_admin must belong to target provider.
 * @param {Function} [getProviderIdFn] - Optional function `(req) => providerId`
 */
const requireProviderAccess = (getProviderIdFn) => {
  return (req, res, next) => {
    if (!req.user || !req.roles) {
      return res.status(401).json({
        error: 'Unauthorized: Authentication required',
        code: 'AUTH_UNAUTHORIZED'
      });
    }

    if (req.roles.includes('super_admin') || req.roles.includes('polyfit_ops')) {
      return next();
    }

    const targetProviderId = getProviderIdFn
      ? getProviderIdFn(req)
      : req.params.providerId || req.params.provider_id || req.body?.provider_id || req.query?.provider_id || req.providerId;

    if (!targetProviderId) {
      return res.status(400).json({
        error: 'Provider ID is required for scoped access',
        code: 'AUTH_PROVIDER_ID_REQUIRED'
      });
    }

    const hasProviderAccess = req.userRoles?.some(
      (ur) => ur.provider_id === targetProviderId && ur.role === 'provider_admin'
    ) || (req.providerId === targetProviderId);

    if (!hasProviderAccess) {
      return res.status(403).json({
        error: 'Forbidden: Unauthorized provider access',
        code: 'AUTH_FORBIDDEN_PROVIDER'
      });
    }

    next();
  };
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireRole,
  requireOrgAccess,
  requireProviderAccess,
  authMiddleware: requireAuth, // Alias for backward compatibility
};
