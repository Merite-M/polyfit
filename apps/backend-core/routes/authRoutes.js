const express = require('express');
const crypto = require('crypto');
const { rateLimit } = require('express-rate-limit');
const { supabase } = require('../services/supabaseService');
const { logAuthEvent } = require('../services/auditService');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Strict Rate Limiter for Auth attempts (PF-78: 5 attempts per 15 min)
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts, please try again after 15 minutes',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  skip: (req) => req.headers['x-skip-rate-limit'] === 'true' && req.headers['x-enforce-rate-limit'] !== 'true'
});

const ALLOWED_ROLES = [
  'super_admin',
  'polyfit_ops',
  'org_admin',
  'provider_admin',
  'employee'
];

/**
 * Helper: fetch roles for a user ID
 */
async function fetchUserRoles(userId) {
  if (!supabase) return { roles: ['employee'], primaryRole: 'employee', orgId: null, providerId: null };

  const { data: roleRecords } = await supabase
    .from('user_roles')
    .select('role, org_id, provider_id')
    .eq('user_id', userId);

  let roles = [];
  let orgId = null;
  let providerId = null;

  if (roleRecords && roleRecords.length > 0) {
    roles = roleRecords.map((r) => r.role);
    const orgRole = roleRecords.find((r) => r.org_id);
    if (orgRole) orgId = orgRole.org_id;
    const providerRole = roleRecords.find((r) => r.provider_id);
    if (providerRole) providerId = providerRole.provider_id;
  } else {
    roles = ['employee'];
  }

  const hierarchy = { super_admin: 1, polyfit_ops: 2, org_admin: 3, provider_admin: 4, employee: 5 };
  const sorted = [...roles].sort((a, b) => (hierarchy[a] || 99) - (hierarchy[b] || 99));

  return {
    roles,
    primaryRole: sorted[0] || 'employee',
    orgId,
    providerId,
    roleRecords: roleRecords || []
  };
}

// ─── 1. Sign Up (Email/Password) ─────────────────────────────────────────────
router.post('/signup', authRateLimiter, async (req, res) => {
  try {
    const { email, password, role = 'employee', org_id, provider_id, full_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        code: 'AUTH_MISSING_CREDENTIALS'
      });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        error: `Invalid role. Allowed roles: ${ALLOWED_ROLES.join(', ')}`,
        code: 'AUTH_INVALID_ROLE'
      });
    }

    if (role === 'org_admin' && !org_id) {
      return res.status(400).json({
        error: 'org_id is required for org_admin role',
        code: 'AUTH_ORG_REQUIRED'
      });
    }

    if (role === 'provider_admin' && !provider_id) {
      return res.status(400).json({
        error: 'provider_id is required for provider_admin role',
        code: 'AUTH_PROVIDER_REQUIRED'
      });
    }

    if (!supabase) {
      return res.status(503).json({
        error: 'Auth service temporarily unavailable',
        code: 'AUTH_SERVICE_UNAVAILABLE'
      });
    }

    // Sign up via Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          org_id: org_id || null,
          provider_id: provider_id || null,
          full_name: full_name || null
        }
      }
    });

    if (signUpError) {
      return res.status(400).json({
        error: signUpError.message,
        code: 'AUTH_SIGNUP_FAILED'
      });
    }

    const user = authData.user;
    if (!user) {
      return res.status(400).json({
        error: 'User creation failed',
        code: 'AUTH_USER_CREATION_FAILED'
      });
    }

    // Insert into user_roles
    const { error: roleInsertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role,
        org_id: org_id || null,
        provider_id: provider_id || null
      });

    if (roleInsertError) {
      console.warn('[authRoutes/signup] Failed to insert into user_roles:', roleInsertError.message);
    }

    // If employee with org_id, link in employees table if exists or insert
    if (role === 'employee' && org_id) {
      await supabase
        .from('employees')
        .upsert({
          org_id,
          user_id: user.id,
          full_name: full_name || email.split('@')[0],
          email
        }, { onConflict: 'email' });
    }

    await logAuthEvent({
      userId: user.id,
      eventType: 'signup',
      metadata: { role, org_id, provider_id },
      req
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        role,
        org_id: org_id || null,
        provider_id: provider_id || null
      },
      session: authData.session
    });
  } catch (error) {
    console.error('[authRoutes/signup] Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error during registration',
      code: 'AUTH_INTERNAL_ERROR'
    });
  }
});

// ─── 2. Login (Email/Password) ───────────────────────────────────────────────
router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        code: 'AUTH_MISSING_CREDENTIALS'
      });
    }

    if (!supabase) {
      return res.status(503).json({
        error: 'Auth service temporarily unavailable',
        code: 'AUTH_SERVICE_UNAVAILABLE'
      });
    }

    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError || !authData.user) {
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'AUTH_INVALID_CREDENTIALS'
      });
    }

    const { roles, primaryRole, orgId, providerId } = await fetchUserRoles(authData.user.id);

    await logAuthEvent({
      userId: authData.user.id,
      eventType: 'login',
      metadata: { roles, primaryRole },
      req
    });

    return res.status(200).json({
      message: 'Login successful',
      session: authData.session,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        roles,
        primaryRole,
        orgId,
        providerId
      }
    });
  } catch (error) {
    console.error('[authRoutes/login] Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error during login',
      code: 'AUTH_INTERNAL_ERROR'
    });
  }
});

