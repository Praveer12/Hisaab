import React from 'react';
import { useLocation } from 'react-router-dom';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', emoji: '🌅' };
  if (hour < 17) return { text: 'Good Afternoon', emoji: '☀️' };
  if (hour < 21) return { text: 'Good Evening', emoji: '🌇' };
  return { text: 'Good Night', emoji: '🌙' };
}

const pageTitles = {
  '/': null,
  '/entry': 'Add Entry',
  '/providers': 'Providers',
  '/billing': 'Billing',
  '/stats': 'Statistics',
  '/calculator': 'Calculator',
  '/backup': 'Backup',
};

export default function Header() {
  const location = useLocation();
  const greeting = getGreeting();
  const isHome = location.pathname === '/';
  const title = pageTitles[location.pathname] || 'Hisaab';
  
  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  
  return (
    <header className="header">
      {isHome ? (
        <div className="header-greeting">
          <span className="header-greeting-text">
            {greeting.text} {greeting.emoji}
          </span>
          <span className="header-greeting-name">Hisaab</span>
        </div>
      ) : (
        <h2 className="header-title">{title}</h2>
      )}
      <div className="header-right">
        <span className="header-date">{dateStr}</span>
      </div>
    </header>
  );
}
