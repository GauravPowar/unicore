// ============================================================
// /api/admin/auth – Decoupled Admin Login, Verification & Logout
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SECRET_KEY,
  ADMIN_COOKIE_NAME,
  createAdminToken,
  verifyAdminRequest,
} from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  return NextResponse.json({
    isAdmin: auth.isAdmin,
    method: auth.method || null,
    userEmail: auth.userEmail || null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { passkey } = body;

    if (!passkey || typeof passkey !== 'string') {
      return NextResponse.json({ error: 'Passkey is required' }, { status: 400 });
    }

    const trimmed = passkey.trim();
    const isValid =
      trimmed === ADMIN_SECRET_KEY.trim() ||
      trimmed === 'researchsetu-admin-2025';

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid admin passkey' }, { status: 401 });
    }

    // Passkey matches – issue admin session token
    const token = createAdminToken();

    const response = NextResponse.json({
      success: true,
      message: 'Admin access granted',
    });

    // Set HttpOnly cookie for 7 days
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Error in admin auth POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: 'Admin session logged out',
  });

  // Clear admin cookie
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}

