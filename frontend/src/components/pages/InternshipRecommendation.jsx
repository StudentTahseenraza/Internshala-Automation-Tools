import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './InternshipRecommendation.css';

const socket = io('http://localhost:5000', {
    reconnection: true,
    reconnectionAttempts: 5,
});

const InternshipRecommendation = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        skills: '',
        minStipend: '',
        maxStipend: '',
        resume: null,
    });
    const [recommendations, setRecommendations] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        socket.on('progressUpdate', (data) => {
            console.log('Progress updated:', data);
        });
        return () => socket.off('progressUpdate');
    }, []);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData({
            ...formData,
            [name]: files ? files[0] : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setRecommendations([]);

        const searchQuery = formData.skills.split(',')[0].trim().replace(/\s+/g, '-');
        window.open(`https://internshala.com/internships/${searchQuery}-internship`, '_blank');

        const data = new FormData();
        for (let key in formData) {
            if (formData[key]) data.append(key, formData[key]);
        }

        try {
            const response = await axios.post('http://localhost:5000/api/recommend-internships', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setRecommendations(response.data.recommendations || []);
        } catch (err) {
            console.error('Recommendation request failed:', err);
            setError(err.response?.data?.error || 'Failed to fetch internships. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (link) => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/auto-apply', { link });
            alert('Successfully applied!');
            console.log('Apply response:', response.data);
        } catch (err) {
            setError('Could not apply automatically. ' + (err.response?.data?.error || ''));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="internship-container">
            <h2>Internship Recommendation</h2>
            <form onSubmit={handleSubmit}>
                <div><label>Email:</label><input type="email" name="email" value={formData.email} onChange={handleChange} required /></div>
                <div><label>Password:</label><input type="password" name="password" value={formData.password} onChange={handleChange} required /></div>
                <div><label>Skills (comma-separated):</label><input type="text" name="skills" value={formData.skills} onChange={handleChange} placeholder="e.g., Python, JavaScript" required /></div>
                <div><label>Minimum Stipend (₹):</label><input type="number" name="minStipend" value={formData.minStipend} onChange={handleChange} placeholder="e.g., 5000" /></div>
                <div><label>Maximum Stipend (₹):</label><input type="number" name="maxStipend" value={formData.maxStipend} onChange={handleChange} placeholder="e.g., 20000" /></div>
                <div><label>Resume (PDF):</label><input type="file" name="resume" accept=".pdf" onChange={handleChange} /></div>
                <button type="submit" disabled={loading}>{loading ? 'Fetching Internships...' : 'Get Recommendations'}</button>
            </form>

            {error && <p className="error">{error}</p>}
            {loading && <p className="loading">Loading recommendations...</p>}
            {recommendations.length > 0 && (
                <div className="result">
                    <h3>Recommended Internships:</h3>
                    <ul>
                        {recommendations.map((rec, i) => (
                            <li key={i}>
                                <strong>{rec.title}</strong> at {rec.company}<br />
                                Stipend: {rec.stipend}<br />
                                Score: {rec.score}%<br />
                                <a href={rec.link} target="_blank" rel="noreferrer">View & Apply</a>
                                <button onClick={() => handleApply(rec.link)} disabled={loading}>
                                    {loading ? 'Applying...' : 'Apply Automatically'}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default InternshipRecommendation;