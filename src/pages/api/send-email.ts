// Email notification API endpoint using Resend
export const prerender = false;

import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

// Restaurant details
const RESTAURANT = {
  name: "M&M Factory Pizza",
  address: "Plaça Major, 3, 07460 Pollença",
  phone: "+34 871 531 423",
  email: "orders@mmfactorypizza.com",
};

// Admin email for new order notifications
const ADMIN_EMAIL = "akash@trustseo.co";

// Email templates
function getOrderPlacedEmail(order: any) {
  const isPaid = order.paymentStatus === 'paid';
  const orderDate = new Date().toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const itemsList = order.items.map((item: any) => 
    `<tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${item.quantity}× ${item.menuItemName}</strong>
        ${item.extras && item.extras.length > 0 ? `<br><span style="color: #666; font-size: 13px;">+ ${item.extras.map((e: any) => e.extraName).join(', ')}</span>` : ''}
        ${item.specialInstructions ? `<br><span style="color: #f59e0b; font-size: 13px;">📝 ${item.specialInstructions}</span>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">€${item.itemTotal.toFixed(2)}</td>
    </tr>`
  ).join('');

  return {
    subject: isPaid 
      ? `Payment Confirmed & Receipt - ${order.orderNumber} | M&M Factory Pizza`
      : `Order Confirmed - ${order.orderNumber} | M&M Factory Pizza`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background-color: #1a1a1a; padding: 30px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 28px;">
              <span style="color: #8B9A46;">M</span>&<span style="color: #dc2626;">M</span> Factory Pizza
            </h1>
            ${isPaid ? '<p style="margin: 10px 0 0 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Payment Receipt</p>' : ''}
          </div>
          
          <!-- Success Banner -->
          <div style="background-color: ${isPaid ? '#10b981' : '#f59e0b'}; padding: 20px; text-align: center;">
            <h2 style="margin: 0; color: #ffffff; font-size: 22px;">
              ${isPaid ? '✓ Payment Successful!' : '📋 Order Confirmed'}
            </h2>
            ${isPaid ? '<p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Your payment has been processed securely</p>' : '<p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Payment due at pickup</p>'}
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              Hi <strong>${order.customerName}</strong>,
            </p>
            <p style="font-size: 16px; color: #333; margin-bottom: 25px;">
              ${isPaid 
                ? 'Thank you for your payment! Your order is confirmed and we\'ll start preparing it right away.' 
                : 'Thank you for your order! Please remember to pay €' + order.total.toFixed(2) + ' when you pick up.'}
            </p>
            
            <!-- Invoice/Receipt Header -->
            <div style="background-color: ${isPaid ? '#ecfdf5' : '#fef3c7'}; border: 2px solid ${isPaid ? '#10b981' : '#f59e0b'}; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 5px 0;">
                    <span style="color: #666; font-size: 13px;">Order Number</span><br>
                    <strong style="color: #1a1a1a; font-size: 20px;">${order.orderNumber}</strong>
                  </td>
                  <td style="padding: 5px 0; text-align: right;">
                    <span style="color: #666; font-size: 13px;">Date</span><br>
                    <strong style="color: #1a1a1a; font-size: 14px;">${orderDate}</strong>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 15px;">
                    <span style="color: #666; font-size: 13px;">Payment Status</span><br>
                    <strong style="color: ${isPaid ? '#059669' : '#d97706'}; font-size: 16px;">
                      ${isPaid ? '✓ PAID - Card Payment' : '⏳ PENDING - Pay at Pickup'}
                    </strong>
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- Order Items / Invoice Lines -->
            <h3 style="color: #1a1a1a; font-size: 16px; margin-bottom: 15px; border-bottom: 2px solid #8B9A46; padding-bottom: 10px;">
              ${isPaid ? '📄 Invoice Details' : '📋 Order Details'}
            </h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 10px 12px; text-align: left; font-size: 13px; color: #666; border-bottom: 2px solid #ddd;">Item</th>
                  <th style="padding: 10px 12px; text-align: right; font-size: 13px; color: #666; border-bottom: 2px solid #ddd;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
              <tfoot>
                <tr>
                  <td style="padding: 10px 12px; color: #666; font-size: 14px;">Subtotal</td>
                  <td style="padding: 10px 12px; text-align: right; font-size: 14px;">€${order.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; color: #666; font-size: 14px;">VAT (21%)</td>
                  <td style="padding: 10px 12px; text-align: right; font-size: 14px;">€${order.tax.toFixed(2)}</td>
                </tr>
                <tr style="background-color: ${isPaid ? '#ecfdf5' : '#fef3c7'};">
                  <td style="padding: 15px 12px; font-weight: bold; font-size: 18px;">
                    ${isPaid ? 'Total Paid' : 'Amount Due'}
                  </td>
                  <td style="padding: 15px 12px; text-align: right; font-weight: bold; font-size: 20px; color: ${isPaid ? '#059669' : '#d97706'};">€${order.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            
            <!-- Pickup Info -->
            <div style="background-color: #8B9A46; border-radius: 12px; padding: 20px; color: #ffffff; margin-bottom: 25px;">
              <h3 style="margin: 0 0 15px 0; font-size: 18px;">📍 Pickup Location</h3>
              <p style="margin: 0 0 5px 0; font-size: 16px;"><strong>${RESTAURANT.address}</strong></p>
              <p style="margin: 0; font-size: 14px; opacity: 0.9;">
                You'll receive an email when your order is ready!
              </p>
            </div>
            
            ${isPaid ? `
            <!-- Payment Confirmation Box -->
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin-bottom: 20px; font-size: 13px; color: #166534;">
              <strong>💳 Payment processed securely via Stripe</strong><br>
              This email serves as your receipt. No payment needed at pickup.
            </div>
            ` : `
            <!-- Payment Reminder -->
            <div style="background-color: #fef9c3; border: 1px solid #fde047; border-radius: 8px; padding: 15px; margin-bottom: 20px; font-size: 13px; color: #854d0e;">
              <strong>💵 Please bring payment</strong><br>
              Amount due at pickup: <strong>€${order.total.toFixed(2)}</strong> (Cash or Card accepted)
            </div>
            `}
            
            <!-- Contact -->
            <p style="font-size: 14px; color: #666; text-align: center;">
              Questions? Call us at <a href="tel:${RESTAURANT.phone}" style="color: #8B9A46;">${RESTAURANT.phone}</a>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
            <p style="margin: 0 0 5px 0; color: #fff; font-size: 14px; font-weight: bold;">M&M Factory Pizza</p>
            <p style="margin: 0; color: #999; font-size: 12px;">
              ${RESTAURANT.address} | ${RESTAURANT.phone}
            </p>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 11px;">
              © ${new Date().getFullYear()} M&M Factory Pizza. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };
}

function getStatusUpdateEmail(order: any, newStatus: string) {
  // Handle both field name formats (snake_case from DB, camelCase from frontend)
  const orderNumber = order.order_number || order.orderNumber;
  const customerName = order.customer_name || order.customerName;
  const orderTotal = order.total || 0;
  
  const statusMessages: Record<string, { title: string; message: string; color: string }> = {
    confirmed: {
      title: "Order Confirmed! ✓",
      message: "Great news! Your order has been confirmed and we'll start preparing it soon.",
      color: "#3b82f6"
    },
    preparing: {
      title: "We're Preparing Your Order! 👨‍🍳",
      message: "Our chefs are now preparing your delicious order. It won't be long!",
      color: "#f97316"
    },
    ready: {
      title: "Your Order is Ready! 🎉",
      message: "Your order is ready for pickup! Head over to our restaurant to collect it.",
      color: "#10b981"
    },
    completed: {
      title: "Thank You! 🙏",
      message: "We hope you enjoyed your meal! Thank you for choosing M&M Factory Pizza.",
      color: "#8B9A46"
    }
  };

  const status = statusMessages[newStatus] || {
    title: "Order Update",
    message: `Your order status has been updated to: ${newStatus}`,
    color: "#666"
  };

  return {
    subject: `${status.title} - Order ${orderNumber} | M&M Factory Pizza`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background-color: #1a1a1a; padding: 30px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 28px;">
              <span style="color: #8B9A46;">M</span>&<span style="color: #dc2626;">M</span> Factory Pizza
            </h1>
          </div>
          
          <!-- Status Banner -->
          <div style="background-color: ${status.color}; padding: 25px; text-align: center;">
            <h2 style="margin: 0; color: #ffffff; font-size: 24px;">${status.title}</h2>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              Hi <strong>${customerName}</strong>,
            </p>
            <p style="font-size: 16px; color: #333; margin-bottom: 25px;">
              ${status.message}
            </p>
            
            <!-- Order Info -->
            <div style="background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
              <div style="margin-bottom: 10px;">
                <span style="color: #666;">Order Number:</span>
                <strong style="color: #1a1a1a; margin-left: 10px;">${orderNumber}</strong>
              </div>
              ${orderTotal > 0 ? `<div>
                <span style="color: #666;">Total:</span>
                <strong style="color: #8B9A46; margin-left: 10px; font-size: 18px;">€${orderTotal.toFixed(2)}</strong>
              </div>` : ''}
            </div>
            
            ${newStatus === 'ready' ? `
            <!-- Pickup Reminder -->
            <div style="background-color: #10b981; border-radius: 12px; padding: 20px; color: #ffffff; margin-bottom: 25px; text-align: center;">
              <h3 style="margin: 0 0 10px 0; font-size: 20px;">🏃 Come Pick Up Your Order!</h3>
              <p style="margin: 0; font-size: 16px;"><strong>${RESTAURANT.address}</strong></p>
            </div>
            ` : ''}
            
            <!-- Contact -->
            <p style="font-size: 14px; color: #666; text-align: center;">
              Questions? Call us at <a href="tel:${RESTAURANT.phone}" style="color: #8B9A46;">${RESTAURANT.phone}</a>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
            <p style="margin: 0; color: #999; font-size: 13px;">
              © ${new Date().getFullYear()} M&M Factory Pizza | ${RESTAURANT.address}
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };
}

// Admin notification email for new orders
function getAdminNewOrderEmail(order: any) {
  const isPaid = order.paymentStatus === 'paid';
  const orderDate = new Date().toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const itemsList = order.items.map((item: any) => 
    `<tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${item.quantity}× ${item.menuItemName}</strong>
        ${item.extras && item.extras.length > 0 ? `<br><span style="color: #666; font-size: 13px;">+ ${item.extras.map((e: any) => e.extraName).join(', ')}</span>` : ''}
        ${item.specialInstructions ? `<br><span style="color: #f59e0b; font-size: 13px;">📝 ${item.specialInstructions}</span>` : ''}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">€${item.itemTotal.toFixed(2)}</td>
    </tr>`
  ).join('');

  return {
    subject: `🍕 NEW ORDER ${isPaid ? '💳 PAID' : '💵 PAY@PICKUP'} - #${order.orderNumber} - €${order.total.toFixed(2)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background-color: ${isPaid ? '#059669' : '#dc2626'}; padding: 20px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 24px;">🍕 NEW ORDER!</h1>
            <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${orderDate}</p>
          </div>
          
          <!-- Payment Status Banner -->
          <div style="background-color: ${isPaid ? '#ecfdf5' : '#fef3c7'}; border-bottom: 3px solid ${isPaid ? '#10b981' : '#f59e0b'}; padding: 15px; text-align: center;">
            <span style="font-size: 20px; font-weight: bold; color: ${isPaid ? '#059669' : '#d97706'};">
              ${isPaid ? '💳 PAYMENT RECEIVED' : '💵 PAYMENT DUE AT PICKUP'}
            </span>
          </div>
          
          <!-- Order Info -->
          <div style="padding: 25px;">
            <!-- Order Summary Box -->
            <div style="background-color: #f8f9fa; border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 5px 0;">
                    <span style="color: #666; font-size: 13px;">Order Number</span><br>
                    <strong style="font-size: 22px; color: #1a1a1a;">#${order.orderNumber}</strong>
                  </td>
                  <td style="padding: 5px 0; text-align: right;">
                    <span style="color: #666; font-size: 13px;">Order Total</span><br>
                    <strong style="font-size: 26px; color: ${isPaid ? '#059669' : '#d97706'};">€${order.total.toFixed(2)}</strong>
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- Payment Details -->
            <div style="background-color: ${isPaid ? '#f0fdf4' : '#fefce8'}; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #666;">💰 PAYMENT INFORMATION</h3>
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 3px 0; color: #333;"><strong>Status:</strong></td>
                  <td style="padding: 3px 0; text-align: right;">
                    <span style="background-color: ${isPaid ? '#dcfce7' : '#fef08a'}; color: ${isPaid ? '#166534' : '#854d0e'}; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: bold;">
                      ${isPaid ? '✓ PAID' : '⏳ PENDING'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 3px 0; color: #333;"><strong>Method:</strong></td>
                  <td style="padding: 3px 0; text-align: right; color: #333;">${isPaid ? 'Card (Stripe)' : 'Cash/Card at Pickup'}</td>
                </tr>
                <tr>
                  <td style="padding: 3px 0; color: #333;"><strong>Amount:</strong></td>
                  <td style="padding: 3px 0; text-align: right; color: #333; font-weight: bold;">€${order.total.toFixed(2)}</td>
                </tr>
              </table>
              ${!isPaid ? `<p style="margin: 10px 0 0 0; padding: 10px; background-color: #fef08a; border-radius: 6px; font-size: 13px; color: #854d0e;">
                <strong>⚠️ Remember:</strong> Collect €${order.total.toFixed(2)} from customer at pickup
              </p>` : ''}
            </div>
            
            <!-- Customer Info -->
            <h3 style="margin: 0 0 10px 0; color: #333; border-bottom: 2px solid #8B9A46; padding-bottom: 8px;">👤 Customer Details</h3>
            <table style="width: 100%; margin-bottom: 20px;">
              <tr>
                <td style="padding: 5px 0; color: #666; width: 80px;">Name:</td>
                <td style="padding: 5px 0; color: #333;"><strong>${order.customerName}</strong></td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #666;">Phone:</td>
                <td style="padding: 5px 0;"><a href="tel:${order.customerPhone}" style="color: #2563eb; text-decoration: none; font-weight: bold;">${order.customerPhone}</a></td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #666;">Email:</td>
                <td style="padding: 5px 0;"><a href="mailto:${order.customerEmail}" style="color: #2563eb; text-decoration: none;">${order.customerEmail}</a></td>
              </tr>
            </table>
            
            <!-- Order Items -->
            <h3 style="margin: 0 0 10px 0; color: #333; border-bottom: 2px solid #8B9A46; padding-bottom: 8px;">📋 Order Items</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
              ${itemsList}
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 8px 10px; color: #666; font-size: 14px;">Subtotal</td>
                <td style="padding: 8px 10px; text-align: right; font-size: 14px;">€${order.subtotal.toFixed(2)}</td>
              </tr>
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 8px 10px; color: #666; font-size: 14px;">VAT (21%)</td>
                <td style="padding: 8px 10px; text-align: right; font-size: 14px;">€${order.tax.toFixed(2)}</td>
              </tr>
              <tr style="background-color: ${isPaid ? '#dcfce7' : '#fef08a'};">
                <td style="padding: 12px 10px; font-weight: bold; font-size: 16px;">${isPaid ? 'Total Paid' : 'Total Due'}</td>
                <td style="padding: 12px 10px; text-align: right; font-weight: bold; font-size: 20px; color: ${isPaid ? '#059669' : '#d97706'};">€${order.total.toFixed(2)}</td>
              </tr>
            </table>
            
            ${order.notes ? `
            <div style="background-color: #fef3c7; border-radius: 8px; padding: 12px; margin-bottom: 20px;">
              <strong>📝 Customer Notes:</strong><br>
              <span style="color: #92400e;">${order.notes}</span>
            </div>
            ` : ''}
            
            <!-- Action Button -->
            <div style="text-align: center; margin-top: 25px;">
              <a href="https://mm-factory-pizza.vercel.app/admin" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Open Admin Dashboard →</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { type, order, newStatus, customerEmail } = body;

    if (!customerEmail && type !== 'admin_notification') {
      return new Response(
        JSON.stringify({ error: 'Customer email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let emailContent;
    let recipientEmail = customerEmail;
    
    if (type === 'order_placed') {
      emailContent = getOrderPlacedEmail(order);
    } else if (type === 'status_update') {
      emailContent = getStatusUpdateEmail(order, newStatus);
    } else if (type === 'admin_notification') {
      emailContent = getAdminNewOrderEmail(order);
      recipientEmail = ADMIN_EMAIL;
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid email type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Send email via Resend
    // Note: In free tier, you can only send to your own email or use onboarding@resend.dev
    // For production, you need to verify your domain
    const { data, error } = await resend.emails.send({
      from: 'M&M Factory Pizza <onboarding@resend.dev>', // Change after domain verification
      to: recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (error) {
      console.error('Resend error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, messageId: data?.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Email error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send email' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
