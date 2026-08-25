import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendOrderEmails } from '@/app/api/orders/route';

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.warn('⚠️ RAZORPAY_WEBHOOK_SECRET is not configured in .env.local');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 });
    }

    // Verify webhook signature with HMAC SHA-256
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('❌ Razorpay webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    console.log(`🔔 Razorpay Webhook Event: ${event.event}`);

    // Handle payment.captured or order.paid
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload?.payment?.entity;
      const orderEntity = event.payload?.order?.entity;
      const orderId = payment?.notes?.orderId || orderEntity?.receipt || payment?.notes?.receipt;

      if (orderId) {
        try {
          const docRef = doc(db, 'orders', orderId);
          const snap = await getDoc(docRef);

          if (snap.exists()) {
            const isPartial = payment?.notes?.is_partial === 'yes';
            const newStatus = isPartial ? 'Partial COD - Advance Paid' : 'Online Paid - Awaiting Dispatch';
            const existingData = snap.data();

            await updateDoc(docRef, {
              paymentId: payment?.id || existingData.paymentId,
              razorpayOrderId: payment?.order_id || null,
              paymentStatus: 'captured',
              status: newStatus,
              verifiedVia: 'razorpay_webhook',
              updatedAt: new Date().toISOString(),
            });

            console.log(`✅ Order #${orderId} payment verified & updated via webhook (${payment?.id})`);

            // Backup email trigger if frontend checkout didn't complete email dispatch
            if (!existingData.emailSent) {
              const updatedOrder = { ...existingData, orderId, status: newStatus, paymentId: payment?.id || existingData.paymentId };
              await sendOrderEmails(updatedOrder).catch(e => console.error('Webhook email dispatch error:', e));
              await updateDoc(docRef, { emailSent: true });
            }
          } else {
            console.log(`ℹ️ Order #${orderId} not found in Firestore yet (may be writing client-side).`);
          }
        } catch (fsErr) {
          console.error('Firestore webhook update error:', fsErr);
        }
      }
    }

    // Handle payment.failed
    if (event.event === 'payment.failed') {
      const payment = event.payload?.payment?.entity;
      const orderId = payment?.notes?.orderId;

      if (orderId) {
        try {
          const docRef = doc(db, 'orders', orderId);
          const snap = await getDoc(docRef);

          if (snap.exists()) {
            await updateDoc(docRef, {
              paymentStatus: 'failed',
              paymentError: payment?.error_description || 'Payment Failed',
              updatedAt: new Date().toISOString(),
            });
            console.log(`⚠️ Order #${orderId} marked as payment failed via webhook.`);
          }
        } catch (fsErr) {
          console.error('Firestore webhook failure update error:', fsErr);
        }
      }
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (error) {
    console.error('Razorpay Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
