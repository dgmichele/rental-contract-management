import db from "../config/db";
import dayjs from "dayjs";
import { DashboardStatsResponse } from "../types/api";

/**
 * Service per la generazione delle statistiche della dashboard.
 * Tutti i dati sono filtrati per user_id.
 */
export const getStats = async (userId: number): Promise<DashboardStatsResponse> => {
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
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

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
