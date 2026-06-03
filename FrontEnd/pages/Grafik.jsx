import { useState, useEffect } from "react";
import BarChart from "../components/charts/BarChart.jsx";
import PieChart from "../components/charts/PieChart.jsx";
import * as API from "../services/api.js";
import { T } from "../constants/translations.js";
import { currentMonthStr, fmtS } from "../utils/format.js";
import { CAT_ICONS } from "../constants/categories.js";

export default function Grafik({ theme, lang = "en" }) {
  const t = T[lang] || T.en;
  const [trendMonths, setTrendMonths] = useState(6);
  const [chart, setChart]       = useState([]);
  const [pieExpense, setPieExpense] = useState([]);
  const [pieIncome, setPieIncome]   = useState([]);
  const [recent, setRecent]     = useState([]);
  const [pred, setPred]         = useState(null);
  const month = currentMonthStr();

  useEffect(() => {
    API.getCategoryChart(month)
      .then(setPieExpense)
      .catch(console.error);

    API.getIncomeCategoryChart(month)
      .then(setPieIncome)
      .catch(console.error);

    API.listTransactions({})
      .then(r => setRecent(r.data?.slice(0, 6) || []))
      .catch(console.error);

    API.getPrediction()
      .then(setPred)
      .catch(console.error);
  }, [month]);

  return (
    <div style={{ padding:"20px 24px", animation:"fadeIn .3s ease" }}>
      <div style={{ fontWeight:800, fontSize:20, color: theme.txt, marginBottom:6 }}>{t.grafikTitle}</div>
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {[{l:t.trend6M,v:6},{l:t.trend3M,v:3},{l:t.trend1Y,v:12}].map(({l,v}) => (
          <button key={v} onClick={() => setTrendMonths(v)} style={{ padding:"5px 14px", borderRadius:999, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, background:trendMonths===v?"#4A7A32": theme.card, color:trendMonths===v?"white": theme.sub, transition:"all .2s" }}>{l}</button>
        ))}
      </div>
      <div className="grafik-grid-pie" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 220px", gap:12, marginBottom:12 }}>
        <div style={{ background: theme.card, borderRadius:18, padding:16 }}>
          <div style={{ fontWeight:700, fontSize:13, color: theme.txt, marginBottom:10 }}>{t.expenseByCategory}</div>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}><PieChart data={pieExpense} size={110} /></div>
          {pieExpense.map(d => (
            <div key={d.name} style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"2px 0", borderBottom:`1px solid ${theme.bdr}` }}>
              <span style={{ display:"flex", alignItems:"center", gap:5 }}><span style={{ width:7, height:7, borderRadius:2, background:d.color, display:"inline-block" }} />{CAT_ICONS[d.name]} {d.name}</span>
              <span style={{ color: theme.sub }}>{d.value}% · {fmtS(d.total)}</span>
            </div>
          ))}
        </div>
        <div style={{ background: theme.card, borderRadius:18, padding:16 }}>
          <div style={{ fontWeight:700, fontSize:13, color: theme.txt, marginBottom:10 }}>{t.incomeByCategory}</div>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}><PieChart data={pieIncome} size={110} /></div>
          {pieIncome.map(d => (
            <div key={d.name} style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"2px 0", borderBottom:`1px solid ${theme.bdr}` }}>
              <span style={{ display:"flex", alignItems:"center", gap:5 }}><span style={{ width:7, height:7, borderRadius:2, background:d.color, display:"inline-block" }} />{d.name}</span>
              <span style={{ color: theme.sub }}>{d.value}% · {fmtS(d.total)}</span>
            </div>
          ))}
        </div>
        <div style={{ background: theme.card, borderRadius:18, padding:16, border:`2px solid ${theme.bdr}` }}>
          <div style={{ fontWeight:700, fontSize:13, color: theme.txt, marginBottom:10 }}>{t.recent}</div>
          {recent.map(tx => (
            <div key={tx.id} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
              <span style={{ fontSize:16 }}>{tx.type==="income"?"💼":CAT_ICONS[tx.category]||"💸"}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:600, color: theme.txt, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{tx.description||"—"}</div>
                <div style={{ fontSize:10, color: theme.sub }}>{tx.category} · {tx.date}</div>
              </div>
              <div style={{ fontSize:11, fontWeight:700, color:tx.type==="income"?"#4CAF50":"#C0392B", whiteSpace:"nowrap" }}>{tx.type==="income"?"+":"-"}{fmtS(tx.amount)}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="grafik-grid-bottom" style={{ display:"grid", gridTemplateColumns:"1fr 220px", gap:12 }}>
        <div style={{ background: theme.card, borderRadius:18, padding:16 }}>
          <div style={{ fontWeight:700, fontSize:13, color: theme.txt, marginBottom:6 }}>{t.financialTrend}</div>
          <div style={{ display:"flex", gap:10, marginBottom:4 }}>
            {[ ["#4A7A32",t.pemasukan],["rgba(74,122,50,0.25)",t.pengeluaran] ].map(([c,l]) => (
              <span key={l} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color: theme.sub }}><span style={{ width:8, height:8, borderRadius:2, background:c, display:"inline-block" }} />{l}</span>
            ))}
          </div>
          <BarChart data={chart} h={140} />
        </div>
        {pred && pred.prediksi > 0 && (
          <div style={{
            position: "relative",
            background: "linear-gradient(145deg, #1e3a14 0%, #2d5220 40%, #3d6b2a 100%)",
            borderRadius: 18,
            padding: "20px 18px",
            color: "white",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(42, 90, 28, 0.35)",
          }}>
            {/* Decorative circles */}
            <div style={{
              position:"absolute", top:-28, right:-28,
              width:110, height:110, borderRadius:"50%",
              background:"rgba(255,255,255,0.05)", pointerEvents:"none"
            }}/>
            <div style={{
              position:"absolute", bottom:-18, right:18,
              width:70, height:70, borderRadius:"50%",
              background:"rgba(255,255,255,0.04)", pointerEvents:"none"
            }}/>

            {/* AI Badge */}
            <div style={{
              display:"inline-flex", alignItems:"center", gap:5,
              background:"rgba(255,255,255,0.12)",
              border:"1px solid rgba(255,255,255,0.2)",
              borderRadius:999, padding:"3px 10px",
              fontSize:10, fontWeight:700, letterSpacing:"0.05em",
              marginBottom:14, textTransform:"uppercase"
            }}>
              <span style={{ fontSize:12 }}>🤖</span>
              {t.basedOnAI}
            </div>

            {/* Title */}
            <div style={{ fontSize:11, fontWeight:600, opacity:0.7, marginBottom:4, letterSpacing:"0.03em" }}>
              {t.prediksi}
            </div>

            {/* Main Amount */}
            <div style={{
              fontSize:28, fontWeight:900, letterSpacing:"-0.5px",
              lineHeight:1.1, marginBottom:10,
              textShadow:"0 2px 8px rgba(0,0,0,0.2)"
            }}>
              {fmtS(pred.prediksi)}
            </div>

            {/* Divider */}
            <div style={{ height:1, background:"rgba(255,255,255,0.12)", marginBottom:10 }}/>

            {/* Change indicator */}
            {pred.context?.change_pct != null ? (
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{
                  display:"inline-flex", alignItems:"center", justifyContent:"center",
                  width:22, height:22, borderRadius:6,
                  background: pred.context.change_pct > 0 ? "rgba(255,100,100,0.25)" : "rgba(100,255,150,0.2)",
                  fontSize:11, fontWeight:800,
                  color: pred.context.change_pct > 0 ? "#ff8f8f" : "#7dffab",
                }}>
                  {pred.context.change_pct > 0 ? "↑" : "↓"}
                </span>
                <span style={{ fontSize:11, opacity:0.8 }}>
                  <strong style={{ opacity:1 }}>{Math.abs(pred.context.change_pct)}%</strong> {t.fromLastMonth}
                </span>
              </div>
            ) : (
              <div style={{ fontSize:10, opacity:0.5 }}>— {t.fromLastMonth}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}