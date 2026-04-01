// Extension Bridge - Handles communication with Chrome extension
class ExtensionBridge {
  constructor() {
    this.isReady = false;
    this.readyPromise = null;
    this.pendingRequests = new Map();
    this.requestId = 0;
    this.init();
  }

  init() {
    console.log('🌉 Initializing Extension Bridge...');
    
    // Set up message listener for responses from content script
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      
      console.log('📨 Extension bridge received message:', event.data);
      
      if (event.data.type === 'EXTENSION_STORAGE_RESPONSE' || event.data.type === 'EXTENSION_API_RESPONSE') {
        const { requestId, success, data, error } = event.data;
        const pendingRequest = this.pendingRequests.get(requestId);
        
        console.log('🔍 Looking for pending request:', requestId, 'Found:', !!pendingRequest);
        
        if (pendingRequest) {
          this.pendingRequests.delete(requestId);
          if (success) {
            console.log('✅ Resolving request with data:', data);
            pendingRequest.resolve(data);
          } else {
            console.log('❌ Rejecting request with error:', error);
            pendingRequest.reject(new Error(error));
          }
        }
      }
    });
    
    // Wait a bit for content script to load, then test
    setTimeout(() => {
      this.testContentScript();
    }, 500);
  }

  // Test if content script is available by sending a test message
  async testContentScript() {
    return new Promise((resolve) => {
      const requestId = ++this.requestId;
      
      // Store the promise resolvers
      this.pendingRequests.set(requestId, { 
        resolve: (data) => {
          console.log('✅ Extension content script detected');
          this.isReady = true;
          resolve(true);
        }, 
        reject: (error) => {
          console.log('❌ Extension content script not available');
          this.isReady = false;
          resolve(false);
        }
      });
      
      // Send test message to content script
      console.log('📤 Sending test message to content script, requestId:', requestId);
      window.postMessage({
        type: 'EXTENSION_GET_STORAGE',
        requestId: requestId,
        keys: ['isValidated']
      }, window.location.origin);
      
      // Set timeout
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          console.log('❌ Extension content script not available (timeout)');
          this.isReady = false;
          resolve(false);
        }
      }, 1000);
    });
  }

  // Wait for bridge to be ready
  async waitForReady() {
    if (this.isReady) {
      return true;
    }
    
    // Try to detect extension content script for a few seconds
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 10;
      
      const checkExtension = async () => {
        attempts++;
        console.log(`🔍 Checking for extension... (${attempts}/${maxAttempts})`);
        
        const isAvailable = await this.testContentScript();
        if (isAvailable) {
          console.log('✅ Extension detected!');
          resolve(true);
          return;
        }
        
        if (attempts >= maxAttempts) {
          console.log('❌ Extension not found after maximum attempts');
          resolve(false);
        } else {
          setTimeout(checkExtension, 500);
        }
      };
      
      checkExtension();
    });
  }

  // Get data from extension storage via content script
  async getExtensionStorage(keys) {
    try {
      if (!this.isReady) {
        await this.waitForReady();
      }
      
      if (!this.isReady) {
        throw new Error('Extension not available');
      }

      console.log('🔍 Getting extension storage for keys:', keys);
      
      return new Promise((resolve, reject) => {
        const requestId = ++this.requestId;
        
        // Store the promise resolvers
        this.pendingRequests.set(requestId, { resolve, reject });
        
        // Send message to content script
        window.postMessage({
          type: 'EXTENSION_GET_STORAGE',
          requestId: requestId,
          keys: keys
        }, window.location.origin);
        
        // Set timeout to avoid hanging forever
        setTimeout(() => {
          if (this.pendingRequests.has(requestId)) {
            this.pendingRequests.delete(requestId);
            reject(new Error('Extension storage request timeout'));
          }
        }, 5000);
      });
    } catch (error) {
      console.error('❌ Failed to get extension storage:', error);
      throw error;
    }
  }

  // Call Freelancer API using extension credentials via content script
  async callFreelancerAPI(url, options = {}) {
    try {
      console.log('🌐 Calling Freelancer API via extension:', url);
      
      if (!this.isReady) {
        await this.waitForReady();
      }
      
      if (!this.isReady) {
        throw new Error('Extension not available');
      }
      
      return new Promise((resolve, reject) => {
        const requestId = ++this.requestId;
        
        // Store the promise resolvers
        this.pendingRequests.set(requestId, { resolve, reject });
        
        // Send message to content script
        window.postMessage({
          type: 'EXTENSION_CALL_FREELANCER_API',
          requestId: requestId,
          url: url,
          options: options
        }, window.location.origin);
        
        // Set timeout to avoid hanging forever
        setTimeout(() => {
          if (this.pendingRequests.has(requestId)) {
            this.pendingRequests.delete(requestId);
            reject(new Error('Freelancer API request timeout'));
          }
        }, 10000);
      });
    } catch (error) {
      console.error('❌ Freelancer API call failed:', error);
      throw error;
    }
  }

  // Check if connected to Freelancer
  async isConnectedToFreelancer() {
    try {
      const result = await this.getExtensionStorage([
        'accessToken', 'capturedToken', 'isValidated'
      ]);
      
      const hasToken = result.accessToken || result.capturedToken;
      const isValidated = result.isValidated;
      
      return hasToken && isValidated;
    } catch (error) {
      console.error('❌ Failed to check Freelancer connection:', error);
      return false;
    }
  }

  // Get user profile from extension
  async getUserProfile() {
    try {
      const result = await this.getExtensionStorage([
        'userId', 'validatedUsername', 'userEmail'
      ]);
      
      if (result.validatedUsername || result.userId) {
        return {
          username: result.validatedUsername,
          id: result.userId,
          email: result.userEmail,
          display_name: result.validatedUsername
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to get user profile:', error);
      return null;
    }
  }
}

// Create singleton instance
const extensionBridge = new ExtensionBridge();

export default extensionBridge;