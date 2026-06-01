import { useState, useEffect, useCallback } from "react";
import PieChart from "../components/charts/PieChart.jsx";
import * as API from "../services/api.js";
import { T } from "../constants/translations.js";
import { currentMonthStr, fmtS } from "../utils/format.js";
import { VALID_CATEGORIES, CAT_ICONS, CAT_COLORS } from "../constants/categories.js";

export default function Budgeting({ theme, lang = "en" }) {
  const t = T[lang] || T.en;
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
      <div style={{ fontWeight:800, fontSize:20, color: theme.txt, marginBottom:16 }}>{t.monthlyBudget} · {month}</div>
      {overBudgets.length > 0 && (
        <div style={{ background:"#FDF0EE", border:"1.5px solid #F5C6BE", borderRadius:14, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:22 }}>⚠️</span>
          <div>
            <div style={{ fontWeight:700, color:"#C0392B", fontSize:13 }}>{t.overbudgetAlert}</div>
            <div style={{ fontSize:12, color:"#888" }}>{overBudgets.map(b=>b.category).join(", ")} melebihi anggaran bulan ini</div>
          </div>
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 250px", gap:16 }}>
        <div>
          <div style={{ background: theme.card, borderRadius:18, padding:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontWeight:700, fontSize:14, color: theme.txt }}>{t.monthlyBudget}</div>
              <button onClick={() => setShowAdd(v=>!v)} style={{ background:"#4A7A32", color:"white", border:"none", borderRadius:8, padding:"5px 12px", fontSize:12, fontWeight:700, cursor:"pointer" }}>{t.addBudget}</button>
            </div>
            {showAdd && (
              <div style={{ background: theme.bg, borderRadius:12, padding:12, marginBottom:14, display:"flex", gap:8, flexWrap:"wrap" }}>
                <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} style={{ flex:1, minWidth:120, padding:"7px 10px", borderRadius:8, border:`1px solid ${theme.bdr}`, fontSize:12, background: theme.inp, color: theme.txt }}>
                  {VALID_CATEGORIES.map(c=><option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                </select>
                <input placeholder={t.limitPlaceholder} type="number" value={form.limit_amount} onChange={e=>setForm(p=>({...p,limit_amount:e.target.value}))} style={{ flex:1, minWidth:120, padding:"7px 10px", borderRadius:8, border:`1px solid ${theme.bdr}`, fontSize:12, background: theme.inp, color: theme.txt }} />
                <button onClick={handleAdd} style={{ background:"#4A7A32", color:"white", border:"none", borderRadius:8, padding:"7px 14px", fontWeight:700, cursor:"pointer", fontSize:12 }}>{t.saveBtn}</button>
              </div>
            )}
            {budgets.length===0 && <div style={{ textAlign:"center", padding:24, color: theme.sub, fontSize:13 }}>{t.noBudget} {month}</div>}
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
            <div style={{ fontWeight:800, fontSize:14, marginBottom:10 }}>{t.aiRecommendation}</div>
            {recs===null && <div style={{ fontSize:12, opacity:0.7 }}>{t.loading}</div>}
            {recs!==null && !Array.isArray(recs?.recommendations) && <div style={{ fontSize:12, opacity:0.7 }}>{t.aiUnavailable}</div>}
            {Array.isArray(recs?.recommendations) && recs.recommendations.length===0 && <div style={{ fontSize:12, opacity:0.7 }}>{t.noRecommendation}</div>}
            {Array.isArray(recs?.recommendations) && recs.recommendations.map((r,i) => (
              <div key={i} style={{ background:"rgba(255,255,255,0.12)", borderRadius:10, padding:10, marginBottom:8 }}>
                <div style={{ fontWeight:700, fontSize:12 }}>{CAT_ICONS[r.category]||"💡"} {r.category}</div>
                <div style={{ fontSize:11, opacity:0.85, marginTop:3 }}>{t.recLimit} <b>{fmtS(r.recommended_limit)}</b></div>
                <div style={{ fontSize:11, opacity:0.7, marginTop:3, fontStyle:"italic" }}>{r.reason}</div>
              </div>
            ))}
            {recs?.basedOnCity && <div style={{ fontSize:10, opacity:0.55, marginTop:8 }}>{t.basedOnUMR} {recs.basedOnCity}</div>}
          </div>
          <div style={{ background: theme.card, borderRadius:18, padding:16, border:`2px solid ${theme.bdr}` }}>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:10, color: theme.txt }}>{t.budgetDistribution}</div>
            <div style={{ display:"flex", justifyContent:"center" }}>
              <PieChart data={budgets.map(b=>({ name:b.category, value:b.limit_amount, color:CAT_COLORS[b.category]||"#4A7A32" }))} size={110} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
