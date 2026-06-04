/**
 * categories.js
 * Kategori expense disesuaikan dengan VALID_CATEGORIES di model1Service.js
 * (backend akan otomatis mapping: "Makanan & Minuman" → "Makanan",
 *  "Tagihan Tetap" → "Tagihan", "Kost" → "Perumahan")
 */

export const VALID_CATEGORIES = [
  "Makanan & Minuman",
  "Belanja",
  "Transportasi",
  "Tagihan Tetap",
  "Kesehatan",
  "Hiburan",
  "Pendidikan",
  "Pakaian",
  "Sosial",
  "Olahraga",
  "Traveling",
  "Elektronik",
  "Kost",
  "Anak-Anak",
  "Hewan Peliharaan",
];

export const CAT_ICONS = {
  "Makanan & Minuman": "🍽️",
  "Belanja":           "🛍️",
  "Transportasi":      "🚗",
  "Tagihan Tetap":     "📋",
  "Kesehatan":         "💊",
  "Hiburan":           "🎬",
  "Pendidikan":        "📚",
  "Pakaian":           "👕",
  "Sosial":            "👥",
  "Olahraga":          "⚽",
  "Traveling":         "✈️",
  "Elektronik":        "💻",
  "Kost":              "🏠",
  "Anak-Anak":         "🧒",
  "Hewan Peliharaan":  "🐾",
};

export const CAT_COLORS = {
  "Makanan & Minuman": "#4A7A32",
  "Belanja":           "#3D6B25",
  "Transportasi":      "#5E8F3E",
  "Tagihan Tetap":     "#6B9E4A",
  "Kesehatan":         "#3D6B25",
  "Hiburan":           "#5E8F3E",
  "Pendidikan":        "#4A7A32",
  "Pakaian":           "#7AAD56",
  "Sosial":            "#8BBB6A",
  "Olahraga":          "#6B9E4A",
  "Traveling":         "#5E8F3E",
  "Elektronik":        "#4A7A32",
  "Kost":              "#3D6B25",
  "Anak-Anak":         "#7AAD56",
  "Hewan Peliharaan":  "#2D4A1E",
};

export const VALID_INCOME_CATEGORIES = [
  "Gaji",
  "Hadiah",
  "THR",
  "Reimburse",
  "Investasi",
];

export const INCOME_CAT_ICONS = {
  Gaji:      "💼",
  Hadiah:    "🎁",
  THR:       "🪙",
  Reimburse: "🧾",
  Investasi: "📈",
};

export const INCOME_CAT_COLORS = {
  Gaji:      "#1A6B3A",
  Hadiah:    "#2E8B57",
  THR:       "#3AAA6A",
  Reimburse: "#4DB87A",
  Investasi: "#66CC8A",
};

export const VALID_FREQUENCIES = ["daily", "weekly", "monthly"];