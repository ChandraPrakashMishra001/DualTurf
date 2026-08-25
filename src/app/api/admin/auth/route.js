import { NextResponse } from 'next/server';

// POST /api/admin/auth — validate admin password
export async function POST(request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json({ success: false, message: 'Admin password not configured on server.' }, { status: 500 });
    }

    if (password === adminPassword) {
      // Return a simple session token (timestamp-based, verified on subsequent requests)
      const token = Buffer.from(`dualturf-admin:${Date.now()}:${adminPassword}`).toString('base64');
      return NextResponse.json({ success: true, token });
    }

    return NextResponse.json({ success: false, message: 'Incorrect password.' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Auth error.' }, { status: 500 });
  }
}

// GET /api/admin/auth — verify a session token
export async function GET(request) {
  try {
    const token = request.headers.get('x-admin-token');
    if (!token) return NextResponse.json({ valid: false }, { status: 401 });

    const adminPassword = process.env.ADMIN_PASSWORD;
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const valid = decoded.startsWith('dualturf-admin:') && decoded.endsWith(`:${adminPassword}`);

    return NextResponse.json({ valid });
  } catch {
    return NextResponse.json({ valid: false }, { status: 401 });
  }
}
