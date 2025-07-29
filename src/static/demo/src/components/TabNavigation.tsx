import React from 'react';

interface TabNavigationProps {
  activeTab: 'demo' | 'developer';
  onTabChange: (tab: 'demo' | 'developer') => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => (
  <div className="tab-navigation">
    <button
      className={`tab-button ${activeTab === 'demo' ? 'active' : ''}`}
      onClick={() => onTabChange('demo')}
    >
      Demo
    </button>
    <button
      className={`tab-button ${activeTab === 'developer' ? 'active' : ''}`}
      onClick={() => onTabChange('developer')}
    >
      Developer
    </button>
  </div>
);

export default TabNavigation; 