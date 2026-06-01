import React, { useState, useEffect } from "react";
import * as API from "../services/api.js";
import { T } from "../constants/translations.js";

const PROVINCES = [
  "Bali","DKI Jakarta","Jawa Barat","Jawa Tengah","Jawa Timur",
  "Sumatera Utara","Sumatera Selatan","Kalimantan Timur",
  "Sulawesi Selatan","Yogyakarta","Banten","Riau","Lampung",
  "Kalimantan Selatan","Sulawesi Utara","Papua",
];

const LANGUAGES = [
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "en", label: "English",          flag: "🇬🇧" },
];

export default function Settings({ profile, onProfileUpdate, darkMode, onToggleDark, lang, onToggleLang }) {
  const [tab, setTab]       = useState("profil");
  const [form, setForm]     = useState({ name:"", city:"", province:"", umr_value:"" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");
  const text = T[lang] || T.en;

  // Sync form when profile loads
  useEffect(() => {
    if (profile) setForm({
      name:      profile.name      ?? "",
      city:      profile.city      ?? "",
      province:  profile.province  ?? "",
      umr_value: profile.umr_value ? String(profile.umr_value) : "",
    });
  }, [profile]);

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
      const updated = await API.updateProfile({
        name:      form.name.trim(),
        city:      form.city.trim()    || null,
        province:  form.province       || null,
        umr_value: form.umr_value ? Number(form.umr_value) : 0,
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
    { id: "profil",       label: text.profileTab  },
    { id: "tampilan",     label: text.appearanceTab },
    { id: "bahasa",       label: text.languageTab },
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
                <input className="page-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder={text.namePlaceholder} />
              </div>
              <div className="page-grid-2">
                <div>
                  <label className="page-label">{text.cityLabel}</label>
                  <input className="page-input" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder={text.cityPlaceholder} />
                </div>
                <div>
                  <label className="page-label">{text.provinceLabel}</label>
                  <select className="page-input" style={{ cursor: "pointer" }} value={form.province} onChange={e => setForm(p => ({ ...p, province: e.target.value }))}>
                    <option value="">{text.provinceOption}</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="page-label">
                  {text.umrLabel} <span style={{ fontWeight: 400, opacity: 0.7 }}>{text.umrHint}</span>
                </label>
                <input className="page-input" type="number" value={form.umr_value} onChange={e => setForm(p => ({ ...p, umr_value: e.target.value }))} placeholder={text.umrPlaceholder} />
              </div>
            </div>

            {error && (
              <div className="page-error">
                {error}
              </div>
            )}

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

            {/* Dark mode toggle */}
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

            <div className="language-note">
              {text.languageNote}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
