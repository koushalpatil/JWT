import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api, { setAccessToken, setupInterceptors, refreshAccessToken } from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accessTokenExpiresAt, setAccessTokenExpiresAt] = useState(null);
    const [refreshTokenExpiresAt, setRefreshTokenExpiresAt] = useState(null);
    const [lastActive, setLastActive] = useState(Date.now());

    // Constants (in ms)
    const ACCESS_EXPIRY_MS = 10 * 1000;
    const REFRESH_EXPIRY_MS = 20 * 1000;

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            setAccessToken(null);
            setUser(null);
            setAccessTokenExpiresAt(null);
            setRefreshTokenExpiresAt(null);
            // Optional: Redirect to login is handled by the UI protection logic
        }
    };

    // Initial Session Verification
    useEffect(() => {
        // Setup simple interceptor (just for logout callback)
        setupInterceptors(logout);

        const verifySession = async () => {
            try {
                const token = await refreshAccessToken();
                // If successful, we assume valid session
                setUser({ name: 'User' }); // Simplified user object
                setAccessTokenExpiresAt(Date.now() + ACCESS_EXPIRY_MS);
                setRefreshTokenExpiresAt(Date.now() + REFRESH_EXPIRY_MS);
            } catch (error) {
                // No valid session, that's fine, user stays logged out
            } finally {
                setLoading(false);
            }
        };

        verifySession();
    }, []);

    // Silent Refresh Logic (Proactive)
    useEffect(() => {
        if (!accessTokenExpiresAt || !refreshTokenExpiresAt) return;

        // If refresh token is about to expire or expired, do not refresh access token
        if (Date.now() > refreshTokenExpiresAt - 1000) return;

        // Schedule refresh 2 seconds before access token expires
        const refreshTime = accessTokenExpiresAt - Date.now() - 2000;

        // If we are already past the refresh window, try immediately
        // (unless it's totally expired, which is handled by the condition above)
        const timeoutMs = refreshTime > 0 ? refreshTime : 0;

        console.log(`Scheduling silent refresh in ${timeoutMs}ms`);

        const timer = setTimeout(async () => {
            console.log('Triggering silent refresh...');
            try {
                await refreshAccessToken();
                // refreshAccessToken updates the axios default header and internal store
                // We just need to update our local expiry state
                setAccessTokenExpiresAt(Date.now() + ACCESS_EXPIRY_MS);
                console.log('Silent refresh successful');
            } catch (error) {
                console.error('Silent refresh failed', error);
                // We don't force logout here; we let the auto-logout timer handle the hard stop
                // or the next API call fail.
            }
        }, timeoutMs);

        return () => clearTimeout(timer);
    }, [accessTokenExpiresAt, refreshTokenExpiresAt]);

    // Auto-Logout Logic (Strict Session Limit)
    useEffect(() => {
        if (!refreshTokenExpiresAt) return;

        const timeUntilLogout = refreshTokenExpiresAt - Date.now();

        if (timeUntilLogout <= 0) {
            console.log('Refresh token expired. Logging out.');
            logout();
            return;
        }

        console.log(`Scheduling auto-logout in ${timeUntilLogout}ms`);
        const timer = setTimeout(() => {
            console.log('Session expired. Logging out.');
            logout();
        }, timeUntilLogout);

        return () => clearTimeout(timer);
    }, [refreshTokenExpiresAt]);

    const login = async (username, password) => {
        const response = await api.post('/auth/login', { username, password });
        const { accessToken } = response.data;
        setAccessToken(accessToken);
        setUser({ username });
        const now = Date.now();
        setAccessTokenExpiresAt(now + ACCESS_EXPIRY_MS);
        setRefreshTokenExpiresAt(now + REFRESH_EXPIRY_MS);
        return response;
    };

    const signup = async (username, password) => {
        const response = await api.post('/auth/signup', { username, password });
        const { accessToken } = response.data;
        if (accessToken) {
            setAccessToken(accessToken);
            setUser({ username });
            const now = Date.now();
            setAccessTokenExpiresAt(now + ACCESS_EXPIRY_MS);
            setRefreshTokenExpiresAt(now + REFRESH_EXPIRY_MS);
        }
        return response;
    };

    const updateLastActive = useCallback(() => {
        setLastActive(Date.now());
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            login,
            signup,
            logout,
            loading,
            accessTokenExpiresAt,
            refreshTokenExpiresAt,
            lastActive,
            updateLastActive
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
