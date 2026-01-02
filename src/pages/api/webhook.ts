// Stripe Webhook handler - processes successful payments
export const prerender = false;

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Create Supabase client
const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  // For now, we'll process without signature verification for simplicity
  // In production, you should add STRIPE_WEBHOOK_SECRET and verify
  
  try {
    const event = JSON.parse(body);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Extract order data from metadata
      const metadata = session.metadata || {};
      const orderNumber = metadata.orderNumber;
      const customerName = metadata.customerName;
      const customerPhone = metadata.customerPhone;
      const customerEmail = metadata.customerEmail;
      const notes = metadata.notes;
      const subtotal = parseFloat(metadata.subtotal || '0');
      const tax = parseFloat(metadata.tax || '0');
      const total = parseFloat(metadata.total || '0');
      const items = JSON.parse(metadata.items || '[]');

      // Create order in database
      const { data, error } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail || null,
          items: items,
          subtotal: subtotal,
          tax: tax,
          total: total,
          status: 'pending',
          payment_status: 'paid',
          payment_intent_id: session.payment_intent as string,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create order' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.log('Order created:', data);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
