import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Dashboard = () => {
    const { user, logout, accessTokenExpiresAt, refreshTokenExpiresAt, lastActive } = useAuth();
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/protected');
                setData(response.data);
            } catch (error) {
                console.error('Failed to fetch protected data', error);
            }
        };

        fetchData();
    }, []);


    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, []);


    const formatTime = (ms) => {
        if (!ms || ms < 0) return '0s';
        const seconds = Math.floor(ms / 1000);
        return `${seconds}s`;
    };

    const accessTokenRemaining = accessTokenExpiresAt ? accessTokenExpiresAt - currentTime : 0;
    const refreshTokenRemaining = refreshTokenExpiresAt ? refreshTokenExpiresAt - currentTime : 0;
    const inactivityRemaining = lastActive + 10000 - currentTime;

    return (
        <div style={{ padding: '20px' }}>
            <div className="auth-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h2>Dashboard</h2>
                <p>Welcome, {user?.username}!</p>
                {data && <p style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '10px', borderRadius: '8px' }}>
                    Protected Data: {data.message}
                </p>}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '30px', marginBottom: '30px' }}>
                    <div className="counter-card" style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Access Token</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{formatTime(accessTokenRemaining)}</div>
                        <div style={{ fontSize: '0.7rem' }}>of 10s</div>
                    </div>
                    <div className="counter-card" style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Refresh Token</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{formatTime(refreshTokenRemaining)}</div>
                        <div style={{ fontSize: '0.7rem' }}>of 20s</div>
                    </div>
                    <div className="counter-card" style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Inactivity</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{formatTime(inactivityRemaining)}</div>
                        <div style={{ fontSize: '0.7rem' }}>of 10s</div>
                    </div>
                </div>

                <button onClick={logout}>Logout</button>
            </div>
        </div>
    );
};

export default Dashboard;
