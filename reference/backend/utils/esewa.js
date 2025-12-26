import crypto from 'crypto';

export const getEsewaSignature = (message) => {
  const secret = '8gBm/:&EnhH.1/q'; // Use process.env.ESEWA_SECRET in production

  // Create HMAC-SHA256 signature
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(message);

  // Return Base64 encoded string
  return hmac.digest('base64');
};
