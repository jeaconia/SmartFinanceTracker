function PieChart({ data, size = 100 }) {
  if (!data?.length) {
    return (
      <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 12, textAlign: 'center' }}>
        Belum ada data
      </div>
    );
  }

  const total = data.reduce((s, d) => s + (d.value || 0), 0) || 1;
  let angle = -90;

  const slices = data.map((d) => {
    const sw  = ((d.value || 0) / total) * 360;
    const s   = angle;
    angle    += sw;
    const r   = size / 2 - 3;
    const cx  = size / 2;
    const cy  = size / 2;
    const sr  = (s  * Math.PI) / 180;
    const er  = ((s + sw) * Math.PI) / 180;
    const x1  = cx + r * Math.cos(sr);
    const y1  = cy + r * Math.sin(sr);
    const x2  = cx + r * Math.cos(er);
    const y2  = cy + r * Math.sin(er);
    return { ...d, path: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${sw > 180 ? 1 : 0},1 ${x2},${y2} Z` };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth={1.5} />
      ))}
    </svg>
  );
}

export default PieChart;