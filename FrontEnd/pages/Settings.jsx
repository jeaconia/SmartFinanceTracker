import React, { useState, useEffect } from "react";
import * as API from "../services/api.js";
import { T } from "../constants/translations.js";

// Province → Cities mapping (sesuai CITY_UMR di backend)
const PROVINCE_CITIES = {
  "DKI Jakarta":          ["Jakarta"],
  "Jawa Barat":           ["Bandung", "Bekasi", "Bogor", "Cirebon", "Depok", "Sukabumi", "Tasikmalaya"],
  "Jawa Tengah":          ["Semarang", "Solo", "Magelang", "Purwokerto"],
  "Jawa Timur":           ["Surabaya", "Malang", "Kediri", "Blitar", "Madiun", "Probolinggo", "Mojokerto", "Jember", "Banyuwangi"],
  "Banten":               ["Tangerang", "Serang", "Cilegon"],
  "DI Yogyakarta":        ["Yogyakarta"],
  "Bali":                 ["Denpasar"],
  "Sumatera Utara":       ["Medan"],
  "Sumatera Barat":       ["Padang"],
  "Sumatera Selatan":     ["Palembang"],
  "Riau":                 ["Pekanbaru"],
  "Kepulauan Riau":       ["Batam"],
  "Lampung":              ["Bandar Lampung"],
  "Jambi":                ["Jambi"],
  "Bengkulu":             ["Bengkulu"],
  "Kalimantan Timur":     ["Balikpapan", "Samarinda", "Bontang", "Tarakan"],
  "Kalimantan Selatan":   ["Banjarmasin"],
  "Kalimantan Tengah":    ["Palangkaraya"],
  "Sulawesi Selatan":     ["Makassar", "Pare-pare"],
  "Sulawesi Utara":       ["Manado", "Bitung", "Tomohon"],
  "Sulawesi Tenggara":    ["Kendari"],
  "Sulawesi Tengah":      ["Palu"],
  "Gorontalo":            ["Gorontalo"],
  "Kalimantan Barat":     ["Pontianak"],
  "Maluku":               ["Ambon"],
  "Maluku Utara":         ["Ternate"],
  "Nusa Tenggara Barat":  ["Mataram"],
  "Nusa Tenggara Timur":  ["Kupang"],
  "Papua":                ["Jayapura"],
  "Papua Barat":          ["Sorong"],
};

const PROVINCES = Object.keys(PROVINCE_CITIES).sort();

const LANGUAGES = [
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "en", label: "English",          flag: "🇬🇧" },
];

