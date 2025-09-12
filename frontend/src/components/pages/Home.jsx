import React from 'react';
import FeatureCard from '../FeatureCard';

function Home() {
    const features = [
        { icon: 'fas fa-robot', title: 'Auto-Apply Bot', description: 'Applies to internship matching specified criteria, auto-fills forms', link: '/auto-apply-bot' },
        { icon: 'fas fa-check-circle', title: 'Application Tracker', description: 'Scheduler/CRON support to run automation at', link: '/application-tracker' },
        { icon: 'fas fa-file-alt', title: 'AI-Powered Cover Letter Generator', description: 'Generate personalized cover letters using AI', link: '/cover-letter-generator' },
        { icon: 'fas fa-sign-in-alt', title: 'Auto Login System', description: 'Securely log in to Internshala account', link: '/auto-login-system' },
        { icon: 'fas fa-star', title: 'Skill Match Analyzer', description: 'Manage applications from multiple platforms', link: '/skill-match-analyzer-1' },
        { icon: 'fas fa-file-alt', title: 'Skill Match Analyzer', description: 'Analyze compatibility of user profile with requirements', link: '/skill-match-analyzer-2' },
        { icon: 'fas fa-star', title: 'Internship Recommendation Engine', description: 'Suggests internships based on skills, history, trends', link: '/internship-recommendation' },
        { icon: 'fas fa-globe', title: 'Multi-Platform Support', description: 'Manage applications from multiple platforms', link: '/multi-platform-support' },
        { icon: 'fas fa-file-alt', title: 'Dynamic Form Filler', description: 'Detect and auto-fill relevant details in applying forms', link: '/dynamic-form-filler' },
        { icon: 'fas fa-code', title: 'AI Resume Optimization', description: 'Tailor resume for each internship using AI assistance', link: '/ai-resume-optimization' },
        { icon: 'fas fa-bell', title: 'Telegram/Email Alerts', description: 'Receive real-time status updates', link: '/telegram-email-alerts' },
        { icon: 'fas fa-chart-line', title: 'Progress Dashboard', description: 'Visualize application stats; success rate, tasks', link: '/progress-dashboard' },
    ];

    return (
        <div className="feature-grid">
            {features.map((feature, index) => (
                <FeatureCard
                    key={index}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    link={feature.link}
                />
            ))}
        </div>
    );
}

export default Home;