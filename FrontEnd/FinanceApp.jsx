import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar.jsx";
import NotifPanel from "./components/NotifPanel.jsx";
import TxModal from "./components/TxModal.jsx";
import BarChart from "./components/charts/BarChart.jsx";
import PieChart from "./components/charts/PieChart.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import * as API from "./services/api.js";
import { supabase } from "./services/supabase.js";
import { VALID_CATEGORIES, CAT_ICONS, CAT_COLORS, VALID_FREQUENCIES } from "./constants/categories.js";
import { fmt, fmtS, currentMonthStr } from "./utils/format.js";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = tdk login
  const [page, setPage]       = useState("dashboard");
  const [profile, setProfile] = useState(null);
  const [notifs, setNotifs]   = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  // ── Auth: cek session saat mount & subscribe perubahan ───────────────────
  useEffect(() => {
    // Ambil session yang sudah ada (refresh page)
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) API.setAuthToken(s.access_token);
      setSession(s ?? null);
    });

    // Subscribe perubahan auth (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (s) API.setAuthToken(s.access_token);
      else   API.clearAuthToken();
      setSession(s ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Load profil & notifikasi setelah login ───────────────────────────────
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
      setNotifs((p) => p.map((n) => ({ ...n, read: true })));
    } catch (err) { console.warn(err); }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (session === undefined) {
    return (
      <div style={{ minHeight:"100vh", background:"#F0EDD8", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", color:"#4A7A32", fontSize:16, fontWeight:600 }}>
        <span style={{ animation:"pulse 1.2s infinite" }}>💰 Memuat...</span>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      </div>
    );
  }

  // ── Belum login → tampilkan AuthPage ─────────────────────────────────────
  if (!session) return <AuthPage onAuth={handleAuth} />;

  // ── Sudah login → tampilkan app ───────────────────────────────────────────
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#F0EDD8", fontFamily:"'DM Sans',sans-serif", fontSize:14 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        button{transition:all .15s;font-family:inherit}
        button:hover{filter:brightness(1.06)}
        input,select{font-family:inherit;outline:none}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:#C8D4A0;border-radius:3px}
      `}</style>

      <Sidebar
        active={page}
        onChange={(p) => { setPage(p); setShowNotif(false); }}
        profile={profile}
        onLogout={handleLogout}
      />

      {showNotif && <NotifPanel notifs={notifs} onClose={() => setShowNotif(false)} onReadAll={handleReadAll} />}

      <main style={{ marginLeft:60, flex:1, overflowY:"auto", maxHeight:"100vh" }}>
        {page === "dashboard"  && <Dashboard profile={profile} notifs={notifs} onBell={() => setShowNotif((v) => !v)} />}
        {page === "grafik"     && <Grafik />}
        {page === "budgeting"  && <Budgeting />}
        {page === "catatan"    && <Catatan />}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pages — sama persis seperti sebelumnya
// ─────────────────────────────────────────────────────────────────────────────

function Dashboard({ profile, notifs, onBell }) {
  const [sum, setSum]     = useState(null);
  const [chart, setChart] = useState([]);
  const [pie, setPie]     = useState([]);
  const [label, setLabel] = useState(null);
  const [showTx, setShowTx] = useState(false);

  useEffect(() => {
    const month = currentMonthStr();
    API.getDashboardSummary(month).then(setSum).catch(() => {});
    API.getMonthlyChart().then(setChart).catch(() => {});
    API.getCategoryChart(month).then(setPie).catch(() => {});
    API.getSpendingLabel(month).then(setLabel).catch(() => {});
  }, []);

  const handleSaveTx = useCallback(async (tx) => {
    await API.createTransaction(tx).catch(() => {});
    API.getDashboardSummary(currentMonthStr()).then(setSum).catch(() => {});
  }, []);

  const unread = notifs.filter((n) => !n.read).length;
  if (!sum) return <div style={{ padding:32, color:"#4A7A32", textAlign:"center" }}>Memuat...</div>;

  const netPositive = sum.sisaBudget >= 0;

  return (
    <div style={{ padding:"20px 24px", animation:"fadeIn .3s ease" }}>
      {showTx && <TxModal onSave={handleSaveTx} onClose={() => setShowTx(false)} />}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <div style={{ color:"#888", fontSize:14 }}>Welcome,</div>
          <div style={{ fontSize:26, fontWeight:800, color:"#1a1a1a", fontFamily:"'Playfair Display',Georgia,serif" }}>{profile?.name ?? "—"}</div>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
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

        <div style={{ background:"white", borderRadius:18, padding:"18px 20px", border:"2px solid #C8D4A0", position:"relative", overflow:"hidden" }}>
          <div style={{ fontWeight:800, fontSize:15, color:"#1a1a1a", marginBottom:4 }}>Today's Insight</div>
          {label ? (
            <>
              <div style={{ fontSize:22, fontWeight:900, color:"#4A7A32", marginBottom:4 }}>✨ {label.label}</div>
              {label.traits?.slice(0,2).map((t,i) => <div key={i} style={{ fontSize:11, color:"#666", marginBottom:2 }}>• {t}</div>)}
              {label.confidence && <div style={{ fontSize:10, color:"#bbb", marginTop:6 }}>Akurasi AI: {Math.round(label.confidence*100)}%</div>}
            </>
          ) : <div style={{ fontSize:13, color:"#aaa" }}>Memuat analisis AI...</div>}
          <div style={{ position:"absolute", right:12, bottom:10, fontSize:32, opacity:0.08 }}>🤖</div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 240px", gap:14 }}>
        <div style={{ background:"white", borderRadius:18, padding:"18px 20px" }}>
          <div style={{ fontWeight:700, fontSize:14, color:"#1a1a1a", marginBottom:6 }}>Analisis Keuangan Bulanan</div>
          <div style={{ display:"flex", gap:12, marginBottom:4 }}>
            {[["#4A7A32","Pemasukan"],["rgba(74,122,50,0.25)","Pengeluaran"]].map(([c,l]) => (
              <span key={l} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#999" }}>
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
          {pie.map((d) => (
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

function Grafik() {
  const [trendMonths, setTrendMonths] = useState(6);
  const [chart, setChart]     = useState([]);
  const [pieSpend, setPieSpend] = useState([]);
  const [recent, setRecent]   = useState([]);
  const [pred, setPred]       = useState(null);
  const month = currentMonthStr();

  useEffect(() => { API.getTrendChart(trendMonths).then(setChart).catch(() => {}); }, [trendMonths]);
  useEffect(() => {
    API.getCategoryChart(month).then(setPieSpend).catch(() => {});
    API.listTransactions({}).then(r => setRecent(r.data?.slice(0,6)||[])).catch(() => {});
    API.getPrediction().then(setPred).catch(() => {});
  }, []);

  return (
    <div style={{ padding:"20px 24px", animation:"fadeIn .3s ease" }}>
      <div style={{ fontWeight:800, fontSize:20, color:"#1a1a1a", marginBottom:6, fontFamily:"'Playfair Display',Georgia,serif" }}>Ringkasan Pengeluaranmu</div>
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {[{l:"6 Bln",v:6},{l:"3 Bln",v:3},{l:"1 Tahun",v:12}].map(({l,v}) => (
          <button key={v} onClick={() => setTrendMonths(v)} style={{ padding:"5px 14px", borderRadius:999, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, background:trendMonths===v?"#4A7A32":"white", color:trendMonths===v?"white":"#888", transition:"all .2s" }}>{l}</button>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 220px", gap:12, marginBottom:12 }}>
        <div style={{ background:"white", borderRadius:18, padding:16 }}>
          <div style={{ fontWeight:700, fontSize:13, color:"#1a1a1a", marginBottom:10 }}>🔴 Pengeluaran per Kategori</div>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}><PieChart data={pieSpend} size={110} /></div>
          {pieSpend.map(d => (
            <div key={d.name} style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"2px 0", borderBottom:"1px solid #fafafa" }}>
              <span style={{ display:"flex", alignItems:"center", gap:5 }}><span style={{ width:7, height:7, borderRadius:2, background:d.color, display:"inline-block" }} />{CAT_ICONS[d.name]} {d.name}</span>
              <span style={{ color:"#aaa" }}>{d.value}% · {fmtS(d.total)}</span>
            </div>
          ))}
        </div>
        <div style={{ background:"white", borderRadius:18, padding:16 }}>
          <div style={{ fontWeight:700, fontSize:13, color:"#1a1a1a", marginBottom:10 }}>💚 Pemasukan</div>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}><PieChart data={pieSpend.map(d=>({...d,color:d.color+"99"}))} size={110} /></div>
          {pieSpend.map(d => (
            <div key={d.name} style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"2px 0", borderBottom:"1px solid #fafafa" }}>
              <span style={{ display:"flex", alignItems:"center", gap:5 }}><span style={{ width:7, height:7, borderRadius:2, background:d.color+"99", display:"inline-block" }} />{d.name}</span>
              <span style={{ color:"#aaa" }}>{d.value}%</span>
            </div>
          ))}
        </div>
        <div style={{ background:"white", borderRadius:18, padding:16, border:"2px solid #C8D4A0" }}>
          <div style={{ fontWeight:700, fontSize:13, color:"#1a1a1a", marginBottom:10 }}>🕒 Recent</div>
          {recent.map(t => (
            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
              <span style={{ fontSize:16 }}>{t.type==="income"?"💼":CAT_ICONS[t.category]||"💸"}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:600, color:"#333", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.description||"—"}</div>
                <div style={{ fontSize:10, color:"#bbb" }}>{t.category||"Pemasukan"} · {t.date}</div>
              </div>
              <div style={{ fontSize:11, fontWeight:700, color:t.type==="income"?"#4CAF50":"#C0392B", whiteSpace:"nowrap" }}>{t.type==="income"?"+":"-"}{fmtS(t.amount)}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 220px", gap:12 }}>
        <div style={{ background:"white", borderRadius:18, padding:16 }}>
          <div style={{ fontWeight:700, fontSize:13, color:"#1a1a1a", marginBottom:6 }}>📈 Tren Keuangan</div>
          <div style={{ display:"flex", gap:10, marginBottom:4 }}>
            {[["#4A7A32","Pemasukan"],["rgba(74,122,50,0.25)","Pengeluaran"]].map(([c,l]) => (
              <span key={l} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#999" }}><span style={{ width:8, height:8, borderRadius:2, background:c, display:"inline-block" }} />{l}</span>
            ))}
          </div>
          <BarChart data={chart} h={140} />
        </div>
        {pred && (
          <div style={{ background:"linear-gradient(135deg,#3A5C28,#5a6b3a)", borderRadius:18, padding:16, color:"white" }}>
            <div style={{ fontWeight:800, fontSize:14, marginBottom:3 }}>🔮 Prediksi Bulan Depan</div>
            <div style={{ fontSize:11, opacity:0.75, marginBottom:8 }}>Berdasarkan AI</div>
            <div style={{ fontSize:26, fontWeight:900 }}>{fmtS(pred.prediksi)}</div>
            {pred.context?.change_pct != null && <div style={{ fontSize:11, opacity:0.8, marginTop:4, marginBottom:12 }}>{pred.context.change_pct>0?"▲":"▼"} {Math.abs(pred.context.change_pct)}% dari bulan lalu</div>}
            {pred.context?.based_on_months && <div style={{ fontSize:11, opacity:0.65, fontStyle:"italic" }}>Prediksi berdasarkan {pred.context.based_on_months} bulan terakhir</div>}
          </div>
        )}
      </div>
    </div>
  );
}

function Budgeting() {
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

  const overBudgets = budgets.filter(b => b.over);
  const handleAdd = async () => {
    if (!form.category || !form.limit_amount) return;
    await API.createBudget({ category:form.category, limit_amount:Number(form.limit_amount), month }).catch(() => {});
    setForm({ category:VALID_CATEGORIES[0], limit_amount:"" }); setShowAdd(false); reload();
  };
  const handleEdit   = async (b) => { if (!editAmt) return; await API.updateBudget(b.id, Number(editAmt)).catch(() => {}); setEditId(null); reload(); };
  const handleDelete = async (id) => { await API.deleteBudget(id).catch(() => {}); reload(); };

  return (
    <div style={{ padding:"20px 24px", animation:"fadeIn .3s ease" }}>
      <div style={{ fontWeight:800, fontSize:20, color:"#1a1a1a", marginBottom:16, fontFamily:"'Playfair Display',Georgia,serif" }}>Budgeting · {month}</div>
      {overBudgets.length > 0 && (
        <div style={{ background:"#FDF0EE", border:"1.5px solid #F5C6BE", borderRadius:14, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:22 }}>⚠️</span>
          <div>
            <div style={{ fontWeight:700, color:"#C0392B", fontSize:13 }}>Overbudget Alert!</div>
            <div style={{ fontSize:12, color:"#888" }}>{overBudgets.map(b=>b.kat).join(", ")} melebihi anggaran bulan ini</div>
          </div>
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 250px", gap:16 }}>
        <div>
          <div style={{ background:"white", borderRadius:18, padding:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontWeight:700, fontSize:14 }}>Anggaran Bulanan</div>
              <button onClick={() => setShowAdd(v=>!v)} style={{ background:"#4A7A32", color:"white", border:"none", borderRadius:8, padding:"5px 12px", fontSize:12, fontWeight:700, cursor:"pointer" }}>+ Tambah</button>
            </div>
            {showAdd && (
              <div style={{ background:"#F7F5E6", borderRadius:12, padding:12, marginBottom:14, display:"flex", gap:8, flexWrap:"wrap" }}>
                <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} style={{ flex:1, minWidth:120, padding:"7px 10px", borderRadius:8, border:"1px solid #C8D4A0", fontSize:12, background:"white" }}>
                  {VALID_CATEGORIES.map(c=><option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                </select>
                <input placeholder="Limit (Rp)" type="number" value={form.limit_amount} onChange={e=>setForm(p=>({...p,limit_amount:e.target.value}))} style={{ flex:1, minWidth:120, padding:"7px 10px", borderRadius:8, border:"1px solid #C8D4A0", fontSize:12 }} />
                <button onClick={handleAdd} style={{ background:"#4A7A32", color:"white", border:"none", borderRadius:8, padding:"7px 14px", fontWeight:700, cursor:"pointer", fontSize:12 }}>Simpan</button>
              </div>
            )}
            {budgets.length===0 && <div style={{ textAlign:"center", padding:24, color:"#ccc", fontSize:13 }}>Belum ada anggaran untuk {month}</div>}
            {budgets.map(b => {
              const pct = Math.min((b.terpakai/b.anggaran)*100, 100);
              return (
                <div key={b.id} style={{ marginBottom:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, alignItems:"center", gap:8 }}>
                    <span style={{ fontWeight:600, fontSize:13 }}>{b.icon} {b.kat}</span>
                    {editId===b.id ? (
                      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                        <input type="number" value={editAmt} onChange={e=>setEditAmt(e.target.value)} style={{ width:110, padding:"3px 8px", borderRadius:7, border:"1px solid #C8D4A0", fontSize:12 }} />
                        <button onClick={()=>handleEdit(b)} style={{ background:"#4A7A32", color:"white", border:"none", borderRadius:6, padding:"3px 10px", fontSize:11, cursor:"pointer" }}>✓</button>
                        <button onClick={()=>setEditId(null)} style={{ background:"none", border:"none", color:"#aaa", cursor:"pointer", fontSize:13 }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:11, color:b.over?"#C0392B":"#888" }}>{fmtS(b.terpakai)} / {fmtS(b.anggaran)}{b.over?" 🔴":""}</span>
                        <button onClick={()=>{setEditId(b.id);setEditAmt(String(b.anggaran));}} style={{ border:"none", background:"none", cursor:"pointer", fontSize:12, color:"#8BBB6A" }}>✏️</button>
                        <button onClick={()=>handleDelete(b.id)} style={{ border:"none", background:"none", cursor:"pointer", fontSize:12, color:"#ddd" }}>🗑️</button>
                      </div>
                    )}
                  </div>
                  <div style={{ background:"#C8D4A0", borderRadius:999, height:7, overflow:"hidden" }}>
                    <div style={{ width:`${pct}%`, height:"100%", background:b.over?"#C0392B":"#4A7A32", borderRadius:999, transition:"width .5s ease" }} />
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
          <div style={{ background:"white", borderRadius:18, padding:16, border:"2px solid #C8D4A0" }}>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>Distribusi Anggaran</div>
            <div style={{ display:"flex", justifyContent:"center" }}>
              <PieChart data={budgets.map(b=>({name:b.kat,value:b.anggaran,color:b.color}))} size={110} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Catatan() {
  const [tab, setTab]           = useState("expense");
  const [txs, setTxs]           = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [showTx, setShowTx]     = useState(false);
  const [showRecForm, setShowRecForm] = useState(false);
  const [recForm, setRecForm]   = useState({ name:"", amount:"", category:VALID_CATEGORIES[0], frequency:"monthly", next_due_date:"" });
  const month = currentMonthStr();

  const reloadTx = useCallback(() => {
    API.listTransactions({ type:tab==="rutin"?undefined:tab, month })
      .then(r => { setTxs(r.data||[]); setPagination(r.pagination); }).catch(() => {});
  }, [tab, month]);

  useEffect(() => {
    if (tab==="rutin") API.listRecurring(true).then(setRecurring).catch(() => {});
    else reloadTx();
  }, [tab, reloadTx]);

  const handleSaveTx  = async (tx) => { await API.createTransaction(tx).catch(()=>{}); reloadTx(); };
  const handleDeleteTx = async (id) => { await API.deleteTransaction(id).catch(()=>{}); reloadTx(); };
  const handleSaveRec = async () => {
    if (!recForm.name||!recForm.amount||!recForm.next_due_date) return;
    await API.createRecurring({...recForm, amount:Number(recForm.amount)}).catch(()=>{});
    setShowRecForm(false);
    API.listRecurring(true).then(setRecurring).catch(()=>{});
  };
  const handleDeleteRec = async (id) => { await API.deleteRecurring(id).catch(()=>{}); API.listRecurring(true).then(setRecurring).catch(()=>{}); };

  const TABS = [{id:"income",label:"💚 Pemasukan"},{id:"expense",label:"🔴 Pengeluaran"},{id:"rutin",label:"🔄 Rutin"}];

  return (
    <div style={{ padding:"20px 24px", animation:"fadeIn .3s ease" }}>
      {showTx && <TxModal onSave={handleSaveTx} onClose={() => setShowTx(false)} defaultType={tab==="expense"?"expense":"income"} />}
      <div style={{ fontWeight:800, fontSize:20, color:"#1a1a1a", marginBottom:14, fontFamily:"'Playfair Display',Georgia,serif" }}>Catatan Keuangan</div>
      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>{setTab(t.id);setShowTx(false);setShowRecForm(false);}} style={{ padding:"6px 16px", borderRadius:999, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, background:tab===t.id?"#4A7A32":"white", color:tab===t.id?"white":"#888", transition:"all .2s" }}>{t.label}</button>
        ))}
        <button onClick={()=>tab==="rutin"?setShowRecForm(v=>!v):setShowTx(true)} style={{ marginLeft:"auto", background:"white", border:"1.5px solid #C8D4A0", color:"#4A7A32", borderRadius:999, padding:"6px 16px", fontWeight:700, fontSize:12, cursor:"pointer" }}>+ {tab==="rutin"?"Tambah Rutin":"Tambah"}</button>
      </div>

      {tab==="rutin" && showRecForm && (
        <div style={{ background:"white", borderRadius:14, padding:14, marginBottom:14, display:"flex", gap:8, flexWrap:"wrap", border:"1.5px solid #C8D4A0" }}>
          <input placeholder="Nama (e.g. Spotify)" value={recForm.name} onChange={e=>setRecForm(p=>({...p,name:e.target.value}))} style={{ flex:2, minWidth:120, padding:"7px 10px", borderRadius:8, border:"1px solid #C8D4A0", fontSize:12 }} />
          <input placeholder="Jumlah (Rp)" type="number" value={recForm.amount} onChange={e=>setRecForm(p=>({...p,amount:e.target.value}))} style={{ flex:1, minWidth:100, padding:"7px 10px", borderRadius:8, border:"1px solid #C8D4A0", fontSize:12 }} />
          <select value={recForm.category} onChange={e=>setRecForm(p=>({...p,category:e.target.value}))} style={{ flex:1, minWidth:120, padding:"7px 10px", borderRadius:8, border:"1px solid #C8D4A0", fontSize:12, background:"white" }}>
            {VALID_CATEGORIES.map(c=><option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
          </select>
          <select value={recForm.frequency} onChange={e=>setRecForm(p=>({...p,frequency:e.target.value}))} style={{ flex:1, minWidth:90, padding:"7px 10px", borderRadius:8, border:"1px solid #C8D4A0", fontSize:12, background:"white" }}>
            {VALID_FREQUENCIES.map(f=><option key={f} value={f}>{f}</option>)}
          </select>
          <input type="date" value={recForm.next_due_date} onChange={e=>setRecForm(p=>({...p,next_due_date:e.target.value}))} style={{ flex:1, minWidth:120, padding:"7px 10px", borderRadius:8, border:"1px solid #C8D4A0", fontSize:12 }} />
          <button onClick={handleSaveRec} style={{ background:"#4A7A32", color:"white", border:"none", borderRadius:8, padding:"7px 14px", fontWeight:700, cursor:"pointer", fontSize:12 }}>Simpan</button>
        </div>
      )}

      <div style={{ background:"white", borderRadius:18, padding:18 }}>
        {tab!=="rutin" && (
          <>
            {txs.length===0 && (
              <div style={{ textAlign:"center", padding:32, color:"#ddd" }}>
                <div style={{ fontSize:36, marginBottom:6 }}>📭</div>
                <div style={{ fontSize:13 }}>Belum ada transaksi {tab==="income"?"pemasukan":"pengeluaran"} bulan ini</div>
              </div>
            )}
            {txs.map(t => (
              <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 0", borderBottom:"1px solid #F0EDD8" }}>
                <span style={{ fontSize:20 }}>{t.type==="income"?"💼":CAT_ICONS[t.category]||"💸"}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13, color:"#1a1a1a" }}>{t.description||"—"}</div>
                  <div style={{ fontSize:11, color:"#bbb", marginTop:2 }}>{t.category||"Pemasukan"} · {t.date}{t.is_recurring&&<span style={{ marginLeft:6, color:"#8BBB6A", fontWeight:600 }}>🔄 rutin</span>}</div>
                </div>
                <div style={{ fontWeight:800, fontSize:14, color:t.type==="income"?"#4CAF50":"#C0392B" }}>{t.type==="income"?"+":"-"}{fmt(t.amount)}</div>
                <button onClick={()=>handleDeleteTx(t.id)} style={{ background:"none", border:"none", color:"#ddd", cursor:"pointer", fontSize:14, padding:"0 4px" }}>✕</button>
              </div>
            ))}
            {pagination && pagination.totalPages>1 && <div style={{ textAlign:"center", padding:"12px 0", fontSize:12, color:"#999" }}>Hal 1 dari {pagination.totalPages} · {pagination.total} transaksi</div>}
          </>
        )}
        {tab==="rutin" && (
          <>
            {recurring.length===0 && (
              <div style={{ textAlign:"center", padding:32, color:"#ddd" }}>
                <div style={{ fontSize:36, marginBottom:6 }}>🔄</div>
                <div style={{ fontSize:13 }}>Belum ada pengeluaran rutin</div>
              </div>
            )}
            {recurring.map(r => (
              <div key={r.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 0", borderBottom:"1px solid #F0EDD8" }}>
                <span style={{ fontSize:20 }}>{CAT_ICONS[r.category]||"🔄"}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13, color:"#1a1a1a" }}>{r.name}</div>
                  <div style={{ fontSize:11, color:"#bbb", marginTop:2 }}>{r.category} · {r.frequency} · jatuh tempo {r.next_due_date}</div>
                </div>
                <div style={{ fontWeight:800, fontSize:14, color:"#C0392B" }}>-{fmtS(r.amount)}</div>
                <span style={{ fontSize:10, padding:"2px 7px", borderRadius:999, background:r.is_active?"#E8F5E9":"#f5f5f5", color:r.is_active?"#388E3C":"#aaa", fontWeight:600 }}>{r.is_active?"Aktif":"Nonaktif"}</span>
                <button onClick={()=>handleDeleteRec(r.id)} style={{ background:"none", border:"none", color:"#ddd", cursor:"pointer", fontSize:14, padding:"0 4px" }}>✕</button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
