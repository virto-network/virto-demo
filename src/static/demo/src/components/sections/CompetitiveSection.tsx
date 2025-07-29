import React from 'react';

const features = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4"></path>
        <circle cx="12" cy="12" r="10"></circle>
      </svg>
    ),
    title: 'No Blockchain Knowledge',
    desc: "Your users don't need to understand blockchain technology. They simply sign up and start using your app immediately.",
    badge: 'User-Friendly',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        <line x1="2" y1="2" x2="22" y2="22" />
      </svg>
    ),
    title: 'Zero User Fees',
    desc: 'No transaction fees, no hidden costs for your users. They enjoy a completely free experience while you maintain full control over your monetization.',
    badge: 'Cost-Free',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 48 48" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 43V22C18 18.7 20.7 16 24 16s6 2.7 6 6v21" />
        <path d="M12 40V22c0-6.6 5.4-12 12-12s12 5.4 12 12v18" />
        <path d="M6 35V22C6 12.1 14.1 4 24 4s18 8.1 18 18v13" />
        <path d="M24 44V31" />
        <path d="M24 24.6V21.9" />
      </svg>
    ),
    title: 'Built-in Passkeys Support',
    desc: 'Native integration with WebAuthn and passkeys for passwordless authentication. Users can sign in securely with biometrics, security keys, or device authentication.',
    badge: 'Passwordless',
  },
];

const CompetitiveSection: React.FC = () => (
  <section className="competitive-section">
    <div className="competitive-content">
      <h2 className="competitive-title">Why Choose Virto Connect?</h2>
      <p className="competitive-subtitle">Experience the advantages that set Virto Connect apart from other embedded authentication solutions</p>

      <div className="features-grid">
        {features.map(f => (
          <div className="feature-card" key={f.title}>
            <div className="feature-card-icon">{f.icon}</div>
            <h3 className="feature-card-title">{f.title}</h3>
            <p className="feature-card-description">{f.desc}</p>
            <span className="feature-card-badge">{f.badge}</span>
          </div>
        ))}
      </div>

      <div className="competitive-buttons">
        <button className="competitive-button secondary" onClick={() => window.open('https://form.typeform.com/to/ZQBjra3e', '_blank')}>I want to know more</button>
      </div>
    </div>
  </section>
);

export default CompetitiveSection; 