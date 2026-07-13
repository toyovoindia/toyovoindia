import crypto from 'crypto';
import env from '../config/env.js';
import logger from '../utils/logger.js';

class PhonePeService {
  constructor() {
    this.merchantId = env.PHONEPE_MERCHANT_ID;
    this.clientId = env.PHONEPE_CLIENT_ID || env.PHONEPE_MERCHANT_ID; 
    this.clientSecret = env.PHONEPE_CLIENT_SECRET || env.PHONEPE_SALT_KEY;
    this.environment = env.PHONEPE_ENV;
    
    // UAT URL is for testing, API URL is for production
    this.authBaseUrl = this.environment === 'PRODUCTION' 
      ? 'https://api.phonepe.com/apis/identity-manager' 
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox';
      
    this.pgBaseUrl = this.environment === 'PRODUCTION' 
      ? 'https://api.phonepe.com/apis/pg' 
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

    this.cachedToken = null;
    this.tokenExpiry = null;
    this.tokenPromise = null;
  }

  /**
   * Encodes a payload to Base64 (still required for V2 payload wrapper)
   */
  encodePayload(payload) {
    const jsonPayload = JSON.stringify(payload);
    return Buffer.from(jsonPayload).toString('base64');
  }

  /**
   * Retrieves an OAuth Access Token.
   * Uses caching and lock mechanisms to prevent race conditions on simultaneous requests.
   */
  async getAccessToken() {
    // If we have a valid token (with 5 min buffer), return it immediately
    if (this.cachedToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 300000) {
      return this.cachedToken;
    }

    // If a request is already in flight, wait for it
    if (this.tokenPromise) {
      return this.tokenPromise;
    }

    this.tokenPromise = this._fetchNewToken();
    try {
      const token = await this.tokenPromise;
      return token;
    } finally {
      this.tokenPromise = null;
    }
  }

  async _fetchNewToken(retryCount = 0) {
    try {
      const authEndpoint = '/v1/oauth/token';
      const params = new URLSearchParams();
      params.append('client_id', this.clientId);
      params.append('client_secret', this.clientSecret);
      params.append('client_version', '1');
      params.append('grant_type', 'client_credentials');

      const response = await fetch(`${this.authBaseUrl}${authEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      if (!response.ok) {
        throw new Error(`Auth API returned ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.access_token) {
         throw new Error('Access token not found in Auth response');
      }

      this.cachedToken = data.access_token;
      // expires_in is usually in seconds
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      logger.info('Successfully refreshed PhonePe OAuth token.');
      
      return this.cachedToken;
    } catch (error) {
      // Exponential backoff retry logic for transient errors
      if (retryCount < 2) {
        logger.warn(`OAuth Token fetch failed, retrying... (${retryCount + 1}/2)`, error);
        await new Promise(res => setTimeout(res, Math.pow(2, retryCount) * 1000));
        return this._fetchNewToken(retryCount + 1);
      }
      logger.error('PhonePe OAuth Token Error:', error);
      throw new Error('Failed to authenticate with PhonePe Gateway');
    }
  }

  /**
   * Server-to-server strict verification API call
   */
  async checkPaymentStatus(merchantTransactionId, retryCount = 0) {
    try {
      const token = await this.getAccessToken();
      const endpoint = `/checkout/v2/order/${merchantTransactionId}/status`;

      const response = await fetch(`${this.pgBaseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `O-Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Status API Error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
       if (retryCount < 2) {
          await new Promise(res => setTimeout(res, Math.pow(2, retryCount) * 1000));
          return this.checkPaymentStatus(merchantTransactionId, retryCount + 1);
       }
       logger.error(`PhonePe Status Check failed for ${merchantTransactionId}: ${error.message}`);
       throw error;
    }
  }
}

export const phonepeService = new PhonePeService();
