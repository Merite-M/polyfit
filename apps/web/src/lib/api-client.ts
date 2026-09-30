/**
 * PolyFit Resilient API Client
 * Provides timeout handling, safe idempotency-aware retries, user-friendly error mapping,
 * and offline detection across all frontend API service calls.
 */

import { supabase } from './supabase';

export class APIError extends Error {
  public status: number;
  public code?: string;
  public details?: unknown;

  constructor(message: string, status: number = 500, code?: string, details?: unknown) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_IDEMPOTENT_RETRIES = 2;

// User-friendly error message dictionary
const ERROR_CODE_MESSAGES: Record<string, string> = {
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please slow down and try again in a few minutes.',
  CHECKIN_RATE_LIMIT_EXCEEDED: 'Too many attempts. Please wait a moment before trying again.',
  AUTH_MISSING_HEADER: 'Authentication is required. Please log in.',
  AUTH_INVALID_TOKEN: 'Your session has expired. Please log in again.',
  AUTH_SERVICE_UNAVAILABLE: 'Authentication service is temporarily unavailable.',
  NETWORK_OFFLINE: 'You are currently offline. Please check your internet connection.',
  TIMEOUT: 'The server took too long to respond. Please try again.',
};

export async function apiFetch<T = unknown>(
  url: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const isIdempotent = ['GET', 'HEAD', 'OPTIONS'].includes(method);

  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = isIdempotent ? DEFAULT_IDEMPOTENT_RETRIES : 0,
    retryDelayMs = 800,
    ...fetchOptions
  } = options;

  const API_BASE_URL =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
    'https://polyfit-backend.onrender.com';

  const resolvedUrl = url.startsWith('/')
    ? `${API_BASE_URL.replace(/\/$/, '')}${url}`
    : url;

  if (typeof window !== 'undefined' && !navigator.onLine) {
    throw new APIError(
      ERROR_CODE_MESSAGES.NETWORK_OFFLINE,
      0,
      'NETWORK_OFFLINE'
    );
  }

  // Automatically attach Supabase Auth session token if not explicitly provided
  const requestHeaders = new Headers(fetchOptions.headers || {});
  if (!requestHeaders.has('Authorization')) {
    try {
      if (typeof window !== 'undefined' && supabase) {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.access_token) {
          requestHeaders.set('Authorization', `Bearer ${data.session.access_token}`);
        }
      }
    } catch {
      // In offline/demo mode, proceed without session token
    }
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(resolvedUrl, {
        ...fetchOptions,
        headers: requestHeaders,
        method,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        let errorPayload: Record<string, unknown> = {};
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorPayload = (await response.json()) as Record<string, unknown>;
          } else {
            errorPayload = { error: await response.text() };
          }
        } catch {
          errorPayload = { error: response.statusText };
        }

        const rawMsg =
          (typeof errorPayload.error === 'string' && errorPayload.error) ||
          (typeof errorPayload.message === 'string' && errorPayload.message) ||
          `Request failed with status ${response.status}`;
        const code = typeof errorPayload.code === 'string' ? errorPayload.code : undefined;
        const friendlyMessage = (code && ERROR_CODE_MESSAGES[code]) || rawMsg;

        // Only retry transient gateway errors (502, 503, 504) if the method is idempotent and retries remain
        if (
          isIdempotent &&
          (response.status === 502 || response.status === 503 || response.status === 504) &&
          attempt < retries
        ) {
          console.warn(`[apiFetch] Server error ${response.status} on ${method} ${url}, retrying attempt ${attempt + 1}/${retries}...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs * Math.pow(2, attempt)));
          continue;
        }

        throw new APIError(friendlyMessage, response.status, code, errorPayload.details);
      }

      // Check if response has content
      const text = await response.text();
      return text ? (JSON.parse(text) as T) : ({} as T);
    } catch (err: unknown) {
      clearTimeout(timer);

      if (err instanceof Error && err.name === 'AbortError') {
        lastError = new APIError(
          ERROR_CODE_MESSAGES.TIMEOUT,
          408,
          'TIMEOUT'
        );
        if (!isIdempotent) {
          throw lastError;
        }
      } else if (err instanceof APIError) {
        lastError = err;
        if (err.status >= 400 && err.status < 500) {
          throw err;
        }
        if (!isIdempotent) {
          throw err;
        }
      } else {
        const errorMsg = err instanceof Error ? err.message : 'Network connection error occurred';
        lastError = new APIError(
          errorMsg,
          0,
          'NETWORK_ERROR'
        );
        if (!isIdempotent) {
          throw lastError;
        }
      }

      // If we have retries left for transient idempotent errors, wait and retry
      if (isIdempotent && attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError || new APIError('Request failed after retries', 500);
}
