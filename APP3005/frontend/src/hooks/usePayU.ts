// ============================================
// usePayU HOOK — PayU form-POST redirect
// ============================================
// PayU uses a server-redirect flow: we create an invisible HTML <form>
// and auto-submit it to PayU's hosted checkout URL.
// We can pre-select a payment method by passing `pg` and `bankcode` fields.
//
// PayU `pg` values:   CC (credit card), DC (debit card), NB (net banking),
//                     UPI, CASH (wallets)
// PayU `bankcode`:    HDFC, ICICI, SBI, ... (banks) or PAYTM, PHONEPE, ... (wallets)
// ============================================

import { useCallback } from 'react';

export interface InitiatePaymentResponse {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  hash: string;
  action: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}

export interface PayUExtraFields {
    /** PayU payment group: CC, DC, NB, UPI, CASH */
    pg?: string;
    /** PayU bank / wallet code, e.g. HDFC, PAYTM, SBI */
    bankcode?: string;
}

export function usePayU() {
    /**
     * Redirect to PayU's hosted payment page by auto-submitting a hidden form.
     * Pass optional `extra` to pre-select a payment method / bank on PayU's page.
     */
    const redirectToPayU = useCallback(
        (payload: InitiatePaymentResponse, extra?: PayUExtraFields) => {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = payload.action;
            form.style.display = 'none';

            const fields: Record<string, string> = {
                key:         payload.key,
                txnid:       payload.txnid,
                amount:      payload.amount,
                productinfo: payload.productinfo,
                firstname:   payload.firstname,
                email:       payload.email,
                phone:       payload.phone,
                surl:        payload.surl,
                furl:        payload.furl,
                hash:        payload.hash,
            };

            // Only append UDFs that exist in the payload
            if (payload.udf1) fields.udf1 = payload.udf1;
            if (payload.udf2) fields.udf2 = payload.udf2;
            if (payload.udf3) fields.udf3 = payload.udf3;
            if (payload.udf4) fields.udf4 = payload.udf4;
            if (payload.udf5) fields.udf5 = payload.udf5;

            // Pre-select payment method on PayU's hosted page
            if (extra?.pg) fields.pg = extra.pg;
            if (extra?.bankcode) fields.bankcode = extra.bankcode;

            for (const [name, value] of Object.entries(fields)) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = name;
                input.value = value;
                form.appendChild(input);
            }

            // ── Premium PayU Redirect Overlay ─────────────────────────────────────────
            const overlay = document.createElement('div');
            overlay.id = 'payu-redirect-overlay';
            overlay.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 40%, #0f3460 100%);
                z-index: 99999; display: flex; flex-direction: column;
                align-items: center; justify-content: center;
                padding: 16px; box-sizing: border-box;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;

            overlay.innerHTML = `
                <style>
                    @keyframes payu-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    @keyframes payu-pulse { 0%,100% { opacity: 0.3; transform: scale(0.85); } 50% { opacity: 1; transform: scale(1); } }
                    @keyframes payu-fade-in { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes payu-shimmer { 0% { left: -100%; } 100% { left: 200%; } }
                    #payu-card {
                        background: rgba(255,255,255,0.05);
                        border: 1px solid rgba(255,255,255,0.12);
                        backdrop-filter: blur(20px);
                        -webkit-backdrop-filter: blur(20px);
                        border-radius: 24px;
                        padding: 40px 36px;
                        max-width: 420px;
                        width: 100%;
                        text-align: center;
                        animation: payu-fade-in 0.5s ease forwards;
                        box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.1);
                        position: relative;
                        overflow: hidden;
                    }
                    #payu-card::before {
                        content: '';
                        position: absolute; top: 0; left: 0; right: 0; height: 2px;
                        background: linear-gradient(90deg, transparent, #D4AF37, transparent);
                    }
                    .payu-logo-ring {
                        width: 80px; height: 80px;
                        border-radius: 50%;
                        background: rgba(212,175,55,0.12);
                        border: 2px solid rgba(212,175,55,0.3);
                        display: flex; align-items: center; justify-content: center;
                        margin: 0 auto 24px;
                        position: relative;
                    }
                    .payu-spinner {
                        position: absolute; inset: -8px;
                        border-radius: 50%;
                        border: 2px solid transparent;
                        border-top-color: #D4AF37;
                        animation: payu-spin 1s linear infinite;
                    }
                    .payu-dots { display: flex; gap: 6px; justify-content: center; margin: 20px 0 0; }
                    .payu-dot {
                        width: 7px; height: 7px; border-radius: 50%;
                        background: #D4AF37;
                        animation: payu-pulse 1.4s ease-in-out infinite;
                    }
                    .payu-dot:nth-child(2) { animation-delay: 0.2s; }
                    .payu-dot:nth-child(3) { animation-delay: 0.4s; }
                    .payu-trust {
                        display: flex; align-items: center; justify-content: center;
                        gap: 16px; margin-top: 28px;
                        padding-top: 20px;
                        border-top: 1px solid rgba(255,255,255,0.08);
                        flex-wrap: wrap;
                    }
                    .payu-trust-item {
                        display: flex; align-items: center; gap: 5px;
                        color: rgba(255,255,255,0.4); font-size: 11px; font-weight: 500;
                    }
                    #payu-manual-btn {
                        display: none;
                        margin-top: 20px;
                        padding: 12px 28px;
                        background: #D4AF37;
                        color: #0f0f1a;
                        font-size: 13px; font-weight: 700;
                        border: none; border-radius: 50px;
                        cursor: pointer; letter-spacing: 0.3px;
                        box-shadow: 0 8px 30px rgba(212,175,55,0.4);
                        position: relative; overflow: hidden;
                    }
                    #payu-manual-btn::after {
                        content: '';
                        position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
                        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                        animation: payu-shimmer 2s infinite;
                    }
                    @media (max-width: 480px) {
                        #payu-card { padding: 32px 24px; border-radius: 20px; }
                        .payu-logo-ring { width: 68px; height: 68px; }
                    }
                </style>

                <div id="payu-card">
                    <div class="payu-logo-ring">
                        <div class="payu-spinner"></div>
                        <!-- PayU "P" logo -->
                        <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle"
                                font-family="-apple-system, sans-serif" font-size="26" font-weight="800" fill="#D4AF37">P</text>
                        </svg>
                    </div>

                    <p style="color:rgba(255,255,255,0.5);font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">Secure Redirect</p>
                    <h2 style="color:white;font-size:22px;font-weight:700;margin:0 0 8px;line-height:1.3;">Taking you to PayU</h2>
                    <p style="color:rgba(255,255,255,0.45);font-size:13px;margin:0;line-height:1.6;">
                        You'll complete your payment on<br/>
                        <span style="color:#D4AF37;font-weight:600;">PayU's encrypted checkout page</span>
                    </p>

                    <div class="payu-dots">
                        <div class="payu-dot"></div>
                        <div class="payu-dot"></div>
                        <div class="payu-dot"></div>
                    </div>

                    <p style="color:rgba(255,255,255,0.25);font-size:11px;margin:14px 0 0;">Please do not refresh or press Back</p>

                    <div class="payu-trust">
                        <div class="payu-trust-item">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            256-bit SSL
                        </div>
                        <div class="payu-trust-item">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            PCI-DSS
                        </div>
                        <div class="payu-trust-item">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(212,175,55,0.7)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            <span style="color:rgba(212,175,55,0.7);">RBI Authorised</span>
                        </div>
                    </div>
                </div>
            `;

            // Show the manual submit button after 3 s in case auto-submit fails
            const card = overlay.querySelector('#payu-card') as HTMLElement | null;

            // Build a hidden form and append it inside the card
            form.style.display = 'none';
            form.target = '_self';

            // Create a styled fallback button and inject it into the card
            const manualBtn = document.createElement('button');
            manualBtn.id = 'payu-manual-btn';
            manualBtn.type = 'submit';
            manualBtn.textContent = '↗ Click here to proceed to PayU';
            form.appendChild(manualBtn);

            if (card) card.appendChild(form);
            else overlay.appendChild(form);

            document.body.appendChild(overlay);

            // Reveal the fallback button if redirect hasn't happened after 3 s
            setTimeout(() => {
                if (document.getElementById('payu-redirect-overlay')) {
                    manualBtn.style.display = 'inline-block';
                }
            }, 3000);

            // Auto-submit after one tick so the DOM is ready
            setTimeout(() => {
                form.submit();
            }, 100);
        },

        [],
    );

    return { redirectToPayU };
}
