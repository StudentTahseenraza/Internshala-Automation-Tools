import React, { useState, useEffect } from 'react';
import './MultiPlatformSupport.css';

// Simple Error Boundary
class ErrorBoundary extends React.Component {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <div className="error">Something went wrong while rendering job listings. Please try again.</div>;
        }
        return this.props.children;
    }
}

const MultiPlatformSupport = () => {
    const [platforms, setPlatforms] = useState({
        Indeed: false,
        JSearch: false,
        Remotive: false,
        Internshala: false
    });
    const [allPlatforms, setAllPlatforms] = useState(false);
    const [skills, setSkills] = useState('');
    const [field, setField] = useState('');
    const [minStipend, setMinStipend] = useState('');
    const [maxStipend, setMaxStipend] = useState('');
    const [resume, setResume] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [apiErrors, setApiErrors] = useState({});

        const API_BASE = import.meta.env.VITE_API_URL;


    const handlePlatformChange = (platform) => {
        if (platform === 'All') {
            const newValue = !allPlatforms;
            setAllPlatforms(newValue);
            setPlatforms({
                Indeed: newValue,
                JSearch: newValue,
                Remotive: newValue,
                Internshala: newValue
            });
        } else {
            setPlatforms({ ...platforms, [platform]: !platforms[platform] });
            setAllPlatforms(false);
        }
    };

    const handleFetchJobs = async () => {
        setIsLoading(true);
        setError('');
        setApiErrors({});
        const selectedPlatforms = Object.keys(platforms).filter(platform => platforms[platform]);
        
        if (selectedPlatforms.length === 0) {
            setError('Please select at least one platform.');
            setIsLoading(false);
            return;
        }

        if (!skills || !field || !minStipend || !maxStipend) {
            setError('Please fill in all search parameters.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/jobs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platforms: selectedPlatforms, skills, field, minStipend, maxStipend })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch jobs');
            }

            const data = await response.json();
            setJobs(data);

            const errors = {};
            selectedPlatforms.forEach(platform => {
                if (!data.some(job => job.source === platform)) {
                    errors[platform] = `No jobs fetched from ${platform}. Check API key or parameters.`;
                }
            });
            setApiErrors(errors);
        } catch (err) {
            setError('Error fetching jobs. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApply = async (job) => {
        if (!resume) {
            setError('Please upload a resume before applying.');
            return;
        }

        const formData = new FormData();
        formData.append('resume', resume);
        formData.append('jobUrl', job.url);
        formData.append('platform', job.source);

        try {
            const response = await fetch(`${API_BASE}/api/auto-apply`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to apply for the job');
            }

            const result = await response.json();
            alert(`Successfully applied to ${job.title} at ${job.company}`);
        } catch (err) {
            setError('Error applying for the job. Please try again.');
            console.error(err);
        }
    };

    useEffect(() => {
        let ws;
        let reconnectAttempts = 3;

        const connectWebSocket = () => {
            ws = new WebSocket('ws://localhost:5000');
            
            ws.onopen = () => {
                console.log('WebSocket connected');
                reconnectAttempts = 3; // Reset attempts on successful connection
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'JOBS_UPDATE') {
                        setJobs(message.data);
                    }
                } catch (err) {
                    console.error('WebSocket message error:', err);
                }
            };

            ws.onclose = (event) => {
                console.log('WebSocket connection closed:', event.code, event.reason);
                if (reconnectAttempts > 0) {
                    console.log(`Reconnecting WebSocket (${reconnectAttempts} attempts left)...`);
                    setTimeout(connectWebSocket, 3000); // Retry after 3s
                    reconnectAttempts--;
                } else {
                    setError('WebSocket connection failed after retries. Real-time updates unavailable.');
                }
            };

            ws.onerror = (err) => {
                console.error('WebSocket error:', err);
            };
        };

        connectWebSocket();
        return () => ws && ws.close();
    }, []);

    // Render structured job description with fallback
    const renderDescription = (description) => {
        if (!description || typeof description !== 'object') {
            return (
                <div className="job-section">
                    <h4>Description</h4>
                    <p>{typeof description === 'string' ? description : 'No description available'}</p>
                </div>
            );
        }

        return Object.keys(description).map((sectionKey, index) => (
            <div key={index} className="job-section">
                <h4>{description[sectionKey].heading}</h4>
                {description[sectionKey].content.map((item, i) => (
                    item.type === 'list' ? (
                        <ul key={i}>
                            {item.items.map((listItem, j) => (
                                <li key={j}>{listItem}</li>
                            ))}
                        </ul>
                    ) : (
                        <p key={i}>{item.text}</p>
                    )
                ))}
            </div>
        ));
    };

    return (
        <ErrorBoundary>
            <div className="feature-page">
                <h2>Multi-Platform Internship Search</h2>
                <p>Search and apply for internships across multiple platforms seamlessly.</p>

                <div className="platform-selection">
                    <h3>Select Platforms</h3>
                    <label>
                        <input
                            type="checkbox"
                            checked={allPlatforms}
                            onChange={() => handlePlatformChange('All')}
                        />
                        All
                    </label>
                    {Object.keys(platforms).map(platform => (
                        <label key={platform}>
                            <input
                                type="checkbox"
                                checked={platforms[platform]}
                                onChange={() => handlePlatformChange(platform)}
                            />
                            {platform}
                        </label>
                    ))}
                </div>

                <div className="search-params">
                    <h3>Search Parameters</h3>
                    <label>
                        <span>Skills (e.g., Python, React)</span>
                        <input
                            type="text"
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                            placeholder="Enter skills"
                        />
                    </label>
                    <label>
                        <span>Field (e.g., Software Development)</span>
                        <input
                            type="text"
                            value={field}
                            onChange={(e) => setField(e.target.value)}
                            placeholder="Enter field"
                        />
                    </label>
                    <label>
                        <span>Minimum Stipend (INR)</span>
                        <input
                            type="number"
                            value={minStipend}
                            onChange={(e) => setMinStipend(e.target.value)}
                            placeholder="Enter minimum stipend"
                        />
                    </label>
                    <label>
                        <span>Maximum Stipend (INR)</span>
                        <input
                            type="number"
                            value={maxStipend}
                            onChange={(e) => setMaxStipend(e.target.value)}
                            placeholder="Enter maximum stipend"
                        />
                    </label>
                </div>

                <div className="resume-upload">
                    <label>
                        <span>Upload Resume</span>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setResume(e.target.files[0])}
                        />
                    </label>
                </div>

                {error && <div className="error">{error}</div>}
                {Object.keys(apiErrors).map(platform => (
                    <div key={platform} className="error">{apiErrors[platform]}</div>
                ))}

                <button onClick={handleFetchJobs} disabled={isLoading}>
                    {isLoading ? 'Fetching Jobs...' : 'Fetch Jobs Now'}
                </button>

                <div className="platform-management-tools">
                    <h3>Available Internships and Jobs</h3>
                    <ul>
                        {jobs.length > 0 ? (
                            jobs.map((job, index) => (
                                <li key={index} className="job-listing">
                                    <h3>{job.title}</h3>
                                    <p><strong>Company:</strong> {job.company}</p>
                                    <p><strong>Location:</strong> {job.location}</p>
                                    <p><strong>Salary:</strong> {job.salary}</p>
                                    {renderDescription(job.description)}
                                    <p><a href={job.url} target="_blank" rel="noopener noreferrer">View Job</a></p>
                                    <button onClick={() => handleApply(job)}>Apply</button>
                                    <p><strong>Source:</strong> {job.source}</p>
                                </li>
                            ))
                        ) : (
                            <p>No jobs found. Try adjusting your search parameters.</p>
                        )}
                    </ul>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default MultiPlatformSupport;