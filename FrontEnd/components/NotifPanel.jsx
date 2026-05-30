export default function NotifPanel({ notifs, onClose, onReadAll }) {
  return (
    <div style={{
      position: "fixed", top: 56, right: 16, width: 300, background: "white",
      borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
      zIndex: 999, overflow: "hidden", border: "1px solid #C8D4A0",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px", borderBottom: "1px solid #C8D4A0",
        fontWeight: 700, color: "#2D4A1E",
        display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14,
      }}>
        <span>Notifikasi</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onReadAll}
            style={{ border: "none", background: "none", cursor: "pointer", fontSize: 11, color: "#8BBB6A", fontWeight: 600 }}
          >
            Tandai semua
          </button>
          <button
            onClick={onClose}
            style={{ border: "none", background: "none", cursor: "pointer", fontSize: 14, color: "#999" }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Empty state */}
      {notifs.length === 0 && (
        <div style={{ padding: 24, textAlign: "center", color: "#bbb", fontSize: 13 }}>
          Tidak ada notifikasi
        </div>
      )}

      {/* List */}
      {notifs.map((n) => (
        <div
          key={n.id}
          style={{
            padding: "10px 16px", borderBottom: "1px solid #F0EDD8",
            background: n.read ? "white" : "#F7F5E6",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: n.type === "overbudget" ? "#C0392B" : "#2D4A1E" }}>
            {n.type === "overbudget" ? "⚠️" : n.type === "rutin" ? "🔔" : "ℹ️"} {n.title}
          </div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>{n.msg}</div>
          <div style={{ fontSize: 11, color: "#bbb", marginTop: 3 }}>{n.time}</div>
        </div>
      ))}
    </div>
  );
}