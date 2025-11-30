const axios = require('axios');
const crypto = require('crypto');

class TelebirrService {
  constructor() {
    this.baseURL = process.env.TELEBIRR_BASE_URL || 'https://developerportal.ethiotelebirr.et:38443/apiaccess/payment/gateway';
    this.appId = process.env.TELEBIRR_APP_ID;
    this.appKey = process.env.TELEBIRR_APP_KEY;
    this.merchantId = process.env.TELEBIRR_MERCHANT_ID;
    this.notifyUrl = process.env.TELEBIRR_NOTIFY_URL;
    this.returnUrl = process.env.TELEBIRR_RETURN_URL;
  }

  generateNonce(length = 32) {
    return crypto.randomBytes(length).toString('hex').substring(0, length);
  }

  generateSign(data) {
    // Sort parameters alphabetically
    const sortedKeys = Object.keys(data).sort();
    const signString = sortedKeys
      .map(key => `${key}=${data[key]}`)
      .join('&') + this.appKey;
    
    // Generate SHA256 hash
    return crypto.createHash('sha256').update(signString).digest('hex').toUpperCase();
  }

  async initializePayment({ amount, outTradeNo, subject, totalAmount, userId }) {
    try {
      const timestamp = Date.now().toString();
      const nonce = this.generateNonce();

      const requestData = {
        appid: this.appId,
        merch_code: this.merchantId,
        nonce_str: nonce,
        out_trade_no: outTradeNo,
        subject: subject || 'LED Screen Payment',
        total_amount: totalAmount || amount,
        notify_url: this.notifyUrl,
        return_url: this.returnUrl,
        timeout_express: '30m',
        timestamp: timestamp
      };

      // Generate signature
      const sign = this.generateSign(requestData);
      requestData.sign = sign;

      const response = await axios.post(
        `${this.baseURL}/payment/v1/web`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.code === '0') {
        return {
          success: true,
          data: response.data.data,
          checkout_url: response.data.data.toPayUrl || response.data.data.toPayURL,
          prepay_id: response.data.data.prepay_id
        };
      } else {
        return {
          success: false,
          error: response.data?.msg || 'Payment initialization failed'
        };
      }
    } catch (error) {
      console.error('Telebirr initialization error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.msg || error.message || 'Payment initialization failed'
      };
    }
  }

  async verifyPayment(outTradeNo) {
    try {
      const timestamp = Date.now().toString();
      const nonce = this.generateNonce();

      const requestData = {
        appid: this.appId,
        merch_code: this.merchantId,
        nonce_str: nonce,
        out_trade_no: outTradeNo,
        timestamp: timestamp
      };

      const sign = this.generateSign(requestData);
      requestData.sign = sign;

      const response = await axios.post(
        `${this.baseURL}/payment/v1/query`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.code === '0') {
        return {
          success: true,
          data: response.data.data,
          status: response.data.data.trade_status
        };
      } else {
        return {
          success: false,
          error: response.data?.msg || 'Payment verification failed'
        };
      }
    } catch (error) {
      console.error('Telebirr verification error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.msg || error.message || 'Payment verification failed'
      };
    }
  }

  verifyWebhookSignature(data, receivedSign) {
    const calculatedSign = this.generateSign(data);
    return calculatedSign === receivedSign;
  }
}

module.exports = new TelebirrService();
