import axios from 'axios';

// Type definition for Electron API
declare global {
    interface Window {
        electronAPI?: {
            storeToken: (token: string) => Promise<{ success: boolean; error?: string }>;
            getToken: () => Promise<string | null>;
            removeToken: () => Promise<{ success: boolean; error?: string }>;
            isElectron: () => boolean;
        };
    }
}

// Detect if running in Electron
const isElectron = () => {
    // Check if electronAPI is available (preload script loaded)
    if (window.electronAPI?.isElectron) {
        return window.electronAPI.isElectron();
    }
    // Fallback to user agent check
    const userAgent = navigator.userAgent.toLowerCase();
    const inElectron = userAgent.includes('electron');
    // console.log('🔍 Environment check - Running in Electron:', inElectron);
    return inElectron;
};

// Create axios instance with defaults
const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000',
    withCredentials: true, // Important for cookies in browser
    headers: {
        'Content-Type': 'application/json',
    }
});

// Request interceptor - Add Electron detection header and auth token
axiosInstance.interceptors.request.use(
    async (config) => {
        // Tell backend this is an Electron client
        if (isElectron()) {
            config.headers['X-Client-Type'] = 'electron';

            // For Electron, send token via Authorization header (from OS keychain)
            try {
                const token = await window.electronAPI?.getToken();
                if (token) {
                    config.headers['Authorization'] = `Bearer ${token}`;
                    // console.log('🔐 [Electron] Sending request with token from OS keychain:', token.substring(0, 20) + '...');
                } else {
                    // console.warn('⚠️ [Electron] No token found in OS keychain for request:', config.url);
                }
            } catch (error) {
                // console.error('❌ [Electron] Failed to retrieve token from OS keychain:', error);
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Store token in OS keychain for Electron
axiosInstance.interceptors.response.use(
    async (response) => {
        // console.log('📥 [Response Interceptor] URL:', response.config.url);
        // console.log('📥 [Response Interceptor] Response data:', response.data);
        // console.log('📥 [Response Interceptor] isElectron:', isElectron());
        // console.log('📥 [Response Interceptor] Has token:', !!response.data?.token);

        // If Electron and login response contains token, store it in OS keychain
        if (isElectron() && response.data?.token) {
            // console.log('✅ [Electron] Received token from login, storing in OS keychain');
            // console.log('✅ [Electron] Token value:', response.data.token.substring(0, 30) + '...');
            try {
                const result = await window.electronAPI?.storeToken(response.data.token);
                if (result?.success) {
                    // console.log('✅ [Electron] Token stored successfully in OS keychain');
                    // Verify storage
                    // const retrievedToken = await window.electronAPI?.getToken();
                    // console.log('✅ [Electron] Verification - token in OS keychain:', retrievedToken?.substring(0, 30) + '...');
                } else {
                    // console.error('❌ [Electron] Failed to store token:', result?.error);
                }
            } catch (error) {
                // console.error('❌ [Electron] Error storing token:', error);
            }
        } else if (isElectron() && !response.data?.token) {
            // console.warn('⚠️ [Electron] Response has no token. Response:', response.data);
        }
        return response;
    },
    async (error) => {
        // Handle 401 errors (token expired/invalid)
        if (error.response?.status === 401) {
            if (isElectron()) {
                // console.warn('⚠️ [Electron] 401 Unauthorized - clearing token from OS keychain');
                try {
                    await window.electronAPI?.removeToken();
                } catch (err) {
                    // console.error('❌ [Electron] Failed to remove token:', err);
                }
            }
            // Token is invalid - user needs to login again
            // console.log('Authentication failed - please login again');
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
export { isElectron };

