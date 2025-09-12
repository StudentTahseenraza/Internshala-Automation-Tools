import React from 'react';
import { Link } from 'react-router-dom';

function FeatureCard({ icon, title, description, link }) {
    return (
        <Link to={link} className="feature-card">
            <i className={icon}></i>
            <h3>{title}</h3>
            <p>{description}</p>
        </Link>
    );
}

export default FeatureCard;