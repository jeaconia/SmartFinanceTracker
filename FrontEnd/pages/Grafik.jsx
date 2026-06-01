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
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 220px", gap:12, marginBottom:12 }}>
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
          {recent.map(t => (
            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
              <span style={{ fontSize:16 }}>{t.type==="income"?"💼":CAT_ICONS[t.category]||"💸"}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:600, color: theme.txt, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.description||"—"}</div>
                <div style={{ fontSize:10, color: theme.sub }}>{d.category || t.pemasukan} · {d.date}</div>
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
            {[ ["#4A7A32",t.pemasukan],["rgba(74,122,50,0.25)",t.pengeluaran] ].map(([c,l]) => (
              <span key={l} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color: theme.sub }}><span style={{ width:8, height:8, borderRadius:2, background:c, display:"inline-block" }} />{l}</span>
            ))}
          </div>
          <BarChart data={chart} h={140} />
        </div>
        {pred && pred.prediksi > 0 && (
          <div style={{ background:"linear-gradient(135deg,#3A5C28,#5a6b3a)", borderRadius:18, padding:16, color:"white" }}>
            <div style={{ fontWeight:800, fontSize:14, marginBottom:3 }}>{t.prediksi}</div>
            <div style={{ fontSize:11, opacity:0.75, marginBottom:8 }}>{t.basedOnAI}</div>
            <div style={{ fontSize:26, fontWeight:900 }}>{fmtS(pred.prediksi)}</div>
            {pred.context?.change_pct != null && (
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                {pred.context.change_pct > 0 ? "▲" : "▼"} {Math.abs(pred.context.change_pct)}% {t.fromLastMonth}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
