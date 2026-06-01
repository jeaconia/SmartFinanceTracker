function BarChart({ data, h = 130 }) {
  if (!data?.length)
    return (
      <div style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb", fontSize: 12 }}>
        No data
      </div>
    );

  const max = Math.max(...data.flatMap((d) => [d.pemasukan, d.pengeluaran]), 1);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: h, paddingTop: 8 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ width: "100%", display: "flex", gap: 2, alignItems: "flex-end", height: h - 18 }}>
            <div style={{ flex: 1, background: "#4A7A32", borderRadius: "3px 3px 0 0", height: `${(d.pemasukan / max) * 100}%`, minHeight: 3, transition: "height .5s ease" }} />
            <div style={{ flex: 1, background: "rgba(74,122,50,0.25)", borderRadius: "3px 3px 0 0", height: `${(d.pengeluaran / max) * 100}%`, minHeight: 3, transition: "height .5s ease" }} />
          </div>
          <span style={{ fontSize: 9, color: "#999", whiteSpace: "nowrap" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default BarChart;