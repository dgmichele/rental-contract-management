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
├── types/
│   └── api.ts
│   └── auth.ts
│   └── database.ts
│   └── index.ts
│   └── shared.ts
├── utils/
│   ├── AppError.ts
│   ├── errorHandler.ts
│   └── token.utils.ts
├── .env.dev
├── .env.production
├── .gitignore
├── jest.config.js
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
ACCESS_TOKEN_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=30d

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
ACCESS_TOKEN_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=30d

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

- ✅ HTTPS attivo su `contratti.bichimmobiliare.it`
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

### Fase 1: Setup & Auth (3-4 giorni)

1. Setup progetto, TypeScript, Knex
2. Migrations database (tutte le tabelle)
3. Auth service: register, login, refresh, logout
4. JWT middleware
5. Password reset flow
6. Test auth (alta priorità)

### Fase 2: CRUD Base (3-4 giorni)

7. Owners CRUD
8. Tenants logic (no endpoints diretti, gestiti via contracts)
9. Contracts CRUD base
10. Dashboard stats
11. Rate limiting
12. Error handling

### Fase 3: Logica Avanzata (4-5 giorni)

13. Annuities service (calcolo, generazione)
14. Endpoint annuities
15. Renew contract logic
16. Renew annuity logic
17. Test annuities (alta priorità)

### Fase 4: Email & Cron (3-4 giorni)

18. Email service (Resend integration)
19. React Email templates
20. Notification service + cron job
21. Test cron job (alta priorità)

### Fase 5: Testing & Deploy (2-3 giorni)

22. Test media priorità
23. Fix bugs
24. Deploy su Netsons
25. Verifica produzione

**Totale stimato: 15-20 giorni**

---

## 15. Best Practices

- **Logging:** `console.log('[SERVICE_NAME] Description', { data })` nei punti critici
- **Error handling:** Mai esporre stack trace in produzione
- **Validazione:** Sempre validare input utente (Zod)
- **Query optimization:** Usa indici DB per query frequenti
- **Transactions:** Usa Knex transactions per operazioni multi-tabella (es. create contract + annuities)
- **Security:** Mai loggare password, tokens completi
- **Testing:** Mock date con `jest.useFakeTimers()` per test cron
- **Migrations:** Mai modificare migration già eseguita in prod (crea nuova migration)

---

**Fine PRD Backend**
