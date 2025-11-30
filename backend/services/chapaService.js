const axios = require('axios');

class ChapaService {
  constructor() {
    this.baseURL = 'https://api.chapa.co/v1';
    this.secretKey = process.env.CHAPA_SECRET_KEY;
  }

  async initializePayment({ amount, currency = 'ETB', email, first_name, last_name, tx_ref, callback_url, return_url, customization = {} }) {
    try {
      const response = await axios.post(
        `${this.baseURL}/transaction/initialize`,
        {
          amount,
          currency,
          email,
          first_name,
          last_name,
          tx_ref,
          callback_url,
          return_url,
          customization: {
            title: customization.title || 'LED Screen Payment',
            description: customization.description || 'Payment for LED screen rental/purchase',
            logo: customization.logo || ''
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data.data,
        checkout_url: response.data.data.checkout_url
      };
    } catch (error) {
      console.error('Chapa initialization error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Payment initialization failed'
      };
    }
  }

  async verifyPayment(tx_ref) {
    try {
      const response = await axios.get(
        `${this.baseURL}/transaction/verify/${tx_ref}`,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`
          }
        }
      );

      return {
        success: true,
        data: response.data.data,
        status: response.data.data.status
      };
    } catch (error) {
      console.error('Chapa verification error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Payment verification failed'
      };
    }
  }
}

module.exports = new ChapaService();
