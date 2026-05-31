import React, { useState, useEffect } from "react";
import * as API from "../services/api.js";

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

const TEXT = {
  id: {
    pageTitle: "Pengaturan",
    profileTab: "👤 Edit Profil",
    appearanceTab: "🎨 Tampilan",
    languageTab: "🌐 Bahasa",
    profileHeading: "Informasi Profil",
    nameLabel: "Nama Lengkap *",
    namePlaceholder: "Nama kamu",
    cityLabel: "Kota",
    provinceLabel: "Provinsi",
    provinceOption: "Pilih provinsi",
    umrLabel: "UMR Daerah",
    umrHint: "(untuk rekomendasi AI)",
    umrPlaceholder: "contoh: 3000000",
    saveButton: "Simpan Perubahan",
    savingText: "Menyimpan...",
    savedText: "✅ Tersimpan!",
    appearanceHeading: "Tampilan Aplikasi",
    darkModeLabel: "🌙 Mode Gelap",
    darkModeDesc: "Tampilan gelap untuk malam hari",
    modeActiveDark: "🌙 Mode gelap aktif",
    modeActiveLight: "☀️ Mode terang aktif",
    languageHeading: "Pilih Bahasa",
    languageIdDesc: "Tampilan dalam Bahasa Indonesia",
    languageEnDesc: "Display in English",
    languageNote: "* Perubahan bahasa bersifat preferensi tampilan saja.",
    nameRequired: "Nama tidak boleh kosong.",
    saveError: "Gagal menyimpan: ",
  },
  en: {
    pageTitle: "Settings",
    profileTab: "👤 Edit Profile",
    appearanceTab: "🎨 Appearance",
    languageTab: "🌐 Language",
    profileHeading: "Profile Information",
    nameLabel: "Full Name *",
    namePlaceholder: "Your name",
    cityLabel: "City",
    provinceLabel: "Province",
    provinceOption: "Choose province",
    umrLabel: "Local Minimum Wage",
    umrHint: "(used for AI recommendations)",
    umrPlaceholder: "e.g. 3000000",
    saveButton: "Save Changes",
    savingText: "Saving...",
    savedText: "✅ Saved!",
    appearanceHeading: "App Appearance",
    darkModeLabel: "🌙 Dark Mode",
    darkModeDesc: "Dark theme for night use",
    modeActiveDark: "🌙 Dark mode active",
    modeActiveLight: "☀️ Light mode active",
    languageHeading: "Choose Language",
    languageIdDesc: "Display in Indonesian",
    languageEnDesc: "Display in English",
    languageNote: "* Language change is display preference only.",
    nameRequired: "Name cannot be empty.",
    saveError: "Failed to save: ",
  },
};

