import React, { useState } from 'react';
import axios from 'axios';

function AutoApplyBot() {
    const [userType, setUserType] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [location, setLocation] = useState('');
    const [minStipend, setMinStipend] = useState('');
    const [duration, setDuration] = useState('');
    const [resumeFile, setResumeFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [summary, setSummary] = useState(null);
    const [totalMatched, setTotalMatched] = useState(0);

    const handleAutoApply = async (e) => {
        e.preventDefault();

        if (!email.trim() || !password.trim() || !role.trim() || !userType) {
            setError('Please provide email, password, role, and select user type (internship/job).');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');
        setSummary(null);
        setTotalMatched(0);

        const formData = new FormData();
        formData.append('email', email.trim());
        formData.append('password', password.trim());
        formData.append('role', role.trim());
        formData.append('location', location.trim());
        formData.append('minStipend', minStipend.trim() || '0');
        formData.append('duration', duration.trim());
        formData.append('type', userType);
        if (resumeFile) {
            formData.append('resume', resumeFile);
        }

        try {
            const response = await axios.post('http://localhost:5000/api/auto-apply', formData, {
                timeout: 300000,
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            console.log('Response received:', response.data);
            setMessage(response.data.message);
            setTotalMatched(response.data.totalMatched || 0);
            setSummary(response.data.summary || {});
        } catch (err) {
            console.error('Auto-apply request failed:', err);
            const errorMessage = err.response?.data?.error || 'Failed to apply. Please try again. Timeout exceeded.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="feature-page">
            <h2>Auto-Apply Bot</h2>
            <p>Applies to internships or jobs matching specified criteria, auto-fills forms.</p>
            
            {/* User Type Selection */}
            <div className="user-type-selection">
                <label>Select User Type:</label>
                <select value={userType} onChange={(e) => setUserType(e.target.value)} required>
                    <option value="">Select...</option>
                    <option value="internship">Undergraduate (Internship)</option>
                    <option value="job">Fresher/Postgraduate (Job)</option>
                </select>
            </div>

            {/* Internship Form */}
            {userType === 'internship' && (
                <form className="feature-form" onSubmit={handleAutoApply}>
                    <h3>Internship Application</h3>
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
                    <label htmlFor="role">Role/Keyword:</label>
                    <input
                        id="role"
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="e.g., Software Development"
                        required
                    />
                    <label htmlFor="location">Location:</label>
                    <input
                        id="location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g., Remote, Bangalore"
                    />
                    <label htmlFor="minStipend">Minimum Stipend (₹):</label>
                    <input
                        id="minStipend"
                        type="number"
                        value={minStipend}
                        onChange={(e) => setMinStipend(e.target.value)}
                        placeholder="e.g., 5000"
                    />
                    <label htmlFor="duration">Duration:</label>
                    <input
                        id="duration"
                        type="text"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="e.g., 3 months"
                    />
                    <label htmlFor="resume">Upload Resume (PDF):</label>
                    <input
                        id="resume"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setResumeFile(e.target.files[0])}
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? 'Applying...' : 'Start Auto-Apply for Internships'}
                    </button>
                </form>
            )}

            {/* Job Form */}
            {userType === 'job' && (
                <form className="feature-form" onSubmit={handleAutoApply}>
                    <h3>Job Application</h3>
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
                    <label htmlFor="role">Role/Keyword:</label>
                    <input
                        id="role"
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="e.g., Software Engineer"
                        required
                    />
                    <label htmlFor="location">Location:</label>
                    <input
                        id="location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g., Remote, Bangalore"
                    />
                    <label htmlFor="minStipend">Minimum Stipend/Salary (₹):</label>
                    <input
                        id="minStipend"
                        type="number"
                        value={minStipend}
                        onChange={(e) => setMinStipend(e.target.value)}
                        placeholder="e.g., 20000"
                    />
                    <label htmlFor="duration">Duration (if applicable):</label>
                    <input
                        id="duration"
                        type="text"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="e.g., Full-time"
                    />
                    <label htmlFor="resume">Upload Resume (PDF):</label>
                    <input
                        id="resume"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setResumeFile(e.target.files[0])}
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? 'Applying...' : 'Start Auto-Apply for Jobs'}
                    </button>
                </form>
            )}

            {error && (
                <div className="error">
                    {error}
                    <button onClick={handleAutoApply} style={{ marginLeft: '10px' }}>
                        Retry
                    </button>
                </div>
            )}
            {message && (
                <div className="result">
                    <h3>{message}</h3>
                    {totalMatched > 0 && (
                        <div>
                            <p>Total {userType === 'internship' ? 'Internships' : 'Jobs'} Matched: {totalMatched}</p>
                            <table className="summary-table">
                                <thead>
                                    <tr>
                                        <th>Status</th>
                                        <th>Count</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary && Object.entries(summary).map(([status, count]) => (
                                        <tr key={status}>
                                            <td>{status}</td>
                                            <td>{count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
            <style jsx>{
            `
                .user-type-selection {
                    margin-bottom: 1.5rem;
                }
                .user-type-selection select {
                    padding: 0.5rem;
                    width: 100%;
                    max-width: 300px;
                }
                .summary-table {
                    width: 50%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                .summary-table th,
                .summary-table td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                .summary-table th {
                    background-color: #f2f2f2;
                }
                .error {
                    color: red;
                    margin-top: 10px;
                }
                .result {
                    color: green;
                    margin-top: 10px;
                }
            `}</style>
        </div>
    );
}

export default AutoApplyBot;