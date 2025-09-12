import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
    // Define the rotating banner content
    const bannerContent = [
        {
            text: "Automate Your Internship Applications!",
            icon: "fas fa-robot",
        },
        {
            text: "Get Personalized Recommendations!",
            icon: "fas fa-star",
        },
        {
            text: "Track Your Progress with Ease!",
            icon: "fas fa-chart-line",
        },
        {
            text: "Optimize Your Resume with AI!",
            icon: "fas fa-file-alt",
        },
    ];

    // State to manage the current banner item
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

    // Rotate banner every 4 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBannerIndex((prevIndex) =>
                prevIndex === bannerContent.length - 1 ? 0 : prevIndex + 1
            );
        }, 4000); // Change every 4 seconds

        return () => clearInterval(interval); // Cleanup on unmount
    }, [bannerContent.length]);

    return (
        <header className="header">
            <div className="header-content">
                <div className="logo-title">
                    <i className="fas fa-robot header-logo"></i>
                    <h1>Internshala Auto-Apply Bot</h1>
                </div>
                <p>Automates tasks on the Internshala platform, such as logins, profile updates, internship search, and applications.</p>
                <div className="scheduler-btn">
                    <i className="fas fa-upload"></i> Scheduler
                    <span className="scheduler-status">Publish mode/type</span>
                </div>
                <Link to="/" className="back-home">Back to Home</Link>

                {/* Rotating Banner Section */}
                <div className="banner">
                    <div className="banner-content">
                        <i className={`${bannerContent[currentBannerIndex].icon} banner-icon`}></i>
                        <span className="banner-text">{bannerContent[currentBannerIndex].text}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;