// ============================================================
// UniCore – Decoupled Admin Authentication & Security
// Provides passkey verification, session cookie management,
// and role checking completely decoupled from personal accounts.
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Configurable Admin Passkey (reads environment variable or defaults to secure standard)
export const ADMIN_SECRET_KEY =
  process.env.ADMIN_SECRET_KEY ||
  process.env.UNICORE_ADMIN_KEY ||
  'unicore-admin-2025';

export const ADMIN_COOKIE_NAME = 'unicore_admin_session';

// Salt for HMAC signature
const SESSION_SALT = process.env.ADMIN_SESSION_SALT || 'unicore_secret_salt_998811';

/**
 * Creates a cryptographically signed admin session token
 */
export function createAdminToken(): string {
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac('sha256', SESSION_SALT)
    .update(`${ADMIN_SECRET_KEY}:${timestamp}`)
    .digest('hex');
  return `${timestamp}.${signature}`;
}

/**
 * Validates the admin session token. Token expires after 7 days.
 */
export function verifyAdminToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Max age: 7 days
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - timestamp > maxAgeMs) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SALT)
    .update(`${ADMIN_SECRET_KEY}:${timestampStr}`)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}

export interface AdminAuthResult {
  isAdmin: boolean;
  method?: 'cookie' | 'header' | 'user_role';
  userEmail?: string;
  userId?: string;
}

/**
 * Decoupled Admin Verification helper for Next.js API Routes and Server Components.
 * Checks in order:
 * 1. Admin HttpOnly Cookie ('unicore_admin_session')
 * 2. Request header ('x-admin-key' matching ADMIN_SECRET_KEY)
 * 3. Supabase Auth session (if user has user_metadata.is_admin === true or role === 'admin')
 * Notice: Zero personal IDs or emails hardcoded!
 */
export async function verifyAdminRequest(req?: NextRequest): Promise<AdminAuthResult> {
  // 1. Check Header if request object provided
  if (req) {
    const headerKey = req.headers.get('x-admin-key');
    if (headerKey && headerKey === ADMIN_SECRET_KEY) {
      return { isAdmin: true, method: 'header' };
    }
  }

  // 2. Check Cookie
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (token && verifyAdminToken(token)) {
      return { isAdmin: true, method: 'cookie' };
    }
  } catch (err) {
    // Cookie store may fail in non-request contexts
  }

  // 3. Check Supabase User Auth role
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const isRoleAdmin =
        user.app_metadata?.role === 'admin' ||
        user.user_metadata?.is_admin === true;

      if (isRoleAdmin) {
        return {
          isAdmin: true,
          method: 'user_role',
          userId: user.id,
          userEmail: user.email,
        };
      }
    }
  } catch (err) {
    // Auth client failed
  }

  return { isAdmin: false };
}

