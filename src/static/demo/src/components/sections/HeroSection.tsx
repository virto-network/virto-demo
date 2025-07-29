import React from 'react';

interface HeroSectionProps {
  onDemoClick: () => void;
  onDeveloperClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onDemoClick, onDeveloperClick }) => (
  <div className="hero-section">
    <div className="hero-content">
      <div className="hero-left">
        <h1 className="hero-title">Virto Connect</h1>
        <p className="hero-subtitle">Effortless Access. Fully Yours</p>
        <p className="hero-description">
          Virto Connect is a plug-and-play authentication tool that makes it simple to sign up and sign in
          to modern applications. Built with <strong>passkeys</strong> and Substrate keys for passwordless
          security, <strong>OAuth</strong> and Zero knowledge coming soon for seamless integration
          — no blockchain knowledge required for your users.
        </p>
        <div className="hero-buttons">
          <button className="hero-button primary" onClick={onDemoClick}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Demo
          </button>
          <button className="hero-button secondary" onClick={onDeveloperClick}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
            Get Started
          </button>
        </div>
      </div>
      <div className="hero-right">
        <div className="hero-logo">
          <img className="hero-logo-phone" src="virto-connect.gif" alt="Virto Connect Animation" width="120" height="120" />
          <img className="hero-logo-cube" src="cube.png" alt="Cube" width="120" height="120" />
        </div>
      </div>
    </div>
  </div>
);

export default HeroSection; 