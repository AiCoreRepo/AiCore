URL="https://b7af5dc243e6c3.lhr.life"
sed -i "s|PAYU_SUCCESS_URL=.*|PAYU_SUCCESS_URL=$URL/payments/success|" /home/atul/Desktop/AiCore/APP3005/aivestire-backend-tmp/.env
sed -i "s|PAYU_FAILURE_URL=.*|PAYU_FAILURE_URL=$URL/payments/failure|" /home/atul/Desktop/AiCore/APP3005/aivestire-backend-tmp/.env
