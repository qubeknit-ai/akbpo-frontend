// Freelancer credentials sync utility
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class FreelancerSync {
  constructor() {
    this.credentials = null;
  }

  // Test backend connectivity
  async testBackendConnection() {
    try {
      const response = await fetch(`${API_URL}/`, {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      console.warn('⚠️ Backend connectivity test failed:', error.message);
      return false;
    }
  }

  // Get credentials from backend database
  async fetchCredentialsFromBackend() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('🔍 Fetching credentials from:', `${API_URL}/api/freelancer/credentials`);

      const response = await fetch(`${API_URL}/api/freelancer/credentials`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          console.log('ℹ️ No credentials found in backend (404)');
          return null; // No credentials found
        }
        const errorText = await response.text();
        console.error('❌ Backend error response:', errorText);
        throw new Error(`Backend error ${response.status}: ${errorText}`);
      }

      const credentials = await response.json();
      console.log('✅ Credentials fetched successfully:', {
        id: credentials.id,
        user_id: credentials.user_id,
        is_validated: credentials.is_validated,
        validated_username: credentials.validated_username,
        has_access_token: !!credentials.access_token,
        has_cookies: !!credentials.cookies,
        last_validated: credentials.last_validated
      });
      return credentials;
    } catch (error) {
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        console.error('❌ Network error: Cannot connect to backend server');
        throw new Error('Cannot connect to backend server. Please ensure the backend is running on http://localhost:8000');
      }
      console.error('❌ Error fetching Freelancer credentials:', error);
      throw error;
    }
  }

  // Store credentials in localStorage
  storeCredentials(credentials) {
    if (!credentials) {
      localStorage.removeItem('freelancer_credentials');
      this.credentials = null;
      return;
    }

    // Store the credentials
    localStorage.setItem('freelancer_credentials', JSON.stringify(credentials));
    this.credentials = credentials;

    // Also store individual items for easy access
    if (credentials.access_token) {
      localStorage.setItem('freelancer_access_token', credentials.access_token);
    }
    if (credentials.cookies) {
      localStorage.setItem('freelancer_cookies', JSON.stringify(credentials.cookies));
    }
    if (credentials.csrf_token) {
      localStorage.setItem('freelancer_csrf_token', credentials.csrf_token);
    }
  }

  // Get stored credentials from localStorage
  getStoredCredentials() {
    try {
      const stored = localStorage.getItem('freelancer_credentials');
      if (stored) {
        this.credentials = JSON.parse(stored);
        return this.credentials;
      }
    } catch (error) {
      console.error('❌ Error parsing stored credentials:', error);
      localStorage.removeItem('freelancer_credentials');
    }
    return null;
  }

  // Check if user is connected to Freelancer
  isConnected() {
    const credentials = this.getStoredCredentials();
    return credentials && credentials.is_validated && (credentials.access_token || credentials.cookies);
  }

  // Sync credentials from backend to frontend
  async syncCredentials() {
    try {
      console.log('🔄 Syncing Freelancer credentials from backend...');
      
      // Get current user info for logging
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userEmail = currentUser.email || 'unknown user';
      console.log(`👤 Syncing credentials for user: ${userEmail}`);
      
      // Test backend connectivity first
      const isBackendOnline = await this.testBackendConnection();
      if (!isBackendOnline) {
        throw new Error('Backend server is not accessible. Please ensure it is running on http://localhost:8000');
      }
      
      const credentials = await this.fetchCredentialsFromBackend();
      
      if (!credentials) {
        console.log(`❌ No Freelancer credentials found in backend for user: ${userEmail}`);
        this.storeCredentials(null);
        return {
          success: false,
          message: 'No Freelancer credentials found. Please connect using the extension first.',
          connected: false
        };
      }

      console.log(`📊 Found credentials for user: ${userEmail}`, {
        database_user_id: credentials.user_id,
        freelancer_user_id: credentials.freelancer_user_id,
        validated_username: credentials.validated_username,
        is_validated: credentials.is_validated,
        has_access_token: !!credentials.access_token,
        has_cookies: !!credentials.cookies
      });

      if (!credentials.is_validated) {
        console.log(`⚠️ Freelancer credentials not validated for user: ${userEmail}`);
        this.storeCredentials(credentials);
        return {
          success: false,
          message: 'Freelancer credentials found but not validated. Please validate using the extension.',
          connected: false,
          needsValidation: true
        };
      }

      if (!credentials.access_token && !credentials.cookies) {
        console.log(`⚠️ Freelancer credentials missing access token and cookies for user: ${userEmail}`);
        this.storeCredentials(credentials);
        return {
          success: false,
          message: 'Freelancer credentials incomplete. Please reconnect using the extension.',
          connected: false,
          needsReconnect: true
        };
      }

      // Store valid credentials
      this.storeCredentials(credentials);
      console.log(`✅ Freelancer credentials synced successfully for user: ${userEmail}`);
      console.log(`🎯 Connected to Freelancer account: ${credentials.validated_username} (ID: ${credentials.freelancer_user_id})`);
      
      return {
        success: true,
        message: 'Freelancer credentials synced successfully',
        connected: true,
        credentials: {
          username: credentials.validated_username,
          email: credentials.validated_email,
          userId: credentials.freelancer_user_id,
          lastValidated: credentials.last_validated ? new Date(credentials.last_validated) : null
        }
      };
    } catch (error) {
      console.error('❌ Error syncing Freelancer credentials:', error);
      return {
        success: false,
        message: `Failed to sync credentials: ${error.message}`,
        connected: false,
        error: error.message
      };
    }
  }

  // Make API calls using stored credentials
  async callFreelancerAPI(url, options = {}) {
    const credentials = this.getStoredCredentials();
    
    if (!credentials || !credentials.is_validated) {
      throw new Error('No valid Freelancer credentials available');
    }

    const headers = {
      ...options.headers
    };

    // Add authentication headers
    if (credentials.access_token) {
      headers['Authorization'] = `Bearer ${credentials.access_token}`;
      headers['freelancer-oauth-v1'] = credentials.access_token;
    }

    if (credentials.csrf_token) {
      headers['X-CSRFToken'] = credentials.csrf_token;
    }

    // Add cookies if available
    if (credentials.cookies) {
      const cookieString = Object.entries(credentials.cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
      headers['Cookie'] = cookieString;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`Freelancer API error: ${response.status}`);
    }

    return response.json();
  }

  // Clear all stored credentials
  clearCredentials() {
    localStorage.removeItem('freelancer_credentials');
    localStorage.removeItem('freelancer_access_token');
    localStorage.removeItem('freelancer_cookies');
    localStorage.removeItem('freelancer_csrf_token');
    this.credentials = null;
  }
}

// Create singleton instance
const freelancerSync = new FreelancerSync();

export default freelancerSync;