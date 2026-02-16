import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const INACTIVITY_LIMIT = 10 * 1000;

export const useInactivity = () => {
    const { logout, user, updateLastActive } = useAuth();
    const timerRef = useRef(null);

    const resetTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        if (user) {
            updateLastActive();
            timerRef.current = setTimeout(() => {
                console.log('Inactivity timeout reached. Logging out...');
                logout();
            }, INACTIVITY_LIMIT);
        }
    }, [logout, user, updateLastActive]);

    useEffect(() => {
        if (!user) return;

        const events = ['mousemove', 'keydown', 'click', 'scroll'];
        let lastUpdate = 0;

        const handleActivity = () => {
            const now = Date.now();
            // Throttle updates to once per second
            if (now - lastUpdate > 1000) {
                lastUpdate = now;
                resetTimer();
            }
        };

        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        resetTimer(); // Initial reset

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [resetTimer, user]);
};
