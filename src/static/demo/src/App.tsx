import { useState } from 'react';
import type { User } from '@/types/auth.types';
import HeroSection from '@/components/sections/HeroSection';
import TabNavigation from '@/components/TabNavigation';
import CompetitiveSection from '@/components/sections/CompetitiveSection';
import DevelopersSection from '@/components/sections/DevelopersSection';
import FooterSection from '@/components/sections/FooterSection';
import DemoTab from '@/components/sections/DemoTab';
import DeveloperTab from '@/components/sections/DeveloperTab';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('demo');
  
  const handleAuthSuccess = (user: User) => {
    console.log('Authentication successful:', user);
  };

  const handleAuthError = (error: string) => {
    console.error('Authentication error:', error);
  };

  return (
    <div className="app">
        <div className="container">
        <HeroSection
          onDemoClick={() => setActiveTab('demo')}
          onDeveloperClick={() => setActiveTab('developer')}
        />

        <div className="content-section" id="content-section">
          <TabNavigation activeTab={activeTab as 'demo' | 'developer'} onTabChange={(tab) => setActiveTab(tab)} />

          {activeTab === 'demo' && (
            <DemoTab onAuthSuccess={handleAuthSuccess} onAuthError={handleAuthError} />
          )}

          {activeTab === 'developer' && (
            <DeveloperTab />
          )}
        </div>

        <CompetitiveSection />

        <DevelopersSection />

        <FooterSection />

        <virto-connect
          id="previewVirtoConnect"
          server="http://localhost:3000/api"
          provider-url="ws://localhost:21000"
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}

export default App; 