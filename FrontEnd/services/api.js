/**
 * src/services/api.js
 * Semua panggilan ke backend Express + Supabase.
 *
 * SETUP:
 *   1. Set VITE_API_URL di file .env: VITE_API_URL=http://localhost:3001
 *   2. Setelah login Supabase: setAuthToken(session.access_token)
 */

import { CAT_ICONS, CAT_COLORS } from "../constants/categories.js";
import { timeAgo, monthLabel }    from "../utils/format.js";

/**
 * API_BASE_URL:
 * - Jika VITE_API_URL di-set di .env → pakai nilai tersebut (untuk production/staging)
 * - Jika tidak di-set → pakai string kosong "" agar request /api/* diteruskan
 *   melalui Vite dev proxy ke backend (menghindari masalah CORS saat development)
 */
export const API_BASE_URL = import.meta.env?.VITE_API_URL ?? "";

let _token = null;
export const setAuthToken   = (t) => { _token = t; };
export const clearAuthToken = ()  => { _token = null; };

async function apiFetch(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (_token) headers["Authorization"] = `Bearer ${_token}`;
  const res  = await fetch(`${API_BASE_URL}${path}`, { ...opts, headers });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

// USER
export async function getProfile() {
  const { data } = await apiFetch("/api/users/me");
  return data;
}
export async function updateProfile(updates) {
  const { data } = await apiFetch("/api/users/me", { method: "PUT", body: JSON.stringify(updates) });
  return data;
}

// ANALYTICS
export async function getDashboardSummary(month) {
  const q = month ? `?month=${month}` : "";
  const { data } = await apiFetch(`/api/analytics/summary${q}`);
  return { sisaBudget: data.net, pemasukan: data.monthly_income, pengeluaran: data.total_expense, growthRate: data.spending_growth_rate, month: data.month };
}
export async function getMonthlyChart(year) {
  const q = year ? `?year=${year}` : "";
  const { data } = await apiFetch(`/api/analytics/chart/monthly${q}`);
  return data.map(d => ({ label: monthLabel(d.month), pemasukan: d.monthly_income, pengeluaran: d.total_expense, month: d.month }));
}
export async function getTrendChart(months = 6) {
  const { data } = await apiFetch(`/api/analytics/chart/trend?months=${months}`);
  return data.map(d => ({ label: monthLabel(d.month), pemasukan: d.monthly_income, pengeluaran: d.total_expense, month: d.month }));
}
export async function getCategoryChart(month) {
  const q = month ? `?month=${month}` : "";
  const { data } = await apiFetch(`/api/analytics/chart/category${q}`);
  return data.map(d => ({ name: d.category, value: d.percentage, total: d.total, color: CAT_COLORS[d.category] || "#8BBB6A" }));
}

export async function getIncomeCategoryChart(month) {
  const q = month ? `?month=${month}&type=income` : "?type=income";
  const { data } = await apiFetch(`/api/analytics/chart/category${q}`);
  return data.map(d => ({ name: d.category, value: d.percentage, total: d.total, color: CAT_COLORS[d.category] || "#8BBB6A" }));
}

// AI
export async function getSpendingLabel(month) {
  try {
    const q = month ? `?month=${month}` : "";
    const { data } = await apiFetch(`/api/ai/spending-label${q}`);
    return { label: data.spending_label ?? data.label ?? "—", confidence: data.label_confidence ?? null, traits: data.label_traits ?? [] };
  } catch {
    return { label: "—", confidence: null, traits: [] };
  }
}
export async function getPrediction() {
  try {
    const { data } = await apiFetch("/api/ai/predict");
    return { prediksi: data.predicted_total_expense ?? data.prediction ?? 0, context: data.context ?? null };
  } catch {
    return { prediksi: 0, context: null };
  }
}
export async function getBudgetRecommendations() {
  try {
    const { data } = await apiFetch("/api/ai/budget-recommendation");
    return { recommendations: data.recommendations ?? [], basedOnCity: data.based_on_city, basedOnUmr: data.based_on_umr };
  } catch {
    return { recommendations: [], basedOnCity: null, basedOnUmr: null };
  }
}
export async function getAiResults(month) {
  const q = month ? `?month=${month}` : "";
  const { data } = await apiFetch(`/api/ai/results${q}`);
  return data;
}

// TRANSACTIONS
export async function listTransactions({ type, category, month, year, page = 1, limit = 20 } = {}) {
  const p = new URLSearchParams();
  if (type)     p.set("type", type);
  if (category) p.set("category", category);
  if (month)    p.set("month", month);
  if (year)     p.set("year", year);
  p.set("page", String(page)); p.set("limit", String(limit));
  const { data, pagination } = await apiFetch(`/api/transactions?${p}`);
  return { data, pagination };
}
export async function createTransaction(tx) {
  const { data } = await apiFetch("/api/transactions", { method: "POST", body: JSON.stringify(tx) });
  return data;
}
export async function updateTransaction(id, updates) {
  const { data } = await apiFetch(`/api/transactions/${id}`, { method: "PUT", body: JSON.stringify(updates) });
  return data;
}
export async function deleteTransaction(id) {
  return apiFetch(`/api/transactions/${id}`, { method: "DELETE" });
}

// BUDGETS
export async function listBudgets(month) {
  const q = month ? `?month=${month}` : "";
  const { data } = await apiFetch(`/api/budgets${q}`);
  return data;
}
export async function createBudget({ category, limit_amount, month }) {
  const { data } = await apiFetch("/api/budgets", { method: "POST", body: JSON.stringify({ category, limit_amount, month }) });
  return data;
}
export async function updateBudget(id, limit_amount) {
  const { data } = await apiFetch(`/api/budgets/${id}`, { method: "PUT", body: JSON.stringify({ limit_amount }) });
  return data;
}
export async function deleteBudget(id) {
  return apiFetch(`/api/budgets/${id}`, { method: "DELETE" });
}

// RECURRING
export async function listRecurring(isActive) {
  const q = isActive !== undefined ? `?is_active=${isActive}` : "";
  const { data } = await apiFetch(`/api/recurring${q}`);
  return data.map(r => ({ ...r, icon: CAT_ICONS[r.category] || "🔄", color: CAT_COLORS[r.category] || "#4A7A32" }));
}
export async function createRecurring(rec) {
  const { data } = await apiFetch("/api/recurring", { method: "POST", body: JSON.stringify(rec) });
  return data;
}
export async function updateRecurring(id, updates) {
  const { data } = await apiFetch(`/api/recurring/${id}`, { method: "PUT", body: JSON.stringify(updates) });
  return data;
}
export async function deleteRecurring(id) {
  return apiFetch(`/api/recurring/${id}`, { method: "DELETE" });
}
export async function activateRecurring(id) {
  const { data } = await apiFetch(`/api/recurring/${id}/activate`, { method: "POST" });
  return data;
}

// NOTIFICATIONS
export async function listNotifications(isReadFilter) {
  const q = isReadFilter !== undefined ? `?is_read=${isReadFilter}` : "";
  const { data } = await apiFetch(`/api/notifications${q}`);
  return data.map(n => ({ id: n.id, type: n.type, title: n.title, msg: n.message ?? n.body ?? "", time: timeAgo(n.created_at), read: n.is_read }));
}
export async function getUnreadCount() {
  const res = await apiFetch("/api/notifications/unread-count");
  return res.count ?? 0;
}
export async function markNotifRead(id) {
  return apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" });
}
export async function markAllNotifRead() {
  return apiFetch("/api/notifications/read-all", { method: "PATCH" });
}

export async function checkHealth() {
  return fetch(`${API_BASE_URL}/health`).then(r => r.json());
}