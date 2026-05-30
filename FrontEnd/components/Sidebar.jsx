const NAVS = [
  { id: "dashboard", icon: "⊞", label: "Dashboard"  },
  { id: "grafik",    icon: "📊", label: "Grafik"     },
  { id: "budgeting", icon: "📋", label: "Budgeting"  },
  { id: "catatan",   icon: "📝", label: "Catatan"    },
];

function Sidebar({ active, onChange, profileInitial = "JD" }) {
  return (
    <div style={{
      width: 60, background: "#2D4A1E", display: "flex", flexDirection: "column",
      alignItems: "center", padding: "16px 0", gap: 6,
      position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 100,
    }}>
      {NAVS.map((n) => (
        <button
          key={n.id}
          title={n.label}
          onClick={() => onChange(n.id)}
          style={{
            width: 40, height: 40, borderRadius: 10, border: "none", cursor: "pointer",
            fontSize: 17, transition: "all .2s",
            background: active === n.id ? "rgba(255,255,255,0.2)" : "transparent",
            color: "white", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {n.icon}
        </button>
      ))}

      <div style={{ flex: 1 }} />

      <button style={{ width: 40, height: 40, borderRadius: 10, border: "none", background: "transparent", color: "white", fontSize: 17, cursor: "pointer" }}>
        ⚙️
      </button>
      <div style={{
        width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.25)",
        marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, color: "white", fontWeight: 700,
      }}>
        {profileInitial}
      </div>
    </div>
  );
}

export default Sidebar;