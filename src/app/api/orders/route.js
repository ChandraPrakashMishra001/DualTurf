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

// Send order confirmation emails to BOTH DualTurf admin and customer
async function sendOrderEmails(order) {
  const smtpEmail = process.env.SMTP_EMAIL || 'turfdual@gmail.com';
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpPassword || smtpPassword === 'YOUR_GMAIL_APP_PASSWORD_HERE') {
    console.log('⚠️ SMTP not configured with live Gmail App Password. Order recorded successfully: #' + order.orderId);
    console.log(`✉️ [DualTurf Admin Notification] Recipient: ${smtpEmail}`);
    if (order.customer?.email) {
      console.log(`✉️ [Customer Confirmation] Recipient: ${order.customer.email}`);
    }
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
      ? `<br/><span style="display:inline-block;margin-top:4px;padding:2px 8px;background:rgba(196,255,61,0.15);color:#c4ff3d;font-size:12px;font-weight:bold;border-radius:4px;border:1px solid rgba(196,255,61,0.3);">⚡ Print: ${item.customName || ''} ${item.customNumber ? '#' + item.customNumber : ''} (+₹200)</span>`
      : '';
    return `<tr>
      <td style="padding:12px 14px;border-bottom:1px solid #222;">
        <strong style="color:#ffffff;font-size:14px;">${item.title}</strong>
        ${printBadge}
      </td>
      <td style="padding:12px 14px;border-bottom:1px solid #222;text-align:center;color:#cccccc;">${item.size}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #222;text-align:center;color:#cccccc;">${item.quantity}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #222;text-align:right;color:#c4ff3d;font-weight:bold;">₹${item.price * item.quantity}</td>
    </tr>`;
  }).join('');

  // 1. DualTurf Store Admin Notification Template
  const adminHtml = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #222;">
      
      <div style="background:linear-gradient(135deg,#c4ff3d,#8aff00);padding:24px 32px;text-align:center;">
        <h1 style="margin:0;color:#000000;font-size:24px;letter-spacing:2px;">⚽ NEW DUALTURF ORDER</h1>
        <p style="margin:6px 0 0;color:#1a1a1a;font-size:16px;font-weight:700;">#${order.orderId}</p>
      </div>

      <div style="padding:28px 32px;">
        
        <div style="background:#141414;border-radius:8px;padding:18px;margin-bottom:18px;border:1px solid #222;">
          <h3 style="margin:0 0 10px;color:#c4ff3d;font-size:13px;text-transform:uppercase;letter-spacing:1px;">👤 Customer Details</h3>
          <p style="margin:4px 0;font-size:14px;"><strong>Name:</strong> ${order.customer?.fullName || 'N/A'}</p>
          <p style="margin:4px 0;font-size:14px;"><strong>Phone:</strong> ${order.customer?.phone || 'N/A'}</p>
          <p style="margin:4px 0;font-size:14px;"><strong>Email:</strong> ${order.customer?.email || 'N/A'}</p>
        </div>

        <div style="background:#141414;border-radius:8px;padding:18px;margin-bottom:18px;border:1px solid #222;">
          <h3 style="margin:0 0 10px;color:#c4ff3d;font-size:13px;text-transform:uppercase;letter-spacing:1px;">📍 Shipping Address</h3>
          <p style="margin:4px 0;font-size:14px;line-height:1.5;">${order.customer?.address || ''}<br/>${order.customer?.city || ''}, ${order.customer?.state || ''} - ${order.customer?.pincode || ''}</p>
        </div>

        <div style="background:#141414;border-radius:8px;padding:18px;margin-bottom:18px;border:1px solid #222;">
          <h3 style="margin:0 0 10px;color:#c4ff3d;font-size:13px;text-transform:uppercase;letter-spacing:1px;">🛍️ Items Ordered</h3>
          <table style="width:100%;border-collapse:collapse;color:#fff;font-size:13px;">
            <thead>
              <tr style="border-bottom:2px solid #c4ff3d;color:#aaa;">
                <th style="padding:8px 10px;text-align:left;">Product</th>
                <th style="padding:8px 10px;text-align:center;">Size</th>
                <th style="padding:8px 10px;text-align:center;">Qty</th>
                <th style="padding:8px 10px;text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <div style="background:#141414;border-radius:8px;padding:18px;border:1px solid #222;">
          <h3 style="margin:0 0 10px;color:#c4ff3d;font-size:13px;text-transform:uppercase;letter-spacing:1px;">💳 Payment Breakdown</h3>
          <table style="width:100%;color:#fff;font-size:14px;">
            <tr>
              <td style="padding:4px 0;color:#aaa;">Payment Mode:</td>
              <td style="padding:4px 0;text-align:right;font-weight:600;">${order.paymentMethod || 'N/A'}</td>
            </tr>
            ${order.paymentId ? `
            <tr>
              <td style="padding:4px 0;color:#aaa;">Payment Ref / ID:</td>
              <td style="padding:4px 0;text-align:right;font-family:monospace;color:#c4ff3d;">${order.paymentId}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding:4px 0;color:#aaa;">Subtotal:</td>
              <td style="padding:4px 0;text-align:right;">₹${order.subtotal || 0}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#aaa;">Shipping:</td>
              <td style="padding:4px 0;text-align:right;">₹${order.shippingFee || 80}</td>
            </tr>
            ${order.codFee ? `
            <tr>
              <td style="padding:4px 0;color:#ffb800;">COD Handling Fee:</td>
              <td style="padding:4px 0;text-align:right;color:#ffb800;">+₹${order.codFee}</td>
            </tr>
            ` : ''}
            <tr style="border-top:1px solid #333;">
              <td style="padding:6px 0;font-weight:700;">Total Value:</td>
              <td style="padding:6px 0;text-align:right;font-weight:700;color:#c4ff3d;font-size:16px;">₹${order.totalAmount || 0}</td>
            </tr>
            ${order.advanceAmount ? `
            <tr style="color:#c4ff3d;">
              <td style="padding:4px 0;font-weight:600;">⚡ Advance Paid Online:</td>
              <td style="padding:4px 0;text-align:right;font-weight:600;">₹${order.advanceAmount}</td>
            </tr>
            ` : ''}
            ${(order.balanceCOD !== undefined && order.balanceCOD > 0) ? `
            <tr style="color:#ffffff;">
              <td style="padding:4px 0;font-weight:600;">💵 COD Balance to Collect:</td>
              <td style="padding:4px 0;text-align:right;font-weight:600;">₹${order.balanceCOD}</td>
            </tr>
            ` : ''}
          </table>
        </div>

      </div>

      <div style="background:#111111;padding:16px 32px;text-align:center;font-size:12px;color:#666;">
        <p style="margin:0;">DualTurf Order Dispatch System • ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
      </div>
    </div>
  `;

  // 2. Customer Order Confirmation Email Template
  const customerHtml = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0d0d0d;color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #222;">
      
      <div style="background:#141414;padding:28px 32px;text-align:center;border-bottom:2px solid #c4ff3d;">
        <h1 style="margin:0;color:#c4ff3d;font-size:26px;letter-spacing:3px;font-weight:900;">DUALTURF</h1>
        <p style="margin:6px 0 0;color:#ffffff;font-size:15px;font-weight:600;">ORDER CONFIRMATION</p>
        <p style="margin:4px 0 0;color:#888888;font-size:13px;">Order #${order.orderId}</p>
      </div>

      <div style="padding:28px 32px;">
        
        <p style="font-size:16px;line-height:1.6;margin-top:0;">
          Hi <strong>${order.customer?.fullName || 'Customer'}</strong>,<br/>
          Thank you for shopping at DualTurf! Your football jersey order has been confirmed and is being processed for dispatch.
        </p>

        <div style="background:#161616;border-radius:8px;padding:18px;margin-bottom:18px;border:1px solid rgba(196,255,61,0.2);">
          <h3 style="margin:0 0 10px;color:#c4ff3d;font-size:13px;text-transform:uppercase;letter-spacing:1px;">📦 Order Items</h3>
          <table style="width:100%;border-collapse:collapse;color:#fff;font-size:13px;">
            <thead>
              <tr style="border-bottom:1px solid #333;color:#888;">
                <th style="padding:8px 10px;text-align:left;">Item</th>
                <th style="padding:8px 10px;text-align:center;">Size</th>
                <th style="padding:8px 10px;text-align:center;">Qty</th>
                <th style="padding:8px 10px;text-align:right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <div style="background:#161616;border-radius:8px;padding:18px;margin-bottom:18px;border:1px solid #222;">
          <h3 style="margin:0 0 10px;color:#c4ff3d;font-size:13px;text-transform:uppercase;letter-spacing:1px;">📍 Shipping Address</h3>
          <p style="margin:0;font-size:14px;color:#ccc;line-height:1.5;">
            ${order.customer?.address || ''}<br/>
            ${order.customer?.city || ''}, ${order.customer?.state || ''} - ${order.customer?.pincode || ''}<br/>
            Phone: ${order.customer?.phone || ''}
          </p>
        </div>

        <div style="background:#161616;border-radius:8px;padding:18px;margin-bottom:18px;border:1px solid #222;">
          <h3 style="margin:0 0 10px;color:#c4ff3d;font-size:13px;text-transform:uppercase;letter-spacing:1px;">💳 Payment Summary</h3>
          <table style="width:100%;color:#fff;font-size:14px;">
            <tr>
              <td style="padding:4px 0;color:#888;">Payment Method:</td>
              <td style="padding:4px 0;text-align:right;">${order.paymentMethod || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#888;">Total Order Amount:</td>
              <td style="padding:4px 0;text-align:right;font-weight:700;">₹${order.totalAmount || 0}</td>
            </tr>
            ${order.codFee ? `
            <tr>
              <td style="padding:4px 0;color:#ffb800;">COD Cash Handling Fee:</td>
              <td style="padding:4px 0;text-align:right;color:#ffb800;">+₹${order.codFee}</td>
            </tr>
            ` : ''}
            ${order.advanceAmount ? `
            <tr style="color:#c4ff3d;">
              <td style="padding:4px 0;font-weight:600;">Advance Paid Online:</td>
              <td style="padding:4px 0;text-align:right;font-weight:600;">₹${order.advanceAmount} ✓</td>
            </tr>
            ` : ''}
            ${(order.balanceCOD !== undefined && order.balanceCOD > 0) ? `
            <tr style="color:#ffffff;">
              <td style="padding:4px 0;font-weight:600;">Balance to Pay on Delivery (COD):</td>
              <td style="padding:4px 0;text-align:right;font-weight:600;">₹${order.balanceCOD}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div style="background:rgba(196,255,61,0.06);border:1px solid rgba(196,255,61,0.25);border-radius:8px;padding:16px;margin-bottom:20px;">
          <h4 style="margin:0 0 6px;color:#c4ff3d;font-size:13px;">🛡️ Store Policy & Delivery Info:</h4>
          <p style="margin:4px 0;font-size:12px;color:#aaa;line-height:1.4;">
            • Estimated delivery: 3–5 business days (custom player prints add 3–5 days for precision tailoring).<br/>
            • <strong>Important:</strong> A complete, continuous unboxing video is mandatory for any size replacement or defect claim.<br/>
            • Need help? Reply to this email or WhatsApp us at <strong>+91-7656072801</strong>.
          </p>
        </div>

        <div style="text-align:center;margin-top:24px;">
          <a href="https://wa.me/917656072801?text=Hi%20DualTurf,%20I%20have%20a%20question%20about%20my%20order%20%23${order.orderId}" style="display:inline-block;background:#c4ff3d;color:#000000;font-weight:800;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;">
            📱 CHAT ON WHATSAPP (+91-7656072801)
          </a>
        </div>

      </div>

      <div style="background:#111111;padding:16px 32px;text-align:center;font-size:12px;color:#666;border-top:1px solid #222;">
        <p style="margin:0;">DualTurf Official Jersey Store • Bhubaneswar, Odisha</p>
        <p style="margin:4px 0 0;"><a href="https://www.dualturf.in" style="color:#c4ff3d;text-decoration:none;">www.dualturf.in</a></p>
      </div>
    </div>
  `;

  // 1. Send to DualTurf Admin Email
  try {
    await transporter.sendMail({
      from: `"DualTurf Orders" <${smtpEmail}>`,
      to: smtpEmail,
      subject: `🛒 New Order #${order.orderId} - ${order.customer?.fullName || 'Customer'} (₹${order.totalAmount || 0})`,
      html: adminHtml,
    });
    console.log(`✅ Admin order email sent to ${smtpEmail} for #${order.orderId}`);
  } catch (error) {
    console.error('❌ Admin email send failed:', error.message);
  }

  // 2. Send to Customer Email
  if (order.customer?.email) {
    try {
      await transporter.sendMail({
        from: `"DualTurf" <${smtpEmail}>`,
        to: order.customer.email,
        subject: `⚽ Order Confirmed #${order.orderId} - DualTurf Jersey Store`,
        html: customerHtml,
      });
      console.log(`✅ Customer confirmation email sent to ${order.customer.email} for #${order.orderId}`);
    } catch (error) {
      console.error('❌ Customer email send failed:', error.message);
    }
  }

  return true;
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

// GET /api/orders -> Return orders (filtered by email or userId if provided, else all)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const userId = searchParams.get('userId');
  const allOrders = getOrders();
  
  if (email || userId) {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const userOrders = allOrders.filter(o => {
      const matchEmail = cleanEmail && (
        (o.customerEmail && o.customerEmail.trim().toLowerCase() === cleanEmail) ||
        (o.customer?.email && o.customer.email.trim().toLowerCase() === cleanEmail)
      );
      const matchUid = userId && o.userId === userId;
      return matchEmail || matchUid;
    });
    return NextResponse.json({ success: true, orders: userOrders });
  }
  
  return NextResponse.json({ success: true, orders: allOrders });
}

// POST /api/orders -> Receive new order from customer checkout
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      orderId,
      customer,
      items,
      subtotal,
      shippingFee = 80,
      codFee = 0,
      totalAmount,
      advanceAmount,
      balanceCOD,
      paymentMethod,
      paymentId,
      utr,
      status = 'New Order - Awaiting Verification',
    } = body;

    const newOrder = {
      orderId: orderId || `DT-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      customer: customer || {},
      items: items || [],
      subtotal: subtotal || 0,
      shippingFee: shippingFee || 80,
      codFee: codFee || 0,
      totalAmount: totalAmount || (subtotal + (shippingFee || 80) + (codFee || 0)),
      advanceAmount: advanceAmount !== undefined ? advanceAmount : 0,
      balanceCOD: balanceCOD !== undefined ? balanceCOD : 0,
      paymentMethod: paymentMethod || '100% Online Payment',
      paymentId: paymentId || utr || 'N/A',
      utr: utr || paymentId || 'N/A',
      status,
    };

    const currentOrders = getOrders();
    currentOrders.unshift(newOrder);
    saveOrders(currentOrders);

    console.log(`🔔 NEW ORDER RECEIVED: #${newOrder.orderId}`);
    sendOrderEmails(newOrder).catch((err) => console.error('Order email error:', err));

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