// ─── 3. Magic Link Login (Frictionless Onboarding) ───────────────────────────
router.post('/magic-link', authRateLimiter, async (req, res) => {
  try {
    const { email, redirectTo } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        code: 'AUTH_MISSING_EMAIL'
      });
    }

    if (!supabase) {
      return res.status(503).json({
        error: 'Auth service temporarily unavailable',
        code: 'AUTH_SERVICE_UNAVAILABLE'
      });
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: redirectTo || process.env.FRONTEND_URL || 'http://localhost:3000'
      }
    });

    if (otpError) {
      return res.status(400).json({
        error: otpError.message,
        code: 'AUTH_MAGIC_LINK_FAILED'
      });
    }

    await logAuthEvent({
      userId: null,
      eventType: 'magic_link_sent',
      metadata: { email },
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Magic link sent successfully. Please check your email.'
    });
  } catch (error) {
    console.error('[authRoutes/magic-link] Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error processing magic link',
      code: 'AUTH_INTERNAL_ERROR'
    });
  }
});

// ─── 4. Session Refresh ──────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        error: 'refresh_token is required',
        code: 'AUTH_MISSING_REFRESH_TOKEN'
      });
    }

    if (!supabase) {
      return res.status(503).json({
        error: 'Auth service temporarily unavailable',
        code: 'AUTH_SERVICE_UNAVAILABLE'
      });
    }

    const { data, error: refreshError } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (refreshError || !data.session) {
      return res.status(401).json({
        error: 'Invalid or expired refresh token',
        code: 'AUTH_INVALID_REFRESH_TOKEN'
      });
    }

    const { roles, primaryRole, orgId, providerId } = await fetchUserRoles(data.user.id);

    return res.status(200).json({
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        roles,
        primaryRole,
        orgId,
        providerId
      }
    });
  } catch (error) {
    console.error('[authRoutes/refresh] Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error refreshing session',
      code: 'AUTH_INTERNAL_ERROR'
    });
  }
});

