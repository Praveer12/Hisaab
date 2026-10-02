import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', emoji: '🌅' };
  if (hour < 17) return { text: 'Good Afternoon', emoji: '☀️' };
  if (hour < 21) return { text: 'Good Evening', emoji: '🌇' };
  return { text: 'Good Night', emoji: '🌙' };
}

const pageTitles = {
  '/': null,             // Home — greeting style
  '/milk': null,         // Milk dashboard — greeting style
  '/entry': 'Add Entry',
  '/providers': 'Providers',
  '/billing': 'Billing',
  '/stats': 'Statistics',
  '/calculator': 'Calculator',
  '/backup': 'Backup',
  '/cook': null,         // Cook dashboard — greeting style
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const greeting = getGreeting();
  const isHome = location.pathname === '/';
  const isMilkDash = location.pathname === '/milk';
  const isCookDash = location.pathname === '/cook';
  const showGreeting = isHome || isMilkDash || isCookDash;
  const title = pageTitles[location.pathname] ?? 'Hisaab';

  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const greetingName = isHome ? 'Hisaab' : isMilkDash ? '🥛 Doodh' : '👨‍🍳 Cook';

  return (
    <header className="header">
      {showGreeting ? (
        <div className="header-greeting">
          <span className="header-greeting-text">
            {greeting.text} {greeting.emoji}
          </span>
          <span className="header-greeting-name">{greetingName}</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            className="btn btn-icon"
            onClick={() => navigate(-1)}
            style={{ marginLeft: '-4px' }}
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="header-title">{title}</h2>
        </div>
      )}
      <div className="header-right">
        <span className="header-date">{dateStr}</span>
      </div>
    </header>
  );
}
