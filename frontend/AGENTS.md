# AGENTS.md - Frontend Instructions (Complete & Updated)

## 1. Panoramica del Progetto

Applicazione web React per gestione contratti di affitto con autenticazione JWT, dashboard statistiche, CRUD completo per proprietari e contratti, gestione rinnovi e annualità, sistema notifiche.

**Obiettivo:** Interfaccia moderna, responsive (mobile-first), performante che comunica con backend API RESTful.

---

## 2. Principi Guida

- **Linguaggio:** TypeScript, JavaScript ES6+, sempre `async/await`
- **Naming:** Inglese (eccetto `cedolare_secca`, `canone_concordato`)
- **Struttura:** Componenti piccoli e riutilizzabili, separazione UI/business logic
- **Separazione:** Pages → Components → Hooks → Services → API
- **Validazione:** Client-side con Zod + react-hook-form
- **State Management:** Zustand solo per auth, React Query per server state
- **Logging:** `console.log()` nei punti critici per debug
- **Environment:** `.env.dev` (localhost) e `.env.production` (Netsons)
- **Commenti:** Commentare sempre il codice in italiano, dettagliati ma compatti

---

## 3. Stack Tecnologico

**Core:**

- React 18, TypeScript, Vite, React Router v6

**UI & Styling:**

- Tailwind CSS, Headless UI, React Icons
- Google Fonts (Merriweather 900, Inter 400/700)
- ReactBits Iridescence background

**State & Data:**

- React Query (TanStack Query), Zustand (auth only), Axios

**Forms & Validation:**

- react-hook-form, Zod

**Utilities:**

- Day.js (date formatting), clsx (conditional classes)

**Notifications:**

- react-hot-toast

---

## 4. Struttura Progetto

```
frontend/
├── public/
│   └── logo.svg
├── src/
│   ├── assets/
│   │   └── images/
│   ├── components/
│   │   ├── ui/              # Button, Card, Input, Spinner, Toast, Skeleton
│   │   ├── layout/          # Header, Sidebar, MobileNav, Layout
│   │   ├── forms/           # ContractForm, OwnerForm, TenantForm
│   │   ├── modals/          # AddOwnerModal, DeleteModal, ViewOwnerModal
│   │   ├── cards/           # ContractCard, OwnerCard, StatsCard
│   │   └── timeline/        # AnnuityTimeline
│   ├── pages/
│   │   ├── auth/            # Login, Register, ForgotPassword, ResetPassword
│   │   ├── dashboard/       # Dashboard (homepage)
│   │   ├── owners/          # OwnersListPage, OwnerDetailPage
│   │   ├── contracts/       # ContractsListPage, ContractDetailPage
│   │   └── settings/        # AccountSettingsPage
│   ├── hooks/
│   │   ├── useAuth.ts       # Auth logic
│   │   ├── useContracts.ts  # Contracts CRUD
│   │   ├── useOwners.ts     # Owners CRUD
│   │   ├── useDashboard.ts  # Dashboard stats
│   │   ├── useToast.ts      # Toast notifications
│   │   └── useModal.ts      # Modal state management
│   ├── services/
│   │   └── api/
│   │       ├── axios.config.ts
│   │       ├── auth.service.ts
│   │       ├── contracts.service.ts
│   │       ├── owners.service.ts
│   │       └── dashboard.service.ts
│   ├── store/
│   │   └── authStore.ts     # Zustand (solo auth)
│   ├── types/
│   │   ├── api.ts           # API responses, PaginatedResponse
│   │   ├── auth.ts          # Auth types
│   │   ├── contract.ts      # Contract, Annuity
│   │   ├── owner.ts         # Owner, Tenant
│   │   └── shared.ts        # Shared types dal backend
│   ├── utils/
│   │   ├── date.utils.ts    # Day.js helpers
│   │   ├── format.utils.ts  # Currency, text formatting
│   │   ├── errorHandler.ts  # HTTP error mapping
│   │   └── validation.ts    # Zod schemas
│   ├── constants/
│   │   ├── api.ts           # API_URL, endpoints
│   │   ├── colors.ts        # Brand colors
│   │   └── messages.ts      # Toast messages standard
│   ├── config/
│   │   └── react-query.ts   # Query client config
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html               # Entry point HTML (generato da Vite)
├── .htaccess                # Rewrite rules per SPA routing su cPanel
├── .env.dev
├── .env.production
├── .gitignore
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 5. Design System & Branding

### 5.1. Palette Colori (Tailwind Config)

```javascript
// tailwind.config.js
colors: {
  'primary': '#b41c3c',
  'primary-hover': '#1e1e1e',
  'secondary': '#d2778a',
  'bg-main': '#fdf5f7',
  'bg-card': '#fffbfc',
  'border': '#f0d6da',
  'text-title': '#1e1e1e',
  'text-body': '#5f5f5f',
  'text-subtle': '#9c9c9c',
  'link': '#b41c3c',
}
```

### 5.2. Tipografia

```javascript
fontFamily: {
  'heading': ['Merriweather', 'serif'],  // h1, h2
  'body': ['Inter', 'sans-serif'],       // h3+, p, general
}
```

### 5.3. Componenti UI Standard

**Button:**

- Primario: `bg-primary hover:bg-primary-hover text-bg-card`
- Secondario: `bg-transparent text-primary hover:text-primary-hover border-0`

**Card:**

- `bg-bg-card border border-border rounded-lg`

**Input/Select:**

- `bg-bg-card border border-border rounded focus:border-secondary placeholder:text-text-subtle`

**Banner (cedolare secca):**

- `bg-secondary text-bg-card`

**Icons (card actions):**

- `text-secondary hover:text-primary-hover transition-colors duration-300`

**Popup:**

- Background: `bg-bg-main`
- Overlay: `bg-black/80 backdrop-blur-sm`
- Sticky header: `bg-bg-main shadow-md`

### 5.4. Background Applicazione

Iridescence (ReactBits) con colori: `#d2778a`, `#f0d6da`, `#fffbfc`, `#fdf5f7`

---

## 6. Routing & Navigazione

### 6.1. Route Structure (React Router v6)

```typescript
// App.tsx routes
<Routes>
  {/* Public routes */}
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
  <Route path="/reset-password/:token" element={<ResetPassword />} />

  {/* Protected routes */}
  <Route element={<ProtectedRoute />}>
    <Route element={<Layout />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/owners" element={<OwnersListPage />} />
      <Route path="/owners/:id" element={<OwnerDetailPage />} />
      <Route path="/contracts" element={<ContractsListPage />} />
      <Route path="/contracts/:id" element={<ContractDetailPage />} />
      <Route
        path="/contracts/new"
        element={<ContractDetailPage mode="add" />}
      />
      <Route path="/settings" element={<AccountSettingsPage />} />
    </Route>
  </Route>

  <Route path="*" element={<NotFound />} />
</Routes>
```

### 6.2. Layout Responsivo

**Desktop:**

- Header: Logo sx, icona utente dx (dropdown: nome, email, logout)
- Sidebar sx: 🏠 Dashboard, 👤 Proprietari, 📁 Contratti
- Footer sidebar: ⚙️ Impostazioni (dropdown: profilo, email Resend)

**Tablet/Mobile:**

- Header: Logo sx, icona utente dx (dropdown: nome, email, impostazioni, Resend, logout)
- Bottom nav sticky: 🏠 Dashboard, 👤 Proprietari, 📁 Contratti (solo icone)

---

## 7. Pagine Principali

### 7.1. Dashboard (Homepage)

**Componenti:**

1. **Header:** `Benvenuto ${user.name}`
2. **StatsCards (5 card scrollabili orizzontalmente):**
   - Numero contratti totali
   - Numero proprietari totali
   - Scadenze mese corrente
   - Scadenze mese successivo
   - Totale canoni mensili (€)
3. **ExpiringContractsSection (mese corrente):**
   - Titolo: "Scadenze mese corrente"
   - Grid 12 card (4 col desktop, 3 col tablet, 1 col mobile)
   - Paginazione classica con numeri
4. **ExpiringContractsSection (mese successivo):**
   - Titolo: "Scadenze mese successivo"
   - Grid 12 card (stessa struttura)
   - Paginazione classica con numeri

**ContractCard (scadenze):**

- Banner cedolare secca (se applicabile)
- Nome proprietario (h3)
- Nome inquilino (testo normale)
- Indirizzo immobile
- Data scadenza
- Canone mensile
- Ultima annualità pagata (solo se NON cedolare secca)
- Icona occhio (visualizza)
- Pulsante "Gestisci rinnovo" o "Gestisci annualità"

**API Calls:**

- `GET /api/dashboard/stats`
- `GET /api/dashboard/expiring-contracts?period=current&page=1&limit=12`
- `GET /api/dashboard/expiring-contracts?period=next&page=1&limit=12`

### 7.2. Tutti i Proprietari

**Componenti:**

1. **Header:** Titolo "Tutti i proprietari" + Button "Aggiungi proprietario" (dx)
2. **SearchBar:** Placeholder "Cerca proprietario..." (sotto titolo)
3. **OwnerCard Grid:** 12 card (4 col desktop, 3 col tablet, 1 col mobile)
4. **Pagination:** Classica con numeri

**OwnerCard:**

- Nome e cognome (h3)
- Telefono
- Email
- Icone (alto dx):
  - Occhio → ViewOwnerModal (popup visualizzazione)
  - Matita → EditOwnerModal (popup modifica)
  - Cestino → DeleteOwnerModal (popup conferma)
- Button "Visualizza contratti" → redirect `/owners/:id`

**Modals:**

- **AddOwnerModal:** Form (nome, cognome, telefono, email) + "Aggiungi"
- **EditOwnerModal:** Form precompilato + "Conferma modifiche"
- **ViewOwnerModal:** Dati read-only
- **DeleteOwnerModal:** Conferma eliminazione

**API Calls:**

- `GET /api/owners?search=...&page=1&limit=12`
- `POST /api/owners`
- `PUT /api/owners/:id`
- `DELETE /api/owners/:id`

### 7.3. Proprietario Singolo

**Componenti:**

1. **Header:** Nome proprietario (h1) + icona matita (EditOwnerModal con opzione elimina)
2. **StatsCards (2 card):**
   - Numero contratti
   - Somma canoni mensili (€)
3. **ContractCard Grid:** 12 card (stessa struttura dashboard)
4. **Pagination:** Classica con numeri

**ContractCard (proprietario singolo):**

- Banner cedolare secca
- Nome inquilino (h3) - più importante qui
- Indirizzo immobile
- Data scadenza
- Canone mensile
- Ultima annualità pagata (se NON cedolare secca)
- Icone (alto dx):
  - Matita → redirect `/contracts/:id?mode=edit`
  - Cestino → DeleteContractModal
- Button "Visualizza contratto" → redirect `/contracts/:id`

**API Calls:**

- `GET /api/owners/:id`
- `GET /api/owners/:id/contracts?page=1&limit=12`

### 7.4. Tutti i Contratti

**Componenti:**

1. **Header:** Titolo "Tutti i contratti" + Button "Aggiungi contratto" (dx)
2. **SearchBar + FilterButton:** Cerca per proprietario/inquilino + filtri scadenza mese
3. **ContractCard Grid:** 12 card (4 col desktop, 3 col tablet, 1 col mobile)
4. **Pagination:** Classica con numeri

**FilterButton (mobile):**

- Sticky top quando scroll giù (solo mobile)

**Filtri Modal:**

- Select mese scadenza (1-12)
- Select anno scadenza
- Button "Applica filtri"

**ContractCard:**

- Banner cedolare secca
- Nome proprietario (h3)
- Nome inquilino
- Indirizzo immobile
- Data scadenza
- Canone mensile
- Ultima annualità pagata (se NON cedolare secca)
- Icone (alto dx):
  - Occhio → redirect `/contracts/:id`
  - Matita → redirect `/contracts/:id?mode=edit`
  - Cestino → DeleteContractModal

**API Calls:**

- `GET /api/contracts?search=...&expiryMonth=10&expiryYear=2025&page=1&limit=12`
- `DELETE /api/contracts/:id`

### 7.5. Contratto Singolo (Pagina Complessa)

**5 Modalità Condizionali:**

**Determinazione Modalità (Query Params):**

```typescript
// Pattern routing in ContractDetailPage.tsx
const { id } = useParams();
const [searchParams] = useSearchParams();
const mode = searchParams.get("mode") || "view"; // 'view' | 'edit' | 'add' | 'renew' | 'annuity'

// Navigazione da altre pagine:
// Dashboard → navigate(`/contracts/${id}?mode=renew`)
// ContractCard → navigate(`/contracts/${id}?mode=edit`)
// OwnerDetail → navigate(`/contracts/new?ownerId=${ownerId}`)
```

#### 7.5.1. Modalità Visualizzazione (`mode=view` o default)

**Layout:**

- Titolo: `Contratto tra ${owner.name} ${owner.surname} e ${tenant.name} ${tenant.surname}`
- **Sezione Dati Proprietario:** Nome, Cognome, Telefono, Email (read-only)
- **Sezione Dati Inquilino:** Nome, Cognome, Telefono, Email (read-only)
- **Sezione Dati Contratto:** Indirizzo, Durata (da - a), Cedolare secca, Tipologia, Canone concordato, Canone mensile, Ultima annualità pagata (read-only)
- **Timeline Annualità:** Visibile SOLO se `cedolare_secca: false`
- **Buttons (fondo):** "Modifica" + "Elimina"

**API Call:** `GET /api/contracts/:id`

#### 7.5.2. Modalità Aggiungi (`mode=add` o `/contracts/new`)

**Layout:**

- Titolo: "Nuovo contratto"
- **Sezione Proprietario:**
  - Select proprietario (dropdown con lista) + opzione "Crea nuovo proprietario"
  - Se da `/owners/:id` → proprietario pre-selezionato, NO opzione crea nuovo
- **Sezione Inquilino:** Form vuoto (nome, cognome, telefono, email)
- **Sezione Contratto:** Form vuoto (tutti campi)
- **Timeline:** NON visibile
- **Button (fondo):** "Aggiungi contratto"

**Logica:**

- Se click "Crea nuovo proprietario" → AddOwnerModal → aggiungi a select
- Validazione client-side (Zod)

**Pattern Proprietario Pre-selezionato:**

```typescript
// In ContractDetailPage.tsx - Mode 'add'
const [searchParams] = useSearchParams();
const preselectedOwnerId = searchParams.get("ownerId");

// Inizializza form con owner pre-selezionato
useEffect(() => {
  if (preselectedOwnerId && mode === "add") {
    setValue("owner_id", parseInt(preselectedOwnerId));
  }
}, [preselectedOwnerId, mode]);
```

**Pattern Modale "Crea Nuovo Proprietario":**

```typescript
// In ContractForm.tsx
const [showAddOwnerModal, setShowAddOwnerModal] = useState(false);
const [owners, setOwners] = useState<Owner[]>(initialOwners);

const createOwnerMutation = useCreateOwner({
  onSuccess: (newOwner) => {
    // Aggiungi il nuovo owner alla lista locale
    setOwners((prev) => [...prev, newOwner]);
    // Seleziona automaticamente il nuovo owner
    setValue("owner_id", newOwner.id);
    setShowAddOwnerModal(false);
  },
});
```

**API Call:** `POST /api/contracts`

#### 7.5.3. Modalità Modifica (`mode=edit` o `?mode=edit`)

**Layout:**

- Titolo: `Modifica contratto`
- **Tutte le sezioni:** Form precompilato (tutti campi modificabili)
- **Timeline:** NON visibile
- **Buttons (fondo):** "Conferma modifiche" + "Elimina"

**API Call:**

- `GET /api/contracts/:id` (load data)
- `PUT /api/contracts/:id` (save)

#### 7.5.4. Modalità Rinnovo (`mode=renew`)

**Layout:**

- Titolo: `Rinnova contratto`
- **Sezione Proprietario:** Read-only
- **Sezione Inquilino:** Read-only
- **Sezione Contratto:** SOLO campi modificabili: Indirizzo, Durata, Cedolare secca, Tipologia, Canone concordato, Canone mensile, Ultima annualità pagata
- **Timeline:** NON visibile
- **Button (fondo):** "Conferma rinnovo"

**Quando usare:**

- Contratti in cedolare secca
- Contratti NON cedolare secca quando annualità coincide con scadenza naturale

**API Call:** `PUT /api/contracts/:id/renew`

#### 7.5.5. Modalità Rinnovo Annualità (`mode=annuity`)

**Layout:**

- Titolo: `Rinnova annualità`
- **Sezione Proprietario:** Read-only
- **Sezione Inquilino:** Read-only
- **Sezione Contratto:** SOLO campo "Ultima annualità pagata" modificabile (required)
- **Timeline:** NON visibile
- **Button (fondo):** "Conferma rinnovo annualità"

**Quando usare:**

- Solo contratti NON cedolare secca
- Quando annualità NON coincide con scadenza naturale

**API Call:** `PUT /api/contracts/:id/annuity`

### 7.6. Impostazioni Account

**Componenti:**

1. **Sezione "Aggiorna dati":**

   - Form: Nome, Cognome, Email
   - Button "Salva" (disabilitato di default, attivo se modifica rilevata)

2. **Sezione "Aggiorna password":**
   - Form: Password attuale, Nuova password, Ripeti nuova password
   - Button "Salva" (disabilitato di default, attivo quando "ripeti password" ha almeno 1 carattere)

**Pattern Button "Salva" Dinamico:**

```typescript
// Sezione "Aggiorna dati" - Usa isDirty di react-hook-form
const {
  formState: { isDirty },
} = useForm();
<Button disabled={!isDirty}>Salva</Button>;

// Sezione "Aggiorna password" - Controlla campo ripeti password
const repeatPassword = watch("repeatPassword");
<Button disabled={!repeatPassword || repeatPassword.length === 0}>
  Salva
</Button>;
```

**Validazione:**

- Password attuale errata → toast error
- Nuova password debole → toast error
- Password non coincidono → toast error

**API Calls:**

- `PUT /api/users/me/details`
- `PUT /api/users/me/password`

---

## 8. Componenti Riutilizzabili

### 8.1. UI Components

**Button.tsx:**

```typescript
interface ButtonProps {
  variant: "primary" | "secondary";
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}
```

**Card.tsx:**

```typescript
interface CardProps {
  children: React.ReactNode;
  className?: string;
}
```

**Input.tsx:**

```typescript
interface InputProps {
  label: string;
  type: string;
  placeholder?: string;
  error?: string;
  register: UseFormRegister;
  name: string;
}
```

**Spinner.tsx:** Loading spinner globale

**Skeleton.tsx:** Base skeleton component

### 8.2. Cards

**ContractCard.tsx:**

```typescript
interface ContractCardProps {
  contract: Contract;
  showOwnerName?: boolean; // true per dashboard/lista, false per owner detail
  showTenantName?: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onManageRenewal?: () => void;
  onManageAnnuity?: () => void;
}
```

**OwnerCard.tsx:**

```typescript
interface OwnerCardProps {
  owner: Owner;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewContracts: () => void;
}
```

**StatsCard.tsx:**

```typescript
interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}
```

### 8.3. Timeline

**AnnuityTimeline.tsx:**

```typescript
interface AnnuityTimelineProps {
  annuities: Annuity[];
  contractStartYear: number;
  contractEndYear: number;
}
```

**UI:**

- Linea verticale
- Pallini per ogni anno (start, annuities, end)
- Pallino pieno con ✓ se pagato
- Pallino vuoto se non pagato
- Anno di fianco (colore titolo se pagato, colore paragrafo se no)
- Data scadenza sotto anno

### 8.4. Modals

**BaseModal.tsx:**

```typescript
interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}
```

**DeleteModal.tsx:**

```typescript
interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}
```

**Transizioni:** Fade in/out smooth (Headless UI Transition)

---

## 9. State Management

### 9.1. Zustand (Solo Auth)

```typescript
// store/authStore.ts
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (tokens: Tokens, user: User) => void;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
}
```

**Persist:** localStorage per tokens

### 9.2. React Query (Server State)

**Query Keys:**

```typescript
// config/react-query.ts
export const QUERY_KEYS = {
  contracts: {
    all: ["contracts"] as const,
    lists: () => [...QUERY_KEYS.contracts.all, "list"] as const,
    list: (filters: string) =>
      [...QUERY_KEYS.contracts.lists(), filters] as const,
    details: () => [...QUERY_KEYS.contracts.all, "detail"] as const,
    detail: (id: number) => [...QUERY_KEYS.contracts.details(), id] as const,
    annuities: (id: number) =>
      [...QUERY_KEYS.contracts.detail(id), "annuities"] as const,
  },
  owners: {
    all: ["owners"] as const,
    lists: () => [...QUERY_KEYS.owners.all, "list"] as const,
    list: (filters: string) => [...QUERY_KEYS.owners.lists(), filters] as const,
    details: () => [...QUERY_KEYS.owners.all, "detail"] as const,
    detail: (id: number) => [...QUERY_KEYS.owners.details(), id] as const,
    contracts: (id: number) =>
      [...QUERY_KEYS.owners.detail(id), "contracts"] as const,
  },
  dashboard: {
    stats: ["dashboard", "stats"] as const,
    expiring: (period: string, page: number) =>
      ["dashboard", "expiring", period, page] as const,
  },
  user: {
    me: ["user", "me"] as const,
  },
} as const;
```

**Config:**

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      cacheTime: 1000 * 60 * 10, // 10 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## 10. API Integration

### 10.1. Axios Config

```typescript
// services/api/axios.config.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor: aggiungi JWT
api.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: gestisci 401 e refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = authStore.getState().refreshToken;
        const { data } = await axios.post("/api/auth/refresh", {
          refreshToken,
        });

        authStore.getState().setTokens(data.data.accessToken, refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        authStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### 10.2. Service Layer

**auth.service.ts:**

```typescript
export const authService = {
  register: (data: RegisterRequest) => api.post("/api/auth/register", data),
  login: (data: LoginRequest) => api.post("/api/auth/login", data),
  logout: (refreshToken: string) =>
    api.post("/api/auth/logout", { refreshToken }),
  forgotPassword: (email: string) =>
    api.post("/api/auth/forgot-password", { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post("/api/auth/reset-password", { token, newPassword }),
};
```

**contracts.service.ts:**

```typescript
export const contractsService = {
  getAll: (params: ContractFilters) => api.get("/api/contracts", { params }),
  getById: (id: number) => api.get(`/api/contracts/${id}`),
  getAnnuities: (id: number) => api.get(`/api/contracts/${id}/annuities`),
  create: (data: CreateContractRequest) => api.post("/api/contracts", data),
  update: (id: number, data: UpdateContractRequest) =>
    api.put(`/api/contracts/${id}`, data),
  renew: (id: number, data: RenewContractRequest) =>
    api.put(`/api/contracts/${id}/renew`, data),
  updateAnnuity: (id: number, year: number) =>
    api.put(`/api/contracts/${id}/annuity`, { last_annuity_paid: year }),
  delete: (id: number) => api.delete(`/api/contracts/${id}`),
};
```

### 10.3. Custom Hooks

**useContracts.ts:**

```typescript
export const useContracts = (filters?: ContractFilters) => {
  return useQuery({
    queryKey: QUERY_KEYS.contracts.list(JSON.stringify(filters)),
    queryFn: () => contractsService.getAll(filters),
  });
};

export const useContract = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.contracts.detail(id),
    queryFn: () => contractsService.getById(id),
    enabled: !!id,
  });
};

export const useCreateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contractsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contracts.all });
      toast.success("Contratto creato con successo");
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(
        error.response?.data?.message || "Errore nella creazione del contratto"
      );
    },
  });
};
```

**Pattern Reset Paginazione su Cambio Filtri:**

```typescript
// In ContractsListPage.tsx / OwnersListPage.tsx
const [page, setPage] = useState(1);
const [filters, setFilters] = useState({});
const [search, setSearch] = useState("");

// Reset a pagina 1 quando cambiano filtri o ricerca
useEffect(() => {
  setPage(1);
}, [filters, search]);
```

---

## 11. Types & API Responses

### 11.1. API Response Types

**Definizione tipi standard per response API:**

```typescript
// types/api.ts
export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface PaginatedApiResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// Esempio uso con Axios
const { data } = await api.get<PaginatedApiResponse<Contract>>(
  "/api/contracts"
);
// data.data → Contract[]
// data.pagination → { page, limit, total, totalPages }
```

---

## 12. Validazione Client-Side

### 12.1. Zod Schemas

**Contract Schema:**

```typescript
// utils/validation.ts
export const contractSchema = z
  .object({
    owner_id: z.number().positive("Seleziona un proprietario"),
    tenant_data: z
      .object({
        name: z.string().min(1, "Nome richiesto"),
        surname: z.string().min(1, "Cognome richiesto"),
        phone: z.string().min(1, "Telefono richiesto"),
        email: z.string().email("Email non valida"),
      })
      .optional(),
    tenant_id: z.number().positive().optional(),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido"),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido"),
    cedolare_secca: z.boolean(),
    typology: z.enum(["residenziale", "commerciale"]),
    canone_concordato: z.boolean(),
    monthly_rent: z.number().positive("Canone deve essere maggiore di 0"),
    last_annuity_paid: z.number().int().nullable(),
    address: z.string().min(1, "Indirizzo richiesto"),
  })
  .refine((data) => new Date(data.end_date) > new Date(data.start_date), {
    message: "La data di fine deve essere successiva alla data di inizio",
    path: ["end_date"],
  });
```

**Pattern Campo "Ultima Annualità Pagata" Condizionale:**

```typescript
// In ContractForm.tsx - Mostra campo solo se NON cedolare secca
const watchCedolareSecca = watch("cedolare_secca");

{
  !watchCedolareSecca && (
    <Input
      label="Ultima annualità pagata"
      type="number"
      {...register("last_annuity_paid")}
    />
  );
}
```

**Owner Schema:**

```typescript
export const ownerSchema = z.object({
  name: z.string().min(1, "Nome richiesto"),
  surname: z.string().min(1, "Cognome richiesto"),
  phone: z.string().min(1, "Telefono richiesto"),
  email: z.string().email("Email non valida"),
});
```

### 12.2. React Hook Form Integration

```typescript
// components/forms/ContractForm.tsx
const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<ContractFormData>({
  resolver: zodResolver(contractSchema),
  defaultValues: initialData,
});

const onSubmit = async (data: ContractFormData) => {
  try {
    await createContract.mutateAsync(data);
    navigate("/contracts");
  } catch (error) {
    // Error handled by mutation
  }
};
```

---

## 14. Gestione Date (Day.js)

### 14.1. Utility Functions

```typescript
// utils/date.utils.ts
import dayjs from "dayjs";
import "dayjs/locale/it";

dayjs.locale("it");

export const formatDateItalian = (date: string | Date): string => {
  return dayjs(date).format("D MMMM YYYY"); // "15 gennaio 2028"
};

export const formatDateInput = (date: string | Date): string => {
  return dayjs(date).format("YYYY-MM-DD"); // Per input HTML
};

export const isDateInMonth = (
  date: string,
  month: number,
  year: number
): boolean => {
  const d = dayjs(date);
  return d.month() === month - 1 && d.year() === year;
};

export const getCurrentMonth = (): number => dayjs().month() + 1;
export const getCurrentYear = (): number => dayjs().year();
export const getNextMonth = (): { month: number; year: number } => {
  const next = dayjs().add(1, "month");
  return { month: next.month() + 1, year: next.year() };
};
```

---

## 13. Error Handling

### 13.1. HTTP Error Mapping

**Utility per mappare errori HTTP a messaggi user-friendly:**

```typescript
// utils/errorHandler.ts
import { AxiosError } from "axios";
import { ApiError } from "../types/api";

export const getErrorMessage = (error: AxiosError<ApiError>): string => {
  const status = error.response?.status;
  const message = error.response?.data?.message;

  switch (status) {
    case 400:
      return message || "Dati non validi";
    case 401:
      return "Sessione scaduta, effettua nuovamente il login";
    case 403:
      return "Non hai i permessi per questa operazione";
    case 404:
      return message || "Risorsa non trovata";
    case 409:
      return message || "Risorsa già esistente";
    case 500:
      return "Errore del server, riprova più tardi";
    default:
      return message || "Errore di connessione";
  }
};

// Uso nei mutation hooks
onError: (error: AxiosError<ApiError>) => {
  toast.error(getErrorMessage(error));
};
```

---

## 15. Toast Notifications

### 15.1. Setup (react-hot-toast)

```typescript
// constants/messages.ts
export const TOAST_MESSAGES = {
  // Success
  CONTRACT_CREATED: {
    type: "success",
    message: "Contratto creato con successo",
  },
  CONTRACT_UPDATED: {
    type: "success",
    message: "Contratto aggiornato con successo",
  },
  CONTRACT_DELETED: {
    type: "success",
    message: "Contratto eliminato con successo",
  },
  OWNER_CREATED: {
    type: "success",
    message: "Proprietario creato con successo",
  },

  // Errors
  GENERIC_ERROR: { type: "error", message: "Si è verificato un errore" },
  NETWORK_ERROR: { type: "error", message: "Errore di connessione" },
  UNAUTHORIZED: {
    type: "error",
    message: "Sessione scaduta, effettua nuovamente il login",
  },
} as const;
```

### 15.2. Custom Hook

```typescript
// hooks/useToast.ts
export const useToast = () => {
  const showSuccess = (message: string) =>
    toast.success(message, {
      duration: 3000,
      position: "top-right",
    });

  const showError = (message: string) =>
    toast.error(message, {
      duration: 4000,
      position: "top-right",
    });

  return { showSuccess, showError };
};
```

---

## 16. Loading States & Skeletons

### 16.1. Skeleton Components

**ContractCardSkeleton.tsx:**

```typescript
export const ContractCardSkeleton = () => (
  <div className="bg-bg-card rounded-lg border border-border p-4 animate-pulse">
    <div className="h-6 bg-border rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-border rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-border rounded w-2/3"></div>
  </div>
);
```

**Usage:**

```typescript
const { data, isLoading } = useContracts(filters);

if (isLoading) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <ContractCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

### 16.2. Global Spinner

```typescript
// components/ui/Spinner.tsx
export const Spinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div
      className={`${sizeClasses[size]} border-4 border-border border-t-secondary rounded-full animate-spin`}
    />
  );
};
```

---

## 17. Paginazione

### 15.1. Pagination Component

```typescript
// components/ui/Pagination.tsx
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex gap-2 justify-center mt-6">
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 rounded ${
            page === currentPage
              ? "bg-primary text-bg-card"
              : "bg-bg-card border border-border hover:bg-border"
          }`}
        >
          {page}
        </button>
      ))}
    </div>
  );
};
```

### 15.2. Usage

```typescript
const [page, setPage] = useState(1);
const { data } = useContracts({ page, limit: 12 });

<Pagination
  currentPage={page}
  totalPages={data?.pagination.totalPages || 1}
  onPageChange={setPage}
/>;
```

---

## 18. Variabili d'Ambiente

### 18.1. File di Configurazione

**`.env.dev` (sviluppo locale):**

```bash
VITE_API_URL=http://localhost:3000/
```

**`.env.production` (produzione):**

```bash
VITE_API_URL=https://api.bichimmobiliare.it/
```

### 18.2. Gestione con Git Version Control

**⚠️ IMPORTANTE:** Se usi Git Version Control per deployare su cPanel, segui questo workflow:

#### **Setup (una tantum):**

1. **In locale:** Aggiungi `.env.*` al `.gitignore`

   ```gitignore
   # .gitignore
   .env
   .env.dev
   .env.production
   .env.local
   ```

2. **Su cPanel:** Crea `.env.production` manualmente nel file manager

**Perché questo metodo:**

- ✅ `.env.production` rimane su cPanel (non viene sovrascritto da Git)
- ✅ Vite lo legge durante `npm run build` sul server
- ✅ Non è committato su Git (sicurezza)
- ✅ Valori vengono compilati nel bundle durante il build

#### **Come Funziona:**

```
Locale:
  .env.production (in .gitignore, NON committato)
       ↓
  git push (solo codice sorgente)
       ↓
cPanel:
  .env.production (creato manualmente, persiste)
       ↓
  npm run build (Vite legge .env.production)
       ↓
  dist/ (valori hardcoded nel bundle)
```

### 18.3. Sicurezza

**❌ NON mettere in `.env.production` frontend:**

- API keys segrete (es. Stripe secret key)
- Database credentials
- Tokens sensibili

**✅ OK mettere:**

- URL pubblici (es. `VITE_API_URL`)
- Chiavi pubbliche (es. Stripe publishable key)
- Feature flags

**Motivo:** Tutto finisce nel bundle JavaScript pubblico, visibile in DevTools.

---

## 19. Deploy & Configurazione Produzione

### 19.1. CORS (Cross-Origin Resource Sharing)

**Problema:** Frontend (`contratti.bichimmobiliare.it`) e backend (`api.bichimmobiliare.it`) sono su sottodomini diversi, quindi il browser li considera origini separate e blocca le richieste per sicurezza.

**Soluzione:** Il backend è già configurato correttamente con il middleware `cors`:

```typescript
// backend/server.ts (già implementato)
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // https://contratti.bichimmobiliare.it
    credentials: true,
  })
);
```

**Variabili d'ambiente backend (cPanel):**

Assicurati che su cPanel siano configurate:

- `FRONTEND_URL=https://contratti.bichimmobiliare.it`

**Verifica:** Dopo il deploy, testa una chiamata API dal frontend. Se ricevi errori CORS, controlla:

1. Che `FRONTEND_URL` sia corretto nel backend
2. Che non ci siano trailing slash (`/`) alla fine degli URL
3. Che `credentials: true` sia presente se usi cookie/auth

---

### 19.2. Routing SPA (.htaccess)

**Problema:** React gestisce il routing lato client. Se un utente ricarica la pagina su `contratti.bichimmobiliare.it/owners`, cPanel cerca una cartella fisica `/owners` e restituisce 404.

**Soluzione:** Creare un file `.htaccess` nella root del frontend (dopo il build) che reindirizzi tutte le richieste a `index.html`.

**File `.htaccess`:**

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Se il file o la directory esistono, servili direttamente
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d

  # Altrimenti, reindirizza tutto a index.html
  RewriteRule ^ index.html [L]
</IfModule>
```

**Dove posizionarlo:**

- Durante sviluppo: `frontend/.htaccess` (verrà copiato in `dist/` durante il build)
- Dopo build: `frontend/dist/.htaccess`

**Configurazione Vite per copiare .htaccess:**

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  publicDir: "public", // Vite copia automaticamente tutto da public/ a dist/
});
```

**Alternativa:** Copia manualmente `.htaccess` in `dist/` dopo ogni build:

```bash
npm run build
cp .htaccess dist/.htaccess
```

---

### 19.3. index.html

**File generato automaticamente da Vite** nella root del progetto frontend.

**Contenuto standard:**

```html
<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/logo.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gestionale Contratti - Bich Immobiliare</title>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Merriweather:wght@900&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Note:**

- Vite sostituisce automaticamente `/src/main.tsx` con il bundle JS durante il build
- Il file `index.html` è l'entry point dell'applicazione
- Deve trovarsi nella root del progetto frontend (non in `src/`)

---

### 19.4. Deploy con Git Version Control su cPanel

**⚠️ IMPORTANTE:** Questo metodo è consigliato se usi Git per deployare su cPanel. Il build avviene **sul server cPanel** dopo ogni push.

---

#### **Setup Iniziale (una tantum)**

**1. Crea `.env.production` manualmente nel file manager cPanel:**

- Accedi a **cPanel** → **File Manager**
- Naviga nella cartella `rental_contract_management/frontend`
- Crea file `.env.production`
- Contenuto: `VITE_API_URL=https://api.bichimmobiliare.it/`
- Salva e chiudi

**Nota:** Questo file:

- ✅ Rimane su cPanel (non viene sovrascritto da Git perché è in `.gitignore`)
- ✅ Vite lo legge durante `npm run build`
- ✅ Non è committato su Git (sicurezza)

**2. Crea file `deploy.sh` all'interno della cartella del frontend con il seguente contenuto:**

```bash
cat > deploy.sh << 'EOF'
#!/bin/bash

echo "======================================"
echo "🚀 Deploy Frontend - Bich Immobiliare"
echo "======================================"
echo ""

echo "🔄 Step 1/4: Pulling latest changes from Git..."
git pull origin main
if [ $? -ne 0 ]; then
  echo "❌ Error: Git pull failed"
  exit 1
fi
echo "✅ Git pull completed"
echo ""

echo "📦 Step 2/4: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
  echo "❌ Error: npm install failed"
  exit 1
fi
echo "✅ Dependencies installed"
echo ""

echo "🏗️  Step 3/4: Building production bundle..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Error: Build failed"
  exit 1
fi
echo "✅ Build completed"
echo ""

echo "📋 Step 4/4: Copying .htaccess to dist..."
if [ -f .htaccess ]; then
  cp .htaccess dist/.htaccess
  echo "✅ .htaccess copied"
else
  echo "⚠️  Warning: .htaccess not found, skipping"
fi
echo ""

echo "======================================"
echo "✅ Deploy completed successfully!"
echo "======================================"
echo ""
echo "🌐 Visit: https://contratti.bichimmobiliare.it"
echo ""
EOF
```

**3. Rendi eseguibile lo script:**

```bash
chmod +x deploy.sh
```

**4. Verifica che `.gitignore` sia corretto:**

```bash
cat .gitignore
```

Deve contenere:

```
node_modules/
dist/
.env
.env.dev
.env.production
.env.local
```

**5. Committa `deploy.sh` su Git (in locale):**

```bash
# In locale
git add deploy.sh
git commit -m "Add deploy script"
git push origin main
```

**6. Recap:**

1. File Manager cPanel: Crei .env.production dentro frontend/.
2. Locale:
   - Crei deploy.sh in frontend/.
   - git add ., git commit, git push.
3. Terminale cPanel:
   - dirigiti nella cartella frontend con `cd /home/ljxvcewj/rental_contract_management/frontend`
   - rendi eseguibile lo script con `chmod +x deploy.sh` (Solo la prima volta assoluta)
   - esegui lo script con `./deploy.sh` per eseguire il deploy

---

#### **Deploy Quotidiano**

**Workflow completo:**

**1. In locale - Sviluppa e committa:**

```bash
# Sviluppa in locale con npm run dev
# ...

# Quando sei pronto per il deploy
git add .
git commit -m "Update frontend"
git push origin main
```

**2. Su cPanel - Esegui deploy:**

```bash
# Connettiti via Terminal cPanel
Usa il comando "cd /home/ljxvcewj/rental_contract_management/frontend" per accedere alla directory del frontend

# Esegui deploy
./deploy.sh
```

**Output atteso:**

```
======================================
🚀 Deploy Frontend - Bich Immobiliare
======================================

🔄 Step 1/4: Pulling latest changes from Git...
✅ Git pull completed

📦 Step 2/4: Installing dependencies...
✅ Dependencies installed

🏗️  Step 3/4: Building production bundle...
✅ Build completed

📋 Step 4/4: Copying .htaccess to dist...
✅ .htaccess copied

======================================
✅ Deploy completed successfully!
======================================

🌐 Visit: https://contratti.bichimmobiliare.it
```

---

#### **Checklist Verifica Post-Deploy**

Dopo ogni deploy, verifica:

1. ✅ **Visita** `https://contratti.bichimmobiliare.it`
2. ✅ **Testa login** con credenziali valide
3. ✅ **Naviga** tra le pagine (Dashboard, Proprietari, Contratti)
4. ✅ **Ricarica** una pagina interna (es. `/owners`) per verificare `.htaccess`
5. ✅ **Apri DevTools** → Console → Verifica nessun errore CORS
6. ✅ **Testa API call** (es. login, fetch contratti)

---

#### **Troubleshooting**

**Problema: `git pull` fallisce**

```bash
# Verifica stato Git
git status

# Se ci sono conflitti, resetta (ATTENZIONE: perde modifiche locali su server)
git reset --hard origin/main
git pull origin main
```

**Problema: `npm install` fallisce**

```bash
# Pulisci cache npm
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Problema: `npm run build` fallisce**

```bash
# Verifica che .env.production esista
cat .env.production

# Se manca, ricrealo
echo "VITE_API_URL=https://api.bichimmobiliare.it/" > .env.production
```

**Problema: `.htaccess` non funziona (404 su refresh)**

```bash
# Verifica che .htaccess sia in dist/
ls -la dist/.htaccess

# Se manca, copialo manualmente
cp .htaccess dist/.htaccess
```

---

#### **Note di Sicurezza**

**✅ Sicuro:**

- `.env.production` è fuori dalla document root pubblica
- Non è accessibile via HTTP
- Solo tu (via SSH) puoi leggerlo

**⚠️ Attenzione:**

- `VITE_API_URL` finisce nel bundle JavaScript pubblico (è normale)
- **NON** mettere chiavi segrete in `.env.production` frontend
- Le chiavi segrete vanno solo nel backend (env vars cPanel Node.js)

---

#### **Alternative: Build Locale + Upload Manuale**

Se preferisci **non** fare il build su cPanel:

**1. Build in locale:**

```bash
npm run build
cp .htaccess dist/.htaccess
```

**2. Upload `dist/` via FTP/File Manager cPanel**

**Pro:** Non serve SSH  
**Contro:** Meno automatico, upload manuale ogni volta

---

## 20. Ordine Sviluppo Consigliato

### Fase 1: Setup & Auth (2-3 giorni)

#### 1.1 Setup Progetto

**Comandi:**

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install react-router-dom @tanstack/react-query zustand axios
npm install react-hook-form zod @hookform/resolvers
npm install dayjs clsx react-hot-toast react-icons
npm install -D tailwindcss postcss autoprefixer @headlessui/react
npx tailwindcss init -p
```

**File da creare:**

1. `tailwind.config.js`: Palette colori, fonts
2. `src/index.css`: Tailwind directives + Google Fonts import
3. `.env.dev`: API_URL
4. `src/config/react-query.ts`: Query client config
5. `src/services/api/axios.config.ts`: Axios instance + interceptors

#### 1.2 Auth Store & Services

**File:**

1. `src/store/authStore.ts`: Zustand store con persist
2. `src/types/auth.ts`: User, Tokens, LoginRequest, RegisterRequest
3. `src/services/api/auth.service.ts`: API calls
4. `src/hooks/useAuth.ts`: Login, register, logout logic

#### 1.3 Auth Pages

**File:**

1. `src/pages/auth/Login.tsx`: Form + validazione
2. `src/pages/auth/Register.tsx`: Form + validazione
3. `src/pages/auth/ForgotPassword.tsx`: Email input
4. `src/pages/auth/ResetPassword.tsx`: Token + new password

**Test:** Login/register flow completo

#### 1.4 Protected Routes

**File:**

1. `src/components/ProtectedRoute.tsx`: Check auth, redirect se no
2. `src/App.tsx`: Setup routes

---

### Fase 2: Layout & UI Base (2-3 giorni)

#### 2.1 Layout Components

**File:**

1. `src/components/layout/Header.tsx`: Logo + user dropdown
2. `src/components/layout/Sidebar.tsx`: Desktop nav
3. `src/components/layout/MobileNav.tsx`: Bottom nav mobile
4. `src/components/layout/Layout.tsx`: Wrapper con header + sidebar + outlet

**Responsive:** Test desktop/tablet/mobile

#### 2.2 UI Components Base

**File:**

1. `src/components/ui/Button.tsx`
2. `src/components/ui/Card.tsx`
3. `src/components/ui/Input.tsx`
4. `src/components/ui/Spinner.tsx`
5. `src/components/ui/Skeleton.tsx`
6. `src/components/ui/Pagination.tsx`

#### 2.3 Background Iridescence

**Setup:** ReactBits Iridescence con palette colori

---

### Fase 3: Dashboard (2-3 giorni)

#### 3.1 Dashboard Services & Hooks

**File:**

1. `src/services/api/dashboard.service.ts`
2. `src/hooks/useDashboard.ts`: useStats, useExpiringContracts

#### 3.2 Dashboard Components

**File:**

1. `src/components/cards/StatsCard.tsx`
2. `src/components/cards/ContractCard.tsx` (base)
3. `src/components/cards/ContractCardSkeleton.tsx`

#### 3.3 Dashboard Page

**File:**

1. `src/pages/dashboard/Dashboard.tsx`: Stats + 2 sezioni scadenze + paginazione

**Test:** Verifica API calls, loading states, paginazione

---

### Fase 4: CRUD Proprietari (2-3 giorni)

#### 4.1 Owners Services & Hooks

**File:**

1. `src/types/owner.ts`: Owner, CreateOwnerRequest
2. `src/services/api/owners.service.ts`
3. `src/hooks/useOwners.ts`: useOwners, useOwner, useCreateOwner, useUpdateOwner, useDeleteOwner

#### 4.2 Owner Components

**File:**

1. `src/components/cards/OwnerCard.tsx`
2. `src/components/cards/OwnerCardSkeleton.tsx`
3. `src/components/forms/OwnerForm.tsx`
4. `src/components/modals/AddOwnerModal.tsx`
5. `src/components/modals/EditOwnerModal.tsx`
6. `src/components/modals/ViewOwnerModal.tsx`
7. `src/components/modals/DeleteModal.tsx` (riutilizzabile)

#### 4.3 Owner Pages

**File:**

1. `src/pages/owners/OwnersListPage.tsx`: Search + grid + paginazione
2. `src/pages/owners/OwnerDetailPage.tsx`: Stats + contratti + paginazione

**Test:** CRUD completo, search, paginazione

---

### Fase 5: CRUD Contratti Base (3-4 giorni)

#### 5.1 Contracts Services & Hooks

**File:**

1. `src/types/contract.ts`: Contract, Tenant, Annuity
2. `src/services/api/contracts.service.ts`
3. `src/hooks/useContracts.ts`: useContracts, useContract, useCreateContract, useUpdateContract, useDeleteContract

#### 5.2 Contract Components

**File:**

1. `src/components/forms/ContractForm.tsx`: Form complesso con validazione
2. `src/components/forms/TenantForm.tsx`: Nested form
3. Aggiorna `ContractCard.tsx`: Icone, buttons condizionali

#### 5.3 Contracts Pages

**File:**

1. `src/pages/contracts/ContractsListPage.tsx`: Search + filtri + grid + paginazione
2. `src/pages/contracts/ContractDetailPage.tsx`:
   - Modalità visualizzazione
   - Modalità aggiungi
   - Modalità modifica

**NON implementare ancora:** Rinnovo, annualità, timeline

**Test:** Create, update, delete, filtri

---

### Fase 6: Logica Avanzata Contratti (3-4 giorni)

#### 6.1 Timeline Component

**File:**

1. `src/components/timeline/AnnuityTimeline.tsx`: Linea verticale + pallini + anni

#### 6.2 Modalità Rinnovo & Annualità

**Aggiorna:**

1. `src/pages/contracts/ContractDetailPage.tsx`:
   - Modalità rinnovo (`mode=renew`)
   - Modalità annualità (`mode=annuity`)
   - Logica condizionale buttons dashboard

**Hooks:**

1. `src/hooks/useContracts.ts`: Aggiungi `useRenewContract`, `useUpdateAnnuity`

#### 6.3 Integra Timeline

**Aggiorna:**

1. `ContractDetailPage.tsx`: Mostra timeline in modalità visualizzazione se `cedolare_secca: false`

**Test:** Rinnovo contratto, aggiorna annualità, verifica timeline

---

### Fase 7: Impostazioni & Polish (2 giorni)

#### 7.1 Account Settings

**File:**

1. `src/services/api/user.service.ts`
2. `src/hooks/useUser.ts`: useUpdateDetails, useUpdatePassword
3. `src/pages/settings/AccountSettingsPage.tsx`: 2 sezioni + validazione

#### 7.2 Error Handling Globale

**File:**

1. `src/utils/errorHandler.ts`: Centralizza gestione errori API
2. Aggiorna axios interceptor: Toast per errori comuni

#### 7.3 Loading States

**Verifica:** Tutti i loading states hanno skeleton/spinner

#### 7.4 Responsive

**Test:** Tutte le pagine su mobile/tablet/desktop

---

### Fase 8: Testing & Deploy (1-2 giorni)

#### 8.1 Manual Testing

**Checklist:**

- ✅ Auth flow completo
- ✅ CRUD proprietari
- ✅ CRUD contratti (tutte modalità)
- ✅ Dashboard stats
- ✅ Paginazione
- ✅ Filtri
- ✅ Responsive
- ✅ Error handling

#### 8.2 Build Production

**Comandi:**

```bash
npm run build
```

**Verifica:** No errori TypeScript, build success

#### 8.3 Deploy cPanel

**Segui la checklist completa nella sezione 19.4 "Deploy & Configurazione Produzione"**

**Checklist rapida:**

- ✅ Crea `.htaccess` nella root del frontend (vedi sezione 19.2)
- ✅ Build production: `npm run build`
- ✅ Copia `.htaccess` in `dist/` se non automatico
- ✅ Upload contenuto `dist/` su `contratti.bichimmobiliare.it`
- ✅ Verifica `FRONTEND_URL` nel backend cPanel (sezione 19.1)
- ✅ Test manuale: login, navigazione, refresh pagina interna
- ✅ Controlla console browser per errori CORS

---

## 21. Best Practices

### 21.1. Performance

- **Code splitting:** Lazy load routes con `React.lazy()`
- **Memoization:** `useMemo` per calcoli pesanti, `React.memo` per componenti
- **Debounce:** Search input con debounce (300ms)

### 21.2. Accessibilità

- **ARIA labels:** Tutti i buttons/inputs
- **Keyboard navigation:** Tab order corretto
- **Focus states:** Visibili su tutti gli elementi interattivi

### 21.3. Security

- **XSS:** Mai usare `dangerouslySetInnerHTML`
- **Tokens:** Mai loggare tokens in console (production)
- **Validazione:** Sempre validare input client-side + server-side

### 21.4. Code Quality

- **TypeScript strict:** Nessun `any`
- **Naming:** Consistente, descrittivo
- **Comments:** Solo per logica complessa, in italiano
- **DRY:** Riutilizza componenti, hooks, utilities

---

## 22. Troubleshooting Comune

### 22.1. CORS Errors

**Soluzione:** Verifica backend CORS config include frontend URL

### 22.2. 401 Unauthorized Loop

**Soluzione:** Verifica refresh token logic in axios interceptor

### 22.3. React Query Cache Stale

**Soluzione:** Usa `invalidateQueries` dopo mutations

### 22.4. Tailwind Classes Non Applicate

**Soluzione:** Verifica `content` in `tailwind.config.js` include tutti i file

---

## 23. Funzionalità Future

**Da tenere a mente per futura implementazione:**

- Sistema notifiche in-app (campanella header)
- Esportazione PDF contratti
- Dashboard analytics avanzate
- Multi-language support
- Dark mode

**Architettura:** Progettare componenti modulari per facile integrazione

---

**Fine PRD Frontend**
