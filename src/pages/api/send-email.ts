// Brevo Email API endpoint
export const prerender = false;

import type { APIRoute } from "astro";

// Admin email for order notifications
const ADMIN_EMAIL = "akash@trustseo.co";

// Brevo API endpoint
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  selectedSize?: {
    name: string;
    price: number;
  };
  selectedToppings?: Array<{
    name: string;
    price: number;
  }>;
  specialInstructions?: string;
}

interface EmailRequest {
  to: string;
  type: "order_placed" | "status_update" | "admin_new_order";
  orderNumber: string;
  customerName: string;
  items?: OrderItem[];
  total?: number;
  status?: string;
  paymentMethod?: string;
  pickupTime?: string;
  phone?: string;
  specialInstructions?: string;
}

// Send email via Brevo REST API
async function sendBrevoEmail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = import.meta.env.BREVO_API_KEY;

  if (!apiKey) {
    console.error("BREVO_API_KEY is not configured");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "M&M Factory Pizza", email: "akash@trustseo.co" },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Brevo API error:", response.status, errorData);
      return { success: false, error: `Brevo API error: ${response.status}` };
    }

    const result = await response.json();
    console.log("Brevo email sent successfully:", result);
    return { success: true };
  } catch (error) {
    console.error("Failed to send email via Brevo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Email template for order placed (customer)
function getOrderPlacedEmail(data: EmailRequest): { subject: string; html: string } {
  const itemsHtml =
    data.items
      ?.map((item) => {
        let itemDetails = `<strong>${item.name}</strong>`;
        if (item.selectedSize) {
          itemDetails += ` - ${item.selectedSize.name}`;
        }
        if (item.selectedToppings && item.selectedToppings.length > 0) {
          itemDetails += `<br><small style="color: #666;">Toppings: ${item.selectedToppings.map((t) => t.name).join(", ")}</small>`;
        }
        if (item.specialInstructions) {
          itemDetails += `<br><small style="color: #666;">Note: ${item.specialInstructions}</small>`;
        }
        const itemTotal =
          (item.selectedSize?.price || item.price) * item.quantity +
          (item.selectedToppings?.reduce((sum, t) => sum + t.price, 0) || 0) *
            item.quantity;
        return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${itemDetails}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${itemTotal.toFixed(2)}</td>
        </tr>
      `;
      })
      .join("") || "";

  const paymentStatus =
    data.paymentMethod === "stripe"
      ? '<span style="color: #22c55e; font-weight: bold;">✓ PAID</span>'
      : '<span style="color: #f59e0b; font-weight: bold;">Pay at Pickup</span>';

  return {
    subject: `Order Confirmed #${data.orderNumber} - M&M Factory Pizza`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🍕 M&M Factory Pizza</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Order Confirmation</p>
        </div>

        <!-- Order Box -->
        <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Thank You Message -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #22c55e; margin: 0 0 10px 0;">✓ Order Received!</h2>
            <p style="color: #666; margin: 0;">Thank you for your order, ${data.customerName}!</p>
          </div>

          <!-- Order Details Card -->
          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Order Number:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; font-size: 18px; color: #dc2626;">#${data.orderNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Payment Status:</td>
                <td style="padding: 8px 0; text-align: right;">${paymentStatus}</td>
              </tr>
              ${
                data.pickupTime
                  ? `
              <tr>
                <td style="padding: 8px 0; color: #666;">Pickup Time:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${data.pickupTime}</td>
              </tr>
              `
                  : ""
              }
            </table>
          </div>

          <!-- Invoice Style Items Table -->
          <div style="margin-bottom: 25px;">
            <h3 style="color: #333; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #dc2626;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Item</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Qty</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr style="background: #f9fafb;">
                  <td colspan="2" style="padding: 15px 12px; text-align: right; font-weight: bold; font-size: 16px;">Total:</td>
                  <td style="padding: 15px 12px; text-align: right; font-weight: bold; font-size: 20px; color: #dc2626;">$${data.total?.toFixed(2) || "0.00"}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          ${
            data.specialInstructions
              ? `
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin-bottom: 25px;">
            <strong style="color: #92400e;">📝 Special Instructions:</strong>
            <p style="margin: 5px 0 0 0; color: #78350f;">${data.specialInstructions}</p>
          </div>
          `
              : ""
          }

          <!-- Pickup Location -->
          <div style="background: #fef2f2; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #dc2626; margin: 0 0 10px 0;">📍 Pickup Location</h3>
            <p style="margin: 0; color: #666;">
              <strong>M&M Factory Pizza</strong><br>
              123 Pizza Street, Downtown<br>
              Your City, State 12345
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; margin: 0 0 10px 0;">Questions? Call us at <strong>(555) 123-4567</strong></p>
            <p style="color: #999; font-size: 12px; margin: 0;">Thank you for choosing M&M Factory Pizza!</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

// Email template for status update (customer)
function getStatusUpdateEmail(data: EmailRequest): { subject: string; html: string } {
  const statusEmoji: Record<string, string> = {
    pending: "🕐",
    confirmed: "✅",
    preparing: "👨‍🍳",
    ready: "🔔",
    completed: "🎉",
    cancelled: "❌",
  };

  const statusMessage: Record<string, string> = {
    pending: "Your order is being reviewed",
    confirmed: "Your order has been confirmed and will be prepared soon",
    preparing: "Our chefs are preparing your delicious pizza!",
    ready: "Your order is ready for pickup!",
    completed: "Your order has been completed. Thank you!",
    cancelled: "Your order has been cancelled",
  };

  const status = data.status || "pending";
  const emoji = statusEmoji[status] || "📋";
  const message = statusMessage[status] || "Your order status has been updated";

  const isReady = status === "ready";
  const isCancelled = status === "cancelled";

  return {
    subject: `${emoji} Order #${data.orderNumber} - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${isCancelled ? "#6b7280" : isReady ? "#22c55e" : "#dc2626"} 0%, ${isCancelled ? "#4b5563" : isReady ? "#16a34a" : "#b91c1c"} 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🍕 M&M Factory Pizza</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Order Update</p>
        </div>

        <!-- Content -->
        <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Status Badge -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 60px; margin-bottom: 15px;">${emoji}</div>
            <h2 style="color: ${isCancelled ? "#6b7280" : isReady ? "#22c55e" : "#dc2626"}; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">${status}</h2>
            <p style="color: #666; margin: 0; font-size: 18px;">${message}</p>
          </div>

          <!-- Order Info -->
          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Order Number:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; font-size: 18px; color: #dc2626;">#${data.orderNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Customer:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${data.customerName}</td>
              </tr>
              ${
                data.total
                  ? `
              <tr>
                <td style="padding: 8px 0; color: #666;">Total:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">$${data.total.toFixed(2)}</td>
              </tr>
              `
                  : ""
              }
            </table>
          </div>

          ${
            isReady
              ? `
          <!-- Ready for Pickup Alert -->
          <div style="background: #dcfce7; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; margin-bottom: 25px; text-align: center;">
            <h3 style="color: #166534; margin: 0 0 10px 0;">🎉 Your order is ready!</h3>
            <p style="color: #15803d; margin: 0; font-size: 16px;">Please come to pick up your delicious pizza!</p>
          </div>

          <!-- Pickup Location -->
          <div style="background: #fef2f2; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #dc2626; margin: 0 0 10px 0;">📍 Pickup Location</h3>
            <p style="margin: 0; color: #666;">
              <strong>M&M Factory Pizza</strong><br>
              123 Pizza Street, Downtown<br>
              Your City, State 12345
            </p>
          </div>
          `
              : ""
          }

          <!-- Status Progress -->
          <div style="margin-bottom: 25px;">
            <h4 style="color: #666; margin: 0 0 15px 0; text-align: center;">Order Progress</h4>
            <div style="display: flex; justify-content: space-between; position: relative;">
              <div style="flex: 1; text-align: center;">
                <div style="width: 30px; height: 30px; border-radius: 50%; background: ${["pending", "confirmed", "preparing", "ready", "completed"].includes(status) && !isCancelled ? "#22c55e" : "#e5e7eb"}; margin: 0 auto 5px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">✓</div>
                <span style="font-size: 10px; color: #666;">Received</span>
              </div>
              <div style="flex: 1; text-align: center;">
                <div style="width: 30px; height: 30px; border-radius: 50%; background: ${["confirmed", "preparing", "ready", "completed"].includes(status) && !isCancelled ? "#22c55e" : "#e5e7eb"}; margin: 0 auto 5px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">✓</div>
                <span style="font-size: 10px; color: #666;">Confirmed</span>
              </div>
              <div style="flex: 1; text-align: center;">
                <div style="width: 30px; height: 30px; border-radius: 50%; background: ${["preparing", "ready", "completed"].includes(status) && !isCancelled ? "#22c55e" : "#e5e7eb"}; margin: 0 auto 5px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">✓</div>
                <span style="font-size: 10px; color: #666;">Preparing</span>
              </div>
              <div style="flex: 1; text-align: center;">
                <div style="width: 30px; height: 30px; border-radius: 50%; background: ${["ready", "completed"].includes(status) && !isCancelled ? "#22c55e" : "#e5e7eb"}; margin: 0 auto 5px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">✓</div>
                <span style="font-size: 10px; color: #666;">Ready</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; margin: 0 0 10px 0;">Questions? Call us at <strong>(555) 123-4567</strong></p>
            <p style="color: #999; font-size: 12px; margin: 0;">Thank you for choosing M&M Factory Pizza!</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

// Email template for admin notification
function getAdminNewOrderEmail(data: EmailRequest): { subject: string; html: string } {
  const itemsHtml =
    data.items
      ?.map((item) => {
        let itemDetails = `<strong>${item.name}</strong>`;
        if (item.selectedSize) {
          itemDetails += ` - ${item.selectedSize.name}`;
        }
        if (item.selectedToppings && item.selectedToppings.length > 0) {
          itemDetails += `<br><small>Toppings: ${item.selectedToppings.map((t) => t.name).join(", ")}</small>`;
        }
        if (item.specialInstructions) {
          itemDetails += `<br><small>Note: ${item.specialInstructions}</small>`;
        }
        return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${itemDetails}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        </tr>
      `;
      })
      .join("") || "";

  const paymentBadge =
    data.paymentMethod === "stripe"
      ? '<span style="background: #22c55e; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">💳 PAID ONLINE</span>'
      : '<span style="background: #f59e0b; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">💵 PAY AT PICKUP</span>';

  return {
    subject: `🚨 NEW ORDER #${data.orderNumber} - $${data.total?.toFixed(2)} - ${data.paymentMethod === "stripe" ? "PAID" : "Pay at Pickup"}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Alert Header -->
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🚨 NEW ORDER RECEIVED!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Order #${data.orderNumber}</p>
        </div>

        <!-- Content -->
        <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 25px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Payment Status -->
          <div style="text-align: center; margin-bottom: 25px;">
            ${paymentBadge}
          </div>

          <!-- Customer Details -->
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">👤 Customer Details</h3>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 5px 0; color: #666; width: 100px;">Name:</td>
                <td style="padding: 5px 0; font-weight: bold;">${data.customerName}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #666;">Email:</td>
                <td style="padding: 5px 0;">${data.to}</td>
              </tr>
              ${
                data.phone
                  ? `
              <tr>
                <td style="padding: 5px 0; color: #666;">Phone:</td>
                <td style="padding: 5px 0; font-weight: bold;">${data.phone}</td>
              </tr>
              `
                  : ""
              }
              ${
                data.pickupTime
                  ? `
              <tr>
                <td style="padding: 5px 0; color: #666;">Pickup:</td>
                <td style="padding: 5px 0; font-weight: bold; color: #dc2626;">${data.pickupTime}</td>
              </tr>
              `
                  : ""
              }
            </table>
          </div>

          <!-- Order Items -->
          <div style="margin-bottom: 20px;">
            <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">🍕 Order Items</h3>
            <table style="width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280;">Item</th>
                  <th style="padding: 10px; text-align: center; font-size: 12px; text-transform: uppercase; color: #6b7280;">Qty</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          ${
            data.specialInstructions
              ? `
          <!-- Special Instructions -->
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
            <strong style="color: #92400e;">📝 Special Instructions:</strong>
            <p style="margin: 5px 0 0 0; color: #78350f;">${data.specialInstructions}</p>
          </div>
          `
              : ""
          }

          <!-- Total -->
          <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <span style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Order Total</span>
            <div style="font-size: 32px; font-weight: bold; margin-top: 5px;">$${data.total?.toFixed(2) || "0.00"}</div>
          </div>

          <!-- Action Button -->
          <div style="text-align: center; margin-top: 25px;">
            <a href="${import.meta.env.SITE_URL || "https://mm-factory-pizza.vercel.app"}/admin" style="display: inline-block; background: #7c3aed; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">View in Admin Dashboard →</a>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data: EmailRequest = await request.json();
    console.log("Email request received:", { type: data.type, to: data.to, orderNumber: data.orderNumber });

    // Validate required fields
    if (!data.to || !data.type || !data.orderNumber || !data.customerName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: to, type, orderNumber, customerName",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let emailContent: { subject: string; html: string };
    let recipientEmail = data.to;

    // Generate email content based on type
    switch (data.type) {
      case "order_placed":
        emailContent = getOrderPlacedEmail(data);
        break;
      case "status_update":
        emailContent = getStatusUpdateEmail(data);
        break;
      case "admin_new_order":
        emailContent = getAdminNewOrderEmail(data);
        recipientEmail = ADMIN_EMAIL;
        break;
      default:
        return new Response(
          JSON.stringify({ success: false, error: "Invalid email type" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    console.log(`Sending ${data.type} email to: ${recipientEmail}`);

    // Send email via Brevo
    const result = await sendBrevoEmail(recipientEmail, emailContent.subject, emailContent.html);

    if (!result.success) {
      console.error("Failed to send email:", result.error);
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Email sent successfully to ${recipientEmail}`);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Email API error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
