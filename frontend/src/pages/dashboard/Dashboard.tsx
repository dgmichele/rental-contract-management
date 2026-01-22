import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import { FiLogOut } from 'react-icons/fi';

/**
 * PAGE - DASHBOARD (Placeholder)
 * Pagina temporanea per testare il routing protetto.
 * Verrà sostituita con la dashboard completa nella Fase 3.
 */
export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const { logout, isLoggingOut } = useAuth();

  return (
    <div className="min-h-screen bg-bg-main">
      {/* Header Temporaneo */}
      <header className="bg-bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-heading font-bold text-text-title">
                Dashboard
              </h1>
              <p className="text-sm text-text-body mt-1">
                Gestionale Contratti - Bich Immobiliare
              </p>
            </div>
            <button
              onClick={() => logout()}
              disabled={isLoggingOut}
              className="
                flex items-center gap-2 px-4 py-2
                bg-primary hover:bg-primary-hover
                text-white font-semibold rounded-lg
                transition-smooth
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <FiLogOut size={18} />
              {isLoggingOut ? 'Logout...' : 'Logout'}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-bg-card border border-border rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-text-title mb-4">
            Benvenuto, {user?.name}! 👋
          </h2>
          <p className="text-text-body mb-6">
            Hai effettuato l'accesso con successo. Questa è una pagina protetta.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-semibold mb-2">
              📋 Informazioni Account:
            </p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li><strong>Nome:</strong> {user?.name}</li>
              <li><strong>Email:</strong> {user?.email}</li>
              <li><strong>ID:</strong> {user?.id}</li>
              <li><strong>Registrato il:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('it-IT') : 'N/A'}</li>
            </ul>
          </div>

          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-900">
              ✅ <strong>Routing protetto funzionante!</strong> Se provi ad accedere a questa pagina senza essere autenticato, verrai reindirizzato automaticamente al login.
            </p>
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-900">
              🚧 <strong>Work in Progress:</strong> Questa è una pagina placeholder. La dashboard completa con statistiche, contratti in scadenza e grafici verrà implementata nella Fase 3 dell'ordine di sviluppo.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
