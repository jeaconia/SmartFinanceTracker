import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar.jsx";
import NotifPanel from "./components/NotifPanel.jsx";
import TxModal from "./components/TxModal.jsx";
import BarChart from "./components/charts/BarChart.jsx";
import PieChart from "./components/charts/PieChart.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import Settings from "./pages/Settings.jsx";
import * as API from "./services/api.js";
import { supabase } from "./services/supabase.js";
import { VALID_CATEGORIES, CAT_ICONS, CAT_COLORS, VALID_FREQUENCIES } from "./constants/categories.js";
import { fmt, fmtS, currentMonthStr } from "./utils/format.js";

export default function App() {
  const [session,     setSession]     = useState(undefined);
  const [page,        setPage]        = useState("dashboard");
  const [profile,     setProfile]     = useState(null);
  const [notifs,      setNotifs]      = useState([]);
  const [showNotif,   setShowNotif]   = useState(false);
  const [darkMode,    setDarkMode]    = useState(() => localStorage.getItem("darkMode") === "true");
  const [lang,        setLang]        = useState(() => localStorage.getItem("lang") || "id");

  // ── Theme vars ────────────────────────────────────────────────────────────
  const theme = {
    bg:   darkMode ? "#111c0b" : "#F0EDD8",
    card: darkMode ? "#1a2a12" : "white",
    txt:  darkMode ? "#e8f5e0" : "#1a1a1a",
    sub:  darkMode ? "#8BBB6A" : "#666",
    bdr:  darkMode ? "#2D4A1E" : "#C8D4A0",
    inp:  darkMode ? "#243318" : "white",
  };

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("darkMode", String(next));
  };

  const toggleLang = (code) => {
    setLang(code);
    localStorage.setItem("lang", code);
  };

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) API.setAuthToken(s.access_token);
      setSession(s ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (s) API.setAuthToken(s.access_token);
      else   API.clearAuthToken();
      setSession(s ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    API.getProfile().then(setProfile).catch(() => {});
    API.listNotifications().then(setNotifs).catch(() => {});
  }, [session]);

  const handleAuth = (newSession) => {
    API.setAuthToken(newSession.access_token);
    setSession(newSession);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    API.clearAuthToken();
    setSession(null);
    setProfile(null);
    setNotifs([]);
    setPage("dashboard");
  };

  const handleReadAll = async () => {
    try {
      await API.markAllNotifRead();
      setNotifs(p => p.map(n => ({ ...n, read: true })));
    } catch (e) { console.warn(e); }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (session === undefined) {
    return (
      <div style={{ minHeight:"100vh", background:"#F0EDD8", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Poppins',sans-serif", color:"#4A7A32", fontSize:16, fontWeight:600 }}>
        <span style={{ animation:"pulse 1.2s infinite" }}>💰 Memuat...</span>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      </div>
    );
  }

  if (!session) return <AuthPage onAuth={handleAuth} />;

  return (
    <div style={{ display:"flex", minHeight:"100vh", background: theme.bg, fontFamily:"'Poppins',sans-serif", fontSize:14, transition:"background .3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        button{transition:all .15s;font-family:'Poppins',sans-serif}
        button:hover{filter:brightness(1.06)}
        input,select{font-family:'Poppins',sans-serif;outline:none}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:#C8D4A0;border-radius:3px}
      `}</style>

      <Sidebar
        active={page}
        onChange={p => { setPage(p); setShowNotif(false); }}
        profile={profile}
        onLogout={handleLogout}
        darkMode={darkMode}
      />

      {showNotif && <NotifPanel notifs={notifs} onClose={() => setShowNotif(false)} onReadAll={handleReadAll} />}

      <main style={{ marginLeft:60, flex:1, overflowY:"auto", maxHeight:"100vh" }}>
        {page === "dashboard"  && <Dashboard profile={profile} notifs={notifs} onBell={() => setShowNotif(v => !v)} theme={theme} darkMode={darkMode} />}
        {page === "grafik"     && <Grafik theme={theme} />}
        {page === "budgeting"  && <Budgeting theme={theme} />}
        {page === "catatan"    && <Catatan theme={theme} />}
        {page === "settings"   && (
          <Settings
            profile={profile}
            onProfileUpdate={setProfile}
            darkMode={darkMode}
            onToggleDark={toggleDark}
            lang={lang}
            onToggleLang={toggleLang}
          />
        )}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function Dashboard({ profile, notifs, onBell, theme, darkMode }) {
  const [month, setMonth]   = useState(currentMonthStr);
  const [sum, setSum]     = useState(null);
  const [chart, setChart] = useState([]);
  const [pie, setPie]     = useState([]);
  const [label, setLabel] = useState(null);
  const [showTx, setShowTx] = useState(false);

  useEffect(() => {
    setSum(null);
    API.getDashboardSummary(month).then(setSum).catch(() => {});
    API.getMonthlyChart().then(setChart).catch(() => {});
    API.getCategoryChart(month).then(setPie).catch(() => {});
    API.getSpendingLabel(month).then(setLabel).catch(() => {});
  }, [month]);

  const handleSaveTx = useCallback(async (tx) => {
    await API.createTransaction(tx).catch(() => {});
    API.getDashboardSummary(month).then(setSum).catch(() => {});
  }, [month]);

  const unread = notifs.filter(n => !n.read).length;
  if (!sum) return <div style={{ padding:32, color:"#4A7A32", textAlign:"center" }}>Memuat...</div>;

  const netPositive = sum.sisaBudget >= 0;

  return (
    <div style={{ padding:"20px 24px", animation:"fadeIn .3s ease" }}>
      {showTx && <TxModal onSave={handleSaveTx} onClose={() => setShowTx(false)} />}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <div style={{ color: theme.sub, fontSize:13 }}>Welcome,</div>
          <div style={{ fontSize:26, fontWeight:800, color: theme.txt }}>{profile?.name ?? "—"}</div>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            style={{ padding:"6px 10px", borderRadius:8, border:`1.5px solid ${theme.bdr}`, fontSize:12, fontFamily:"'Poppins',sans-serif", background: theme.card, color: theme.txt, cursor:"pointer" }} />
          <button onClick={() => setShowTx(true)} style={{ background:"#4A7A32", color:"white", border:"none", borderRadius:10, padding:"8px 14px", fontWeight:700, fontSize:12, cursor:"pointer" }}>+ Transaksi</button>
          <button onClick={onBell} style={{ background:"none", border:"none", cursor:"pointer", fontSize:22, position:"relative", padding:4 }}>
            🔔{unread > 0 && <span style={{ position:"absolute", top:0, right:0, background:"#C0392B", color:"white", borderRadius:"50%", width:15, height:15, fontSize:9, display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>{unread}</span>}
          </button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
        <div style={{ background:"linear-gradient(135deg,#3A5C28 0%,#5a6b3a 100%)", borderRadius:18, padding:"18px 20px", color:"white" }}>
          <div style={{ fontSize:12, opacity:0.8, marginBottom:4 }}>Sisa Budget · {sum.month}</div>
          <div style={{ fontSize:30, fontWeight:900, letterSpacing:-1, color:netPositive?"white":"#FFB3B3" }}>{fmtS(sum.sisaBudget)}</div>
          {sum.growthRate !== null && (
            <div style={{ fontSize:11, opacity:0.75, marginBottom:8 }}>
              {sum.growthRate > 0 ? "▲" : "▼"} {Math.abs(sum.growthRate)}% vs bulan lalu
            </div>
          )}
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:10, fontSize:11, opacity:0.85 }}>
            <span>Pemasukan<br /><b style={{ fontSize:13 }}>{fmtS(sum.pemasukan)}</b></span>
            <span style={{ textAlign:"right" }}>Pengeluaran<br /><b style={{ fontSize:13 }}>{fmtS(sum.pengeluaran)}</b></span>
          </div>
        </div>

        <div style={{ background: theme.card, borderRadius:18, padding:"18px 20px", border:`2px solid ${theme.bdr}`, position:"relative", overflow:"hidden" }}>
          <div style={{ fontWeight:800, fontSize:15, color: theme.txt, marginBottom:4 }}>Today's Insight</div>
          {label ? (
            <>
              <div style={{ fontSize:22, fontWeight:900, color:"#4A7A32", marginBottom:4 }}>✨ {label.label}</div>
              {label.traits?.slice(0,2).map((t,i) => <div key={i} style={{ fontSize:11, color: theme.sub, marginBottom:2 }}>• {t}</div>)}
              {label.confidence && <div style={{ fontSize:10, color: theme.sub, marginTop:6 }}>Akurasi AI: {Math.round(label.confidence*100)}%</div>}
            </>
          ) : <div style={{ fontSize:13, color: theme.sub }}>AI service belum tersedia</div>}
          <div style={{ position:"absolute", right:12, bottom:10, fontSize:32, opacity:0.06 }}>🤖</div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 240px", gap:14 }}>
        <div style={{ background: theme.card, borderRadius:18, padding:"18px 20px" }}>
          <div style={{ fontWeight:700, fontSize:14, color: theme.txt, marginBottom:6 }}>Analisis Keuangan Bulanan</div>
          <div style={{ display:"flex", gap:12, marginBottom:4 }}>
            {[["#4A7A32","Pemasukan"],["rgba(74,122,50,0.25)","Pengeluaran"]].map(([c,l]) => (
              <span key={l} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color: theme.sub }}>
                <span style={{ width:8, height:8, borderRadius:2, background:c, display:"inline-block" }} />{l}
              </span>
            ))}
          </div>
          <BarChart data={chart} h={130} />
        </div>

        <div style={{ background:"#2D4A1E", borderRadius:18, padding:"18px 18px", color:"white" }}>
          <div style={{ fontWeight:800, fontSize:14, marginBottom:2 }}>Label Pola Spending</div>
          <div style={{ fontSize:10, opacity:0.7, marginBottom:12 }}>Berdasarkan kategori bulan ini</div>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}><PieChart data={pie} size={90} /></div>
          {pie.map(d => (
            <div key={d.name} style={{ display:"flex", justifyContent:"space-between", fontSize:10, padding:"2px 0", borderBottom:"1px solid rgba(255,255,255,0.12)" }}>
              <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:d.color, display:"inline-block", border:"1px solid rgba(255,255,255,.3)" }} />{d.name}
              </span>
              <span style={{ opacity:0.85 }}>{d.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Grafik({ theme }) {
  const [trendMonths, setTrendMonths] = useState(6);
  const [chart, setChart]       = useState([]);
  const [pieExpense, setPieExpense] = useState([]);
  const [pieIncome, setPieIncome]   = useState([]);
  const [recent, setRecent]     = useState([]);
  const [pred, setPred]         = useState(null);
  const month = currentMonthStr();

  useEffect(() => { API.getTrendChart(trendMonths).then(setChart).catch(() => {}); }, [trendMonths]);
  useEffect(() => {
    API.getCategoryChart(month).then(setPieExpense).catch(() => {});
    API.getIncomeCategoryChart(month).then(setPieIncome).catch(() => {});
    API.listTransactions({}).then(r => setRecent(r.data?.slice(0,6)||[])).catch(() => {});
    API.getPrediction().then(setPred).catch(() => {});
  }, []);

  return (
    <div style={{ padding:"20px 24px", animation:"fadeIn .3s ease" }}>
      <div style={{ fontWeight:800, fontSize:20, color: theme.txt, marginBottom:6 }}>Ringkasan Pengeluaranmu</div>
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {[{l:"6 Bln",v:6},{l:"3 Bln",v:3},{l:"1 Tahun",v:12}].map(({l,v}) => (
          <button key={v} onClick={() => setTrendMonths(v)} style={{ padding:"5px 14px", borderRadius:999, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, background:trendMonths===v?"#4A7A32": theme.card, color:trendMonths===v?"white": theme.sub, transition:"all .2s" }}>{l}</button>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 220px", gap:12, marginBottom:12 }}>
        <div style={{ background: theme.card, borderRadius:18, padding:16 }}>
          <div style={{ fontWeight:700, fontSize:13, color: theme.txt, marginBottom:10 }}>🔴 Pengeluaran per Kategori</div>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}><PieChart data={pieExpense} size={110} /></div>
          {pieExpense.map(d => (
            <div key={d.name} style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"2px 0", borderBottom:`1px solid ${theme.bdr}` }}>
              <span style={{ display:"flex", alignItems:"center", gap:5 }}><span style={{ width:7, height:7, borderRadius:2, background:d.color, display:"inline-block" }} />{CAT_ICONS[d.name]} {d.name}</span>
              <span style={{ color: theme.sub }}>{d.value}% · {fmtS(d.total)}</span>
            </div>
          ))}
        </div>
        <div style={{ background: theme.card, borderRadius:18, padding:16 }}>
          <div style={{ fontWeight:700, fontSize:13, color: theme.txt, marginBottom:10 }}>💚 Pemasukan per Kategori</div>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}><PieChart data={pieIncome} size={110} /></div>
          {pieIncome.map(d => (
            <div key={d.name} style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"2px 0", borderBottom:`1px solid ${theme.bdr}` }}>
              <span style={{ display:"flex", alignItems:"center", gap:5 }}><span style={{ width:7, height:7, borderRadius:2, background:d.color, display:"inline-block" }} />{d.name}</span>
              <span style={{ color: theme.sub }}>{d.value}% · {fmtS(d.total)}</span>
            </div>
          ))}
        </div>
        <div style={{ background: theme.card, borderRadius:18, padding:16, border:`2px solid ${theme.bdr}` }}>
          <div style={{ fontWeight:700, fontSize:13, color: theme.txt, marginBottom:10 }}>🕒 Recent</div>
          {recent.map(t => (
            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
              <span style={{ fontSize:16 }}>{t.type==="income"?"💼":CAT_ICONS[t.category]||"💸"}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:600, color: theme.txt, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.description||"—"}</div>
                <div style={{ fontSize:10, color: theme.sub }}>{t.category||"Pemasukan"} · {t.date}</div>
              </div>
              <div style={{ fontSize:11, fontWeight:700, color:t.type==="income"?"#4CAF50":"#C0392B", whiteSpace:"nowrap" }}>{t.type==="income"?"+":"-"}{fmtS(t.amount)}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 220px", gap:12 }}>
        <div style={{ background: theme.card, borderRadius:18, padding:16 }}>
          <div style={{ fontWeight:700, fontSize:13, color: theme.txt, marginBottom:6 }}>📈 Tren Keuangan</div>
          <div style={{ display:"flex", gap:10, marginBottom:4 }}>
            {[["#4A7A32","Pemasukan"],["rgba(74,122,50,0.25)","Pengeluaran"]].map(([c,l]) => (
              <span key={l} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color: theme.sub }}><span style={{ width:8, height:8, borderRadius:2, background:c, display:"inline-block" }} />{l}</span>
            ))}
          </div>
          <BarChart data={chart} h={140} />
        </div>
        {pred && pred.prediksi > 0 && (
          <div style={{ background:"linear-gradient(135deg,#3A5C28,#5a6b3a)", borderRadius:18, padding:16, color:"white" }}>
            <div style={{ fontWeight:800, fontSize:14, marginBottom:3 }}>🔮 Prediksi Bulan Depan</div>
            <div style={{ fontSize:11, opacity:0.75, marginBottom:8 }}>Berdasarkan AI</div>
            <div style={{ fontSize:26, fontWeight:900 }}>{fmtS(pred.prediksi)}</div>
            {pred.context?.change_pct != null && <div style={{ fontSize:11, opacity:0.8, marginTop:4 }}>{pred.context.change_pct>0?"▲":"▼"} {Math.abs(pred.context.change_pct)}% dari bulan lalu</div>}
          </div>
        )}
      </div>
    </div>
  );
}

function Budgeting({ theme }) {
  const [budgets, setBudgets] = useState([]);
  const [recs, setRecs]       = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState({ category:VALID_CATEGORIES[0], limit_amount:"" });
  const [editId, setEditId]   = useState(null);
  const [editAmt, setEditAmt] = useState("");
  const month = currentMonthStr();

  const reload = useCallback(() => {
    API.listBudgets(month).then(setBudgets).catch(() => {});
    API.getBudgetRecommendations().then(setRecs).catch(() => {});
  }, [month]);
  useEffect(() => { reload(); }, [reload]);

  const overBudgets = budgets.filter(b => b.overbudget);
  const handleAdd = async () => {
    if (!form.category || !form.limit_amount) return;
    await API.createBudget({ category:form.category, limit_amount:Number(form.limit_amount), month }).catch(() => {});
    setForm({ category:VALID_CATEGORIES[0], limit_amount:"" }); setShowAdd(false); reload();
  };
  const handleEdit   = async (b) => { if (!editAmt) return; await API.updateBudget(b.id, Number(editAmt)).catch(() => {}); setEditId(null); reload(); };
  const handleDelete = async (id) => { await API.deleteBudget(id).catch(() => {}); reload(); };

  return (
    <div style={{ padding:"20px 24px", animation:"fadeIn .3s ease" }}>
      <div style={{ fontWeight:800, fontSize:20, color: theme.txt, marginBottom:16 }}>Budgeting · {month}</div>
      {overBudgets.length > 0 && (
        <div style={{ background:"#FDF0EE", border:"1.5px solid #F5C6BE", borderRadius:14, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:22 }}>⚠️</span>
          <div>
            <div style={{ fontWeight:700, color:"#C0392B", fontSize:13 }}>Overbudget Alert!</div>
            <div style={{ fontSize:12, color:"#888" }}>{overBudgets.map(b=>b.category).join(", ")} melebihi anggaran bulan ini</div>
          </div>
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 250px", gap:16 }}>
        <div>
          <div style={{ background: theme.card, borderRadius:18, padding:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontWeight:700, fontSize:14, color: theme.txt }}>Anggaran Bulanan</div>
              <button onClick={() => setShowAdd(v=>!v)} style={{ background:"#4A7A32", color:"white", border:"none", borderRadius:8, padding:"5px 12px", fontSize:12, fontWeight:700, cursor:"pointer" }}>+ Tambah</button>
            </div>
            {showAdd && (
              <div style={{ background: theme.bg, borderRadius:12, padding:12, marginBottom:14, display:"flex", gap:8, flexWrap:"wrap" }}>
                <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} style={{ flex:1, minWidth:120, padding:"7px 10px", borderRadius:8, border:`1px solid ${theme.bdr}`, fontSize:12, background: theme.inp, color: theme.txt }}>
                  {VALID_CATEGORIES.map(c=><option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                </select>
                <input placeholder="Limit (Rp)" type="number" value={form.limit_amount} onChange={e=>setForm(p=>({...p,limit_amount:e.target.value}))} style={{ flex:1, minWidth:120, padding:"7px 10px", borderRadius:8, border:`1px solid ${theme.bdr}`, fontSize:12, background: theme.inp, color: theme.txt }} />
                <button onClick={handleAdd} style={{ background:"#4A7A32", color:"white", border:"none", borderRadius:8, padding:"7px 14px", fontWeight:700, cursor:"pointer", fontSize:12 }}>Simpan</button>
              </div>
            )}
            {budgets.length===0 && <div style={{ textAlign:"center", padding:24, color: theme.sub, fontSize:13 }}>Belum ada anggaran untuk {month}</div>}
            {budgets.map(b => {
              const pct = Math.min(((b.used ?? b.terpakai ?? 0) / b.limit_amount) * 100, 100);
              const isOver = (b.used ?? b.terpakai ?? 0) > b.limit_amount;
              return (
                <div key={b.id} style={{ marginBottom:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, alignItems:"center", gap:8 }}>
                    <span style={{ fontWeight:600, fontSize:13, color: theme.txt }}>{CAT_ICONS[b.category]||"📦"} {b.category}</span>
                    {editId===b.id ? (
                      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                        <input type="number" value={editAmt} onChange={e=>setEditAmt(e.target.value)} style={{ width:110, padding:"3px 8px", borderRadius:7, border:`1px solid ${theme.bdr}`, fontSize:12, background: theme.inp, color: theme.txt }} />
                        <button onClick={()=>handleEdit(b)} style={{ background:"#4A7A32", color:"white", border:"none", borderRadius:6, padding:"3px 10px", fontSize:11, cursor:"pointer" }}>✓</button>
                        <button onClick={()=>setEditId(null)} style={{ background:"none", border:"none", color: theme.sub, cursor:"pointer", fontSize:13 }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:11, color:isOver?"#C0392B": theme.sub }}>{fmtS(b.used ?? b.terpakai ?? 0)} / {fmtS(b.limit_amount)}{isOver?" 🔴":""}</span>
                        <button onClick={()=>{setEditId(b.id);setEditAmt(String(b.limit_amount));}} style={{ border:"none", background:"none", cursor:"pointer", fontSize:12, color:"#8BBB6A" }}>✏️</button>
                        <button onClick={()=>handleDelete(b.id)} style={{ border:"none", background:"none", cursor:"pointer", fontSize:12, color: theme.sub }}>🗑️</button>
                      </div>
                    )}
                  </div>
                  <div style={{ background: theme.bdr, borderRadius:999, height:7, overflow:"hidden" }}>
                    <div style={{ width:`${pct}%`, height:"100%", background:isOver?"#C0392B":"#4A7A32", borderRadius:999, transition:"width .5s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div style={{ background:"#2D4A1E", borderRadius:18, padding:16, color:"white", marginBottom:12 }}>
            <div style={{ fontWeight:800, fontSize:14, marginBottom:10 }}>🤖 Rekomendasi AI</div>
            {recs===null && <div style={{ fontSize:12, opacity:0.7 }}>Memuat...</div>}
            {recs!==null && !Array.isArray(recs?.recommendations) && <div style={{ fontSize:12, opacity:0.7 }}>AI service belum tersedia</div>}
            {Array.isArray(recs?.recommendations) && recs.recommendations.length===0 && <div style={{ fontSize:12, opacity:0.7 }}>Belum ada rekomendasi</div>}
            {Array.isArray(recs?.recommendations) && recs.recommendations.map((r,i) => (
              <div key={i} style={{ background:"rgba(255,255,255,0.12)", borderRadius:10, padding:10, marginBottom:8 }}>
                <div style={{ fontWeight:700, fontSize:12 }}>{CAT_ICONS[r.category]||"💡"} {r.category}</div>
                <div style={{ fontSize:11, opacity:0.85, marginTop:3 }}>Limit rekomendasi: <b>{fmtS(r.recommended_limit)}</b></div>
                <div style={{ fontSize:11, opacity:0.7, marginTop:3, fontStyle:"italic" }}>{r.reason}</div>
              </div>
            ))}
            {recs?.basedOnCity && <div style={{ fontSize:10, opacity:0.55, marginTop:8 }}>Berdasarkan UMR {recs.basedOnCity}</div>}
          </div>
          <div style={{ background: theme.card, borderRadius:18, padding:16, border:`2px solid ${theme.bdr}` }}>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:10, color: theme.txt }}>Distribusi Anggaran</div>
            <div style={{ display:"flex", justifyContent:"center" }}>
              <PieChart data={budgets.map(b=>({ name:b.category, value:b.limit_amount, color:CAT_COLORS[b.category]||"#4A7A32" }))} size={110} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Catatan({ theme }) {
  const [tab, setTab]               = useState("expense");
  const [txs, setTxs]               = useState([]);
  const [recurring, setRecurring]   = useState([]);
  const [pagination, setPagination] = useState(null);
  const [showTx, setShowTx]         = useState(false);
  const [showRecForm, setShowRecForm] = useState(false);
  const [recForm, setRecForm]       = useState({ name:"", amount:"", category:VALID_CATEGORIES[0], frequency:"monthly", next_due_date:"" });
  const [month, setMonth]           = useState(currentMonthStr);

  const reloadTx = useCallback(() => {
    API.listTransactions({ type:tab==="rutin"?undefined:tab, month })
      .then(r => { setTxs(r.data||[]); setPagination(r.pagination); })
      .catch((e) => { console.error('[Catatan] listTransactions error:', e.message); setTxs([]); });
  }, [tab, month]);

  useEffect(() => {
    if (tab==="rutin") API.listRecurring(true).then(setRecurring).catch(() => {});
    else reloadTx();
  }, [tab, reloadTx]);

  const handleSaveTx = async (tx) => {
    try {
      await API.createTransaction(tx);
      reloadTx();
    } catch (err) {
      console.error('[Catatan] createTransaction failed', err);
      alert(`Gagal menyimpan transaksi: ${err.message}`);
    }
  };
  const handleDeleteTx = async (id) => {
    try {
      await API.deleteTransaction(id);
      reloadTx();
    } catch (err) {
      console.error('[Catatan] deleteTransaction failed', err);
      alert(`Gagal menghapus transaksi: ${err.message}`);
    }
  };
  const handleSaveRec = async () => {
    if (!recForm.name || !recForm.amount || !recForm.next_due_date) return;
    try {
      await API.createRecurring({ ...recForm, amount: Number(recForm.amount) });
      setShowRecForm(false);
      API.listRecurring(true).then(setRecurring).catch(() => {});
    } catch (err) {
      console.error('[Catatan] createRecurring failed', err);
      alert(`Gagal menyimpan pengeluaran rutin: ${err.message}`);
    }
  };
  const handleDeleteRec = async (id) => {
    try {
      await API.deleteRecurring(id);
      API.listRecurring(true).then(setRecurring).catch(() => {});
    } catch (err) {
      console.error('[Catatan] deleteRecurring failed', err);
      alert(`Gagal menghapus pengeluaran rutin: ${err.message}`);
    }
  };

  const TABS = [{id:"income",label:"💚 Pemasukan"},{id:"expense",label:"🔴 Pengeluaran"},{id:"rutin",label:"🔄 Rutin"}];

  return (
    <div style={{ padding:"20px 24px", animation:"fadeIn .3s ease" }}>
      {showTx && <TxModal onSave={handleSaveTx} onClose={() => setShowTx(false)} defaultType={tab==="expense"?"expense":"income"} />}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontWeight:800, fontSize:20, color: theme.txt }}>Catatan Keuangan</div>
        <input type="month" value={month} onChange={e => { setMonth(e.target.value); setTxs([]); }}
          style={{ padding:"6px 10px", borderRadius:8, border:`1.5px solid ${theme.bdr}`, fontSize:12, fontFamily:"'Poppins',sans-serif", background: theme.card, color: theme.txt, cursor:"pointer" }} />
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>{setTab(t.id);setShowTx(false);setShowRecForm(false);}} style={{ padding:"6px 16px", borderRadius:999, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, background:tab===t.id?"#4A7A32": theme.card, color:tab===t.id?"white": theme.sub, transition:"all .2s" }}>{t.label}</button>
        ))}
        <button onClick={()=>tab==="rutin"?setShowRecForm(v=>!v):setShowTx(true)} style={{ marginLeft:"auto", background: theme.card, border:`1.5px solid ${theme.bdr}`, color:"#4A7A32", borderRadius:999, padding:"6px 16px", fontWeight:700, fontSize:12, cursor:"pointer" }}>+ {tab==="rutin"?"Tambah Rutin":"Tambah"}</button>
      </div>

      {tab==="rutin" && showRecForm && (
        <div style={{ background: theme.card, borderRadius:14, padding:14, marginBottom:14, display:"flex", gap:8, flexWrap:"wrap", border:`1.5px solid ${theme.bdr}` }}>
          <input placeholder="Nama (e.g. Spotify)" value={recForm.name} onChange={e=>setRecForm(p=>({...p,name:e.target.value}))} style={{ flex:2, minWidth:120, padding:"7px 10px", borderRadius:8, border:`1px solid ${theme.bdr}`, fontSize:12, background: theme.inp, color: theme.txt }} />
          <input placeholder="Jumlah (Rp)" type="number" value={recForm.amount} onChange={e=>setRecForm(p=>({...p,amount:e.target.value}))} style={{ flex:1, minWidth:100, padding:"7px 10px", borderRadius:8, border:`1px solid ${theme.bdr}`, fontSize:12, background: theme.inp, color: theme.txt }} />
          <select value={recForm.category} onChange={e=>setRecForm(p=>({...p,category:e.target.value}))} style={{ flex:1, minWidth:120, padding:"7px 10px", borderRadius:8, border:`1px solid ${theme.bdr}`, fontSize:12, background: theme.inp, color: theme.txt }}>
            {VALID_CATEGORIES.map(c=><option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
          </select>
          <select value={recForm.frequency} onChange={e=>setRecForm(p=>({...p,frequency:e.target.value}))} style={{ flex:1, minWidth:90, padding:"7px 10px", borderRadius:8, border:`1px solid ${theme.bdr}`, fontSize:12, background: theme.inp, color: theme.txt }}>
            {VALID_FREQUENCIES.map(f=><option key={f} value={f}>{f}</option>)}
          </select>
          <input type="date" value={recForm.next_due_date} onChange={e=>setRecForm(p=>({...p,next_due_date:e.target.value}))} style={{ flex:1, minWidth:120, padding:"7px 10px", borderRadius:8, border:`1px solid ${theme.bdr}`, fontSize:12, background: theme.inp, color: theme.txt }} />
          <button onClick={handleSaveRec} style={{ background:"#4A7A32", color:"white", border:"none", borderRadius:8, padding:"7px 14px", fontWeight:700, cursor:"pointer", fontSize:12 }}>Simpan</button>
        </div>
      )}

      <div style={{ background: theme.card, borderRadius:18, padding:18 }}>
        {tab!=="rutin" && (
          <>
            {txs.length===0 && (
              <div style={{ textAlign:"center", padding:32, color: theme.sub }}>
                <div style={{ fontSize:36, marginBottom:6 }}>📭</div>
                <div style={{ fontSize:13 }}>Belum ada transaksi {tab==="income"?"pemasukan":"pengeluaran"} bulan ini</div>
              </div>
            )}
            {txs.map(t => (
              <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 0", borderBottom:`1px solid ${theme.bdr}` }}>
                <span style={{ fontSize:20 }}>{t.type==="income"?"💼":CAT_ICONS[t.category]||"💸"}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13, color: theme.txt }}>{t.description||"—"}</div>
                  <div style={{ fontSize:11, color: theme.sub, marginTop:2 }}>{t.category||"Pemasukan"} · {t.date}{t.is_recurring&&<span style={{ marginLeft:6, color:"#8BBB6A", fontWeight:600 }}>🔄 rutin</span>}</div>
                </div>
                <div style={{ fontWeight:800, fontSize:14, color:t.type==="income"?"#4CAF50":"#C0392B" }}>{t.type==="income"?"+":"-"}{fmt(t.amount)}</div>
                <button onClick={()=>handleDeleteTx(t.id)} style={{ background:"none", border:"none", color: theme.sub, cursor:"pointer", fontSize:14, padding:"0 4px" }}>✕</button>
              </div>
            ))}
            {pagination && pagination.totalPages>1 && <div style={{ textAlign:"center", padding:"12px 0", fontSize:12, color: theme.sub }}>Hal 1 dari {pagination.totalPages} · {pagination.total} transaksi</div>}
          </>
        )}
        {tab==="rutin" && (
          <>
            {recurring.length===0 && (
              <div style={{ textAlign:"center", padding:32, color: theme.sub }}>
                <div style={{ fontSize:36, marginBottom:6 }}>🔄</div>
                <div style={{ fontSize:13 }}>Belum ada pengeluaran rutin</div>
              </div>
            )}
            {recurring.map(r => (
              <div key={r.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 0", borderBottom:`1px solid ${theme.bdr}` }}>
                <span style={{ fontSize:20 }}>{CAT_ICONS[r.category]||"🔄"}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13, color: theme.txt }}>{r.name}</div>
                  <div style={{ fontSize:11, color: theme.sub, marginTop:2 }}>{r.category} · {r.frequency} · jatuh tempo {r.next_due_date}</div>
                </div>
                <div style={{ fontWeight:800, fontSize:14, color:"#C0392B" }}>-{fmtS(r.amount)}</div>
                <span style={{ fontSize:10, padding:"2px 7px", borderRadius:999, background:r.is_active?"#E8F5E9":"#f5f5f5", color:r.is_active?"#388E3C":"#aaa", fontWeight:600 }}>{r.is_active?"Aktif":"Nonaktif"}</span>
                <button onClick={()=>handleDeleteRec(r.id)} style={{ background:"none", border:"none", color: theme.sub, cursor:"pointer", fontSize:14, padding:"0 4px" }}>✕</button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}