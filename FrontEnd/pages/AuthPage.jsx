/**
 * pages/AuthPage.jsx
 * Halaman Login & Register — terhubung ke Supabase Auth.
 * Setelah login berhasil, otomatis buat row di public.users jika belum ada (Register).
 */
import React, { useState } from "react";
import { supabase } from "../services/supabase.js";
import { T } from "../constants/translations.js";
import MoniWhite from "../assets/Moni Logo white.png";

const GREEN      = "#4A7A32";

const DARK_GREEN = "#2D4A1E";
const CREAM      = "#F0EDD8";
const LIGHT      = "#C8D4A0";

// Provinsi & kota contoh — bisa diperluas sesuai kebutuhan
const PROVINCES = [
  "Bali", "DKI Jakarta", "Jawa Barat", "Jawa Tengah", "Jawa Timur",
  "Sumatera Utara", "Sumatera Selatan", "Kalimantan Timur",
  "Sulawesi Selatan", "Yogyakarta",
];

export default function AuthPage({ onAuth, lang = "en" }) {
  const [mode, setMode]       = useState("login");   // "login" | "register"
  const [step, setStep]       = useState(1);          // register: step 1 = akun, step 2 = profil
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // Form fields
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [name,     setName]     = useState("");
  const [city,     setCity]     = useState("");
  const [province, setProvince] = useState("");
  const [umr,      setUmr]      = useState("");

  const reset = () => {
    setError(""); setStep(1);
    setEmail(""); setPassword(""); setConfirm("");
    setName(""); setCity(""); setProvince(""); setUmr("");
  };

  // ── Login ────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) return setError(err.message);
    onAuth(data.session);
  };

  // ── Register step 1 → step 2 ─────────────────────────────────────────────
  const handleNextStep = (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError(text.passwordMismatch);
    if (password.length < 8)  return setError(text.passwordShort);
    setStep(2);
  };

  // ── Register step 2 → Supabase signUp + insert public.users ─────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);

    const { data, error: signErr } = await supabase.auth.signUp({ email, password });
    if (signErr) { setLoading(false); return setError(signErr.message); }

    const userId = data.user?.id;
    if (!userId) { setLoading(false); return setError(text.createAccountFailed); }

    const { error: dbErr } = await supabase.from("users").insert({
      id:        userId,
      email,
      name:      name.trim(),
      city:      city.trim()     || null,
      province:  province        || null,
      umr_value: umr ? Number(umr) : 0,
      currency:  "IDR",
    });

    setLoading(false);
    if (dbErr) return setError(text.saveProfileFailed + dbErr.message);

    if (data.session) {
      onAuth(data.session);
    } else {
      setError("");
      setMode("login");
      reset();
      alert(text.accountCreatedMsg);
    }
  };

  const text = T[lang] || T.en;

  return (
    <div className="auth-root" style={{ background: CREAM }}>
      <div className="auth-card">

        {/* ── Left panel ── */}
        <div className="auth-left" style={{ background: `linear-gradient(155deg, ${DARK_GREEN} 0%, ${GREEN} 100%)` }}>
          {/* Decorative circles */}
          <div style={{ position:"absolute", top:-60, right:-60, width:220, height:220, borderRadius:"50%", border:"1px solid rgba(255,255,255,.1)" }} />
          <div style={{ position:"absolute", bottom:-80, left:-40, width:260, height:260, borderRadius:"50%", border:"1px solid rgba(255,255,255,.08)" }} />

          <div style={{ position:"relative", zIndex:1 }}>
            <div>
              <img src={MoniWhite} alt="Moni logo" className="auth-logo-img" />
            </div>
            <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:26, fontWeight:800, lineHeight:1.2, marginBottom:12 }}>
              {text.leftTitle.split("\n").map((l, i) => (<div key={i}>{l}</div>))}
            </div>
            <div style={{ fontSize:14, opacity:.75, lineHeight:1.7 }}>
              {text.leftDesc}
            </div>
          </div>

          <div style={{ position:"relative", zIndex:1 }}>
            {text.features.map(([icon, t]) => (
              <div key={t} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, fontSize:13 }}>
                <span>{icon}</span>
                <span style={{ opacity:.85 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="auth-right">
          {mode === "login" ? (
            <>
              <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:26, fontWeight:800, color:"#1a1a1a", marginBottom:6 }}>{text.loginHeading}</div>
              <div style={{ fontSize:13, color:"#999", marginBottom:28 }}>{text.loginSub}</div>

              <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>{text.emailLabel}</label>
                  <input className="auth-input" type="email" placeholder={text.emailPlaceholder} value={email} onChange={e=>setEmail(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>{text.passwordLabel}</label>
                  <input className="auth-input" type="password" placeholder={text.passwordPlaceholder} value={password} onChange={e=>setPassword(e.target.value)} required />
                </div>

                {error && <div style={{ fontSize:12, color:"#C0392B", background:"#fdf0ee", borderRadius:8, padding:"8px 12px", border:"1px solid #f5c6be" }}>{error}</div>}

                <button className="auth-btn" type="submit" disabled={loading}>
                  {loading ? text.loginLoading : text.loginButton}
                </button>
              </form>

              <div style={{ textAlign:"center", marginTop:20, fontSize:13, color:"#aaa" }}>
                {text.noAccount} {" "}
                <button className="auth-link" onClick={() => { reset(); setMode("register"); }}>{text.signUpNow}</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:26, fontWeight:800, color:"#1a1a1a", marginBottom:6 }}>
                {step === 1 ? text.registerHead1 : text.registerHead2}
              </div>
              <div style={{ fontSize:13, color:"#999", marginBottom:24 }}>
                {step === 1 ? text.step1Title : text.step2Title}
              </div>

              {/* Step indicator */}
              <div style={{ display:"flex", gap:6, marginBottom:24 }}>
                {[1,2].map(s => (
                  <div key={s} style={{ flex:1, height:4, borderRadius:999, background: step >= s ? GREEN : LIGHT, transition:"background .3s" }} />
                ))}
              </div>

              {step === 1 ? (
                <form onSubmit={handleNextStep} style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>{text.emailLabel}</label>
                    <input className="auth-input" type="email" placeholder={text.emailPlaceholder} value={email} onChange={e=>setEmail(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>{text.passwordLabel}</label>
                    <input className="auth-input" type="password" placeholder={text.passwordPlaceholder} value={password} onChange={e=>setPassword(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>{text.confirmPasswordLabel}</label>
                    <input className="auth-input" type="password" placeholder={text.confirmPasswordPlaceholder} value={confirm} onChange={e=>setConfirm(e.target.value)} required />
                  </div>

                  {error && <div style={{ fontSize:12, color:"#C0392B", background:"#fdf0ee", borderRadius:8, padding:"8px 12px", border:"1px solid #f5c6be" }}>{error}</div>}

                  <button className="auth-btn" type="submit">{text.continueButton}</button>
                </form>
              ) : (
                <form onSubmit={handleRegister} style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>{text.fullNameLabel}</label>
                    <input className="auth-input" type="text" placeholder={text.fullNamePlaceholder} value={name} onChange={e=>setName(e.target.value)} required />
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    <div>
                      <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>{text.cityLabel}</label>
                      <input className="auth-input" type="text" placeholder={text.cityPlaceholder} value={city} onChange={e=>setCity(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>{text.provinceLabel}</label>
                      <select className="auth-input" value={province} onChange={e=>setProvince(e.target.value)} style={{ cursor:"pointer" }}>
                        <option value="">{text.provinceOption}</option>
                        {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>
                      {text.localWageLabel} <span style={{ fontWeight:400, color:"#aaa" }}>{text.localWageHint}</span>
                    </label>
                    <input className="auth-input" type="number" placeholder={text.localWagePlaceholder} value={umr} onChange={e=>setUmr(e.target.value)} />
                  </div>

                  {error && <div style={{ fontSize:12, color:"#C0392B", background:"#fdf0ee", borderRadius:8, padding:"8px 12px", border:"1px solid #f5c6be" }}>{error}</div>}

                  <div style={{ display:"flex", gap:8 }}>
                    <button type="button" onClick={() => { setStep(1); setError(""); }}
                      style={{ flex:1, padding:13, borderRadius:12, border:`1.5px solid ${LIGHT}`, background:"white", color:"#555", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                      {text.backButton}
                    </button>
                    <button className="auth-btn" type="submit" disabled={loading} style={{ flex:2 }}>
                      {loading ? text.registerLoading : text.registerButton}
                    </button>
                  </div>
                </form>
              )}

              <div style={{ textAlign:"center", marginTop:20, fontSize:13, color:"#aaa" }}>
                {text.alreadyHaveAccount} {" "}
                <button className="auth-link" onClick={() => { reset(); setMode("login"); }}>{text.signIn}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}