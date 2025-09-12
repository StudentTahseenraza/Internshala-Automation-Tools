import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/pages/Home';
import AutoApplyBot from './components/pages/AutoApplyBot';
import ApplicationTracker from './components/pages/ApplicationTracker';
import CoverLetterGenerator from './components/pages/CoverLetterGenerator';
import AutoLoginSystem from './components/pages/AutoLoginSystem';
import SkillMatchAnalyzer from './components/pages/SkillMatchAnalyzer';
import InternshipRecommendation from './components/pages/InternshipRecommendation';
import MultiPlatformSupport from './components/pages/MultiPlatformSupport';
import DynamicFormFiller from './components/pages/DynamicFormFiller';
import AIResumeOptimization from './components/pages/AIResumeOptimization';
import TelegramEmailAlerts from './components/pages/TelegramEmailAlerts';
import ProgressDashboard from './components/pages/ProgressDashboard';
import './styles/App.css';
import Footer from './components/Footer';
function App() {
    return (
        <Router>
            <div className="container">
                <Header />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/auto-apply-bot" element={<AutoApplyBot />} />
                    <Route path="/application-tracker" element={<ApplicationTracker />} />
                    <Route path="/cover-letter-generator" element={<CoverLetterGenerator />} />
                    <Route path="/auto-login-system" element={<AutoLoginSystem />} />
                    <Route path="/skill-match-analyzer-1" element={<SkillMatchAnalyzer title="Skill Match Analyzer (Manage Platforms)" description="Manage applications from multiple platforms" />} />
                    <Route path="/skill-match-analyzer-2" element={<SkillMatchAnalyzer title="Skill Match Analyzer (Compatibility)" description="Analyze compatibility of user profile with requirements" />} />
                    <Route path="/internship-recommendation" element={<InternshipRecommendation />} />
                    <Route path="/multi-platform-support" element={<MultiPlatformSupport />} />
                    <Route path="/dynamic-form-filler" element={<DynamicFormFiller />} />
                    <Route path="/ai-resume-optimization" element={<AIResumeOptimization />} />
                    <Route path="/telegram-email-alerts" element={<TelegramEmailAlerts />} />
                    <Route path="/progress-dashboard" element={<ProgressDashboard />} />
                </Routes>
            </div>
            <div className="footer-spacer">
                <Footer />
            </div>
        </Router>
    );
}

export default App;