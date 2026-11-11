const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../index');
const { supabase } = require('../services/supabaseService');

describe('Security Fix: Open Redirect Prevention in Auth Flows', () => {
  test('POST /api/auth/magic-link falls back to safe origin when external redirectTo is passed', async () => {
    let capturedRedirectTo = null;
    const origSignInWithOtp = supabase?.auth?.signInWithOtp;
    if (supabase && supabase.auth) {
      supabase.auth.signInWithOtp = async ({ email, options }) => {
        capturedRedirectTo = options?.emailRedirectTo;
        return { error: null };
      };
    }

    try {
      const res = await request(app)
        .post('/api/auth/magic-link')
        .set('x-skip-rate-limit', 'true')
        .send({
          email: 'test@example.com',
          redirectTo: 'https://attacker.com/steal-token'
        });

      assert.equal(res.status, 200);
      assert.notEqual(capturedRedirectTo, 'https://attacker.com/steal-token');
      assert.ok(
        capturedRedirectTo.startsWith('http://localhost:3000') ||
        capturedRedirectTo.startsWith('https://polyfit.onrender.com')
      );
    } finally {
      if (supabase && supabase.auth) {
        supabase.auth.signInWithOtp = origSignInWithOtp;
      }
    }
  });

  test('POST /api/auth/magic-link neutralizes protocol-relative and backslash bypasses', async () => {
    let capturedRedirectTo = null;
    const origSignInWithOtp = supabase?.auth?.signInWithOtp;
    if (supabase && supabase.auth) {
      supabase.auth.signInWithOtp = async ({ email, options }) => {
        capturedRedirectTo = options?.emailRedirectTo;
        return { error: null };
      };
    }

    try {
      // Protocol-relative test
      await request(app)
        .post('/api/auth/magic-link')
        .set('x-skip-rate-limit', 'true')
        .send({
          email: 'test@example.com',
          redirectTo: '//evil.com/leak'
        });

      assert.notEqual(capturedRedirectTo, '//evil.com/leak');
      assert.ok(
        capturedRedirectTo.startsWith('http://localhost:3000') ||
        capturedRedirectTo.startsWith('https://polyfit.onrender.com')
      );

      // Backslash bypass test
      await request(app)
        .post('/api/auth/magic-link')
        .set('x-skip-rate-limit', 'true')
        .send({
          email: 'test@example.com',
          redirectTo: '/\\evil.com/leak'
        });

      assert.notEqual(capturedRedirectTo, '/\\evil.com/leak');
      assert.ok(
        capturedRedirectTo.startsWith('http://localhost:3000') ||
        capturedRedirectTo.startsWith('https://polyfit.onrender.com')
      );
    } finally {
      if (supabase && supabase.auth) {
        supabase.auth.signInWithOtp = origSignInWithOtp;
      }
    }
  });

  test('POST /api/auth/magic-link allows safe relative paths and whitelisted frontend origins', async () => {
    let capturedRedirectTo = null;
    const origSignInWithOtp = supabase?.auth?.signInWithOtp;
    if (supabase && supabase.auth) {
      supabase.auth.signInWithOtp = async ({ email, options }) => {
        capturedRedirectTo = options?.emailRedirectTo;
        return { error: null };
      };
    }

    try {
      // Safe relative path
      await request(app)
        .post('/api/auth/magic-link')
        .set('x-skip-rate-limit', 'true')
        .send({
          email: 'test@example.com',
          redirectTo: '/corporate/login'
        });

      assert.ok(capturedRedirectTo.endsWith('/corporate/login'));

      // Safe whitelisted origin
      await request(app)
        .post('/api/auth/magic-link')
        .set('x-skip-rate-limit', 'true')
        .send({
          email: 'test@example.com',
          redirectTo: 'https://polyfit.onrender.com/corporate'
        });

      assert.equal(capturedRedirectTo, 'https://polyfit.onrender.com/corporate');
    } finally {
      if (supabase && supabase.auth) {
        supabase.auth.signInWithOtp = origSignInWithOtp;
      }
    }
  });

  test('POST /api/auth/password-reset falls back to safe reset URL when malicious redirectTo provided', async () => {
    let capturedRedirectTo = null;
    const origResetPassword = supabase?.auth?.resetPasswordForEmail;
    if (supabase && supabase.auth) {
      supabase.auth.resetPasswordForEmail = async (email, options) => {
        capturedRedirectTo = options?.redirectTo;
        return { error: null };
      };
    }

    try {
      const res = await request(app)
        .post('/api/auth/password-reset')
        .set('x-skip-rate-limit', 'true')
        .send({
          email: 'test@example.com',
          redirectTo: 'https://evil.com/phishing'
        });

      assert.equal(res.status, 200);
      assert.notEqual(capturedRedirectTo, 'https://evil.com/phishing');
      assert.ok(capturedRedirectTo.endsWith('/reset-password'));
    } finally {
      if (supabase && supabase.auth) {
        supabase.auth.resetPasswordForEmail = origResetPassword;
      }
    }
  });
});
