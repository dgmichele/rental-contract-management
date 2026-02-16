import { Fragment } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { FiHome, FiUsers, FiFolder, FiSettings, FiUser, FiMail } from 'react-icons/fi';

/**
 * Sidebar Component (Desktop Only)
 * 
 * Sidebar laterale sinistra visibile solo su desktop con:
 * - Link principali di navigazione (Dashboard, Proprietari, Contratti)
 * - Menu impostazioni in fondo con dropdown
 */
const Sidebar = () => {
  // Link di navigazione principali
  const navLinks = [
    {
      to: '/dashboard',
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

  // Redirect a Resend per check email
  const handleResendRedirect = () => {
    window.open('https://resend.com/emails', '_blank');
  };

  return (
    <aside className="hidden xl:flex xl:flex-col xl:w-64 bg-bg-card border-r border-border fixed left-0 top-16 bottom-0 overflow-y-auto">
      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg font-body text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-bg-main'
                    : 'text-text-body hover:bg-bg-main hover:text-primary'
                }`
              }
            >
                <>
                  <Icon className={"w-5 h-5 mr-3 hover:text-primary"} />
                  {link.label}
                </>
            </NavLink>
          );
        })}
      </nav>

      {/* Settings Dropdown - Bottom */}
      <div className="px-4 py-6 border-t border-border">
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center w-full px-4 py-3 rounded-lg font-body text-sm font-semibold text-text-body hover:bg-bg-main hover:text-primary transition-all duration-300 cursor-pointer">
            <FiSettings className="w-5 h-5 mr-3" />
            Impostazioni
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-150"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute bottom-full left-0 mb-2 w-full origin-bottom rounded-lg bg-bg-card border border-border shadow-lg focus:outline-none overflow-hidden ">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <NavLink
                      to="/settings"
                      className={`${
                        active ? 'bg-bg-main' : ''
                      } group flex w-full items-center px-4 py-2 text-sm text-text-body font-body transition-colors duration-200 font-normal`}
                    >
                      <FiUser className="mr-3 h-4 w-4 text-secondary" />
                      Il mio profilo
                    </NavLink>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleResendRedirect}
                      className={`${
                        active ? 'bg-bg-main' : ''
                      } group flex w-full items-center px-4 py-2 text-sm text-text-body font-body transition-colors duration-200 cursor-pointer`}
                    >
                      <FiMail className="mr-3 h-4 w-4 text-secondary" />
                      Email scadenze
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </aside>
  );
};

export default Sidebar;
