import { NextResponse } from 'next/server';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function isAdminAuthorized(request) {
  const token = request.headers.get('x-admin-token');
  if (!token) return false;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const decoded = Buffer.from(token, 'base64').toString('utf-8');
  return decoded.startsWith('dualturf-admin:') && decoded.endsWith(`:${adminPassword}`);
}

// GET /api/admin/customers — fetch all users from Firestore
export async function GET(request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const usersSnap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
    const users = usersSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    return NextResponse.json({ success: true, customers: users });
  } catch (error) {
    console.error('Admin customers error:', error);
    // Firestore may require an index — return empty with note
    return NextResponse.json({ success: true, customers: [], note: error.message });
  }
}