// ─── 5. Password Reset Request ───────────────────────────────────────────────
router.post('/password-reset', authRateLimiter, async (req, res) => {
  try {
    const { email, redirectTo } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        code: 'AUTH_MISSING_EMAIL'
      });
    }

    if (!supabase) {
      return res.status(503).json({
        error: 'Auth service temporarily unavailable',
        code: 'AUTH_SERVICE_UNAVAILABLE'
      });
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`
    });

    if (resetError) {
      return res.status(400).json({
        error: resetError.message,
        code: 'AUTH_PASSWORD_RESET_FAILED'
      });
    }

    await logAuthEvent({
      userId: null,
      eventType: 'password_reset_requested',
      metadata: { email },
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email.'
    });
  } catch (error) {
    console.error('[authRoutes/password-reset] Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error processing password reset',
      code: 'AUTH_INTERNAL_ERROR'
    });
  }
});

// ─── 6. Password Update (Authenticated) ──────────────────────────────────────
router.post('/password-update', requireAuth, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters',
        code: 'AUTH_INVALID_PASSWORD'
      });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(req.user.id, {
      password
    });

    if (updateError) {
      return res.status(400).json({
        error: updateError.message,
        code: 'AUTH_PASSWORD_UPDATE_FAILED'
      });
    }

    await logAuthEvent({
      userId: req.user.id,
      eventType: 'password_updated',
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('[authRoutes/password-update] Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error updating password',
      code: 'AUTH_INTERNAL_ERROR'
    });
  }
});

// ─── 7. Invitation System (Invite Employee / Provider Admin) ─────────────────
router.post('/invite', requireAuth, requireRole('super_admin', 'polyfit_ops', 'org_admin'), async (req, res) => {
  try {
    const { email, role, org_id, provider_id } = req.body;

    if (!email || !role) {
      return res.status(400).json({
        error: 'Email and role are required',
        code: 'AUTH_MISSING_INVITE_FIELDS'
      });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        error: `Invalid role. Allowed roles: ${ALLOWED_ROLES.join(', ')}`,
        code: 'AUTH_INVALID_ROLE'
      });
    }

    // Role-scoping checks:
    // org_admin can only invite employees or org_admins for their own org
    if (req.primaryRole === 'org_admin' && !req.roles.includes('super_admin')) {
      if (!['employee', 'org_admin'].includes(role)) {
        return res.status(403).json({
          error: 'Org admins can only invite employees or org admins',
          code: 'AUTH_INVITE_ROLE_RESTRICTED'
        });
      }
      if (org_id && org_id !== req.orgId) {
        return res.status(403).json({
          error: 'Cannot invite users to an organization other than your own',
          code: 'AUTH_FORBIDDEN_ORG'
        });
      }
    }

    const resolvedOrgId = org_id || (['employee', 'org_admin'].includes(role) ? req.orgId : null);
    const resolvedProviderId = provider_id || (role === 'provider_admin' ? req.providerId : null);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const { data: invite, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        email,
        role,
        org_id: resolvedOrgId,
        provider_id: resolvedProviderId,
        invited_by: req.user.id,
        token,
        status: 'pending',
        expires_at: expiresAt
      })
      .select()
      .single();

    if (inviteError) {
      return res.status(400).json({
        error: inviteError.message,
        code: 'AUTH_INVITE_CREATION_FAILED'
      });
    }

    // Trigger Supabase Auth invite if supported
    try {
      await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
          role,
          org_id: resolvedOrgId,
          provider_id: resolvedProviderId,
          invitation_token: token
        }
      });
    } catch (inviteEmailErr) {
      console.warn('[authRoutes/invite] Supabase inviteUserByEmail note:', inviteEmailErr.message);
    }

    await logAuthEvent({
      userId: req.user.id,
      eventType: 'invite_sent',
      metadata: { email, role, org_id: resolvedOrgId, provider_id: resolvedProviderId },
      req
    });

    return res.status(201).json({
      success: true,
      message: `Invitation created for ${email}`,
      invitation: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        org_id: invite.org_id,
        provider_id: invite.provider_id,
        expires_at: invite.expires_at,
        token: invite.token
      }
    });
  } catch (error) {
    console.error('[authRoutes/invite] Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error processing invitation',
      code: 'AUTH_INTERNAL_ERROR'
    });
  }
});

// ─── 8. Accept Invitation ────────────────────────────────────────────────────
router.post('/accept-invite', authRateLimiter, async (req, res) => {
  try {
    const { token, password, full_name } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        error: 'Token and password are required',
        code: 'AUTH_MISSING_FIELDS'
      });
    }

    if (!supabase) {
      return res.status(503).json({
        error: 'Auth service temporarily unavailable',
        code: 'AUTH_SERVICE_UNAVAILABLE'
      });
    }

    // Look up invitation
    const { data: invite, error: fetchError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (fetchError || !invite) {
      return res.status(400).json({
        error: 'Invalid or expired invitation token',
        code: 'AUTH_INVITE_INVALID'
      });
    }

    // Create or sign up user in Supabase Auth
    let userId;
    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || invite.email.split('@')[0],
        role: invite.role,
        org_id: invite.org_id,
        provider_id: invite.provider_id
      }
    });

    if (createError) {
      // User might already exist in auth.users, try updating password
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const match = existingUsers?.users?.find((u) => u.email === invite.email);
      if (match) {
        userId = match.id;
        await supabase.auth.admin.updateUserById(userId, { password });
      } else {
        return res.status(400).json({
          error: createError.message,
          code: 'AUTH_USER_CREATION_FAILED'
        });
      }
    } else {
      userId = createdUser.user.id;
    }

    // Assign role in user_roles
    await supabase.from('user_roles').upsert({
      user_id: userId,
      role: invite.role,
      org_id: invite.org_id,
      provider_id: invite.provider_id
    }, { onConflict: 'user_id,role,org_id,provider_id' });

    // If employee with org_id, upsert into employees table
    if (invite.role === 'employee' && invite.org_id) {
      await supabase.from('employees').upsert({
        org_id: invite.org_id,
        user_id: userId,
        full_name: full_name || invite.email.split('@')[0],
        email: invite.email
      }, { onConflict: 'email' });
    }

    // Update invitation status
    await supabase
      .from('invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invite.id);

    await logAuthEvent({
      userId,
      eventType: 'invite_accepted',
      metadata: { invite_id: invite.id, role: invite.role },
      req
    });

    // Auto sign in to return valid session
    const { data: loginData } = await supabase.auth.signInWithPassword({
      email: invite.email,
      password
    });

    return res.status(200).json({
      success: true,
      message: 'Invitation accepted and account activated successfully',
      session: loginData?.session || null,
      user: {
        id: userId,
        email: invite.email,
        role: invite.role,
        org_id: invite.org_id,
        provider_id: invite.provider_id
      }
    });
  } catch (error) {
    console.error('[authRoutes/accept-invite] Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error accepting invitation',
      code: 'AUTH_INTERNAL_ERROR'
    });
  }
});

// ─── 9. Get Current User & Profile ───────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  return res.status(200).json({
    user: {
      id: req.user.id,
      email: req.user.email,
      app_metadata: req.user.app_metadata,
      user_metadata: req.user.user_metadata
    },
    roles: req.roles,
    primaryRole: req.primaryRole,
    orgId: req.orgId,
    providerId: req.providerId,
    userRoles: req.userRoles
  });
});

// ─── 10. Logout ──────────────────────────────────────────────────────────────
router.post('/logout', requireAuth, async (req, res) => {
  try {
    await logAuthEvent({
      userId: req.user.id,
      eventType: 'logout',
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('[authRoutes/logout] Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error during logout',
      code: 'AUTH_INTERNAL_ERROR'
    });
  }
});

module.exports = router;
