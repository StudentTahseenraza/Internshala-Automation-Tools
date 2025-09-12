import React, { useState } from 'react';
import './CoverLetterGenerator.css';

function CoverLetterGenerator() {
    const [formData, setFormData] = useState({
        name: '',
        jobTitle: '',
        company: '',
        skills: '',
    });
    const [coverLetter, setCoverLetter] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:5000/api/cover-letter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            if (!response.ok) {
                throw new Error('Failed to generate cover letter');
            }
            const data = await response.json();
            setCoverLetter(data.coverLetter);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cover-letter-generator">
            <h2>AI-Powered Cover Letter Generator</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Name:</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div>
                    <label>Job Title:</label>
                    <input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleChange} required />
                </div>
                <div>
                    <label>Company:</label>
                    <input type="text" name="company" value={formData.company} onChange={handleChange} required />
                </div>
                <div>
                    <label>Skills:</label>
                    <textarea name="skills" value={formData.skills} onChange={handleChange} required />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Generating...' : 'Generate Cover Letter'}
                </button>
            </form>
            {error && <p className="error">{error}</p>}
            {coverLetter && (
                <div className="cover-letter-output">
                    <h3>Your Cover Letter:</h3>
                    <p>{coverLetter}</p>
                </div>
            )}
        </div>
    );
}

export default CoverLetterGenerator;