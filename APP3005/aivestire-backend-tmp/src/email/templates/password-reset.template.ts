export function getPasswordResetEmailHtml(context: any): string {
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
