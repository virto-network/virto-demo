import React from 'react';

const DevelopersSection: React.FC = () => (
  <section className="developers-section">
    <div className="developers-content">
      <div className="developers-header">
        <h2 className="developers-title">Choose Your Path</h2>
        <p className="developers-subtitle">Whether you're embedding authentication or building on Substrate, we've got you covered</p>
      </div>

      <div className="developers-grid">
        <div className="developer-card">
          <div className="developer-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"></rect>
              <polyline points="6 8 10 12 6 16"></polyline>
              <line x1="14" y1="14" x2="18" y2="14"></line>
            </svg>
          </div>
          <h3 className="developer-card-title">App Developer</h3>
          <p className="developer-card-description">
            Perfect for frontend developers who want to add secure authentication to their web applications quickly and easily.
          </p>
          <ul className="developer-card-features">
            <li>Copy & paste HTML component</li>
            <li>Real-time customization tools</li>
            <li>No blockchain knowledge needed</li>
          </ul>
          <div className="developer-card-cta">
            <button className="developer-card-button secondary" onClick={() => window.open('https://form.typeform.com/to/ZQBjra3e', '_blank')}>Get Early Access</button>
          </div>
        </div>

        <div className="developer-card">
          <div className="developer-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <h3 className="developer-card-title">Substrate Developer</h3>
          <p className="developer-card-description">
            For blockchain developers building on Substrate who need federated authentication and user management solutions.
          </p>
          <ul className="developer-card-features">
            <li>Substrate SDK integration</li>
            <li>Federated authentication</li>
            <li>Cross-chain compatibility</li>
          </ul>
          <div className="developer-card-cta">
            <button className="developer-card-button primary" onClick={() => window.open('https://github.com/virto-network/virto-sdk', '_blank')}>View SDK</button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default DevelopersSection; 