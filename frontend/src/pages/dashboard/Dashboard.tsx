import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';

/**
 * PAGE - DASHBOARD (Placeholder)
 * Pagina temporanea per testare il routing protetto e il nuovo layout.
 * Verrà sostituita con la dashboard completa nella Fase 3.
 */
export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen">
      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-text-title">
            Ciao {user?.name}! 😊
          </h1>
          <p className="text-text-body mt-2">
            Gestionale Contratti - Bich Immobiliare
          </p>
        </div>

        <div className="grid gap-6">
          <Card className="p-8">
            <h2 className="text-xl font-semibold text-text-title mb-4">
              Dashboard Placeholder
            </h2>
            <p className="text-text-body mb-6">
              Hai effettuato l'accesso con successo. Questa è una pagina protetta con il nuovo layout.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-semibold mb-2">
                📋 Informazioni Account:
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li><strong>Nome:</strong> {user?.name}</li>
                <li><strong>Cognome:</strong> {user?.surname}</li>
                <li><strong>Email:</strong> {user?.email}</li>
                <li><strong>ID:</strong> {user?.id}</li>
                <li><strong>Registrato il:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('it-IT') : 'N/A'}</li>
              </ul>
            </div>

            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-900">
                ✅ <strong>Layout Component Attivo!</strong> Header, Sidebar (desktop) e Bottom Nav (mobile) sono ora visibili e funzionanti.
              </p>
            </div>

            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-900">
                🚧 <strong>Work in Progress:</strong> Questa è una pagina placeholder. La dashboard completa con statistiche, contratti in scadenza e grafici verrà implementata nella Fase 3 dell'ordine di sviluppo.
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
