import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
    return (
        <footer className="amazon-footer">
            <div className="footer-main">
                <div className="footer-column">
                    <h4>Features</h4>
                    <ul>
                        <li><Link to="/auto-apply-bot">Auto-Apply Bot</Link></li>
                        <li><Link to="/internship-recommendation">Internship Recommendations</Link></li>
                        <li><Link to="/progress-dashboard">Progress Dashboard</Link></li>
                        <li><Link to="/ai-resume-optimization">AI Resume Optimization</Link></li>
                    </ul>
                </div>
                <div className="footer-column">
                    <h4>Support</h4>
                    <ul>
                        <li><a href="mailto:support@example.com">Contact Support</a></li>
                        <li><a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer">GitHub Repository</a></li>
                        <li><a href="/docs">Documentation</a></li>
                        <li><a href="/faq">FAQs</a></li>
                    </ul>
                </div>
                <div className="footer-column">
                    <h4>About the Project</h4>
                    <ul>
                        <li><Link to="/about">Project Motive</Link></li>
                        <li>
                            <p className="about-text">
                                Streamlines internship applications using automation and AI to save time and improve success rates.
                            </p>
                        </li>
                        <li><Link to="/why-choose">Why Choose Us?</Link></li>
                        <li><Link to="/team">Meet the Team</Link></li>
                    </ul>
                </div>
                <div className="footer-column">
                    <h4>Legal</h4>
                    <ul>
                        <li><Link to="/terms">Terms of Service</Link></li>
                        <li><Link to="/privacy">Privacy Policy</Link></li>
                        <li><Link to="/license">License</Link></li>
                    </ul>
                </div>
            </div>
            <div className="footer-bottom">
                <div className="footer-logo">
                    <i className="fas fa-robot"></i>
                    <span>Internshala Auto-Apply Bot</span>
                </div>
                <div className="footer-links">
                    <Link to="/terms">Terms</Link> | <Link to="/privacy">Privacy</Link> | <Link to="/security">Security</Link>
                </div>
                <p>© 2025 Internshala Auto-Apply Bot. All rights reserved.</p>
            </div>
        </footer>
    );
}

export default Footer;