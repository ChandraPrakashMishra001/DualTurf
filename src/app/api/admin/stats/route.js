import { NextResponse } from 'next/server';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function isAdminAuthorized(request) {
  const token = request.headers.get('x-admin-token');
  if (!token) return false;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const decoded = Buffer.from(token, 'base64').toString('utf-8');
  return decoded.startsWith('dualturf-admin:') && decoded.endsWith(`:${adminPassword}`);
}

// GET /api/admin/stats — compute dashboard stats from Firestore orders
export async function GET(request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
    const orders = snap.docs.map(d => d.data());

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    const statusCounts = {};
    orders.forEach(o => {
      const s = o.status || 'Unknown';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    // Revenue by day for last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueByDay = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      revenueByDay[d.toISOString().split('T')[0]] = 0;
    }

    orders.forEach(o => {
      if (!o.createdAt) return;
      const day = o.createdAt.split('T')[0];
      if (revenueByDay[day] !== undefined) {
        revenueByDay[day] += Number(o.totalAmount) || 0;
      }
    });

    // Top products by item count
    const productCounts = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        const key = item.title || item.id || 'Unknown';
        productCounts[key] = (productCounts[key] || 0) + (item.quantity || 1);
      });
    });
    const topProducts = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Today's orders
    const todayStr = now.toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.createdAt?.startsWith(todayStr));
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue,
        todayOrders: todayOrders.length,
        todayRevenue,
        statusCounts,
        revenueByDay: Object.entries(revenueByDay)
          .map(([date, revenue]) => ({ date, revenue }))
          .reverse(), // oldest first
        topProducts,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
