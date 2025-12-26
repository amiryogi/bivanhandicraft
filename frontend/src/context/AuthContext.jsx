/**
 * Auth Context
 * Manages authentication state across the application
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check authentication on mount
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                try {
                    const response = await authAPI.getMe();
                    setUser(response.data.user);
                    setIsAuthenticated(true);
                } catch (error) {
                    // Token invalid - clear storage
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    // Register
    const register = useCallback(async (data) => {
        try {
            const response = await authAPI.register(data);
            const { user, accessToken, refreshToken } = response.data;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            setUser(user);
            setIsAuthenticated(true);
            toast.success('Registration successful!');

            return { success: true, user };
        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed';
            toast.error(message);
            return { success: false, error: message };
        }
    }, []);

    // Login
    const login = useCallback(async (email, password) => {
        try {
            const response = await authAPI.login(email, password);
            const { user, accessToken, refreshToken } = response.data;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            setUser(user);
            setIsAuthenticated(true);
            toast.success('Login successful!');

            return { success: true, user };
        } catch (error) {
            const message = error.response?.data?.message || 'Invalid credentials';
            toast.error(message);
            return { success: false, error: message };
        }
    }, []);

    // Logout
    const logout = useCallback(async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            // Ignore logout errors
        }

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setIsAuthenticated(false);
        toast.success('Logged out successfully');
    }, []);

    // Update user profile locally
    const updateUser = useCallback((updates) => {
        setUser((prev) => ({ ...prev, ...updates }));
    }, []);

    const value = {
        user,
        loading,
        isAuthenticated,
        isAdmin: user?.role === 'admin',
        register,
        login,
        logout,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
