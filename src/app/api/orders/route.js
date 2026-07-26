import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'orders.json');

// Helper to read orders
function getOrders() {
  try {
    if (!fs.existsSync(dataFilePath)) {
      fs.writeFileSync(dataFilePath, JSON.stringify([]));
      return [];
    }
    const content = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(content || '[]');
  } catch (error) {
    console.error('Error reading orders:', error);
    return [];
  }
}

// Helper to save orders
function saveOrders(orders) {
  try {
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(orders, null, 2));
  } catch (error) {
    console.error('Error saving orders:', error);
  }
}

// GET /api/orders -> Return all orders for the seller dashboard
export async function GET() {
  const orders = getOrders();
  return NextResponse.json({ success: true, orders });
}

// POST /api/orders -> Receive new order from customer checkout
export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, customer, items, subtotal, utr, status = 'Pending Verification' } = body;

    const newOrder = {
      orderId: orderId || `DT-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      customer: customer || {},
      items: items || [],
      subtotal: subtotal || 0,
      utr: utr || 'Not Provided',
      status,
    };

    const currentOrders = getOrders();
    currentOrders.unshift(newOrder); // newest first
    saveOrders(currentOrders);

    return NextResponse.json({
      success: true,
      message: 'Order received by seller',
      order: newOrder,
    });
  } catch (error) {
    console.error('POST /api/orders error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to record order' },
      { status: 500 }
    );
  }
}

// PATCH /api/orders -> Update order status (e.g. Verified, Shipped, Delivered)
export async function PATCH(request) {
  try {
    const { orderId, status } = await request.json();
    const currentOrders = getOrders();
    const orderIndex = currentOrders.findIndex(o => o.orderId === orderId);

    if (orderIndex === -1) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    currentOrders[orderIndex].status = status;
    saveOrders(currentOrders);

    return NextResponse.json({ success: true, order: currentOrders[orderIndex] });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update order status' }, { status: 500 });
  }
}
