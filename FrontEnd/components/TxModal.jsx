import { useState } from "react";
import { VALID_CATEGORIES, CAT_ICONS } from "../constants/categories.js";
import { todayWIB } from "../utils/format.js";

export default function TxModal({ onSave, onClose, defaultType = "expense" }) {
  const [form, setForm] = useState({
    type:        defaultType,
    amount:      "",
    date:        todayWIB(),
    description: "",
    category:    VALID_CATEGORIES[0],
  });

  const upd      = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const isIncome = form.type === "income";

  const handleSave = () => {
    if (!form.amount || !form.date) return;
    onSave({
      type:        form.type,
      amount:      Number(form.amount),
      date:        form.date,
      description: form.description || null,
      category:    isIncome ? null : form.category,
    });
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
      zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ background: "white", borderRadius: 20, padding: 24, width: 360, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: "#2D4A1E", marginBottom: 16 }}>
          Tambah Transaksi
        </div>

        {/* Type toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {["income", "expense"].map((t) => (
            <button
              key={t}
              onClick={() => upd("type", t)}
              style={{
                flex: 1, padding: 8, borderRadius: 10, cursor: "pointer",
                border: "2px solid", fontWeight: 700, fontSize: 13,
                borderColor: form.type === t ? "#4A7A32" : "#e0e0e0",
                background:  form.type === t ? "#4A7A32" : "white",
                color:       form.type === t ? "white"   : "#888",
              }}
            >
              {t === "income" ? "💚 Pemasukan" : "🔴 Pengeluaran"}
            </button>
          ))}
        </div>

        <input
          type="number" placeholder="Jumlah (Rp)" value={form.amount}
          onChange={(e) => upd("amount", e.target.value)}
          style={inputStyle}
        />
        <input
          type="date" value={form.date}
          onChange={(e) => upd("date", e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Deskripsi (opsional)" value={form.description}
          onChange={(e) => upd("description", e.target.value)}
          style={inputStyle}
        />

        {/* Kategori — hanya expense */}
        {!isIncome && (
          <select
            value={form.category}
            onChange={(e) => upd("category", e.target.value)}
            style={{ ...inputStyle, background: "white" }}
          >
            {VALID_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>
            ))}
          </select>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #C8D4A0", background: "white", cursor: "pointer", fontWeight: 600, color: "#888" }}
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: "#4A7A32", color: "white", cursor: "pointer", fontWeight: 700 }}
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 10,
  border: "1px solid #C8D4A0", fontSize: 14,
  marginBottom: 10, boxSizing: "border-box", fontFamily: "inherit",
};