/**
 * pages/AuthPage.jsx
 * Halaman Login & Register — terhubung ke Supabase Auth.
 * Setelah login berhasil, otomatis buat row di public.users jika belum ada (Register).
 */
import React, { useState } from "react";
import { supabase } from "../services/supabase.js";

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

export default function AuthPage({ onAuth }) {
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
    if (password !== confirm) return setError("Password tidak cocok.");
    if (password.length < 8)  return setError("Password minimal 8 karakter.");
    setStep(2);
  };

  // ── Register step 2 → Supabase signUp + insert public.users ─────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);

    // 1. Buat akun di Supabase Auth
    const { data, error: signErr } = await supabase.auth.signUp({ email, password });
    if (signErr) { setLoading(false); return setError(signErr.message); }

    const userId = data.user?.id;
    if (!userId) { setLoading(false); return setError("Gagal membuat akun."); }

    // 2. Insert profil ke public.users
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
    if (dbErr) return setError("Akun dibuat, tapi gagal simpan profil: " + dbErr.message);

    // 3. Auto-login (Supabase sudah return session jika email confirm dinonaktifkan)
    if (data.session) {
      onAuth(data.session);
    } else {
      // Jika Supabase butuh konfirmasi email
      setError("");
      setMode("login");
      reset();
      alert("Akun berhasil dibuat! Cek email untuk konfirmasi, lalu login.");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: CREAM,
      fontFamily: "'DM Sans', sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        .auth-input{
          width:100%;padding:11px 14px;border-radius:10px;
          border:1.5px solid ${LIGHT};background:white;
          font-size:14px;font-family:inherit;outline:none;
          transition:border-color .2s;
        }
        .auth-input:focus{border-color:${GREEN};}
        .auth-btn{
          width:100%;padding:13px;border-radius:12px;border:none;
          background:${GREEN};color:white;font-size:15px;font-weight:700;
          font-family:inherit;cursor:pointer;transition:all .2s;
          letter-spacing:.2px;
        }
        .auth-btn:hover{background:${DARK_GREEN};}
        .auth-btn:disabled{opacity:.6;cursor:not-allowed;}
        .auth-link{
          background:none;border:none;color:${GREEN};font-size:13px;
          font-weight:600;cursor:pointer;text-decoration:underline;
          font-family:inherit;padding:0;
        }
      `}</style>

      <div style={{ display: "flex", width: "100%", maxWidth: 900, minHeight: 560, borderRadius: 24, overflow: "hidden", boxShadow: "0 24px 64px rgba(45,74,30,.18)" }}>

        {/* ── Left panel ── */}
        <div style={{
          width: "44%", background: `linear-gradient(155deg, ${DARK_GREEN} 0%, ${GREEN} 100%)`,
          padding: "48px 40px", display: "flex", flexDirection: "column", justifyContent: "space-between",
          color: "white", position: "relative", overflow: "hidden",
        }}>
          {/* Decorative circles */}
          <div style={{ position:"absolute", top:-60, right:-60, width:220, height:220, borderRadius:"50%", border:"1px solid rgba(255,255,255,.1)" }} />
          <div style={{ position:"absolute", bottom:-80, left:-40, width:260, height:260, borderRadius:"50%", border:"1px solid rgba(255,255,255,.08)" }} />

          <div style={{ position:"relative", zIndex:1 }}>
            <div style={{ fontSize:28, marginBottom:10 }}>💰</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:800, lineHeight:1.2, marginBottom:12 }}>
              Smart Finance<br />Tracker
            </div>
            <div style={{ fontSize:14, opacity:.75, lineHeight:1.7 }}>
              Pantau keuanganmu dengan cerdas. Analisis AI, budgeting, dan laporan otomatis dalam satu tempat.
            </div>
          </div>

          <div style={{ position:"relative", zIndex:1 }}>
            {[
              ["📊", "Dashboard analitik real-time"],
              ["🤖", "AI spending label & prediksi"],
              ["📋", "Budgeting & reminder otomatis"],
            ].map(([icon, text]) => (
              <div key={text} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, fontSize:13 }}>
                <span>{icon}</span>
                <span style={{ opacity:.85 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div style={{
          flex:1, background:"white", padding:"48px 44px",
          display:"flex", flexDirection:"column", justifyContent:"center",
          animation: "fadeUp .4s ease",
        }}>
          {mode === "login" ? (
            <>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:800, color:"#1a1a1a", marginBottom:6 }}>Selamat datang 👋</div>
              <div style={{ fontSize:13, color:"#999", marginBottom:28 }}>Masuk ke akun Smart Finance Tracker kamu</div>

              <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>Email</label>
                  <input className="auth-input" type="email" placeholder="kamu@email.com" value={email} onChange={e=>setEmail(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>Password</label>
                  <input className="auth-input" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required />
                </div>

                {error && <div style={{ fontSize:12, color:"#C0392B", background:"#fdf0ee", borderRadius:8, padding:"8px 12px", border:"1px solid #f5c6be" }}>{error}</div>}

                <button className="auth-btn" type="submit" disabled={loading}>
                  {loading ? "Masuk..." : "Masuk"}
                </button>
              </form>

              <div style={{ textAlign:"center", marginTop:20, fontSize:13, color:"#aaa" }}>
                Belum punya akun?{" "}
                <button className="auth-link" onClick={() => { reset(); setMode("register"); }}>Daftar sekarang</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:800, color:"#1a1a1a", marginBottom:6 }}>
                {step === 1 ? "Buat akun baru" : "Lengkapi profilmu"}
              </div>
              <div style={{ fontSize:13, color:"#999", marginBottom:24 }}>
                {step === 1 ? "Langkah 1 dari 2 — Info akun" : "Langkah 2 dari 2 — Info profil"}
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
                    <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>Email</label>
                    <input className="auth-input" type="email" placeholder="kamu@email.com" value={email} onChange={e=>setEmail(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>Password</label>
                    <input className="auth-input" type="password" placeholder="Min. 8 karakter" value={password} onChange={e=>setPassword(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>Konfirmasi Password</label>
                    <input className="auth-input" type="password" placeholder="Ulangi password" value={confirm} onChange={e=>setConfirm(e.target.value)} required />
                  </div>

                  {error && <div style={{ fontSize:12, color:"#C0392B", background:"#fdf0ee", borderRadius:8, padding:"8px 12px", border:"1px solid #f5c6be" }}>{error}</div>}

                  <button className="auth-btn" type="submit">Lanjut →</button>
                </form>
              ) : (
                <form onSubmit={handleRegister} style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>Nama Lengkap *</label>
                    <input className="auth-input" type="text" placeholder="Nama kamu" value={name} onChange={e=>setName(e.target.value)} required />
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    <div>
                      <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>Kota</label>
                      <input className="auth-input" type="text" placeholder="Denpasar" value={city} onChange={e=>setCity(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>Provinsi</label>
                      <select className="auth-input" value={province} onChange={e=>setProvince(e.target.value)} style={{ cursor:"pointer" }}>
                        <option value="">Pilih provinsi</option>
                        {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:5 }}>
                      UMR Daerah <span style={{ fontWeight:400, color:"#aaa" }}>(opsional, untuk rekomendasi AI)</span>
                    </label>
                    <input className="auth-input" type="number" placeholder="cth: 3000000" value={umr} onChange={e=>setUmr(e.target.value)} />
                  </div>

                  {error && <div style={{ fontSize:12, color:"#C0392B", background:"#fdf0ee", borderRadius:8, padding:"8px 12px", border:"1px solid #f5c6be" }}>{error}</div>}

                  <div style={{ display:"flex", gap:8 }}>
                    <button type="button" onClick={() => { setStep(1); setError(""); }}
                      style={{ flex:1, padding:13, borderRadius:12, border:`1.5px solid ${LIGHT}`, background:"white", color:"#555", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                      ← Kembali
                    </button>
                    <button className="auth-btn" type="submit" disabled={loading} style={{ flex:2 }}>
                      {loading ? "Mendaftar..." : "Daftar & Masuk"}
                    </button>
                  </div>
                </form>
              )}

              <div style={{ textAlign:"center", marginTop:20, fontSize:13, color:"#aaa" }}>
                Sudah punya akun?{" "}
                <button className="auth-link" onClick={() => { reset(); setMode("login"); }}>Login</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