export default function Settings({ profile, onProfileUpdate, darkMode, onToggleDark, lang, onToggleLang }) {
  const [tab, setTab]       = useState("profil");
  const [form, setForm]     = useState({ name:"", city:"", province:"", umr_value:"" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");
  const text = TEXT[lang] || TEXT.id;

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

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 10,
    border: `1.5px solid ${bdr}`, background: inp,
    fontSize: 13, color: txt, fontFamily: "'Poppins', sans-serif",
    outline: "none", transition: "border-color .2s",
  };

  return (
    <div style={{ padding: "24px 28px", fontFamily: "'Poppins', sans-serif", color: txt, animation: "fadeIn .3s ease" }}>
      <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 20, color: txt }}>{text.pageTitle}</div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, borderBottom: `2px solid ${bdr}`, paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 18px", borderRadius: "10px 10px 0 0", border: "none",
            cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: tab === t.id ? "#4A7A32" : "transparent",
            color: tab === t.id ? "white" : sub,
            fontFamily: "inherit", transition: "all .2s",
            marginBottom: -2, borderBottom: tab === t.id ? "2px solid #4A7A32" : "none",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Tab: Edit Profil ── */}
      {tab === "profil" && (
        <div style={{ maxWidth: 520 }}>
          <div style={{ background: card, borderRadius: 18, padding: 24, boxShadow: darkMode ? "0 2px 12px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18, color: txt }}>{text.profileHeading}</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: sub, display: "block", marginBottom: 5 }}>{text.nameLabel}</label>
                <input style={inputStyle} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder={text.namePlaceholder} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: sub, display: "block", marginBottom: 5 }}>{text.cityLabel}</label>
                  <input style={inputStyle} value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Denpasar" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: sub, display: "block", marginBottom: 5 }}>{text.provinceLabel}</label>
                  <select style={{ ...inputStyle, cursor: "pointer" }} value={form.province} onChange={e => setForm(p => ({ ...p, province: e.target.value }))}>
                    <option value="">{text.provinceOption}</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: sub, display: "block", marginBottom: 5 }}>
                  {text.umrLabel} <span style={{ fontWeight: 400, opacity: 0.7 }}>{text.umrHint}</span>
                </label>
                <input style={inputStyle} type="number" value={form.umr_value} onChange={e => setForm(p => ({ ...p, umr_value: e.target.value }))} placeholder={text.umrPlaceholder} />
              </div>
            </div>

            {error && (
              <div style={{ marginTop: 12, fontSize: 12, color: "#C0392B", background: "#fdf0ee", borderRadius: 8, padding: "8px 12px" }}>
                {error}
              </div>
            )}

            <button onClick={handleSave} disabled={saving} style={{
              marginTop: 20, padding: "11px 28px", borderRadius: 12,
              border: "none", background: "#4A7A32", color: "white",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit", transition: "all .2s",
              opacity: saving ? 0.7 : 1,
            }}>
              {saving ? text.savingText : saved ? text.savedText : text.saveButton}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: Tampilan ── */}
      {tab === "tampilan" && (
        <div style={{ maxWidth: 520 }}>
          <div style={{ background: card, borderRadius: 18, padding: 24, boxShadow: darkMode ? "0 2px 12px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18, color: txt }}>{text.appearanceHeading}</div>

            {/* Dark mode toggle */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${bdr}` }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: txt }}>🌙 Mode Gelap</div>
                <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>{text.darkModeDesc}</div>
              </div>
              <button onClick={onToggleDark} style={{
                width: 52, height: 28, borderRadius: 999,
                border: "none", cursor: "pointer",
                background: darkMode ? "#4A7A32" : "#ddd",
                position: "relative", transition: "background .3s",
                padding: 0,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", background: "white",
                  position: "absolute", top: 3,
                  left: darkMode ? 27 : 3,
                  transition: "left .3s",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                }} />
              </button>
            </div>

            <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, background: darkMode ? "rgba(74,122,50,0.15)" : "#F7F9F3", fontSize: 12, color: sub }}>
              {darkMode ? text.modeActiveDark : text.modeActiveLight}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Bahasa ── */}
      {tab === "bahasa" && (
        <div style={{ maxWidth: 520 }}>
          <div style={{ background: card, borderRadius: 18, padding: 24, boxShadow: darkMode ? "0 2px 12px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18, color: txt }}>{text.languageHeading}</div>

            {LANGUAGES.map(l => (
              <div key={l.code} onClick={() => onToggleLang(l.code)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 16px", borderRadius: 12, marginBottom: 8,
                  cursor: "pointer", transition: "all .2s",
                  border: `2px solid ${lang === l.code ? "#4A7A32" : bdr}`,
                  background: lang === l.code ? (darkMode ? "rgba(74,122,50,0.2)" : "#F0F7EC") : card,
                }}>
                <span style={{ fontSize: 24 }}>{l.flag}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: txt }}>{l.label}</div>
                  <div style={{ fontSize: 11, color: sub }}>
                    {l.code === "id" ? text.languageIdDesc : text.languageEnDesc}
                  </div>
                </div>
                {lang === l.code && <span style={{ marginLeft: "auto", color: "#4A7A32", fontSize: 18 }}>✓</span>}
              </div>
            ))}

            <div style={{ marginTop: 8, fontSize: 11, color: sub, fontStyle: "italic" }}>
              {text.languageNote}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
