import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

/**
 * Layout Component
 * 
 * Wrapper principale per le pagine protette che include:
 * - Header (sempre visibile)
 * - Sidebar (solo desktop)
 * - MobileNav (solo mobile/tablet, sticky bottom)
 * - Outlet per il contenuto delle pagine
 * 
 * Gestisce il padding bottom su mobile per evitare sovrapposizione con bottom nav
 */
const Layout = () => {
  return (
    <div className="min-h-screen bg-bg-main">
      {/* Header */}
      <Header />

      {/* Main Container */}
      <div className="flex">
        {/* Sidebar - Desktop Only (Fixed) */}
        <Sidebar />

        {/* Main Content Area - Con padding left su desktop per sidebar fissa */}
        <main className="flex-1 w-full xl:pl-64">
          {/* Content wrapper con padding per mobile nav */}
          <div className="pb-20 xl:pb-0">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
};

export default Layout;
