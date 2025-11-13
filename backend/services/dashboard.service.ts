import db from "../config/db";
import dayjs from "dayjs";
import {
  DashboardStatsResponse,
  PaginatedResponse,
  GetExpiringContractsQuery,
  ExpiringItem,
  ContractWithRelations,
} from "../types/api";

/**
 * Service per la generazione delle statistiche della dashboard.
 * Tutti i dati sono filtrati per user_id.
 */
export const getStats = async (userId: number): Promise<DashboardStatsResponse> => {
  // ... (getStats è corretto e rimane invariato) ...

  // Conta proprietari
  const totalOwnersResult = await db("owners")
    .where({ user_id: userId })
    .count<{ count: string }>("id as count")
    .first();
  const totalOwners = parseInt(totalOwnersResult?.count || "0", 10);

  // Conta contratti
  const totalContractsResult = await db("contracts")
    .join("owners", "contracts.owner_id", "owners.id")
    .where("owners.user_id", userId)
    .count<{ count: string }>("contracts.id as count")
    .first();
  const totalContracts = parseInt(totalContractsResult?.count || "0", 10);

  // Somma canoni mensili
  const totalMonthlyRentResult = await db("contracts")
    .join("owners", "contracts.owner_id", "owners.id")
    .where("owners.user_id", userId)
    .sum<{ sum: string | null }>("contracts.monthly_rent as sum")
    .first();
  const totalMonthlyRent = parseFloat(totalMonthlyRentResult?.sum || "0");

  // Calcolo scadenze contratti
  const now = dayjs();
  const currentMonth = now.month() + 1; // 1–12
  const currentYear = now.year();
  const nextMonthDate = now.add(1, "month");
  const nextMonth = nextMonthDate.month() + 1;
  const nextYear = nextMonthDate.year();

  // Contratti in scadenza mese corrente
  const expiringContractsCurrentMonthResult = await db("contracts")
    .join("owners", "contracts.owner_id", "owners.id")
    .where("owners.user_id", userId)
    .whereRaw("EXTRACT(MONTH FROM contracts.end_date) = ?", [currentMonth])
    .whereRaw("EXTRACT(YEAR FROM contracts.end_date) = ?", [currentYear])
    .count<{ count: string }>("contracts.id as count")
    .first();
  const expiringContractsCurrentMonth = parseInt(expiringContractsCurrentMonthResult?.count || "0", 10);

  // Contratti in scadenza mese successivo
  const expiringContractsNextMonthResult = await db("contracts")
    .join("owners", "contracts.owner_id", "owners.id")
    .where("owners.user_id", userId)
    .whereRaw("EXTRACT(MONTH FROM contracts.end_date) = ?", [nextMonth])
    .whereRaw("EXTRACT(YEAR FROM contracts.end_date) = ?", [nextYear])
    .count<{ count: string }>("contracts.id as count")
    .first();
  const expiringContractsNextMonth = parseInt(expiringContractsNextMonthResult?.count || "0", 10);

  return {
    totalOwners,
    totalContracts,
    totalMonthlyRent,
    expiringContractsCurrentMonth,
    expiringContractsNextMonth,
  };
};

/**
 * Recupera la lista paginata di contratti e annualità in scadenza
 * per il mese corrente o il mese successivo, filtrati per utente.
 * @param userId ID dell'utente autenticato
 * @param query Parametri di query (period, page, limit)
 * @returns Risposta paginata con gli item in scadenza
 */
