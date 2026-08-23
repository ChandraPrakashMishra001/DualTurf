import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

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

// Send order notification email to seller
async function sendOrderEmail(order) {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpEmail || !smtpPassword || smtpPassword === 'YOUR_GMAIL_APP_PASSWORD_HERE') {
    console.log('⚠️ SMTP not configured — skipping email notification');
    return false;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpEmail,
      pass: smtpPassword,
    },
  });

  const itemsHtml = (order.items || []).map(item => {
    const printBadge = (item.customName || item.customNumber)
      ? `<br/><span style="color:#c4ff3d;font-size:12px;font-weight:bold;">⚡ Print: ${item.customName || ''} ${item.customNumber ? '#' + item.customNumber : ''}</span>`
      : '';
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #333;">${item.title}${printBadge}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #333;text-align:center;">${item.size}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #333;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #333;text-align:right;">₹${item.price * item.quantity}</td>
    </tr>`;
  }).join('');

  const htmlBody = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#ffffff;border-radius:12px;overflow:hidden;">
      
      <div style="background:linear-gradient(135deg,#c4ff3d,#8aff00);padding:24px 32px;text-align:center;">
        <h1 style="margin:0;color:#000;font-size:24px;letter-spacing:2px;">⚽ NEW DUALTURF ORDER</h1>
        <p style="margin:6px 0 0;color:#1a1a1a;font-size:16px;font-weight:600;">#${order.orderId}</p>
      </div>

      <div style="padding:28px 32px;">
        
        <div style="background:#1a1a1a;border-radius:8px;padding:20px;margin-bottom:20px;">
          <h3 style="margin:0 0 12px;color:#c4ff3d;font-size:14px;text-transform:uppercase;letter-spacing:1px;">👤 Customer Details</h3>
          <p style="margin:4px 0;font-size:15px;"><strong>Name:</strong> ${order.customer?.fullName || 'N/A'}</p>
          <p style="margin:4px 0;font-size:15px;"><strong>Phone:</strong> ${order.customer?.phone || 'N/A'}</p>
          <p style="margin:4px 0;font-size:15px;"><strong>Email:</strong> ${order.customer?.email || 'N/A'}</p>
        </div>

        <div style="background:#1a1a1a;border-radius:8px;padding:20px;margin-bottom:20px;">
          <h3 style="margin:0 0 12px;color:#c4ff3d;font-size:14px;text-transform:uppercase;letter-spacing:1px;">📍 Shipping Address</h3>
          <p style="margin:4px 0;font-size:15px;">${order.customer?.address || ''}</p>
          <p style="margin:4px 0;font-size:15px;">${order.customer?.city || ''}, ${order.customer?.state || ''} - ${order.customer?.pincode || ''}</p>
        </div>

        <div style="background:#1a1a1a;border-radius:8px;padding:20px;margin-bottom:20px;">
          <h3 style="margin:0 0 12px;color:#c4ff3d;font-size:14px;text-transform:uppercase;letter-spacing:1px;">🛍️ Items Ordered</h3>
          <table style="width:100%;border-collapse:collapse;color:#fff;font-size:14px;">
            <thead>
              <tr style="border-bottom:2px solid #c4ff3d;">
                <th style="padding:8px 12px;text-align:left;">Product</th>
                <th style="padding:8px 12px;text-align:center;">Size</th>
                <th style="padding:8px 12px;text-align:center;">Qty</th>
                <th style="padding:8px 12px;text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <div style="background:#1a1a1a;border-radius:8px;padding:20px;">
          <h3 style="margin:0 0 12px;color:#c4ff3d;font-size:14px;text-transform:uppercase;letter-spacing:1px;">💳 Payment Summary</h3>
          <table style="width:100%;color:#fff;font-size:15px;">
            <tr>
              <td style="padding:4px 0;">Payment Mode:</td>
              <td style="padding:4px 0;text-align:right;font-weight:600;">${order.paymentMethod || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;">Subtotal:</td>
              <td style="padding:4px 0;text-align:right;">₹${order.subtotal || 0}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;">Shipping:</td>
              <td style="padding:4px 0;text-align:right;">₹${order.shippingFee || 80}</td>
            </tr>
            <tr style="border-top:2px solid #c4ff3d;">
              <td style="padding:12px 0 4px;font-weight:700;font-size:17px;">Total Amount:</td>
              <td style="padding:12px 0 4px;text-align:right;font-weight:700;font-size:17px;color:#c4ff3d;">₹${order.totalAmount || 0}</td>
            </tr>
          </table>
        </div>

      </div>

      <div style="background:#111;padding:16px 32px;text-align:center;font-size:12px;color:#666;">
        <p style="margin:0;">DualTurf Order Notification System • ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"DualTurf Orders" <${smtpEmail}>`,
    to: smtpEmail,
    subject: `🛒 New Order #${order.orderId} — ${order.customer?.fullName || 'Customer'} (${order.paymentMethod || 'COD'}) — ₹${order.totalAmount || 0}`,
    html: htmlBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Order email sent for #${order.orderId}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send order email:', error.message);
    return false;
  }
}

// Send cancellation or return request email to seller
async function sendActionEmail(order, actionStr) {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpEmail || !smtpPassword || smtpPassword === 'YOUR_GMAIL_APP_PASSWORD_HERE') {
    return false;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtpEmail, pass: smtpPassword },
  });

  const mailOptions = {
    from: `"DualTurf Action" <${smtpEmail}>`,
    to: smtpEmail,
    subject: `🚨 ${actionStr.toUpperCase()} - Order #${order.orderId}`,
    html: `
      <h2>${actionStr} Requested</h2>
      <p>Customer: ${order.customer?.fullName} (${order.customer?.email})</p>
      <p>Order ID: ${order.orderId}</p>
      <p>Please log in to your dashboard to handle this request.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Action email error:', error);
    return false;
  }
}

// GET /api/orders -> Return orders (filtered by email if provided, else all)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const allOrders = getOrders();
  
  if (email) {
    const userOrders = allOrders.filter(o => o.customer?.email === email);
    return NextResponse.json({ success: true, orders: userOrders });
  }
  
  return NextResponse.json({ success: true, orders: allOrders });
}

// POST /api/orders -> Receive new order from customer checkout
export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, customer, items, subtotal, shippingFee = 80, totalAmount, paymentMethod, utr, status = 'New Order - Awaiting Verification' } = body;

    const newOrder = {
      orderId: orderId || `DT-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      customer: customer || {},
      items: items || [],
      subtotal: subtotal || 0,
      shippingFee: shippingFee || 80,
      totalAmount: totalAmount || (subtotal + shippingFee),
      paymentMethod: paymentMethod || 'Online / COD',
      utr: utr || 'N/A',
      status,
    };

    const currentOrders = getOrders();
    currentOrders.unshift(newOrder);
    saveOrders(currentOrders);

    console.log(`🔔 NEW ORDER RECEIVED: #${newOrder.orderId}`);
    sendOrderEmail(newOrder).catch(err => console.error(err));

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to record order' }, { status: 500 });
  }
}

// PATCH /api/orders -> Update order status
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
    
    // Trigger email if the status is a user-initiated action
    if (status === 'Cancelled' || status === 'Return Requested' || status === 'Replacement Requested') {
      sendActionEmail(currentOrders[orderIndex], status).catch(e => console.error(e));
    }

    return NextResponse.json({ success: true, order: currentOrders[orderIndex] });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update order' }, { status: 500 });
  }
}
