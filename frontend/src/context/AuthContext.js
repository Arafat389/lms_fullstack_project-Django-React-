// frontend/src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../api/api';
import { jwtDecode } from 'jwt-decode'; // Ensure correct import for jwt-decode
import { useNavigate } from 'react-router-dom'; // For programmatic navigation

// Create the AuthContext
const AuthContext = createContext(null);

// AuthProvider component to wrap your application and provide auth state
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Stores authenticated user data
    const [loading, setLoading] = useState(true); // Indicates if auth status is being loaded
    const navigate = useNavigate(); // Hook for navigation

    // Function to parse and set user from access token
    const parseUserFromToken = useCallback((token) => {
        try {
            const decoded = jwtDecode(token);
            // Assuming your JWT token payload contains 'user_id', 'username', and 'email'
            // You might need to adjust these field names based on your Django Simple JWT settings or custom claims
            return {
                id: decoded.user_id,
                username: decoded.username || decoded.aud, // 'aud' might be username if customized
                email: decoded.email || '', // Add other fields as needed
                first_name: decoded.first_name || '',
                last_name: decoded.last_name || '',
            };
        } catch (error) {
            console.error("Failed to decode token:", error);
            return null;
        }
    }, []);

    // Effect to check user's authentication status on component mount or token change
    useEffect(() => {
        const initializeAuth = async () => {
            const accessToken = localStorage.getItem('access_token');
            const refreshToken = localStorage.getItem('refresh_token');

            if (accessToken) {
                const parsedUser = parseUserFromToken(accessToken);
                if (parsedUser) {
                    setUser(parsedUser);
                } else {
                    // Token invalid, try to refresh or clear
                    console.log("Access token invalid, attempting refresh or clearing...");
                    localStorage.removeItem('access_token');
                    // We rely on the Axios interceptor to handle refresh if needed
                    // For now, just clear local state if the existing token is unparseable
                    setUser(null);
                    if (refreshToken) {
                        // Attempt to refresh in background to avoid immediate logout
                        try {
                            const response = await api.post('token/refresh/', { refresh: refreshToken });
                            localStorage.setItem('access_token', response.data.access);
                            localStorage.setItem('refresh_token', response.data.refresh);
                            setUser(parseUserFromToken(response.data.access));
                        } catch (err) {
                            console.error("Background refresh failed:", err);
                            localStorage.removeItem('refresh_token');
                            setUser(null);
                        }
                    }
                }
            }
            setLoading(false); // Authentication initialization complete
        };
        initializeAuth();
    }, [parseUserFromToken]); // Re-run effect if parseUserFromToken changes (unlikely)


    // Login function
    const login = async (username, password) => {
        setLoading(true);
        try {
            const res = await api.post('login/', { username, password });
            const { access, refresh } = res.data;
            localStorage.setItem('access_token', access); // Store access token
            localStorage.setItem('refresh_token', refresh); // Store refresh token

            const parsedUser = parseUserFromToken(access);
            setUser(parsedUser); // Set user data if successful
            setLoading(false);
            return true; // Indicate success
        } catch (err) {
            console.error('Login failed:', err.response ? err.response.data : err.message);
            setUser(null);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setLoading(false);
            return false; // Indicate failure
        }
    };

    // Register function
    const register = async (userData) => {
        setLoading(true);
        try {
            // Note: register endpoint might not return tokens directly.
            // After successful registration, you typically log the user in.
            await api.post('register/', userData);
            // After successful registration, automatically log in the user
            const success = await login(userData.username, userData.password);
            setLoading(false);
            return success;
        } catch (err) {
            console.error('Registration failed:', err.response ? err.response.data : err.message);
            setLoading(false);
            return false;
        }
    };

    // Logout function
    const logout = () => {
        // Simple JWT doesn't require a backend endpoint for logout (tokens just expire)
        // But if you had blacklisting (via simplejwt-blacklist), you'd make a POST request here
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        navigate('/login'); // Redirect to login page after logout
    };

    // Fetch user profile (used after login or page reload)
    const getUserProfile = async () => {
        try {
            const res = await api.get('profile/');
            // The user object from profile endpoint might have more details than JWT
            setUser(res.data);
            return res.data;
        } catch (err) {
            console.error('Failed to load user profile:', err.response ? err.response.data : err.message);
            // If profile fetch fails (e.g., token expired), attempt logout
            logout();
            return null;
        }
    };

    // Update user profile
    const updateUserProfile = async (userData) => {
        try {
            const res = await api.put('profile/', userData);
            setUser(res.data); // Update context with new user data
            return true;
        } catch (err) {
            console.error('Failed to update profile:', err.response ? err.response.data : err.message);
            return false;
        }
    };


    // The value provided to all consumers of this context
    const contextValue = { user, loading, login, register, logout, getUserProfile, updateUserProfile };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to easily consume the AuthContext in any functional component
export const useAuth = () => useContext(AuthContext);