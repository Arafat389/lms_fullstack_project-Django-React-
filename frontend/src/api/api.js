// frontend/src/api/api.js
import axios from 'axios';
// import { jwtDecode } from 'jwt-decode'; // Correct import for jwt-decode

// Define your Django backend API base URL
const API_URL = 'http://127.0.0.1:8000/api/';

// Create a custom Axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: This runs before every request
// It checks localStorage for an access token and adds it to the Authorization header
api.interceptors.request.use(
    async config => {
        const accessToken = localStorage.getItem('access_token');
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handles token refresh on 401 (Unauthorized) errors
api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        // If error is 401 (Unauthorized) and it's not a refresh token request itself, and not a retry
        if (error.response.status === 401 && !originalRequest._retry && originalRequest.url !== 'login/' && originalRequest.url !== 'token/refresh/') {
            originalRequest._retry = true; // Mark this request as retried
            const refreshToken = localStorage.getItem('refresh_token');

            if (refreshToken) {
                try {
                    // Attempt to get a new access token using the refresh token
                    const response = await axios.post(`${API_URL}token/refresh/`, {
                        refresh: refreshToken,
                    });
                    const { access, refresh } = response.data;

                    // Update tokens in local storage
                    localStorage.setItem('access_token', access);
                    localStorage.setItem('refresh_token', refresh);

                    // Update the original request's authorization header with the new access token
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    // Retry the original request
                    return api(originalRequest);
                } catch (refreshError) {
                    console.error('Failed to refresh token or refresh token expired:', refreshError);
                    // If refresh fails, log out the user by clearing tokens and redirecting
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/login'; // Redirect to login page
                    return Promise.reject(refreshError);
                }
            } else {
                // No refresh token available, so force logout/redirect to login
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