export const getExpiringContracts = async (
  userId: number,
  query: GetExpiringContractsQuery
): Promise<PaginatedResponse<ExpiringItem>> => {
  const { period, page = 1, limit = 12 } = query;
  const offset = (page - 1) * limit;

  // 1. Calcolo mese/anno target
  const now = dayjs();
  const targetDate = period === "current" ? now : now.add(1, "month");
  const targetMonth = targetDate.month() + 1; // 1-12
  const targetYear = targetDate.year();

  // 2. Query per contratti in scadenza (end_date)
  const contractsQuery = db("contracts")
    .select(
      "contracts.id as contract_id",
      db.raw("'contract' as expiry_type"), // Tipo scadenza
      "contracts.end_date as expiry_date",
      db.raw("NULL as annuity_year") // Placeholder
    )
    .join("owners", "contracts.owner_id", "owners.id")
    .where("owners.user_id", userId)
    .whereRaw("EXTRACT(MONTH FROM contracts.end_date) = ?", [targetMonth])
    .whereRaw("EXTRACT(YEAR FROM contracts.end_date) = ?", [targetYear]);

  // 3. Query per annualità in scadenza (due_date E is_paid = false)
  const annuitiesQuery = db("annuities")
    .select(
      "annuities.contract_id",
      db.raw("'annuity' as expiry_type"), // Tipo scadenza
      "annuities.due_date as expiry_date",
      "annuities.year as annuity_year"
    )
    .join("contracts", "annuities.contract_id", "contracts.id")
    .join("owners", "contracts.owner_id", "owners.id")
    .where("owners.user_id", userId)
    .where("annuities.is_paid", false)
    .where("contracts.cedolare_secca", false) // Solo contratti NON cedolare secca generano annualità
    .whereRaw("EXTRACT(MONTH FROM annuities.due_date) = ?", [targetMonth])
    .whereRaw("EXTRACT(YEAR FROM annuities.due_date) = ?", [targetYear]);

  // 4. Combina le query (SENZA 'ORDER BY' QUI)
  const baseCombinedQuery = db
    .from(contractsQuery.union(annuitiesQuery).as("expiring_items"));

  // 5. Calcola il totale (usando la query di base CLONATA)
  const totalResult = await baseCombinedQuery.clone().count<{ count: string }>("*").first();
  const total = parseInt(totalResult?.count || "0", 10);
  const totalPages = Math.ceil(total / limit);

  if (total === 0) {
    return {
      success: true,
      data: [],
      pagination: { page, limit, total, totalPages: 0 },
    };
  }

  // 6. Esegui query paginata (usando la base + 'ORDER BY' e 'LIMIT')
  const expiringItemsRaw = await baseCombinedQuery
    .clone() // Clona di nuovo la base
    .orderBy("expiry_date", "asc") // Aggiungi l'ordering QUI
    .limit(limit)
    .offset(offset);

  const contractIds = expiringItemsRaw.map((item: any) => item.contract_id);

  // 7. Idrata i risultati: recupera i dettagli completi dei contratti
  const contracts = await db("contracts")
    .select(
      "contracts.*",
      // Costruisce l'oggetto owner annidato
      db.raw(
        "json_build_object('id', owners.id, 'name', owners.name, 'surname', owners.surname, 'email', owners.email, 'phone', owners.phone, 'user_id', owners.user_id, 'created_at', owners.created_at, 'updated_at', owners.updated_at) as owner"
      ),
      // Costruisce l'oggetto tenant annidato
      db.raw(
        "json_build_object('id', tenants.id, 'name', tenants.name, 'surname', tenants.surname, 'email', tenants.email, 'phone', tenants.phone, 'user_id', tenants.user_id, 'created_at', tenants.created_at, 'updated_at', tenants.updated_at) as tenant"
      )
    )
    .join("owners", "contracts.owner_id", "owners.id")
    .join("tenants", "contracts.tenant_id", "tenants.id")
    .whereIn("contracts.id", contractIds);

  // Mappa i contratti per ID per un accesso rapido
  const contractMap = new Map<number, ContractWithRelations>();
  contracts.forEach((c: any) => {
    // Knex/pg ritorna JSON come stringa se non parsato, assicuriamo che sia un oggetto
    const owner = typeof c.owner === "string" ? JSON.parse(c.owner) : c.owner;
    const tenant = typeof c.tenant === "string" ? JSON.parse(c.tenant) : c.tenant;
    contractMap.set(c.id, { ...c, owner, tenant });
  });

  // 8. Formatta la risposta finale
  const data: ExpiringItem[] = expiringItemsRaw.map((item: any) => ({
    contract: contractMap.get(item.contract_id)!,
    expiryType: item.expiry_type as "contract" | "annuity",
    expiryDate: dayjs(item.expiry_date).toISOString(), // Standardizza formato data
    annuityYear: item.annuity_year || undefined, // Rimuove 'null'
  }));

  return {
    success: true,
    data,
    pagination: { page, limit, total, totalPages },
  };
};