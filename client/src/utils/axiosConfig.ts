import axios from 'axios';

// Detect if running in Electron
const isElectron = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const inElectron = userAgent.includes('electron');
    console.log('🔍 Environment check - Running in Electron:', inElectron);
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
    (config) => {
        // Tell backend this is an Electron client
        if (isElectron()) {
            config.headers['X-Client-Type'] = 'electron';

            // For Electron, send token via Authorization header
            const token = localStorage.getItem('apl_auth_token');
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
                console.log('🔐 [Electron] Sending request with token:', token.substring(0, 20) + '...');
            } else {
                console.warn('⚠️ [Electron] No token found in localStorage for request:', config.url);
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Store token in localStorage for Electron
axiosInstance.interceptors.response.use(
    (response) => {
        console.log('📥 [Response Interceptor] URL:', response.config.url);
        console.log('📥 [Response Interceptor] Response data:', response.data);
        console.log('📥 [Response Interceptor] isElectron:', isElectron());
        console.log('📥 [Response Interceptor] Has token:', !!response.data?.token);

        // If Electron and login response contains token, store it
        if (isElectron() && response.data?.token) {
            console.log('✅ [Electron] Received token from login, storing in localStorage');
            console.log('✅ [Electron] Token value:', response.data.token.substring(0, 30) + '...');
            localStorage.setItem('apl_auth_token', response.data.token);
            console.log('✅ [Electron] Token stored successfully');
            console.log('✅ [Electron] Verification - token in localStorage:', localStorage.getItem('apl_auth_token')?.substring(0, 30) + '...');
        } else if (isElectron() && !response.data?.token) {
            console.warn('⚠️ [Electron] Response has no token. Response:', response.data);
        }
        return response;
    },
    (error) => {
        // Handle 401 errors (token expired/invalid)
        if (error.response?.status === 401) {
            if (isElectron()) {
                console.warn('⚠️ [Electron] 401 Unauthorized - clearing token');
                localStorage.removeItem('apl_auth_token');
            }
            // Token is invalid - user needs to login again
            console.log('Authentication failed - please login again');
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
export { isElectron };

