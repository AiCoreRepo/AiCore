import { EmailUtils } from './aivestire-backend-tmp/src/email/utils/email.utils';
import { EmailTemplate } from './aivestire-backend-tmp/src/email/enums/email.enums';

const html = EmailUtils.getHtmlForTemplate(EmailTemplate.PASSWORD_RESET, {
  resetLink: "http://localhost:8082/reset-password?token=123",
  expiryMinutes: 15,
  userName: "atul"
});

console.log(html);
