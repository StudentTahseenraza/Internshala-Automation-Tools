import React from 'react';
import FeatureCard from './FeatureCard';

function FeatureGrid() {
    const features = [
        { icon: 'fas fa-robot', title: 'Auto-Apply Bot', description: 'Applies to internship matching specified criteria, auto-fills forms' },
        { icon: 'fas fa-check-circle', title: 'Application Tracker', description: 'Scheduler/CRON support to run automation at' },
        { icon: 'fas fa-file-alt', title: 'AI-Powered Cover Letter Generator', description: 'Generate personalized cover letters using AI' },
        { icon: 'fas fa-sign-in-alt', title: 'Auto Login System', description: 'Securely log in to Internshala account' },
        { icon: 'fas fa-star', title: 'Skill Match Analyzer', description: 'Manage applications from multiple platforms' },
        { icon: 'fas fa-file-alt', title: 'Skill Match Analyzer', description: 'Analyze compatibility of user profile with requirements' },
        { icon: 'fas fa-star', title: 'Internship Recommendation Engine', description: 'Suggests internships based on skills, history, trends' },
        { icon: 'fas fa-globe', title: 'Multi-Platform Support', description: 'Manage applications from multiple platforms' },
        { icon: 'fas fa-file-alt', title: 'Dynamic Form Filler', description: 'Detect and auto-fill relevant details in applying forms' },
        { icon: 'fas fa-code', title: 'AI Resume Optimization', description: 'Tailor resume for each internship using AI assistance' },
        { icon: 'fas fa-bell', title: 'Telegram/Email Alerts', description: 'Receive real-time status updates' },
        { icon: 'fas fa-chart-line', title: 'Progress Dashboard', description: 'Visualize application stats; success rate, tasks' },
    ];

    return (
        <div className="feature-grid">
            {features.map((feature, index) => (
                <FeatureCard
                    key={index}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                />
            ))}
        </div>
    );
}

export default FeatureGrid;