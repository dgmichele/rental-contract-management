import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { FiLogOut, FiMail, FiSettings } from 'react-icons/fi';
import { FaUserTie } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import logoDesktop from '../../assets/images/logo-desktop.png';
import logoMobileTablet from '../../assets/images/logo-mobile-tablet.png';

/**
 * Header Component
 * 
 * Layout header con:
 * - Logo responsive (desktop/mobile-tablet)
 * - User dropdown menu con nome, email e azioni
 * - Differenziazione desktop/mobile per le voci del menu
 */
const Header = () => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Gestione logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      clearAuth();
      navigate('/login');
    } catch (error) {
      console.error('Errore durante il logout:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Redirect a Resend per check email
  const handleResendRedirect = () => {
    window.open('https://resend.com/emails', '_blank');
  };

  // Redirect a impostazioni account
  const handleSettingsRedirect = () => {
    navigate('/settings');
  };

  return (
    <header className="bg-bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Responsive */}
          <div className="shrink-0 cursor-pointer" onClick={() => navigate('/')}>
            {/* Desktop logo */}
            <img
              src={logoDesktop}
              alt="Bich Immobiliare"
              className="hidden md:block h-10 w-auto"
            />
            {/* Mobile/Tablet logo */}
            <img
              src={logoMobileTablet}
              alt="Bich Immobiliare"
              className="block md:hidden h-10 w-auto"
            />
          </div>

          {/* User Dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center justify-center w-10 h-10 rounded-full focus:outline-none cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 transition-all duration-300">
              {user?.name && user?.surname ? (
                <div className="w-full h-full rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {user.name.charAt(0).toUpperCase()}
                  {user.surname.charAt(0).toUpperCase()}
                </div>
              ) : (
                <FaUserTie className="w-7 h-7 text-secondary hover:text-primary-hover transition-colors duration-300" />
              )}
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
              <Menu.Items className="absolute right-0 mt-2 w-64 origin-top-right rounded-lg bg-bg-card border border-border shadow-lg focus:outline-none overflow-hidden">
                {/* User Info Section */}
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-text-title font-body">
                    {user?.name} {user?.surname}
                  </p>
                  <p className="text-xs text-text-subtle font-body mt-1">
                    {user?.email}
                  </p>
                </div>

                {/* Menu Items - Desktop (solo logout) */}
                <div className="py-1 hidden xl:block">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className={`${
                          active ? 'bg-bg-main' : ''
                        } group flex w-full items-center px-4 py-2 text-sm text-text-body font-body transition-colors duration-200 cursor-pointer`}
                      >
                        <FiLogOut className="mr-3 h-4 w-4 text-secondary" />
                        {isLoggingOut ? 'Disconnessione...' : 'Logout'}
                      </button>
                    )}
                  </Menu.Item>
                </div>

                {/* Menu Items - Mobile/Tablet (tutte le opzioni) */}
                <div className="py-1 xl:hidden">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleResendRedirect}
                        className={`${
                          active ? 'bg-bg-main' : ''
                        } group flex w-full items-center px-4 py-2 text-sm text-text-body font-body transition-colors duration-200`}
                      >
                        <FiMail className="mr-3 h-4 w-4 text-secondary" />
                        Email scadenze
                      </button>
                    )}
                  </Menu.Item>

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleSettingsRedirect}
                        className={`${
                          active ? 'bg-bg-main' : ''
                        } group flex w-full items-center px-4 py-2 text-sm text-text-body font-body transition-colors duration-200`}
                      >
                        <FiSettings className="mr-3 h-4 w-4 text-secondary" />
                        Impostazioni account
                      </button>
                    )}
                  </Menu.Item>

                  <div className="border-t border-border">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          className={`${
                            active ? 'bg-bg-main' : ''
                          } group flex w-full items-center px-4 py-2 text-sm text-text-body font-body transition-colors duration-200`}
                        >
                          <FiLogOut className="mr-3 h-4 w-4 text-secondary" />
                          {isLoggingOut ? 'Disconnessione...' : 'Logout'}
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
};

export default Header;
