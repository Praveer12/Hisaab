import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  Users,
  Plus,
  Receipt,
  TrendingUp,
  Calculator,
  DatabaseBackup,
  ChefHat,
  ContactRound,
} from 'lucide-react';

// Routes for the milk section sidebar
const milkNavItems = [
  { path: '/milk',       label: 'Dashboard',  icon: LayoutDashboard },
  { path: '/entry',      label: 'Add Entry',  icon: Plus            },
  { path: '/billing',    label: 'Billing',    icon: Receipt         },
  { path: '/providers',  label: 'Providers',  icon: Users           },
  { path: '/stats',      label: 'Statistics', icon: TrendingUp      },
  { path: '/calculator', label: 'Calculator', icon: Calculator      },
  { path: '/backup',     label: 'Backup',     icon: DatabaseBackup  },
];

const cookNavItems = [
  { path: '/cook', label: 'Cook Dashboard', icon: ChefHat },
];

const contactsNavItems = [
  { path: '/contacts', label: 'Service Contacts', icon: ContactRound },
];

const milkPaths = milkNavItems.map(i => i.path);
const cookPaths = cookNavItems.map(i => i.path);
const contactsPaths = contactsNavItems.map(i => i.path);

export default function SideNav() {
  const location = useLocation();
  const isMilkSection = milkPaths.includes(location.pathname);
  const isCookSection = cookPaths.includes(location.pathname);
  const isContactsSection = contactsPaths.includes(location.pathname);

  const navItems = isMilkSection
    ? milkNavItems
    : isCookSection
    ? cookNavItems
    : isContactsSection
    ? contactsNavItems
    : [];

  return (
    <aside className="side-nav">
      {/* Logo / Brand */}
      <div className="side-nav-brand">
        <span className="side-nav-brand-logo">🏠</span>
        <span className="side-nav-brand-name">Hisaab</span>
      </div>

      {/* Section label */}
      {(isMilkSection || isCookSection || isContactsSection) && (
        <div className="side-nav-section-label">
          {isMilkSection ? '🥛 Doodh' : isCookSection ? '👨‍🍳 Cook' : '📇 Contacts'}
        </div>
      )}

      {/* Nav links */}
      <nav className="side-nav-links">
        {/* Always show Home first */}
        <NavLink to="/" className={({ isActive }) => `side-nav-link${isActive ? ' active' : ''}`} end>
          <Home size={18} />
          <span>Home</span>
        </NavLink>

        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `side-nav-link${isActive ? ' active' : ''}`
            }
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="side-nav-footer">
        <span className="side-nav-version">v1.0</span>
      </div>
    </aside>
  );
}
