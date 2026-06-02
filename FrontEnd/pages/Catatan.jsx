import { useState, useEffect, useCallback } from "react";
import TxModal from "../components/TxModal.jsx";
import * as API from "../services/api.js";
import { T } from "../constants/translations.js";
import { VALID_CATEGORIES, CAT_ICONS, VALID_FREQUENCIES } from "../constants/categories.js";
import { currentMonthStr, fmt } from "../utils/format.js";

export default function Catatan({ theme, lang = "en" }) {
  const t = T[lang] || T.en;
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
      alert(`${t.saveTxError}${err.message}`);
    }
  };
  const handleDeleteTx = async (id) => {
    try {
      await API.deleteTransaction(id);
      reloadTx();
    } catch (err) {
      console.error('[Catatan] deleteTransaction failed', err);
      alert(`${t.deleteTxError}${err.message}`);
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
      alert(`${t.saveRecError}${err.message}`);
    }
  };
  const handleDeleteRec = async (id) => {
    try {
      await API.deleteRecurring(id);
      API.listRecurring(true).then(setRecurring).catch(() => {});
    } catch (err) {
      console.error('[Catatan] deleteRecurring failed', err);
      alert(`${t.deleteRecError}${err.message}`);
    }
  };

  const TABS = [
    { id:"income", label:t.tabIncome },
    { id:"expense", label:t.tabExpense },
    { id:"rutin", label:t.tabRecurring },
  ];

  return (
    <div style={{ padding:"20px 24px", animation:"fadeIn .3s ease" }}>
      {showTx && <TxModal onSave={handleSaveTx} onClose={() => setShowTx(false)} defaultType={tab==="expense"?"expense":"income"} lang={lang} />}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontWeight:800, fontSize:20, color: theme.txt }}>{t.catatanTitle}</div>
        <input type="month" value={month} onChange={e => { setMonth(e.target.value); setTxs([]); }}
          style={{ padding:"6px 10px", borderRadius:8, border:`1.5px solid ${theme.bdr}`, fontSize:12, fontFamily:"'Poppins',sans-serif", background: theme.card, color: theme.txt, cursor:"pointer" }} />
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
        {TABS.map(tab_ => (
          <button key={tab_.id} onClick={()=>{setTab(tab_.id);setShowTx(false);setShowRecForm(false);}} style={{ padding:"6px 16px", borderRadius:999, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, background:tab===tab_.id?"#4A7A32": theme.card, color:tab===tab_.id?"white": theme.sub, transition:"all .2s" }}>{tab_.label}</button>
        ))}
        <button onClick={()=>tab==="rutin"?setShowRecForm(v=>!v):setShowTx(true)} style={{ marginLeft:"auto", background: theme.card, border:`1.5px solid ${theme.bdr}`, color:"#4A7A32", borderRadius:999, padding:"6px 16px", fontWeight:700, fontSize:12, cursor:"pointer" }}>{tab==="rutin"?t.addRecurring:t.addNew}</button>
      </div>

      {tab==="rutin" && showRecForm && (
        <div className="catatan-rec-form" style={{ background: theme.card, borderRadius:14, padding:14, marginBottom:14, display:"flex", gap:8, flexWrap:"wrap", border:`1.5px solid ${theme.bdr}` }}>
          <input placeholder={t.recurringNamePlaceholder} value={recForm.name} onChange={e=>setRecForm(p=>({...p,name:e.target.value}))} style={{ flex:2, minWidth:120, padding:"7px 10px", borderRadius:8, border:`1px solid ${theme.bdr}`, fontSize:12, background: theme.inp, color: theme.txt }} />
          <input placeholder={t.amountPlaceholder} type="number" value={recForm.amount} onChange={e=>setRecForm(p=>({...p,amount:e.target.value}))} style={{ flex:1, minWidth:100, padding:"7px 10px", borderRadius:8, border:`1px solid ${theme.bdr}`, fontSize:12, background: theme.inp, color: theme.txt }} />
          <select value={recForm.category} onChange={e=>setRecForm(p=>({...p,category:e.target.value}))} style={{ flex:1, minWidth:120, padding:"7px 10px", borderRadius:8, border:`1px solid ${theme.bdr}`, fontSize:12, background: theme.inp, color: theme.txt }}>
            {VALID_CATEGORIES.map(c=><option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
          </select>
          <select value={recForm.frequency} onChange={e=>setRecForm(p=>({...p,frequency:e.target.value}))} style={{ flex:1, minWidth:90, padding:"7px 10px", borderRadius:8, border:`1px solid ${theme.bdr}`, fontSize:12, background: theme.inp, color: theme.txt }}>
            {VALID_FREQUENCIES.map(f=><option key={f} value={f}>{f}</option>)}
          </select>
          <input type="date" value={recForm.next_due_date} onChange={e=>setRecForm(p=>({...p,next_due_date:e.target.value}))} style={{ flex:1, minWidth:120, padding:"7px 10px", borderRadius:8, border:`1.5px solid ${theme.bdr}`, fontSize:12, background: theme.inp, color: theme.txt }} />
          <button onClick={handleSaveRec} style={{ background:"#4A7A32", color:"white", border:"none", borderRadius:8, padding:"7px 14px", fontWeight:700, cursor:"pointer", fontSize:12 }}>{t.saveBtn}</button>
        </div>
      )}

      <div style={{ background: theme.card, borderRadius:18, padding:18 }}>
        {tab!=="rutin" && (
          <>
            {txs.length===0 && (
              <div style={{ textAlign:"center", padding:32, color: theme.sub }}>
                <div style={{ fontSize:36, marginBottom:6 }}>📭</div>
                <div style={{ fontSize:13 }}>{tab==="income"?t.noIncome:t.noExpense}</div>
              </div>
            )}
            {txs.map((tx) => (
              <div key={tx.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 0", borderBottom:`1px solid ${theme.bdr}` }}>
                <span style={{ fontSize:20 }}>{tx.type==="income"?"💼":CAT_ICONS[tx.category]||"💸"}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13, color: theme.txt }}>{tx.description||"—"}</div>
                  <div style={{ fontSize:11, color: theme.sub, marginTop:2 }}>{tx.category || t.pemasukan} · {tx.date}{tx.is_recurring&&<span style={{ marginLeft:6, color:"#8BBB6A", fontWeight:600 }}>{t.recurringTag}</span>}</div>
                </div>
                <div style={{ fontWeight:800, fontSize:14, color:tx.type==="income"?"#4CAF50":"#C0392B" }}>{tx.type==="income"?"+":"-"}{fmt(tx.amount)}</div>
                <button onClick={()=>handleDeleteTx(tx.id)} style={{ background:"none", border:"none", color: theme.sub, cursor:"pointer", fontSize:14, padding:"0 4px" }}>✕</button>
              </div>
            ))}
            {pagination && pagination.totalPages>1 && <div style={{ textAlign:"center", padding:"12px 0", fontSize:12, color: theme.sub }}>{t.pg} 1 {t.of} {pagination.totalPages} · {pagination.total} {t.transactions}</div>}
          </>
        )}
        {tab==="rutin" && (
          <>
            {recurring.length===0 && (
              <div style={{ textAlign:"center", padding:32, color: theme.sub }}>
                <div style={{ fontSize:36, marginBottom:6 }}>🔄</div>
                <div style={{ fontSize:13 }}>{t.noRecurring}</div>
              </div>
            )}
            {recurring.map(r => (
              <div key={r.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 0", borderBottom:`1px solid ${theme.bdr}` }}>
                <span style={{ fontSize:20 }}>{CAT_ICONS[r.category]||"🔄"}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13, color: theme.txt }}>{r.name}</div>
                  <div style={{ fontSize:11, color: theme.sub, marginTop:2 }}>{r.category} · {r.frequency} · {t.dueDate} {r.next_due_date}</div>
                </div>
                <div style={{ fontWeight:800, fontSize:14, color:"#C0392B" }}>-{fmt(r.amount)}</div>
                <span style={{ fontSize:10, padding:"2px 7px", borderRadius:999, background:r.is_active?"#E8F5E9":"#f5f5f5", color:r.is_active?"#388E3C":"#aaa", fontWeight:600 }}>{r.is_active?t.active:t.inactive}</span>
                <button onClick={()=>handleDeleteRec(r.id)} style={{ background:"none", border:"none", color: theme.sub, cursor:"pointer", fontSize:14, padding:"0 4px" }}>✕</button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
