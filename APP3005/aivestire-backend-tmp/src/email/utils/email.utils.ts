import { EmailTemplate } from '../enums/email.enums';

function getEmailWrapper(title: string, content: string, context: any) {
  const isProd = process.env.NODE_ENV === 'production';
  const frontendUrl =
    process.env.FRONTEND_URL ||
    (isProd ? 'https://aivestire.com' : 'http://localhost:8080');
  const orderUrl = `${frontendUrl}/user/orders`; // Frontend URL route

  let itemsHtml = '';
  if (context.items && context.items.length > 0) {
    itemsHtml = `
      <div style="margin-top: 32px; border-top: 1px solid #eaebec; padding-top: 24px;">
        <h3 style="color: #111827; margin-bottom: 16px; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Order Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #eaebec; color: #6b7280; font-size: 12px; text-transform: uppercase;">
              <th style="text-align: left; padding: 12px 0;">Item Name</th>
              <th style="text-align: center; padding: 12px 0;">Qty</th>
              <th style="text-align: right; padding: 12px 0;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${context.items
              .map(
                (item: any) => `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 16px 0; color: #374151; font-weight: 500; font-size: 14px; width: 60%;">${item.name}</td>
                <td style="padding: 16px 0; color: #6b7280; text-align: center; font-size: 14px;">${item.quantity}</td>
                <td style="padding: 16px 0; color: #111827; text-align: right; font-weight: 600; font-size: 14px;">₹${item.price}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding-top: 20px; text-align: right; color: #4b5563; font-weight: 500; font-size: 14px;">Total Amount:</td>
              <td style="padding-top: 20px; text-align: right; color: #111827; font-weight: 700; font-size: 18px;">₹${context.totalAmount}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  let shippingHtml = '';
  if (context.shippingAddress) {
    const addr = context.shippingAddress;
    shippingHtml = `
      <div style="margin-top: 32px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px;">
        <h3 style="color: #111827; margin-top: 0; margin-bottom: 12px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Delivery Address</h3>
        <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">
          <strong style="color: #1e293b;">${addr.full_name}</strong><br>
          ${addr.address_line_1}${addr.address_line_2 ? ', ' + addr.address_line_2 : ''}<br>
          ${addr.city}, ${addr.state} - ${addr.pincode}<br>
          <span style="display: inline-block; margin-top: 8px;"><strong>Phone:</strong> ${addr.phone_number}</span>
        </p>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f1f5f9; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 28px 40px; text-align: center; border-bottom: 4px solid #3b82f6;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px; font-family: Georgia, serif;">
                <span style="font-weight: 400;">Ai</span><span style="font-weight: 700;">Vestire</span>
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              ${content}
              
              ${itemsHtml}
              ${shippingHtml}

              <div style="margin-top: 40px; text-align: center;">
                <a href="${orderUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 600; text-decoration: none; padding: 14px 36px; border-radius: 4px; font-size: 15px; letter-spacing: 0.5px;">View Order Details</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 32px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6;">
                If you have any queries, please visit our <a href="${frontendUrl}/contact" style="color: #2563eb; text-decoration: none; font-weight: 500;">Help Center</a>.<br><br>
                &copy; ${new Date().getFullYear()} AiVestire. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export const EmailUtils = {
  getSubjectForTemplate(template: EmailTemplate, context: any): string {
    switch (template) {
      case EmailTemplate.ORDER_CONFIRMATION:
        return (
          'Order Confirmation: Your AiVestire order #' +
          context.orderNumber +
          ' has been successfully placed'
        );
      case EmailTemplate.ORDER_CANCELLED:
        return (
          'Order Cancelled: Update regarding your AiVestire order #' +
          context.orderNumber
        );
      case EmailTemplate.ORDER_DELIVERED:
        return (
          'Delivered: Your AiVestire order #' +
          context.orderNumber +
          ' has been delivered'
        );
      default:
        return 'Notification from AiVestire';
    }
  },

  getHtmlForTemplate(template: EmailTemplate, context: any): string {
    const userName = context.userName || 'Customer';

    switch (template) {
      case EmailTemplate.ORDER_CONFIRMATION:
        return getEmailWrapper(
          'Order Confirmed',
          `
          <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 20px; font-size: 22px; font-weight: 600;">Order Confirmation</h2>
          <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            Dear <strong>${userName}</strong>,<br><br>
            Thank you for shopping with AiVestire. We are pleased to confirm that we have successfully received your order <strong>#${context.orderNumber}</strong>. We are currently processing it and will notify you once your items are dispatched.
          </p>
          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px; border-radius: 0 4px 4px 0;">
            <p style="margin: 0; color: #1e3a8a; font-size: 14px; font-weight: 500; line-height: 1.5;">
              You can track the status of your order at any time by clicking the button below.
            </p>
          </div>
        `,
          context,
        );

      case EmailTemplate.ORDER_CANCELLED:
        return getEmailWrapper(
          'Order Cancelled',
          `
          <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 20px; font-size: 22px; font-weight: 600;">Order Cancellation Request Processed</h2>
          <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            Dear <strong>${userName}</strong>,<br><br>
            This email is to confirm that your order <strong>#${context.orderNumber}</strong> has been cancelled successfully as requested.
          </p>
          ${
            context.reason
              ? `
          <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
            <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.5;">
              <strong>Reason for cancellation:</strong> ${context.reason}
            </p>
          </div>
          `
              : ''
          }
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            If you have already paid for this order, the full amount will be refunded to your original payment method automatically within 5-7 business days. We hope to serve you again soon.
          </p>
        `,
          context,
        );

      case EmailTemplate.ORDER_DELIVERED:
        return getEmailWrapper(
          'Order Delivered',
          `
          <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 20px; font-size: 22px; font-weight: 600;">Your Order Has Been Delivered</h2>
          <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
            Dear <strong>${userName}</strong>,<br><br>
            We are pleased to inform you that your order <strong>#${context.orderNumber}</strong> has been successfully delivered to your requested address.
          </p>
          <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            Thank you for choosing AiVestire. We hope you enjoy your new purchase and look forward to seeing you again.
          </p>
        `,
          context,
        );

      default:
        return getEmailWrapper(
          'Notification',
          `
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Dear Customer, this is a notification regarding your recent activity on AiVestire.</p>
        `,
          context,
        );
    }
  },
};
