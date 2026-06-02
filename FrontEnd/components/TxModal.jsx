import { useState } from "react";
import { T } from "../constants/translations.js";
import { VALID_CATEGORIES, CAT_ICONS, VALID_INCOME_CATEGORIES, INCOME_CAT_ICONS } from "../constants/categories.js";
import { todayWIB } from "../utils/format.js";

export default function TxModal({ onSave, onClose, defaultType = "expense", lang = "en" }) {
  const t = T[lang] || T.en;
  const [form, setForm] = useState({
    type:        defaultType,
    amount:      "",
    date:        todayWIB(),
    description: "",
    category:    defaultType === "income" ? VALID_INCOME_CATEGORIES[0] : VALID_CATEGORIES[0],
  });

  const upd      = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const handleTypeChange = (type) => setForm((p) => ({
    ...p,
    type,
    category: type === "income" ? VALID_INCOME_CATEGORIES[0] : VALID_CATEGORIES[0],
  }));
  const isIncome = form.type === "income";

  const handleSave = () => {
    if (!form.amount || !form.date) return;
    onSave({
      type:        form.type,
      amount:      Number(form.amount),
      date:        form.date,
      description: form.description || null,
      category:    form.category,
    });
    onClose();
  };

  return (
    <div className="tx-modal-backdrop">
      <div className="tx-modal-card">
        <div className="tx-modal-title">{t.txModalTitle}</div>

        <div className="tx-modal-toggle-group">
          {["income", "expense"].map((type) => (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={`tx-modal-toggle-button${form.type === type ? " active" : ""}`}
            >
              {type === "income" ? t.transactionTypeIncome : t.transactionTypeExpense}
            </button>
          ))}
        </div>

        <input
          type="number"
          placeholder={t.amountPlaceholder}
          value={form.amount}
          onChange={(e) => upd("amount", e.target.value)}
          className="tx-modal-input"
        />
        <input
          type="date"
          value={form.date}
          onChange={(e) => upd("date", e.target.value)}
          className="tx-modal-input"
        />
        <input
          placeholder={t.descriptionPlaceholder}
          value={form.description}
          onChange={(e) => upd("description", e.target.value)}
          className="tx-modal-input"
        />

        <select
          value={form.category}
          onChange={(e) => upd("category", e.target.value)}
          className="tx-modal-input"
        >
          {(isIncome ? VALID_INCOME_CATEGORIES : VALID_CATEGORIES).map((c) => (
            <option key={c} value={c}>
              {isIncome ? INCOME_CAT_ICONS[c] : CAT_ICONS[c]} {c}
            </option>
          ))}
        </select>

        <div className="tx-modal-actions">
          <button className="tx-modal-button cancel" onClick={onClose}>{t.cancelBtn}</button>
          <button className="tx-modal-button save" onClick={handleSave}>{t.saveBtn}</button>
        </div>
      </div>
    </div>
  );
}