export default function Settings({ profile, onProfileUpdate, darkMode, onToggleDark, lang, onToggleLang }) {
  const [tab, setTab]       = useState("profil");
  const [form, setForm]     = useState({ name:"", city:"", province:"" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");
  const text = T[lang] || T.en;

  // Sync form when profile loads
  useEffect(() => {
    if (profile) setForm({
      name:     profile.name     ?? "",
      city:     profile.city     ?? "",
      province: profile.province ?? "",
    });
  }, [profile]);

  // Cities for selected province
  const availableCities = form.province ? (PROVINCE_CITIES[form.province] || []) : [];

  const handleProvinceChange = (province) => {
    const cities = PROVINCE_CITIES[province] || [];
    setForm(p => ({
      ...p,
      province,
      // auto-select first city if only one option, else reset
      city: cities.length === 1 ? cities[0] : "",
    }));
  };

  const bg   = darkMode ? "#111c0b" : "#F0EDD8";
  const card = darkMode ? "#1a2a12" : "white";
  const txt  = darkMode ? "#e8f5e0" : "#1a1a1a";
  const sub  = darkMode ? "#8BBB6A" : "#666";
  const bdr  = darkMode ? "#2D4A1E" : "#C8D4A0";
  const inp  = darkMode ? "#243318" : "white";

  const handleSave = async () => {
    if (!form.name.trim()) return setError(text.nameRequired);
    setError(""); setSaving(true);
    try {
      // Kirim city & province; backend akan auto-set umr_value dari CITY_UMR
      const updated = await API.updateProfile({
        name:     form.name.trim(),
        city:     form.city || null,
        province: form.province || null,
      });
      onProfileUpdate(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(text.saveError + e.message);
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { id: "profil",   label: text.profileTab },
    { id: "tampilan", label: text.appearanceTab },
    { id: "bahasa",   label: text.languageTab },
  ];

  const themeVars = {
    "--txt": txt,
    "--sub": sub,
    "--bdr": bdr,
    "--card": card,
    "--inp": inp,
    "--card-secondary": darkMode ? "rgba(74,122,50,0.15)" : "#F7F9F3",
    "--card-active": darkMode ? "rgba(74,122,50,0.2)" : "#F0F7EC",
  };

  // UMR display — derive from city (same map as backend)
  const CITY_UMR = {
    Jakarta: 5441000, Surabaya: 4525000, Bandung: 4209000, Medan: 3800000,
    Semarang: 3243000, Makassar: 3800000, Palembang: 3600000, Tangerang: 4700000,
    Depok: 4700000, Bekasi: 5500000, Bogor: 4639000, Yogyakarta: 2300000,
    Solo: 2300000, Malang: 3294000, Denpasar: 3000000, Balikpapan: 3300000,
    Samarinda: 3200000, Banjarmasin: 3150000, Pekanbaru: 3500000, Batam: 4500000,
    Padang: 2800000, Manado: 3700000, Pontianak: 2900000, Jayapura: 4000000,
    Kupang: 2200000, Ambon: 3200000, Mataram: 2450000, "Bandar Lampung": 2800000,
    Jambi: 3000000, Bengkulu: 2500000, Palangkaraya: 3300000, Kendari: 3000000,
    Palu: 2800000, Gorontalo: 2800000, Ternate: 3200000, Sorong: 4000000,
    Cirebon: 2500000, Serang: 2700000, Cilegon: 4500000, Sukabumi: 2500000,
    Tasikmalaya: 2100000, Purwokerto: 2000000, Magelang: 2100000, Kediri: 2200000,
    Blitar: 2000000, Madiun: 2000000, Probolinggo: 2100000, Mojokerto: 2300000,
    Jember: 2400000, Banyuwangi: 2400000, "Pare-pare": 2800000, Bitung: 3500000,
    Tomohon: 3000000, Tarakan: 3500000, Bontang: 3500000,
  };

  const derivedUmr = form.city ? CITY_UMR[form.city] : null;
  const umrDisplay = derivedUmr
    ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(derivedUmr)
    : "—";

  return (
    <div className="page-root" style={themeVars}>
      <div className="page-title">{text.pageTitle}</div>

      {/* Tab bar */}
      <div className="page-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={"page-tab-button " + (tab === t.id ? "active" : "inactive")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Edit Profil ── */}
      {tab === "profil" && (
        <div style={{ maxWidth: 520 }}>
          <div className={"page-card" + (darkMode ? " dark" : "")}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18, color: txt }}>{text.profileHeading}</div>

            <div className="page-input-group">
              <div>
                <label className="page-label">{text.nameLabel}</label>
                <input
                  className="page-input"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder={text.namePlaceholder}
                />
              </div>

              {/* Province first */}
              <div>
                <label className="page-label">{text.provinceLabel}</label>
                <select
                  className="page-input"
                  style={{ cursor: "pointer" }}
                  value={form.province}
                  onChange={e => handleProvinceChange(e.target.value)}
                >
                  <option value="">{text.provinceOption}</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* City — only shown when province selected */}
              {form.province && (
                <div>
                  <label className="page-label">{text.cityLabel}</label>
                  {availableCities.length === 1 ? (
                    <input
                      className="page-input"
                      value={availableCities[0]}
                      readOnly
                      style={{ opacity: 0.7, cursor: "default" }}
                    />
                  ) : (
                    <select
                      className="page-input"
                      style={{ cursor: "pointer" }}
                      value={form.city}
                      onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                    >
                      <option value="">Pilih kota…</option>
                      {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                </div>
              )}

              {/* UMR — read-only, auto dari model */}
              <div>
                <label className="page-label">
                  {text.umrLabel}
                  <span style={{ fontWeight: 400, opacity: 0.7, marginLeft: 6, fontSize: 12 }}>
                    (otomatis dari kota)
                  </span>
                </label>
                <div
                  className="page-input"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    opacity: 0.75,
                    cursor: "default",
                    userSelect: "none",
                    color: derivedUmr ? txt : sub,
                    fontStyle: derivedUmr ? "normal" : "italic",
                    fontSize: 13,
                  }}
                >
                  {derivedUmr ? umrDisplay : "Pilih kota untuk melihat UMR"}
                </div>
              </div>
            </div>

            {error && <div className="page-error">{error}</div>}

            <button
              onClick={handleSave}
              disabled={saving}
              className="page-button"
              style={{ opacity: saving ? 0.7 : 1 }}
            >
              {saving ? text.savingText : saved ? text.savedText : text.saveButton}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: Tampilan ── */}
      {tab === "tampilan" && (
        <div style={{ maxWidth: 520 }}>
          <div className={"page-card" + (darkMode ? " dark" : "")}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18, color: txt }}>{text.appearanceHeading}</div>

            <div className="page-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: txt }}>🌙 Mode Gelap</div>
                <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>{text.darkModeDesc}</div>
              </div>
              <button
                onClick={onToggleDark}
                className="page-toggle-button"
                style={{ background: darkMode ? "#4A7A32" : "#ddd" }}
              >
                <div className="page-toggle-thumb" style={{ left: darkMode ? 27 : 3 }} />
              </button>
            </div>

            <div className="theme-toggle-card">
              {darkMode ? text.modeActiveDark : text.modeActiveLight}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Bahasa ── */}
      {tab === "bahasa" && (
        <div style={{ maxWidth: 520 }}>
          <div className={"page-card" + (darkMode ? " dark" : "")}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18, color: txt }}>{text.languageHeading}</div>

            {LANGUAGES.map(l => (
              <div
                key={l.code}
                onClick={() => onToggleLang(l.code)}
                className={"language-option " + (lang === l.code ? "active" : "inactive")}
              >
                <span className="icon">{l.flag}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: txt }}>{l.label}</div>
                  <div style={{ fontSize: 11, color: sub }}>
                    {l.code === "id" ? text.languageIdDesc : text.languageEnDesc}
                  </div>
                </div>
                {lang === l.code && <span className="check">✓</span>}
              </div>
            ))}

            <div className="language-note">{text.languageNote}</div>
          </div>
        </div>
      )}
    </div>
  );
}