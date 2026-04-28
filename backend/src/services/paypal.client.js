const paypalConfig = require('../config/paypal.config');

class PayPalClient {
  constructor() {
    this.token = null;
    this.tokenExpiresAt = 0;
    this.baseUrl = paypalConfig.baseUrl;
  }

  async getAccessToken() {
    const now = Date.now();
    if (this.token && now < this.tokenExpiresAt) {
      return this.token;
    }

    const credentials = Buffer.from(`${paypalConfig.clientId}:${paypalConfig.clientSecret}`).toString('base64');
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Error obteniendo access token: ${JSON.stringify(data)}`);
    }

    this.token = data.access_token;
    this.tokenExpiresAt = now + (Number(data.expires_in || 3300) * 1000) - 10000;
    return this.token;
  }

  async request(path, options = {}) {
    const token = await this.getAccessToken();
    const headers = {
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers
    });

    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401) {
        this.token = null;
        return this.request(path, options);
      }
      throw new Error(`PayPal API error (${response.status}): ${JSON.stringify(data)}`);
    }

    return data;
  }
}

module.exports = new PayPalClient();
