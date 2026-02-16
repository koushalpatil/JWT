import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,
});

let accessToken = null;
let onLogout = null;

// Simple setters for external use
export const setAccessToken = (token) => {
    accessToken = token;
};

export const getAccessToken = () => accessToken;

// Request interceptor: Attach token if available
api.interceptors.request.use(
    (config) => {
        if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: Only handle global logout on 401 if needed, 
// but primarily we rely on the AuthContext timers to prevent 401s.
// This is just a failsafe.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (onLogout) onLogout();
        }
        return Promise.reject(error);
    }
);

export const setupInterceptors = (logoutCallback) => {
    onLogout = logoutCallback;
};

export const refreshAccessToken = async () => {
    try {
        const response = await api.post('/auth/refresh');
        const newAccessToken = response.data.accessToken;
        setAccessToken(newAccessToken);
        return newAccessToken;
    } catch (error) {
        throw error;
    }
};

export default api;
