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
const ADMIN_EMAIL = "akash@localleads247.com";

// Email templates
function getOrderPlacedEmail(order: any) {
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
    subject: `Order Confirmed - ${order.orderNumber} | M&M Factory Pizza`,
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
          
          <!-- Success Banner -->
          <div style="background-color: #10b981; padding: 20px; text-align: center;">
            <h2 style="margin: 0; color: #ffffff; font-size: 22px;">✓ Order Confirmed!</h2>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              Hi <strong>${order.customerName}</strong>,
            </p>
            <p style="font-size: 16px; color: #333; margin-bottom: 25px;">
              Thank you for your order! We've received it and will start preparing your delicious food shortly.
            </p>
            
            <!-- Order Info Box -->
            <div style="background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #666;">Order Number:</span>
                <strong style="color: #1a1a1a; font-size: 18px;">${order.orderNumber}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #666;">Payment:</span>
                <strong style="color: ${order.paymentStatus === 'paid' ? '#10b981' : '#f59e0b'};">
                  ${order.paymentStatus === 'paid' ? '✓ Paid Online' : 'Pay at Pickup'}
                </strong>
              </div>
            </div>
            
            <!-- Order Items -->
            <h3 style="color: #1a1a1a; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #8B9A46; padding-bottom: 10px;">
              Your Order
            </h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              ${itemsList}
              <tr>
                <td style="padding: 12px; color: #666;">Subtotal</td>
                <td style="padding: 12px; text-align: right;">€${order.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 12px; color: #666;">VAT (21%)</td>
                <td style="padding: 12px; text-align: right;">€${order.tax.toFixed(2)}</td>
              </tr>
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 15px; font-weight: bold; font-size: 18px;">Total</td>
                <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px; color: #8B9A46;">€${order.total.toFixed(2)}</td>
              </tr>
            </table>
            
            <!-- Pickup Info -->
            <div style="background-color: #8B9A46; border-radius: 12px; padding: 20px; color: #ffffff; margin-bottom: 25px;">
              <h3 style="margin: 0 0 15px 0; font-size: 18px;">📍 Pickup Location</h3>
              <p style="margin: 0 0 5px 0; font-size: 16px;"><strong>${RESTAURANT.address}</strong></p>
              <p style="margin: 0; font-size: 14px; opacity: 0.9;">
                You'll receive another email when your order is ready!
              </p>
            </div>
            
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

function getStatusUpdateEmail(order: any, newStatus: string) {
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
    subject: `${status.title} - Order ${order.order_number} | M&M Factory Pizza`,
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
              Hi <strong>${order.customer_name}</strong>,
            </p>
            <p style="font-size: 16px; color: #333; margin-bottom: 25px;">
              ${status.message}
            </p>
            
            <!-- Order Info -->
            <div style="background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
              <div style="margin-bottom: 10px;">
                <span style="color: #666;">Order Number:</span>
                <strong style="color: #1a1a1a; margin-left: 10px;">${order.order_number}</strong>
              </div>
              <div>
                <span style="color: #666;">Total:</span>
                <strong style="color: #8B9A46; margin-left: 10px; font-size: 18px;">€${order.total.toFixed(2)}</strong>
              </div>
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
    subject: `🍕 NEW ORDER - ${order.orderNumber} - €${order.total.toFixed(2)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background-color: #dc2626; padding: 20px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 24px;">🍕 NEW ORDER!</h1>
          </div>
          
          <!-- Order Info -->
          <div style="padding: 25px;">
            <div style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 10px; padding: 15px; margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="font-weight: bold; font-size: 18px;">Order #${order.orderNumber}</span>
                <span style="font-weight: bold; font-size: 18px; color: #059669;">€${order.total.toFixed(2)}</span>
              </div>
              <div style="color: #666;">
                Payment: <strong style="color: ${order.paymentStatus === 'paid' ? '#059669' : '#f59e0b'};">${order.paymentStatus === 'paid' ? '✓ PAID' : '💵 Pay at Pickup'}</strong>
              </div>
            </div>
            
            <!-- Customer Info -->
            <h3 style="margin: 0 0 10px 0; color: #333; border-bottom: 2px solid #8B9A46; padding-bottom: 8px;">👤 Customer</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${order.customerName}</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> <a href="tel:${order.customerPhone}">${order.customerPhone}</a></p>
            <p style="margin: 5px 0 20px;"><strong>Email:</strong> ${order.customerEmail}</p>
            
            <!-- Order Items -->
            <h3 style="margin: 0 0 10px 0; color: #333; border-bottom: 2px solid #8B9A46; padding-bottom: 8px;">📋 Order Items</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
              ${itemsList}
              <tr style="background-color: #f0f0f0;">
                <td style="padding: 12px; font-weight: bold;">TOTAL</td>
                <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px;">€${order.total.toFixed(2)}</td>
              </tr>
            </table>
            
            ${order.notes ? `
            <div style="background-color: #fef3c7; border-radius: 8px; padding: 12px; margin-top: 15px;">
              <strong>📝 Notes:</strong> ${order.notes}
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
