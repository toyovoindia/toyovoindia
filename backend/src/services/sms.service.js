import http from 'http';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Dummy SMS Service
 * In a real application, integrate with Twilio, Fast2SMS, MSG91, etc.
 */
export const sendSms = async (phone, message) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  logger.info('========== SMS SENT ==========');
  logger.info(`To: ${phone}`);
  logger.info(`Message: ${message}`);
  logger.info('==============================');
  
  return true;
};

export const sendOtpSms = async (phone, otp, purpose = 'verification') => {
  // Use SMSIndiaHub service
  const apiKey = process.env.SMSINDIAHUB_API_KEY;
  const senderId = process.env.SMSINDIAHUB_SENDER_ID;

  // Template message (OTP placeholder will be replaced)
  const template = "Welcome to Toyove India! Powered by IIDMTB. Use OTP ${otp} to verify your login.";
  const message = template.replace('${otp}', otp);

  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;

  const url = `http://cloud.smsindiahub.in/vendorsms/pushsms.aspx?APIKey=${apiKey}&msisdn=${formattedPhone}&sid=${senderId}&msg=${encodeURIComponent(message)}&fl=0&gwid=2`;

  return new Promise((resolve, reject) => {
    http.get(url, (response) => {
      let responseBody = '';
      response.on('data', (chunk) => {
        responseBody += chunk;
      });
      response.on('end', () => {
        logger.info('SMSIndiaHub request completed', { url, status: response.statusCode });
        logger.info('SMSIndiaHub response body', { body: responseBody });
        resolve(true);
      });
    }).on('error', (error) => {
      logger.error('SMSIndiaHub send error', { error: error.message });
      reject(error);
    });
  });
};
