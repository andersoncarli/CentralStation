class CentralStation {
  constructor(options = {}) {
    this.options = {
      url: options.url || 'ws://localhost:3000',
      // ... (other options)
    };

    this.ws = new WebSocket(this.options.url);
    // ... (rest of the constructor code)
  }

  // ... (include the rest of the client-side code here)
}

module.exports = CentralStation;