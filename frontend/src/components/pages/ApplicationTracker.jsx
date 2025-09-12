import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ApplicationTracker.css'; // Import the CSS file

function ApplicationTracker() {
    const [applications, setApplications] = useState([]);
    const [filteredApplications, setFilteredApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const getSummary = () => {
        const summary = {
            submitted: applications.filter(app => app.status === 'submitted').length,
            pending: applications.filter(app => app.status === 'pending').length,
            notApplicable: applications.filter(app => app.status === 'not applicable').length
        };
        return summary;
    };

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/fetch-applications', {
                timeout: 5000
            });
            setApplications(response.data);
            applyFilters(response.data, statusFilter);
            setError('');
        } catch (err) {
            console.error('Error fetching applications:', err);
            setError('Failed to load application tracking list. Please check your network connection and try again later.');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = (apps, status) => {
        let filtered = [...apps];
        if (status) {
            filtered = filtered.filter(app => app.status === status);
        }
        setFilteredApplications(filtered);
    };

    const handleStatusFilterChange = (e) => {
        const newStatus = e.target.value;
        setStatusFilter(newStatus);
        applyFilters(applications, newStatus);
    };

    const clearFilters = () => {
        setStatusFilter('');
        setFilteredApplications([...applications]);
    };

    useEffect(() => {
        fetchApplications();

        let ws;
        try {
            ws = new WebSocket('ws://localhost:5000');
            ws.onopen = () => {
                console.log('Connected to WebSocket');
            };
            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                if (message.type === 'APPLICATIONS_UPDATE') {
                    const updatedApps = message.data;
                    setApplications(updatedApps);
                    applyFilters(updatedApps, statusFilter);
                }
            };
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                const interval = setInterval(fetchApplications, 10000);
                return () => clearInterval(interval);
            };
            ws.onclose = () => {
                console.log('WebSocket connection closed');
            };
        } catch (error) {
            console.error('Failed to initialize WebSocket:', error);
            const interval = setInterval(fetchApplications, 10000);
            return () => clearInterval(interval);
        }

        return () => {
            if (ws) ws.close();
        };
    }, [statusFilter]);

    const summary = getSummary();

    return (
        <div className="application-tracker-container">
            <header className="tracker-header">
                <h2>Application Tracker (Real-Time)</h2>
                <p className="last-updated">
                    Last updated: {new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}
                </p>
            </header>

            <div className="summary-cards">
                <div className="summary-card">
                    <h3>Submitted</h3>
                    <p className="summary-value">{summary.submitted}</p>
                </div>
                <div className="summary-card">
                    <h3>Pending</h3>
                    <p className="summary-value">{summary.pending}</p>
                </div>
                <div className="summary-card">
                    <h3>Not Applicable</h3>
                    <p className="summary-value">{summary.notApplicable}</p>
                </div>
                <div className="summary-card total">
                    <h3>Total</h3>
                    <p className="summary-value">{applications.length}</p>
                </div>
            </div>

            <div className="filters-section">
                <div className="filter-group">
                    <label htmlFor="status-filter">Filter by Status:</label>
                    <select id="status-filter" value={statusFilter} onChange={handleStatusFilterChange}>
                        <option value="">All</option>
                        <option value="submitted">Submitted</option>
                        <option value="pending">Pending</option>
                        <option value="not applicable">Not Applicable</option>
                    </select>
                </div>

                <button className="clear-button" onClick={clearFilters}>
                    Clear Filters
                </button>
            </div>

            {loading && (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading applications...</p>
                </div>
            )}
            {error && (
                <div className="error-state">
                    <p>{error}</p>
                    <button className="retry-button" onClick={fetchApplications}>
                        Retry
                    </button>
                </div>
            )}
            {!loading && !error && filteredApplications.length === 0 && (
                <div className="empty-state">
                    <p>No applications found.</p>
                </div>
            )}
            {!loading && !error && filteredApplications.length > 0 && (
                <div className="table-wrapper">
                    <table className="applications-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Title</th>
                                <th>Company</th>
                                <th>Stipend</th>
                                <th>Status</th>
                                <th>Submitted At</th>
                                <th>Link</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredApplications.map((app) => (
                                <tr key={app.id}>
                                    <td>{app.id}</td>
                                    <td>{app.title}</td>
                                    <td>{app.company}</td>
                                    <td>{app.stipend}</td>
                                    <td>
                                        <span className={`status-badge status-${app.status.replace(' ', '-')}`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td>{new Date(app.submittedAt).toLocaleString()}</td>
                                    <td><a href={app.link} target="_blank" rel="noopener noreferrer">View</a></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default ApplicationTracker;