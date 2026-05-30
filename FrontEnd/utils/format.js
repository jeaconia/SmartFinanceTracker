/**
 * format.js
 * Utility functions for formatting numbers, dates, and other data
 */

/**
 * Format number as IDR currency
 * @param {number} n - Number to format
 * @returns {string} Formatted currency string
 */
export const fmt = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n ?? 0);

/**
 * Format number as short suffix (jt = jutaan, rb = ribuan)
 * @param {number} n - Number to format
 * @returns {string} Shortened number string
 */
export const fmtS = (n) => {
  n = n ?? 0;
  return n >= 1e6
    ? `${(n / 1e6).toFixed(1)}jt`
    : n >= 1e3
    ? `${(n / 1e3).toFixed(0)}rb`
    : `${n}`;
};

/**
 * Get current month as YYYY-MM string
 * @returns {string} Current month in YYYY-MM format
 */
export const currentMonthStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * Format month string (YYYY-MM) to short label (Jan, Feb, etc.)
 * @param {string} monthStr - Month in YYYY-MM format
 * @returns {string} Short month label
 */
export const monthLabel = (monthStr) => {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleString("id-ID", { month: "short" });
};

/**
 * Calculate time ago string (e.g., "2 jam lalu")
 * @param {string|Date} dateStr - ISO date string or Date object
 * @returns {string} Human-readable time difference
 */
export const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d lalu`;
  
  return date.toLocaleDateString("id-ID");
};

/**
 * Format date to DD/MM/YYYY
 * @param {string|Date} dateStr - ISO date string or Date object
 * @returns {string} Formatted date
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID");
};
