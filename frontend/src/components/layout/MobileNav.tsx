import { NavLink } from 'react-router-dom';
import { FiHome, FiUsers, FiFolder } from 'react-icons/fi';

/**
 * MobileNav Component (Mobile/Tablet Only)
 * 
 * Bottom navigation sticky visibile solo su mobile/tablet con:
 * - Link principali (Dashboard, Proprietari, Contratti)
 * - Solo icone senza testo
 */
const MobileNav = () => {
  // Link di navigazione principali
  const navLinks = [
    {
      to: '/',
      icon: FiHome,
      label: 'Dashboard',
    },
    {
      to: '/owners',
      icon: FiUsers,
      label: 'Proprietari',
    },
    {
      to: '/contracts',
      icon: FiFolder,
      label: 'Contratti',
    },
  ];

  return (
    <nav className="xl:hidden fixed bottom-0 left-0 right-0 bg-bg-card border-t border-border z-50 shadow-lg">
      <div className="flex justify-around items-center h-16 px-4">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${
                  isActive
                    ? 'text-primary'
                    : 'text-text-subtle hover:text-secondary'
                }`
              }
              aria-label={link.label}
            >
              {({ isActive }) => (
                <>
                  <Icon 
                    className={`w-6 h-6 transition-transform duration-300 ${
                      isActive ? 'scale-110' : 'scale-100'
                    }`} 
                  />
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
