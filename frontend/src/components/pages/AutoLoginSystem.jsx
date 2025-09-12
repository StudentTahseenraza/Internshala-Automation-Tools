import React, { useState } from 'react';
import axios from 'axios';

function AutoLoginSystem({ title, description }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

        const API_BASE = import.meta.env.VITE_API_URL;


    const handleAutoLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setStatus('');

        try {
            const response = await axios.post(`${API_BASE}/api/auto-login`, {
                email,
                password
            }, { timeout: 120000 });
            setStatus(response.data.message || 'Successfully logged in!');
        } catch (err) {
            console.error('Auto-login request failed:', err);
            const errorMessage = err.response?.data?.error || err.message || 'An error occurred during auto-login.';
            if (err.response?.status === 400) {
                setError('Invalid input. Please provide both email and password.');
            } else if (err.response?.status === 404) {
                setError('Backend endpoint not found. Ensure the server is running on http://localhost:5000 and the /api/auto-apply endpoint is configured.');
            } else if (errorMessage.includes('credentials')) {
                setError('Login failed. Please check your email and password.');
            } else if (errorMessage.includes('CAPTCHA')) {
                setError('A CAPTCHA was detected. Please try logging in manually or use a CAPTCHA-solving service.');
            } else {
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="feature-page">
            <h2>{title}</h2>
            <p>{description}</p>
            <form onSubmit={handleAutoLogin} className="feature-form">
                <label htmlFor="email">Internshala Email:</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your Internshala email"
                    required
                />
                <label htmlFor="password">Internshala Password:</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your Internshala password"
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging In...' : 'Auto Login & Apply'}
                </button>
            </form>
            {error && <div className="error">{error}</div>}
            {status && <div className="result">{status}</div>}
        </div>
    );
}

export default AutoLoginSystem;