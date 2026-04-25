import { EmailTemplate } from '../enums/email.enums';

function getPasswordResetEmailHtml(context: any): string {
  const { resetLink, expiryMinutes, userName } = context;
  const displayName = userName || 'Customer';
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Reset Your Password — AiVestire</title>
  <!--[if mso]>
  <style>table,td,div,p{font-family:Arial,Helvetica,sans-serif!important}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0c0c0e;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
  <!-- Preheader (hidden text for inbox preview) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    Reset your AiVestire password — this link expires in ${expiryMinutes} minutes.
  </div>

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0c0c0e;padding:32px 16px;">
    <tr>
      <td align="center">

        <!-- Card container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#18181b;border-radius:16px;overflow:hidden;box-shadow:0 24px 48px rgba(0,0,0,0.4);">

          <!-- ═══ HEADER ═══ -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#0f172a 100%);padding:40px 40px 32px;text-align:center;border-bottom:3px solid #D4AF37;">
              <!-- Brand -->
              <h1 style="color:#ffffff;margin:0 0 8px;font-size:32px;letter-spacing:2px;font-family:Georgia,'Times New Roman',serif;">
                <span style="font-weight:300;color:#a0a0a0;">Ai</span><span style="font-weight:700;color:#ffffff;">Vestire</span>
              </h1>
              <p style="color:#D4AF37;margin:0;font-size:11px;text-transform:uppercase;letter-spacing:3px;font-weight:600;">Account Security</p>
            </td>
          </tr>

          <!-- ═══ BODY ═══ -->
          <tr>
            <td style="padding:40px 36px 32px;">

              <!-- Lock Icon -->
              <div style="text-align:center;margin-bottom:28px;">
                <div style="display:inline-block;width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,rgba(212,175,55,0.15) 0%,rgba(212,175,55,0.05) 100%);border:2px solid rgba(212,175,55,0.3);line-height:72px;font-size:32px;">
                  &#128274;
                </div>
              </div>

              <!-- Greeting -->
              <h2 style="color:#fafafa;margin:0 0 16px;font-size:24px;font-weight:600;text-align:center;line-height:1.3;">
                Password Reset Request
              </h2>
              <p style="color:#a1a1aa;font-size:15px;line-height:1.7;margin:0 0 32px;text-align:center;">
                Hello <strong style="color:#e4e4e7;">${displayName}</strong>, we received a request to reset the password associated with your AiVestire account.
              </p>

              <!-- ── CTA BUTTON ── -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${resetLink}"
                       target="_blank"
                       style="display:inline-block;background:linear-gradient(135deg,#D4AF37 0%,#c5a028 50%,#b8941f 100%);color:#0f172a;font-weight:700;text-decoration:none;padding:16px 52px;border-radius:8px;font-size:16px;letter-spacing:0.5px;box-shadow:0 4px 16px rgba(212,175,55,0.3);transition:all 0.2s;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:0 0 24px;">
                    <div style="height:1px;background:linear-gradient(90deg,transparent 0%,#3f3f46 50%,transparent 100%);"></div>
                  </td>
                </tr>
              </table>

              <!-- Info Cards -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                <!-- Expiry Card -->
                <tr>
                  <td style="padding:12px 16px;background-color:rgba(212,175,55,0.08);border-radius:10px;border:1px solid rgba(212,175,55,0.15);">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="36" valign="top" style="font-size:20px;padding-right:12px;">&#9200;</td>
                        <td>
                          <p style="margin:0;color:#D4AF37;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Link Expires In</p>
                          <p style="margin:4px 0 0;color:#e4e4e7;font-size:15px;font-weight:500;">${expiryMinutes} minutes from when this email was sent</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Steps -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:16px;background-color:rgba(255,255,255,0.03);border-radius:10px;border:1px solid #27272a;">
                    <p style="margin:0 0 12px;color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">How it works</p>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="28" valign="top" style="color:#D4AF37;font-size:14px;font-weight:700;padding:4px 0;">1.</td>
                        <td style="color:#d4d4d8;font-size:14px;line-height:1.5;padding:4px 0;">Click the "Reset Password" button above</td>
                      </tr>
                      <tr>
                        <td width="28" valign="top" style="color:#D4AF37;font-size:14px;font-weight:700;padding:4px 0;">2.</td>
                        <td style="color:#d4d4d8;font-size:14px;line-height:1.5;padding:4px 0;">Enter and confirm your new password</td>
                      </tr>
                      <tr>
                        <td width="28" valign="top" style="color:#D4AF37;font-size:14px;font-weight:700;padding:4px 0;">3.</td>
                        <td style="color:#d4d4d8;font-size:14px;line-height:1.5;padding:4px 0;">Log in with your new credentials</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="color:#71717a;font-size:12px;line-height:1.6;margin:0 0 8px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="color:#D4AF37;font-size:12px;line-height:1.5;margin:0;word-break:break-all;">
                <a href="${resetLink}" style="color:#D4AF37;text-decoration:underline;">${resetLink}</a>
              </p>

            </td>
          </tr>

          <!-- ═══ SECURITY NOTICE ═══ -->
          <tr>
            <td style="padding:0 36px 32px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:16px;background-color:rgba(239,68,68,0.06);border-radius:10px;border:1px solid rgba(239,68,68,0.12);">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="28" valign="top" style="font-size:16px;padding-right:8px;">&#128737;</td>
                        <td>
                          <p style="margin:0;color:#fca5a5;font-size:13px;line-height:1.6;">
                            <strong>Didn't request this?</strong> You can safely ignore this email. Your password will remain unchanged and your account is secure.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══ FOOTER ═══ -->
          <tr>
            <td style="background-color:#111113;padding:28px 36px;text-align:center;border-top:1px solid #27272a;">
              <p style="margin:0 0 8px;color:#52525b;font-size:12px;line-height:1.5;">
                This is an automated message from AiVestire.
              </p>
              <p style="margin:0;color:#3f3f46;font-size:11px;">
                &copy; ${year} AiVestire &middot; All rights reserved
              </p>
            </td>
          </tr>

        </table>

        <!-- Sub-footer -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:560px;">
          <tr>
            <td style="padding:20px 16px;text-align:center;">
              <p style="margin:0;color:#3f3f46;font-size:11px;line-height:1.5;">
                You received this email because a password reset was requested for your account.
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
      case EmailTemplate.PASSWORD_RESET:
        return 'Password Reset Request — AiVestire';
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

      case EmailTemplate.PASSWORD_RESET:
        return getPasswordResetEmailHtml(context);

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
