import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { Pie, Bar } from 'react-chartjs-2'; // Import chart components
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'; // Import Chart.js components
import './ProgressDashboard.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// Connect to WebSocket server
const socket = io('http://localhost:5000', {
    reconnection: true,
    reconnectionAttempts: 5,
});

const ProgressDashboard = () => {
    const [progressData, setProgressData] = useState({
        totalApplications: 0,
        successRate: 0,
        pendingTasks: 0,
        platforms: [],
        successRateBreakdown: { successful: 0, unsuccessful: 0 },
        tasksBreakdown: { completed: 0, pending: 0 },
    });

    // Fetch initial progress data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/progress');
                setProgressData(response.data);
            } catch (err) {
                console.error('Failed to fetch initial progress data:', err);
            }
        };
        fetchInitialData();
    }, []);

    // Listen for real-time updates via WebSocket
    useEffect(() => {
        socket.on('progressUpdate', (updatedData) => {
            setProgressData(updatedData);
        });

        // Cleanup on component unmount
        return () => {
            socket.off('progressUpdate');
        };
    }, []);

    const handlePlatformAction = (platformName, action) => {
        alert(`${action} clicked for ${platformName}`);
        // In a real app, this would trigger API calls or navigation
    };

    // Convert platforms object to array for rendering
    const platformList = Object.keys(progressData.platforms || {}).map((name) => ({
        name,
        ...progressData.platforms[name],
    }));

    // Success Rate Breakdown Chart Data
    const successRateChartData = {
        labels: ['Successful', 'Unsuccessful'],
        datasets: [
            {
                label: 'Success Rate',
                data: [
                    progressData.successRateBreakdown.successful,
                    progressData.successRateBreakdown.unsuccessful,
                ],
                backgroundColor: ['#2ecc71', '#e74c3c'],
                borderColor: ['#27ae60', '#c0392b'],
                borderWidth: 1,
            },
        ],
    };

    // Tasks Breakdown Chart Data
    const tasksChartData = {
        labels: ['Completed', 'Pending'],
        datasets: [
            {
                label: 'Tasks',
                data: [
                    progressData.tasksBreakdown.completed,
                    progressData.tasksBreakdown.pending,
                ],
                backgroundColor: ['#3498db', '#f1c40f'],
                borderColor: ['#2980b9', '#f39c12'],
                borderWidth: 1,
            },
        ],
    };

    return (
        <div className="progress-dashboard">
            <h2>Progress Dashboard</h2>
            <p>Visualize application stats, success rate, tasks, and multi-platform progress in real-time.</p>

            {/* Stats Cards */}
            <div className="stats-cards">
                <div className="stats-card">
                    <h3>Total Applications</h3>
                    <p>{progressData.totalApplications}</p>
                </div>
                <div className="stats-card">
                    <h3>Success Rate</h3>
                    <p>{progressData.successRate}%</p>
                </div>
                <div className="stats-card">
                    <h3>Pending Tasks</h3>
                    <p>{progressData.pendingTasks}</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-section">
                <div className="chart-container">
                    <h3>Success Rate Breakdown</h3>
                    <Pie
                        data={successRateChartData}
                        options={{
                            responsive: true,
                            plugins: {
                                legend: {
                                    position: 'top',
                                },
                                title: {
                                    display: false,
                                },
                            },
                        }}
                    />
                </div>
                <div className="chart-container">
                    <h3>Tasks Breakdown</h3>
                    <Bar
                        data={tasksChartData}
                        options={{
                            responsive: true,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Number of Tasks',
                                    },
                                },
                            },
                            plugins: {
                                legend: {
                                    display: false,
                                },
                                title: {
                                    display: false,
                                },
                            },
                        }}
                    />
                </div>
            </div>

            {/* Platform Progress Section */}
            <div className="platform-section">
                <h3>Multi-Platform Progress</h3>
                <div className="platform-list">
                    {platformList.map((platform, index) => (
                        <div key={index} className="platform-item">
                            <div className="platform-header">
                                <h4>{platform.name}</h4>
                                <div className="platform-actions">
                                    <button onClick={() => handlePlatformAction(platform.name, 'View Details')}>
                                        View Details
                                    </button>
                                    <button onClick={() => handlePlatformAction(platform.name, 'Filter')}>
                                        Filter
                                    </button>
                                </div>
                            </div>
                            <p>Applications: {platform.applications}</p>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${platform.progress}%` }}
                                >
                                    {platform.progress}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProgressDashboard;