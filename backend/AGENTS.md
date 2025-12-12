# AGENTS.md - Backend Instructions (Complete & Updated)

## 1. Panoramica del Progetto

Backend API RESTful per gestione contratti di affitto con autenticazione JWT, calcolo automatico annualità, notifiche email automatiche via cron job, e isolamento dati per utente.

**Obiettivo:** API sicura, scalabile e testabile che comunica con PostgreSQL e frontend React.

---

## 2. Principi Guida

- **Linguaggio:** TypeScript, JavaScript ES6+, sempre `async/await`
- **Naming:** Inglese (eccetto `cedolare_secca`, `canone_concordato`)
- **Struttura:** NO cartella `src/`. File ingresso (`server.ts`) nella root
- **Separazione:** Routes → Controllers → Services → Database
- **HTTP Status:** Coerenti con messaggi esplicativi
- **Logging:** `console.log()` nei punti critici per debug
- **Environment:** `.env.dev` (localhost + pgAdmin) e `.env.production` (Netsons)
- **Commenti:**: Commentare sempre il codice con informazioni compatte ma allo stesso tempo dettagliate e che facciano capire esattamente cosa fa quella porzione di codice commentata. I commenti devono essere in italiano per maggior chiarezza

---

## 3. Stack Tecnologico

**Core:**

- Node.js, Express, TypeScript, PostgreSQL, Knex.js

**Sicurezza:**

- JWT (access + refresh tokens), Bcrypt, CORS, express-rate-limit, Helmet

**Validazione & Date:**

- Zod, Day.js

**Utilità Development**

- nodemon, ts-node, cross-env, dotenv

**Email:**

- Resend API, React Email, node-cron

**Testing:**

- Jest, Supertest

---

## 4. Struttura Progetto

```
backend/
├── __tests__/
│   ├── integration/
│   │   ├── auth.test.ts
│   │   ├── contracts.test.ts
│   │   ├── cron.test.ts
│   │   └── setup.ts
│   ├── unit/
│   │   ├── annuities.test.ts
│   │   └── validation.test.ts
│   └── helpers/
│       └── factories.ts
├── config/
│   └── db.ts
├── controllers/
│   ├── auth.controller.ts
│   ├── contract.controller.ts
│   ├── dashboard.controller.ts
│   ├── owner.controller.ts
│   └── user.controller.ts
├── db/
│   ├── migrations/
│   ├── seeds/
│   └── knexfile.ts
├── emails/
│   ├── ExpirationReminderClient.tsx
│   ├── ExpirationReminderInternal.tsx
│   └── ResetPasswordEmail.tsx
├── logs/
│   ├── error.log
│   ├── combined.log
│   ├── cron.log
├── middleware/
│   ├── auth.middleware.ts
│   ├── errorHandler.middleware.ts
│   └── rateLimiter.middleware.ts
├── routes/
│   ├── auth.routes.ts
│   ├── contract.routes.ts
│   ├── dashboard.routes.ts
│   ├── owner.routes.ts
│   └── user.routes.ts
├── services/
│   ├── annuity.service.ts
│   ├── auth.service.ts
│   ├── contract.service.ts
│   ├── email.service.ts
│   ├── notification.service.ts
│   ├── owner.service.ts
│   └── user.service.ts
│   └── logger.service.ts
├── types/
│   └── api.ts
│   └── auth.ts
│   └── database.ts
│   └── index.ts
│   └── shared.ts
│   └── express.d.ts
├── utils/
│   ├── AppError.ts
│   ├── errorHandler.ts
│   └── token.utils.ts
├── .env.dev
├── .env.production
├── .env.test
├── .gitignore
├── jest.config.js
├── jest.global-setup.ts
├── package.json
├── server.ts
└── tsconfig.json
```

---

## 5. Database Schema

**Ricorda:** configura `knexfile.ts` usando il comando `npx knex init -x ts`.

### 5.1. Tabelle Principali

#### `users`

```sql
id (PK), name, surname, email (UNIQUE), password_hash, created_at, updated_at
```

#### `owners`

```sql
id (PK), name, surname, phone, email, user_id (FK → users), created_at, updated_at
INDEX: user_id
```

#### `tenants`

```sql
id (PK), name, surname, phone, email, user_id (FK → users), created_at, updated_at
INDEX: user_id
```

#### `contracts`

```sql
id (PK), owner_id (FK → owners), tenant_id (FK → tenants),
start_date, end_date, cedolare_secca (BOOLEAN),
typology (ENUM: 'residenziale', 'commerciale'),
canone_concordato (BOOLEAN), monthly_rent (DECIMAL 10,2),
last_annuity_paid (INT, nullable), created_at, updated_at
INDEX: owner_id, end_date, (owner_id, end_date)
```

#### `annuities`

```sql
id (PK), contract_id (FK → contracts CASCADE), year (INT),
due_date (DATE), is_paid (BOOLEAN default false),
paid_at (TIMESTAMP nullable), created_at, updated_at
UNIQUE: (contract_id, year)
INDEX: due_date, (contract_id, is_paid)
```

**Scopo:** Traccia annualità intermedie per contratti NON in cedolare secca. Genera record per ogni anno tra `start_date` e `end_date` (escluso primo e ultimo anno).

#### `password_reset_tokens`

```sql
id (PK), user_id (FK → users CASCADE), token (UNIQUE),
expires_at (TIMESTAMP), used (BOOLEAN default false), created_at
INDEX: token, (user_id, used)
```

**Scopo:** Gestisce reset password con scadenza e prevenzione riutilizzo.

#### `notifications`

```sql
id (PK), contract_id (FK → contracts CASCADE),
type (ENUM: 'contract_renewal', 'annuity_renewal'),
year (INT nullable), sent_to_client (BOOLEAN),
sent_to_internal (BOOLEAN), sent_at (TIMESTAMP)
UNIQUE: (contract_id, type, year)
INDEX: contract_id, (type, sent_at)
```

**Scopo:** Previene invio duplicato notifiche email. Audit trail.

### 5.2. Tabelle JWT

#### `refresh_tokens`

```sql
id (PK), user_id (FK → users CASCADE), token (TEXT), created_at
INDEX: user_id, token
```

#### `blacklisted_tokens`

```sql
id (PK), token (TEXT UNIQUE), blacklisted_at (TIMESTAMP)
INDEX: token
```

---

## 6. API Endpoints

**IMPORTANTE:** Tutti gli endpoint (eccetto `/api/auth/*`) richiedono JWT valido. Ogni query filtra per `user_id` autenticato.

### 6.1. Authentication (`/api/auth`)

| Method | Endpoint           | Descrizione             | Body                                                          |
| ------ | ------------------ | ----------------------- | ------------------------------------------------------------- |
| POST   | `/register`        | Registra utente         | `name, surname, email, password`                              |
| POST   | `/login`           | Login                   | `email, password` → Returns `accessToken, refreshToken, user` |
| POST   | `/refresh`         | Rinnova access token    | `refreshToken` → Returns `accessToken`                        |
| POST   | `/logout`          | Blacklist refresh token | `refreshToken`                                                |
| POST   | `/forgot-password` | Invia email reset       | `email`                                                       |
| POST   | `/reset-password`  | Reset password          | `token, newPassword`                                          |

**Rate Limiting:** `/login` e `/register` → 5 richieste/15min per IP

### 6.2. Users (`/api/users`) 🔒

| Method | Endpoint       | Descrizione                                                 |
| ------ | -------------- | ----------------------------------------------------------- |
| GET    | `/me`          | Dati utente autenticato                                     |
| PUT    | `/me/details`  | Aggiorna nome, cognome, email                               |
| PUT    | `/me/password` | Aggiorna password (richiede `currentPassword, newPassword`) |

### 6.3. Owners (`/api/owners`) 🔒

| Method | Endpoint         | Descrizione                              | Query Params                   |
| ------ | ---------------- | ---------------------------------------- | ------------------------------ |
| GET    | `/`              | Lista proprietari (paginata)             | `?search=nome&page=1&limit=12` |
| GET    | `/:id`           | Dettagli proprietario                    | -                              |
| GET    | `/:id/contracts` | Contratti del proprietario (paginata)    | `?page=1&limit=12`             |
| POST   | `/`              | Crea proprietario                        | -                              |
| PUT    | `/:id`           | Aggiorna proprietario                    | -                              |
| DELETE | `/:id`           | Elimina proprietario (CASCADE contratti) | -                              |

### 6.4. Contracts (`/api/contracts`) 🔒

| Method | Endpoint         | Descrizione                                                 | Query Params                                                            |
| ------ | ---------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| GET    | `/`              | Lista contratti (paginata)                                  | `?ownerId=X&search=nome&expiryMonth=10&expiryYear=2025&page=1&limit=12` |
| GET    | `/:id`           | Dettagli completi (include owner, tenant, annuities)        | -                                                                       |
| GET    | `/:id/annuities` | Timeline annualità contratto                                | -                                                                       |
| POST   | `/`              | Crea contratto (può creare tenant nuovo)                    | -                                                                       |
| PUT    | `/:id`           | Aggiorna contratto                                          | -                                                                       |
| PUT    | `/:id/renew`     | Rinnova contratto (aggiorna dates, cedolare_secca, ecc)     | -                                                                       |
| PUT    | `/:id/annuity`   | Aggiorna `last_annuity_paid` e marca annuity come `is_paid` | -                                                                       |
| DELETE | `/:id`           | Elimina contratto                                           | -                                                                       |

**POST `/contracts` Body (tenant nuovo):**

```json
{
  "owner_id": 5,
  "tenant_data": {
    "name": "Luigi",
    "surname": "Verdi",
    "phone": "...",
    "email": "..."
  },
  "start_date": "2025-01-01",
  "end_date": "2028-01-01",
  "cedolare_secca": false,
  "typology": "residenziale",
  "canone_concordato": true,
  "monthly_rent": 850.0,
  "last_annuity_paid": 2025
}
```

**POST `/contracts` Body (tenant esistente):**

```json
{
  "owner_id": 5,
  "tenant_id": 12,
  "start_date": "2025-01-01",
  ...
}
```

**PUT `/:id/renew` - Aggiorna solo dati contrattuali:**

```json
{
  "start_date": "2028-01-01",
  "end_date": "2032-01-01",
  "cedolare_secca": true,
  "typology": "residenziale",
  "canone_concordato": false,
  "monthly_rent": 900.0
}
```

**PUT `/:id/annuity` - Solo per contratti NON cedolare secca:**

```json
{
  "last_annuity_paid": 2026
}
```

Marca l'annuity del 2026 come `is_paid: true, paid_at: NOW()`.

### 6.5. Dashboard (`/api/dashboard`) 🔒

| Method | Endpoint              | Descrizione                      | Query Params                                       |
| ------ | --------------------- | -------------------------------- | -------------------------------------------------- |
| GET    | `/stats`              | Statistiche totali               | -                                                  |
| GET    | `/expiring-contracts` | Contratti in scadenza (paginata) | `?period=current` o `?period=next&page=1&limit=12` |

**GET `/stats` Response:**

```json
{
  "totalContracts": 15,
  "totalOwners": 8,
  "currentMonthExpiriesCount": 3,
  "nextMonthExpiriesCount": 5,
  "totalMonthlyRent": 12500.0
}
```

**GET `/expiring-contracts?period=current` Response:**
Lista contratti/annualità scadenza mese corrente con dettagli owner, tenant (paginata).

---

## 7. Logica Business Critica

### 7.1. Calcolo Annualità (`annuity.service.ts`)

**Quando creare annuities:**

- Solo per contratti con `cedolare_secca: false`
- Per ogni anno tra `start_date` e `end_date` (ESCLUSI primo e ultimo anno)

**Esempio:**

```
Contratto: 2025-01-15 → 2028-01-15
Annuities generate:
- year: 2026, due_date: 2026-01-15
- year: 2027, due_date: 2027-01-15
(NO 2025, NO 2028)
```

**Funzione `generateAnnuitiesForContract(contractId)`:**

1. Recupera contratto
2. Se `cedolare_secca: true` → return []
3. Calcola anni intermedi
4. Inserisce record in `annuities` con `is_paid` basato su `last_annuity_paid`
5. Return annuities create

**Trigger:** Chiamata automaticamente dopo `POST /contracts` e dopo `PUT /:id/renew`.

### 7.2. Notifiche Email Cron Job (`notification.service.ts`)

**Scheduling:** `node-cron` esegue ogni giorno alle 08:00

**Logica:**

1. Calcola `targetDate = oggi + 7 giorni`
2. Query contratti:
   - `end_date = targetDate` (scadenza naturale)
   - Annuities con `due_date = targetDate AND is_paid = false`
3. Per ogni match, verifica in `notifications` se già inviata (unique constraint)
4. Se non esiste, invia 2 email:
   - **Email interna:** A `INTERNAL_NOTIFICATION_EMAIL` (reminder team)
   - **Email cliente:** A `owner.email` (professionale, template React Email)
5. Inserisce record in `notifications` con `sent_to_client: true, sent_to_internal: true`
6. Log risultati (successi/fallimenti)

**Prevenzione duplicati:** Unique constraint `(contract_id, type, year)` in `notifications`.

### 7.3. Email Service (`email.service.ts`)

**Templates (React Email):**

- `ResetPasswordEmail`: Link con token reset
- `ExpirationReminderInternal`: Semplice, con dati contratto e CTA "Aggiungi a calendario"
- `ExpirationReminderClient`: Professionale, branded, dati contratto

**Invio:** Resend API con error handling e retry logic (opzionale).

---

## 8. Sicurezza

### 8.1. Rate Limiting

**Endpoint protetti:**

- `/api/auth/login`: 5 req/15min per IP
- `/api/auth/register`: 5 req/15min per IP
- `/api/auth/forgot-password`: 3 req/1h per IP

**Implementazione:** `express-rate-limit` middleware.

### 8.2. Gestione Errori

**Custom Class `AppError`:**

```typescript
class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public isOperational: boolean = true
  ) {}
}
```

**Middleware `errorHandler`:**

- Cattura tutti gli errori
- Log con contesto (endpoint, user_id, error stack)
- Response JSON standardizzata: `{ success: false, message: "..." }`
- Gestisce errori Zod (400), JWT (401), Not Found (404)

### 8.3. Validazione Input

**Zod schemas per ogni endpoint:**

- Validazione a livello controller prima di chiamare service
- Schemi per: register, login, contract creation, ecc.
- Response 400 con dettagli errori validazione

**Esempio schema contratto:**

```typescript
const contractSchema = z.object({
  owner_id: z.number().positive(),
  tenant_id: z.number().positive().optional(),
  tenant_data: z.object({...}).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cedolare_secca: z.boolean(),
  typology: z.enum(['residenziale', 'commerciale']),
  canone_concordato: z.boolean(),
  monthly_rent: z.number().positive(),
  last_annuity_paid: z.number().int().nullable()
}).refine(data => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end > start;
}, { message: "end_date must be after start_date" });
```

### 8.4. JWT

**Access Token:** 15 minuti, contiene `{ userId, email }`
**Refresh Token:** 30 giorni, salvato in DB
**Middleware `auth.middleware`:**

- Verifica `Authorization: Bearer <token>`
- Decodifica JWT
- Verifica token non in blacklist
- Attach `req.user = { id, email }` per uso nei controller

---

## 9. Testing Strategy

### 9.1. Setup (Jest + Supertest)

**Configurazione:**

- Test DB separato (es. `contracts_db_test`)
- `beforeAll`: Esegui migrations
- `beforeEach`: Pulisci tutte le tabelle
- `afterAll`: Chiudi connessione DB

**File:** `__tests__/setup.ts`

### 9.2. Test Priorità ALTA (Essenziali)

#### Authentication (`__tests__/integration/auth.test.ts`)

- ✅ Register: successo, duplicate email, weak password
- ✅ Login: successo, credenziali errate, return tokens
- ✅ Refresh: token valido, expired, blacklisted
- ✅ Logout: blacklist token
- ✅ Forgot password: crea token, invia email
- ✅ Reset password: token valido, expired, già usato

#### Annuities Logic (`__tests__/unit/annuities.test.ts`)

- ✅ NO annuities per cedolare_secca: true
- ✅ Genera annuities corrette per contratto 2025-2028 → [2026, 2027]
- ✅ Calcola `due_date` corrette basate su `start_date`
- ✅ Marca come `is_paid` basato su `last_annuity_paid`
- ✅ Edge case: contratto 2025-2026 → [] (nessuna annuity intermedia)

#### Cron Job Notifications (`__tests__/integration/cron.test.ts`)

- ✅ Trova contratti scadenza esatta tra 7 giorni
- ✅ Trova annuities scadenza tra 7 giorni NON pagate
- ✅ Invia email interna + cliente
- ✅ NO duplicati (verifica unique constraint `notifications`)
- ✅ Log successi/fallimenti
- ✅ Mock date: test con `jest.useFakeTimers()`

### 9.3. Test Priorità MEDIA

#### Contracts CRUD (`__tests__/integration/contracts.test.ts`)

- ✅ Create con tenant esistente
- ✅ Create con tenant nuovo (nested creation)
- ✅ Update contratto
- ✅ Delete contratto (verifica cascade annuities)
- ✅ Filtri: ownerId, search, expiryMonth

#### Auth Middleware (`__tests__/unit/auth.test.ts`)

- ✅ Accesso con token valido
- ✅ Reject: token mancante, expired, blacklisted
- ✅ Attach `req.user` correttamente

#### Validation (`__tests__/unit/validation.test.ts`)

- ✅ Contract schema: reject end_date < start_date
- ✅ Reject email invalida, password corta
- ✅ Reject monthly_rent negativo

### 9.4. Test Priorità BASSA (Nice-to-Have)

- Owners/Tenants CRUD
- Dashboard stats calcolo corretto
- Isolamento dati: user A non accede dati user B

### 9.5. Coverage Target

**Minimo raccomandato:**

- Functions: 70%
- Lines: 70%
- Branches: 70%

**Focus:** Alta priorità test (auth, annuities, cron) → 100% coverage

---

## 10. Variabili d'Ambiente

### `.env.dev`

```bash
NODE_ENV=development
PORT=3000

# Database (locale)
DB_CLIENT=pg
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=poRqow-puvsif
DB_NAME=rental_contract_management_dev

# JWT
ACCESS_TOKEN_SECRET=3:N+H?N816z!
REFRESH_TOKEN_SECRET=dv6r?1x6Bq9/s
ACCESS_TOKEN_EXPIRATION=900s # 15 minutes
REFRESH_TOKEN_EXPIRATION=2592000s # 30 days

# Resend
RESEND_API_KEY=re_your_dev_key # da sostituire con la chiave reale di Resend al momento in cui ci serve
INTERNAL_NOTIFICATION_EMAIL=dev@bichimmobiliare.it
FROM_EMAIL=noreply@bichimmobiliare.it
FROM_NAME=Bich Immobiliare

# Frontend
FRONTEND_URL=http://localhost:5173

# Cron
CRON_NOTIFICATION_TIME=0 8 * * *
CRON_NOTIFICATION_DAYS_BEFORE=7
```

### `.env.production`

```bash
NODE_ENV=production
PORT=3000

# Database (Netsons)
DB_CLIENT=pg
DB_URL=postgresql://user:pass@host:5432/dbname
# Oppure singoli parametri se Netsons non fornisce URL
DB_HOST=postgres.netsons.com
DB_PORT=5432
DB_USER=netsons_user
DB_PASSWORD=strong_password
DB_NAME=contracts_production

# JWT (CAMBIARE con secrets forti)
ACCESS_TOKEN_SECRET=prod_super_secret_access_32chars_min
REFRESH_TOKEN_SECRET=prod_super_secret_refresh_32chars_min
ACCESS_TOKEN_EXPIRATION=900s # 15 minutes
REFRESH_TOKEN_EXPIRATION=2592000s # 30 days

# Resend
RESEND_API_KEY=re_your_production_key
INTERNAL_NOTIFICATION_EMAIL=notifiche@bichimmobiliare.it
FROM_EMAIL=noreply@bichimmobiliare.it
FROM_NAME=Bich Immobiliare

# Frontend
FRONTEND_URL=https://contratti.bichimmobiliare.it

# Cron
CRON_NOTIFICATION_TIME=0 8 * * *
CRON_NOTIFICATION_DAYS_BEFORE=7
```

---

## 11. Deploy Checklist (Netsons)

### Pre-Deploy

- ✅ Test suite passa (almeno alta priorità)
- ✅ Variabili `.env.production` configurate
- ✅ CORS impostato su frontend URL production
- ✅ Rate limiting attivo
- ✅ Error handling testato

### Database

- ✅ Creare DB PostgreSQL su Netsons (phpPgAdmin)
- ✅ Eseguire migrations: `npx knex migrate:latest --env production`
- ✅ Verifica tabelle create correttamente

### Server Node.js

- ✅ Upload codice su sottodominio Netsons
- ✅ `npm install --production`
- ✅ Start server: `npm run start` (usa `cross-env NODE_ENV=production node server.js`)
- ✅ Verifica processo attivo (pm2 o simili)

### Security

- ✅ HTTPS attivo su `api.bichimmobiliare.it`
- ✅ Helmet middleware attivo
- ✅ Secrets JWT forti (min 32 caratteri)
- ✅ `.env` file NON committato

### Monitoring

- ✅ Log cron job funzionante (verifica invio email)
- ✅ Test manuale endpoints chiave
- ✅ Verifica email Resend funzionanti

---

## 12. Note Implementazione

### Logica Cedolare Secca

- **`cedolare_secca: true`** → Scadenza solo a `end_date` (rinnovo contratto)
- **`cedolare_secca: false`** → Scadenza `end_date` + annualità intermedie ogni anno

### Pulsanti Dashboard/Card Contratto

**Logica condizionale:**

- Se `cedolare_secca: true` → Pulsante "Gestisci rinnovo"
- Se `cedolare_secca: false`:
  - Se annualità corrente coincide con `end_date` → "Gestisci rinnovo"
  - Altrimenti → "Gestisci annualità"

### Timeline Annualità (Frontend)

- Visibile solo per contratti `cedolare_secca: false`
- Fetch da `GET /contracts/:id/annuities`
- Mostra anni, date scadenza, stato pagamento

### Tenant Creation

- Endpoint `POST /contracts` accetta:
  - `tenant_id` (tenant esistente) OPPURE
  - `tenant_data` (crea nuovo tenant e assegna a contratto)
- Service gestisce logica: verifica esistenza email, crea se necessario

---

## 13. Response Format Standard

### 13.1. Paginazione

**Tutti gli endpoint GET che restituiscono liste devono supportare paginazione:**

**Query Params:**

- `page` (default: 1)
- `limit` (default: 12, max: 100)

**Response Success con Paginazione:**

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 47,
    "totalPages": 4
  }
}
```

**Implementazione Service:**

```typescript
const offset = (page - 1) * limit;
const data = await knex("contracts")
  .where({ user_id })
  .limit(limit)
  .offset(offset);
const [{ count }] = await knex("contracts").where({ user_id }).count();
```

**Endpoints paginati:**

- `GET /api/owners`
- `GET /api/owners/:id/contracts`
- `GET /api/contracts`
- `GET /api/dashboard/expiring-contracts`

---

### 13.2. Format Risposte

**Success:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error (SEMPRE con campo `message`):**

```json
{
  "success": false,
  "message": "Descrizione errore chiara e specifica"
}
```

**Validation Error (Zod):**

```json
{
  "success": false,
  "message": "Errore di validazione",
  "errors": [
    { "field": "email", "message": "Email non valida" },
    { "field": "password", "message": "Password troppo corta" }
  ]
}
```

---

### 13.3. Messaggi Errore per Status Code

**IMPORTANTE:** Ogni errore DEVE includere un `message` esplicativo. Il frontend recupera sempre `error.response.data.message`.

**Esempi per ogni status:**

**400 - Bad Request:**

```json
{ "success": false, "message": "Dati di input non validi" }
{ "success": false, "message": "La data di fine deve essere successiva alla data di inizio" }
```

**401 - Unauthorized:**

```json
{ "success": false, "message": "Token di autenticazione mancante o non valido" }
{ "success": false, "message": "Password attuale errata" }
{ "success": false, "message": "Credenziali non valide" }
```

**403 - Forbidden:**

```json
{ "success": false, "message": "Non hai i permessi per accedere a questa risorsa" }
{ "success": false, "message": "Questo contratto appartiene a un altro utente" }
```

**404 - Not Found:**

```json
{ "success": false, "message": "Contratto non trovato" }
{ "success": false, "message": "Proprietario non trovato" }
```

**409 - Conflict:**

```json
{ "success": false, "message": "Email già registrata" }
{ "success": false, "message": "Esiste già un'annualità per questo anno" }
```

**Rate Limit (429):**

```json
{ "success": false, "message": "Troppi tentativi, riprova tra 15 minuti" }
```

**500 - Internal Server Error:**

```json
{ "success": false, "message": "Errore nell'aggiornamento del contratto" }
{ "success": false, "message": "Errore nell'invio dell'email di recupero password" }
{ "success": false, "message": "Errore del server, riprova più tardi" }
```

---

### 13.4. Gestione Errori nel Middleware

**`errorHandler.middleware.ts` deve sempre garantire campo `message`:**

```typescript
// Esempio logica
if (err instanceof AppError) {
  return res.status(err.statusCode).json({
    success: false,
    message: err.message, // Sempre presente
  });
}

// Errore generico (catch-all)
return res.status(500).json({
  success: false,
  message: "Errore del server, riprova più tardi",
});
```

**NOTA:** In produzione, NON esporre mai stack trace o dettagli tecnici nel `message`. Loggare tutto internamente con console.log/logger.

---

### 13.5. Status Codes

- 200: OK
- 201: Created
- 400: Bad Request (validation)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (valid token, ma risorsa non owned)
- 404: Not Found
- 409: Conflict (duplicate email, ecc)
- 429: Too Many Requests (rate limiting)
- 500: Internal Server Error

---

## 14. Ordine Sviluppo Consigliato

## Fase 1: Setup & Auth (3-4 giorni)

### 1.1 Setup Progetto

**File da creare:**

- `package.json`: Dipendenze (express, typescript, knex, pg, bcrypt, jsonwebtoken, zod, dotenv, cors, helmet, express-rate-limit, dayjs, resend, react-email, node-cron)
- `tsconfig.json`: Strict mode, target ES2020, moduleResolution node
- `.env.dev`: Variabili locali (DB, JWT secrets, Resend placeholder)
- `.gitignore`: node_modules, .env\*, dist/

**Comandi:**

```bash
npm init -y
npm install [dipendenze]
npm install -D typescript @types/node @types/express ts-node nodemon
npx tsc --init
```

### 1.2 Database Setup

**File:**

- `db/knexfile.ts`: Config per dev/production, legge da .env
- `config/db.ts`: Export istanza Knex

**Migrations da creare (ordine):**

1. `001_create_users.ts`
2. `002_create_owners.ts`
3. `003_create_tenants.ts`
4. `004_create_contracts.ts`
5. `005_create_annuities.ts`
6. `006_create_refresh_tokens.ts`
7. `007_create_blacklisted_tokens.ts`
8. `008_create_password_reset_tokens.ts`
9. `009_create_notifications.ts`

**Esegui:** `npx knex migrate:latest --env development`

### 1.3 Auth Service & Routes

**File da creare nell'ordine:**

1. **`types/database.ts`**: Interfaces per User, RefreshToken, BlacklistedToken, PasswordResetToken
2. **`types/auth.ts`**: RegisterRequest, LoginRequest, RefreshRequest, etc.
3. **`utils/AppError.ts`**: Custom error class con statusCode
4. **`utils/token.utils.ts`**: `generateAccessToken()`, `generateRefreshToken()`, `verifyToken()`
5. **`services/auth.service.ts`**:
   - `register()`: Hash password (bcrypt), insert user, return tokens
   - `login()`: Verify credentials, generate tokens, save refresh token
   - `refreshAccessToken()`: Verify refresh token, generate new access
   - `logout()`: Blacklist refresh token
6. **`controllers/auth.controller.ts`**: Zod validation → call service → response
7. **`routes/auth.routes.ts`**: POST /register, /login, /refresh, /logout

**Test:** Postman/Thunder Client su tutti gli endpoint

### 1.4 JWT Middleware

**File:**

- `middleware/auth.middleware.ts`:
  - Estrae token da header Authorization
  - Verifica con `verifyToken()`
  - Check blacklist
  - Attach `req.user = { id, email }`
  - Next() o throw 401

**Applica a:** Tutte le routes tranne `/api/auth/*`

### 1.5 Password Reset

**File:**

- `services/auth.service.ts` (aggiungi):
  - `requestPasswordReset()`: Generate token, save in DB con expires_at (+1h), return token
  - `resetPassword()`: Verify token valid/unused/not expired, hash new password, update user, mark token used
- `services/email.service.ts` (basic):
  - `sendPasswordResetEmail()`: Resend API call con template placeholder
- `emails/ResetPasswordEmail.tsx`: React Email component (link con token)
- `controllers/auth.controller.ts`: Aggiungi POST `/forgot-password`, `/reset-password`
- `routes/auth.routes.ts`: Aggiungi routes

### 1.6 Rate Limiting

**File:**

- `middleware/rateLimiter.middleware.ts`:
  - `loginLimiter`: 5 req/15min
  - `registerLimiter`: 5 req/15min
  - `forgotPasswordLimiter`: 3 req/1h

**Applica in:** `auth.routes.ts` sui rispettivi endpoints

### 1.7 Test Auth (Alta Priorità)

**File:**

- `__tests__/setup.ts`: beforeAll (migrate), beforeEach (clean DB), afterAll (close connection)
- `__tests__/integration/auth.test.ts`:
  - Register: success, duplicate email, validation fail
  - Login: success, wrong password, return tokens
  - Refresh: valid, expired, blacklisted
  - Logout: blacklist token
  - Password reset: request (email sent), reset (valid token), expired token

---

## Fase 2: CRUD Base (3-4 giorni)

### 2.1 Error Handler Middleware

**File:**

- `middleware/errorHandler.middleware.ts`:
  - Catch AppError → response con statusCode
  - Catch Zod → 400 con errors array
  - Catch JWT errors → 401
  - Generic → 500

**Applica in:** `server.ts` come ultimo middleware

### 2.2 Users Endpoints

**File:**

1. `types/database.ts`: Aggiungi UpdateUserRequest
2. `services/user.service.ts`:
   - `getUserById()`
   - `updateUserDetails()`: name, surname, email (check unique)
   - `updateUserPassword()`: verify currentPassword, hash new
3. `controllers/user.controller.ts`: Validazione + service calls
4. `routes/user.routes.ts`: GET /me, PUT /me/details, PUT /me/password
5. `server.ts`: Mount `/api/users` con auth middleware

### 2.3 Owners CRUD

**File:**

1. `types/database.ts`: Owner interface, CreateOwnerRequest, UpdateOwnerRequest
2. `services/owner.service.ts`:
   - `createOwner()`: Insert con user_id
   - `getOwners()`: Paginated, filter by user_id, search param
   - `getOwnerById()`: Verify ownership (user_id match)
   - `updateOwner()`: Verify ownership
   - `deleteOwner()`: Verify ownership, cascade delete contracts
   - `getOwnerContracts()`: Paginated contracts for owner
3. `controllers/owner.controller.ts`: Validazione + pagination logic
4. `routes/owner.routes.ts`: GET /, GET /:id, GET /:id/contracts, POST /, PUT /:id, DELETE /:id
5. `server.ts`: Mount `/api/owners` con auth

**Test:** Postman con JWT valido

### 2.4 Contracts CRUD Base

**File:**

1. `types/database.ts`: Contract, Tenant, CreateContractRequest, UpdateContractRequest
2. `services/contract.service.ts`:
   - `createContract()`:
     - Se tenant_id → verify exists
     - Se tenant_data → create tenant first
     - Insert contract con user_id derivato da owner
     - **NON generare annuities ancora**
   - `getContracts()`: Paginated, filters (ownerId, search, expiryMonth/Year), join owner/tenant
   - `getContractById()`: Full details con owner, tenant, **NO annuities ancora**
   - `updateContract()`: Verify ownership via owner_id
   - `deleteContract()`: Verify ownership, cascade annuities
3. `controllers/contract.controller.ts`: Validazione (Zod schema con refine per date), pagination
4. `routes/contract.routes.ts`: GET /, GET /:id, POST /, PUT /:id, DELETE /:id
5. `server.ts`: Mount `/api/contracts` con auth

**NON implementare ancora:** `/renew`, `/annuity`, `GET /:id/annuities`

### 2.5 Dashboard Stats

**File:**

1. `types/api.ts`: DashboardStatsResponse
2. `services/dashboard.service.ts`:
   - `getStats()`:
     - Count contracts, owners (by user_id)
     - Sum monthly_rent
     - Count expiring contracts (current/next month)
3. `controllers/dashboard.controller.ts`: Call service
4. `routes/dashboard.routes.ts`: GET /stats
5. `server.ts`: Mount `/api/dashboard` con auth

**NON implementare ancora:** `/expiring-contracts` (serve annuities logic)

---

## Fase 3: Logica Avanzata (4-5 giorni)

### 3.1 Annuities Service

**File:**

1. `types/database.ts`: Annuity interface
2. `services/annuity.service.ts`:
   - `generateAnnuitiesForContract(contractId)`:
     - Fetch contract
     - Se cedolare_secca → return []
     - Calcola anni intermedi (NO primo, NO ultimo)
     - Per ogni anno: due_date = start_date + N anni
     - Insert in annuities con is_paid basato su last_annuity_paid
     - Return annuities create
   - `getAnnuitiesByContract(contractId)`: Return timeline completa
   - `updateAnnuityPaid(contractId, year)`:
     - Find annuity by (contract_id, year)
     - Set is_paid = true, paid_at = NOW()
     - Update contract.last_annuity_paid = year

**Test unitari:**

- `__tests__/unit/annuities.test.ts`:
  - Cedolare secca → no annuities
  - 2025-2028 → [2026, 2027]
  - 2025-2026 → []
  - Due dates correct
  - is_paid logic

### 3.2 Integra Annuities in Contracts

**Modifica:**

- `services/contract.service.ts`:
  - `createContract()`: Dopo insert, call `generateAnnuitiesForContract()`
  - `getContractById()`: Join annuities, return in response
- `controllers/contract.controller.ts`: Aggiungi GET `/:id/annuities` → call `getAnnuitiesByContract()`
- `routes/contract.routes.ts`: Aggiungi GET `/:id/annuities`

### 3.3 Renew Contract

**File:**

- `types/api.ts`: RenewContractRequest
- `services/contract.service.ts`:
  - `renewContract(contractId, data)`:
    - Verify ownership
    - **Knex transaction:**
      - Delete old annuities
      - Update contract (dates, cedolare_secca, etc.)
      - Generate new annuities
    - Return updated contract
- `controllers/contract.controller.ts`: Validazione, call service
- `routes/contract.routes.ts`: PUT `/:id/renew`

### 3.4 Update Annuity

**File:**

- `types/api.ts`: UpdateAnnuityRequest
- `controllers/contract.controller.ts`: PUT `/:id/annuity`
  - Validazione: contractId, last_annuity_paid (year)
  - Call `annuity.service.updateAnnuityPaid()`
  - Response success
- `routes/contract.routes.ts`: PUT `/:id/annuity`

### 3.5 Dashboard Expiring Contracts

**File:**

- `services/dashboard.service.ts`:
  - `getExpiringContracts(period, page, limit)`:
    - Calculate targetMonth/Year
    - Query contracts con end_date = targetMonth
    - Query annuities con due_date in targetMonth AND is_paid = false
    - Join owner, tenant
    - Paginated response
- `controllers/dashboard.controller.ts`: GET `/expiring-contracts?period=current|next`
- `routes/dashboard.routes.ts`: Aggiungi route

---

## Fase 4: Email & Cron (3-4 giorni)

### 4.1 Email Templates

**File da creare:**

- `emails/ResetPasswordEmail.tsx`: Link con token (già fatto in Fase 1)
- `emails/ExpirationReminderInternal.tsx`:
  - Props: contractId, ownerName, tenantName, expiryDate, type (contract/annuity)
  - Style semplice, CTA "Aggiungi a calendario"
- `emails/ExpirationReminderClient.tsx`:
  - Props: ownerName, tenantName, address (se disponibile), expiryDate, type
  - Style professionale branded

### 4.2 Email Service

**File:**

- `services/email.service.ts` (completa):
  - `sendPasswordResetEmail()` (già fatto)
  - `sendExpirationReminderInternal(contract, type, year?)`:
    - Render template con React Email
    - Send via Resend a INTERNAL_NOTIFICATION_EMAIL
  - `sendExpirationReminderClient(contract, type, year?)`:
    - Render template
    - Send a owner.email
  - Error handling con try/catch, log errori

### 4.3 Notification Service

**File:**

1. `types/database.ts`: Notification interface
2. `services/notification.service.ts`:
   - `sendExpiringContractsNotifications()`:
     - Calculate targetDate = now + 7 days
     - Query contracts con end_date = targetDate
     - Query annuities con due_date = targetDate AND is_paid = false
     - Per ogni match:
       - Check if already sent (query notifications)
       - Se NO: send internal + client email
       - Insert in notifications
     - Return counts (sent, failed)
   - `checkNotificationSent(contractId, type, year?)`: Helper per verify duplicate

### 4.4 Cron Job

**File:**

- `server.ts` (aggiungi):
  - Import `node-cron`
  - Schedule job: `cron.schedule(CRON_NOTIFICATION_TIME, async () => {...})`
  - Call `notification.service.sendExpiringContractsNotifications()`
  - Log risultati

**Test manuale:** Cambia cron a `* * * * *` (ogni minuto), verifica log

### 4.5 Test Cron (Alta Priorità)

**File:**

- `__tests__/integration/cron.test.ts`:
  - Mock date con jest.useFakeTimers()
  - Insert contract con end_date = oggi + 7 giorni
  - Insert annuity con due_date = oggi + 7 giorni, is_paid = false
  - Call notification service
  - Assert emails sent (mock Resend)
  - Assert notifications table populated
  - Test NO duplicate (re-run service, assert no new emails)

---

## Fase 5: Testing & Deploy (2-3 giorni)

### 5.1 Test Media Priorità

**File:**

- `__tests__/integration/contracts.test.ts`:
  - Create con tenant esistente/nuovo
  - Update, delete, cascade annuities
  - Filters (ownerId, search, expiryMonth)
- `__tests__/unit/validation.test.ts`:
  - Contract schema: date validation
  - Email, password validation

### 5.2 Fix Bugs & Refactor

- Review TODO comments
- Optimize queries (add missing indexes se necessario)
- Clean console.logs (keep only critical)

### 5.3 Creazione database su phppgadmin

### 5.4 Creazione server Node.js su cPanel

- Update `.env.production` con DB credentials

### 5.5 Deploy Netsons e avvio server Node.js

**Checklist:**

- Upload codice (escludi node_modules, .env.dev)
- `npm install --production`
- Run migrations: `npx knex migrate:latest --env production`
- Test manuale endpoints chiave
- Test email Resend (trigger manual notification)

### 5.6 Monitoring

- Setup basic health check endpoint: GET `/health` → 200 OK
- Verify cron job running (check logs dopo 24h) - Monitor logs per errori cron
- Test reset password flow end-to-end

### 5.7 Logging

- Verify logs are created in `logs/` folder
- Check `logs/combined.log` for general logs
- Check `logs/error.log` for errors
- Check `logs/cron.log` for cron job logs

---

## Note Finali

**Dipendenze tra fasi:**

- Fase 3 dipende da Fase 2 (contracts must exist)
- Fase 4 dipende da Fase 3 (annuities logic)

**Quando sei bloccato:**

- Mock temporaneamente parti mancanti (es. email service → console.log)
- Testa singoli service con script temporanei prima di integrare

**Commit strategy:**

- Commit dopo ogni punto completato

---

## 15. Sistema di Logging

### 15.1 Overview

Il progetto utilizza **Winston** per un sistema di logging professionale con rotazione automatica dei file.

**Caratteristiche:**

- ✅ Log persistenti su file (non si perdono al riavvio)
- ✅ Rotazione automatica giornaliera
- ✅ File separati per tipo (combined, error, cron)
- ✅ Formato JSON strutturato per parsing
- ✅ Console colorata in sviluppo
- ✅ Retention automatica (14-30 giorni)

### 15.2 Struttura File Log

```
backend/logs/
├── combined-YYYY-MM-DD.log   # Tutti i log (info, warn, error)
├── error-YYYY-MM-DD.log      # Solo errori
└── cron-YYYY-MM-DD.log       # Log del cron job
```

**Configurazione rotazione:**

- **combined**: Max 20MB/file, retention 14 giorni
- **error**: Max 20MB/file, retention 30 giorni
- **cron**: Max 10MB/file, retention 30 giorni

### 15.3 Utilizzo nel Codice

**Import:**

```typescript
import {
  logInfo,
  logError,
  logWarn,
  logCron,
  logCronError,
} from "./services/logger.service";
```

**Esempi:**

```typescript
// Log generico
logInfo("[SERVICE_NAME] Operazione completata", { userId: 123 });

// Log errore
logError("[SERVICE_NAME] Errore durante operazione", error);

// Log cron (va sia su cron.log che combined.log)
logCron("[CRON] Job completato", { processed: 10, sent: 5 });
logCronError("[CRON] Errore job", error);
```

**Formato output (JSON):**

```json
{
  "timestamp": "2025-12-12 12:00:00",
  "level": "info",
  "message": "[CRON] 🔔 Esecuzione job notifiche automatiche",
  "stats": {
    "processed": 5,
    "sent": 3,
    "skipped": 1,
    "failed": 1
  }
}
```

### 15.4 Accesso ai Log in Produzione

**Via File Manager cPanel:**

1. Naviga in `backend/logs/`
2. Scarica il file `.log` del giorno corrente

**Via FTP/SFTP:**

- Scarica dalla cartella `/logs/`

**Via SSH (se disponibile):**

```bash
# Visualizza ultimi 100 log
tail -n 100 logs/combined-$(date +%Y-%m-%d).log

# Segui log in tempo reale
tail -f logs/combined-$(date +%Y-%m-%d).log

# Solo log del cron
tail -f logs/cron-$(date +%Y-%m-%d).log

# Cerca errori
grep -i "error" logs/combined-$(date +%Y-%m-%d).log
```

### 15.5 Verifica Cron Job

**Metodo 1: Controllare i log**

```bash
# Cerca esecuzioni cron
grep "Esecuzione job notifiche" logs/cron-$(date +%Y-%m-%d).log

# Verifica statistiche
grep "Job completato" logs/cron-$(date +%Y-%m-%d).log
```

**Metodo 2: Controllare tabella notifications**

```sql
SELECT * FROM notifications
WHERE sent_at >= CURRENT_DATE
ORDER BY sent_at DESC;
```

**Metodo 3: Endpoint di test (opzionale)**

- Creare endpoint `POST /api/cron/trigger` (solo admin)
- Permette di triggerare manualmente il job per test

### 15.6 Configurazione Ambiente

**Nessuna variabile d'ambiente richiesta** - il logger funziona out-of-the-box.

**Comportamento per ambiente:**

- **Development**: Log su console (colorati) + file
- **Production**: Solo file (no console)
- **Test**: Nessun log (evita spam nei test)

### 15.7 Troubleshooting

**Problema: Log non vengono creati**

- Verifica permessi cartella `logs/` (deve essere scrivibile)
- Controlla che Winston sia installato: `npm list winston`

**Problema: File log troppo grandi**

- La rotazione è automatica (max 20MB)
- Se necessario, riduci retention in `logger.service.ts`

**Problema: Non vedo log del cron**

- Verifica che il cron sia attivo (log inizializzazione)
- Controlla `CRON_NOTIFICATION_TIME` in `.env`
- Testa manualmente: `await notificationService.sendExpiringContractsNotifications()`

---

## 16. Best Practices

- **Logging:** Usa `logInfo()`, `logError()`, `logCron()` da `logger.service.ts` invece di `console.log()`. I log vengono salvati automaticamente su file in produzione.
- **Error handling:** Mai esporre stack trace in produzione
- **Validazione:** Sempre validare input utente (Zod)
- **Query optimization:** Usa indici DB per query frequenti
- **Transactions:** Usa Knex transactions per operazioni multi-tabella (es. create contract + annuities)
- **Security:** Mai loggare password, tokens completi
- **Testing:** Mock date con `jest.useFakeTimers()` per test cron
- **Migrations:** Mai modificare migration già eseguita in prod (crea nuova migration)
- **Cron Monitoring:** Controlla regolarmente `logs/cron-YYYY-MM-DD.log` per verificare esecuzioni

---

**Fine PRD Backend**
