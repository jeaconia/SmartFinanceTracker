import { useState, useEffect, useCallback } from "react";
import BarChart from "../components/charts/BarChart.jsx";
import PieChart from "../components/charts/PieChart.jsx";
import TxModal from "../components/TxModal.jsx";
import * as API from "../services/api.js";
import { T } from "../constants/translations.js";
import { currentMonthStr, fmtS } from "../utils/format.js";

export default function Dashboard({ profile, notifs, onBell, theme, darkMode, lang = "en" }) {
  const t = T[lang] || T.en;
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
  if (!sum) return <div style={{ padding:32, color:"#4A7A32", textAlign:"center" }}>{t.loading}</div>;

  const netPositive = sum.sisaBudget >= 0;

  return (
    <div style={{ padding:"20px 24px", animation:"fadeIn .3s ease" }}>
      {showTx && <TxModal onSave={handleSaveTx} onClose={() => setShowTx(false)} lang={lang} />}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ color: theme.sub, fontSize:13 }}>{t.welcome}</div>
          <div style={{ fontSize:26, fontWeight:800, color: theme.txt }}>{profile?.name ?? "—"}</div>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            style={{ padding:"6px 10px", borderRadius:8, border:`1.5px solid ${theme.bdr}`, fontSize:12, fontFamily:"'Poppins',sans-serif", background: theme.card, color: theme.txt, cursor:"pointer" }} />
          <button onClick={() => setShowTx(true)} style={{ background:"#4A7A32", color:"white", border:"none", borderRadius:10, padding:"8px 14px", fontWeight:700, fontSize:12, cursor:"pointer" }}>{t.addTx}</button>
          <button onClick={onBell} style={{ background:"none", border:"none", cursor:"pointer", fontSize:22, position:"relative", padding:4 }}>
            🔔{unread > 0 && <span style={{ position:"absolute", top:0, right:0, background:"#C0392B", color:"white", borderRadius:"50%", width:15, height:15, fontSize:9, display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>{unread}</span>}
          </button>
        </div>
      </div>

      <div className="dash-grid-summary" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
        <div style={{ background:"linear-gradient(135deg,#3A5C28 0%,#5a6b3a 100%)", borderRadius:18, padding:"18px 20px", color:"white" }}>
          <div style={{ fontSize:12, opacity:0.8, marginBottom:4 }}>{t.sisaBudget} · {sum.month}</div>
          <div style={{ fontSize:30, fontWeight:900, letterSpacing:-1, color:netPositive?"white":"#FFB3B3" }}>{fmtS(sum.sisaBudget)}</div>
          {sum.growthRate !== null && (
            <div style={{ fontSize:11, opacity:0.75, marginBottom:8 }}>
              {sum.growthRate > 0 ? "▲" : "▼"} {Math.abs(sum.growthRate)}% {t.fromLastMonth}
            </div>
          )}
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:10, fontSize:11, opacity:0.85 }}>
            <span>{t.pemasukan}<br /><b style={{ fontSize:13 }}>{fmtS(sum.pemasukan)}</b></span>
            <span style={{ textAlign:"right" }}>{t.pengeluaran}<br /><b style={{ fontSize:13 }}>{fmtS(sum.pengeluaran)}</b></span>
          </div>
        </div>

        <div style={{ background: theme.card, borderRadius:18, padding:"18px 20px", border:`2px solid ${theme.bdr}`, position:"relative", overflow:"hidden" }}>
          <div style={{ fontWeight:800, fontSize:15, color: theme.txt, marginBottom:4 }}>{t.todayInsight}</div>
          {label ? (
            <>
              <div style={{ fontSize:22, fontWeight:900, color:"#4A7A32", marginBottom:4 }}>✨ {label.label}</div>
              {label.traits?.slice(0,2).map((item,i) => <div key={i} style={{ fontSize:11, color: theme.sub, marginBottom:2 }}>• {item}</div>)}
              {label.confidence && <div style={{ fontSize:10, color: theme.sub, marginTop:6 }}>{t.aiAccuracy} {Math.round(label.confidence*100)}%</div>}
            </>
          ) : <div style={{ fontSize:13, color: theme.sub }}>{t.aiLoading}</div>}
          <div style={{ position:"absolute", right:12, bottom:10, fontSize:32, opacity:0.06 }}>🤖</div>
        </div>
      </div>

      <div className="dash-grid-charts" style={{ display:"grid", gridTemplateColumns:"1fr 240px", gap:14 }}>
        <div style={{ background: theme.card, borderRadius:18, padding:"18px 20px" }}>
          <div style={{ fontWeight:700, fontSize:14, color: theme.txt, marginBottom:6 }}>{t.monthlyAnalysis}</div>
          <div style={{ display:"flex", gap:12, marginBottom:4 }}>
            {[ ["#4A7A32",t.pemasukan],["rgba(74,122,50,0.25)",t.pengeluaran] ].map(([c,l]) => (
              <span key={l} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color: theme.sub }}>
                <span style={{ width:8, height:8, borderRadius:2, background:c, display:"inline-block" }} />{l}
              </span>
            ))}
          </div>
          <BarChart data={chart} h={130} />
        </div>

        <div style={{ background:"#2D4A1E", borderRadius:18, padding:"18px 18px", color:"white" }}>
          <div style={{ fontWeight:800, fontSize:14, marginBottom:2 }}>{t.spendingLabel}</div>
          <div style={{ fontSize:10, opacity:0.7, marginBottom:12 }}>{t.basedOnCategory}</div>
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
