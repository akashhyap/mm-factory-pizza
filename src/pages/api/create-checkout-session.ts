// Stripe Checkout Session API endpoint
export const prerender = false;

import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { 
      items, 
      customerName, 
      customerPhone, 
      customerEmail, 
      notes,
      orderNumber,
      subtotal,
      tax,
      total 
    } = body;

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No items in cart' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: any) => {
      // Build description with extras if any
      let description = '';
      if (item.extras && item.extras.length > 0) {
        const extrasList = item.extras
          .map((e: any) => `${e.extraName}${e.quantity > 1 ? ` x${e.quantity}` : ''}`)
          .join(', ');
        description = `Extras: ${extrasList}`;
      }
      if (item.specialInstructions) {
        description += description ? ` | Note: ${item.specialInstructions}` : `Note: ${item.specialInstructions}`;
      }

      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.menuItemName,
            description: description || undefined,
          },
          unit_amount: Math.round(item.itemTotal * 100 / item.quantity), // Convert to cents per unit
        },
        quantity: item.quantity,
      };
    });

    // Add tax as a separate line item
    if (tax > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'VAT (21%)',
          },
          unit_amount: Math.round(tax * 100),
        },
        quantity: 1,
      });
    }

    // Get the origin for redirect URLs
    const origin = request.headers.get('origin') || 'http://localhost:4321';

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?cancelled=true`,
      customer_email: customerEmail || undefined,
      metadata: {
        orderNumber,
        customerName,
        customerPhone,
        customerEmail: customerEmail || '',
        notes: notes || '',
        subtotal: subtotal.toString(),
        tax: tax.toString(),
        total: total.toString(),
        items: JSON.stringify(items),
      },
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Stripe error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create checkout session' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
