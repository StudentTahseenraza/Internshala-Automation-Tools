import React, { useState } from 'react';
import axios from 'axios';

function TelegramEmailAlerts() {
    const [email, setEmail] = useState('');
    const [telegramId, setTelegramId] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

        const API_BASE = import.meta.env.VITE_API_URL;


    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await axios.post(`${API_BASE}/api/alerts`, {
                email,
                telegramId
            });
            setMessage(response.data.message);
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred while saving alert settings.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="feature-page">
            <h2>Telegram/Email Alerts</h2>
            <p>Receive real-time status updates.</p>
            <form onSubmit={handleSave} className="feature-form">
                <label htmlFor="email">Email:</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email for alerts"
                />
                <label htmlFor="telegram-id">Telegram ID:</label>
                <input
                    id="telegram-id"
                    type="text"
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value)}
                    placeholder="Enter your Telegram ID"
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Alert Settings'}
                </button>
            </form>
            {error && <div className="error">{error}</div>}
            {message && (
                <div className="result">
                    <h3>Alert Settings:</h3>
                    <p>{message}</p>
                </div>
            )}
        </div>
    );
}

export default TelegramEmailAlerts;