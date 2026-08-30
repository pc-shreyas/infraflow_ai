class BaseIntegration {
  constructor(providerName) {
    this.providerName = providerName;
  }

  async testConnection(credentials) {
    throw new Error(`testConnection method not implemented for ${this.providerName}`);
  }

  async executeTask(action, payload, credentials) {
    throw new Error(`executeTask method not implemented for ${this.providerName}`);
  }
}

module.exports = BaseIntegration;