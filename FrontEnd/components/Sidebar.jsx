import React, { useState } from "react";

// ── Inline SVG Icons ──────────────────────────────────────────────────────────
const IconDashboard = ({ active }) => (
  <svg width="22" height="23" viewBox="0 0 38 39" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M37 31.2073V18.6468C37 17.437 36.999 16.8318 36.8528 16.2689C36.7232 15.7701 36.5106 15.298 36.2228 14.8714C35.898 14.39 35.4465 13.9908 34.5417 13.1942L23.7417 3.68536C22.0618 2.20632 21.2219 1.46717 20.2766 1.18589C19.4437 0.938037 18.5559 0.938037 17.7229 1.18589C16.7784 1.46696 15.9397 2.20541 14.2623 3.68221L3.45874 13.1942C2.55394 13.9908 2.10259 14.39 1.77783 14.8714C1.49003 15.298 1.27573 15.7701 1.14619 16.2689C1 16.8318 1 17.437 1 18.6468V31.2073C1 33.3171 1 34.3716 1.34254 35.2037C1.79926 36.3132 2.67472 37.1958 3.77734 37.6553C4.60431 38 5.65268 38 7.74942 38C9.84616 38 10.8957 38 11.7227 37.6553C12.8253 37.1958 13.7005 36.3134 14.1572 35.2039C14.4998 34.3718 14.5 33.3169 14.5 31.2071V28.9431C14.5 26.4424 16.5147 24.4151 19 24.4151C21.4853 24.4151 23.5 26.4424 23.5 28.9431V31.2071C23.5 33.3169 23.5 34.3718 23.8425 35.2039C24.2993 36.3134 25.1747 37.1958 26.2773 37.6553C27.1043 38 28.1527 38 30.2494 38C32.3462 38 33.3957 38 34.2227 37.6553C35.3253 37.1958 36.2005 36.3132 36.6572 35.2037C36.9998 34.3716 37 33.3171 37 31.2073Z"
      fill={active ? "white" : "none"} stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={active ? 1 : 0.55}/>
  </svg>
);

const IconGrafik = ({ active }) => (
  <svg width="22" height="20" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path opacity={active ? 1 : 0.55} d="M13 14.9999V32.9998M13 14.9999H4.19922C3.07911 14.9999 2.51962 14.9999 2.0918 15.2179C1.71547 15.4096 1.40973 15.7154 1.21799 16.0917C1 16.5195 1 17.08 1 18.2001V32.9998H13M13 14.9999V4.20018C13 3.08008 13 2.51961 13.218 2.09179C13.4097 1.71547 13.7155 1.40973 14.0918 1.21799C14.5196 1 15.0791 1 16.1992 1H21.7992C22.9193 1 23.4806 1 23.9084 1.21799C24.2847 1.40973 24.5895 1.71547 24.7812 2.09179C24.9992 2.51961 25 3.08008 25 4.20018V8.99995M13 32.9998H25M25 32.9998L37 33V12.2001C37 11.08 36.9992 10.5196 36.7812 10.0917C36.5895 9.71542 36.2859 9.40968 35.9095 9.21794C35.4817 8.99995 34.9201 8.99995 33.8 8.99995H25M25 32.9998V8.99995"
      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconBudget = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path opacity={active ? 1 : 0.55} d="M10 1H8.20044C5.6802 1 4.41915 1 3.45654 1.49047C2.60981 1.9219 1.9219 2.60981 1.49047 3.45654C1 4.41915 1 5.6802 1 8.20044V29.8004C1 32.3207 1 33.5801 1.49047 34.5427C1.9219 35.3895 2.60981 36.0786 3.45654 36.51C4.4182 37 5.67774 37 8.19305 37H10M10 1H29.8004C32.3207 1 33.579 1 34.5416 1.49047C35.3884 1.9219 36.0786 2.60981 36.51 3.45654C37 4.4182 37 5.67774 37 8.19305V29.8081C37 32.3234 37 33.5811 36.51 34.5427C36.0786 35.3895 35.3884 36.0786 34.5416 36.51C33.58 37 32.3223 37 29.807 37H10M10 1V37M19 16.75H28M19 10H28"
      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconCatatan = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path opacity={active ? 1 : 0.55} d="M13.0004 5H7.40039C5.16018 5 4.03924 5 3.18359 5.43597C2.43095 5.81947 1.81947 6.43095 1.43597 7.18359C1 8.03924 1 9.16018 1 11.4004V30.6004C1 32.8406 1 33.9601 1.43597 34.8158C1.81947 35.5684 2.43095 36.181 3.18359 36.5645C4.0384 37 5.15799 37 7.39382 37H26.6062C28.842 37 29.96 37 30.8148 36.5645C31.5674 36.181 32.181 35.5678 32.5645 34.8152C33 33.9604 33 32.842 33 30.6062V25M25 7L13 19V25H19L31 13M25 7L31 1L37 7L31 13M25 7L31 13"
      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconSettings = ({ active }) => (
  <svg width="21" height="21" viewBox="0 0 38 37" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path opacity={active ? 1 : 0.55} d="M34.0361 12.7884L33.3766 12.4102C32.6827 11.9878 32.2682 11.5683 31.9657 11.0664 31.7324 10.6482 31.4611 10.126 31.3144 9.54409 31.3056 8.95178L31.3198 7.92105C31.3404 6.65782 31.1785 5.45565 30.4279 4.09063C30.0416 3.64438 29.5069 3.32602 28.4364 2.69011L27.5472 2.1619C26.4797 1.52776 25.9457 1.21058 25.379 1.08966C24.8776 0.982686 24.3602 0.987643 23.8606 1.10326C23.2967 1.23374 22.7695 1.55919 21.7156 2.2097L21.0724 2.60592C20.3691 3.01558 19.8097 3.17439 19.2367 3.19335H18.767C18.1928 3.1743 17.6322 3.01464 16.9288 2.60312L16.2876 2.20631C15.2265 1.54963 14.6951 1.2208 14.1281 1.08966C13.1073 0.970431 12.6041 1.07878C12.0359 1.20113 11.5018 1.52066 10.4337 2.15972L9.55077 2.68728C8.48252 3.32671 7.95198 3.64413 7.56894 4.08856C7.22904 4.48294 6.97498 4.9474 6.82291 5.45111C6.65103 6.02049 6.6809 7.9246L6.69377 8.71287C6.68973 9.54379 6.54104 10.1269 6.26892 10.6501C6.03905 11.0616 5.73523 11.5662 4.82402 12.2924L3.97106 12.7813C2.88782 13.4001 2.34632 13.7097 1.95231 14.1504C1.60374 14.5403 1.17969 15.5064C0.997994 16.0757 1.00096 17.9907L1.00326 19.0342C1.00605 20.3023 1.19198 21.5014C1.9611 22.8489C2.35289 23.2869 3.96403 24.2112L4.60929 24.5812C5.31768 25.0125 6.03202 25.9351C6.28008 26.3804C6.54419 26.8959 6.6856 27.4686 6.69524 28.0515L6.6809 29.0626C6.65096 30.9736 6.82386 31.5446C6.97682 32.0497 7.57422 32.9096C7.96052 33.3559 9.5666 34.3099L10.4556 34.838C11.5232 35.4722 12.6235 35.9099C13.1249 36.0169 13.6426 36.0127 14.1422 35.8971C14.7069 35.7664 15.2359 35.4399 16.2928 34.7875L16.93 34.3942C17.6334 33.9847 18.1922 33.8251 18.7653 33.8061H19.2336C19.8079 33.8252 20.3701 33.9853 21.0381 34.3746L21.7154 34.7938C22.7766 35.4505 23.8739 35.9095C24.3755 36.0256 24.8951 36.0303 25.3983 35.9219C25.9664 35.7996 27.5691 34.8407L28.4604 34.3075C29.5196 33.6738 30.4339 32.9114C30.7738 32.517 31.0282 32.0528 31.1803 31.5491C31.3509 30.9838 31.3202 29.1029L31.3069 28.2871C31.3056 28.0496C31.3141 27.4561 31.4603 26.8726 31.7324 26.3495C31.9642 25.9378C32.2681 25.4332 33.1797 24.7067L33.3802 24.5904L34.0312 24.2184C35.1145 23.5996 35.657 23.2896 36.051 22.8489C36.3996 22.459 36.8233 21.4936C37.0039 20.9276 36.9997 19.0312L36.9974 17.9654C36.9946 16.6972 36.811 15.4982C36.6499 14.998 36.0404 14.1507C35.649 13.7131 34.0392 12.79L34.0361 12.7884ZM11.7981 18.5001C11.7981 22.6008 15.0229 25.9251 19.0009 25.9251C22.9789 25.9251 26.2037 22.6008 26.2037 18.5001C26.2037 14.3994 22.9789 11.0751 19.0009 11.0751C15.0229 11.0751 11.7981 14.3994 11.7981 18.5001Z"
      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const NAVS = [
  { id: "dashboard", label: "Dashboard", Icon: IconDashboard },
  { id: "grafik",    label: "Grafik",    Icon: IconGrafik    },
  { id: "budgeting", label: "Budgeting", Icon: IconBudget    },
  { id: "catatan",   label: "Catatan",   Icon: IconCatatan   },
];

function getInitials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).slice(0, 2).join("");
}

function ProfilePopup({ profile, onEdit, onLogout, darkMode }) {
  const bg  = darkMode ? "#1e2f14" : "white";
  const txt = darkMode ? "#e8f5e0" : "#1a1a1a";
  const sub = darkMode ? "#8BBB6A" : "#888";
  const bdr = darkMode ? "#3a5a28" : "#efefef";

  return (
    <div style={{
      position: "absolute", left: 68, bottom: 0,
      background: bg, borderRadius: 14, padding: "14px 16px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.2)", minWidth: 210,
      border: `1.5px solid ${bdr}`, zIndex: 200,
      fontFamily: "'Poppins', sans-serif",
    }}>
      {/* Arrow */}
      <div style={{
        position: "absolute", left: -7, bottom: 18,
        width: 12, height: 12, background: bg,
        border: `1.5px solid ${bdr}`, borderRight: "none", borderTop: "none",
        transform: "rotate(45deg)",
      }} />

      <div style={{ fontWeight: 700, fontSize: 14, color: txt, marginBottom: 2 }}>
        {profile?.name ?? "—"}
      </div>
      <div style={{ fontSize: 11, color: sub, marginBottom: 10 }}>
        {profile?.email ?? "—"}
      </div>

      {(profile?.city || profile?.province) && (
        <div style={{ fontSize: 11, color: sub, marginBottom: 4 }}>
          📍 {[profile.city, profile.province].filter(Boolean).join(", ")}
        </div>
      )}
      {profile?.umr_value > 0 && (
        <div style={{ fontSize: 11, color: sub, marginBottom: 10 }}>
          💰 UMR: Rp {profile.umr_value.toLocaleString("id-ID")}
        </div>
      )}

      <div style={{ borderTop: `1px solid ${bdr}`, paddingTop: 8, display: "flex", flexDirection: "column", gap: 2 }}>
        <button onClick={onEdit} style={{
          width: "100%", textAlign: "left", padding: "7px 8px", borderRadius: 8,
          border: "none", background: "transparent", cursor: "pointer",
          fontSize: 12, color: "#4A7A32", fontWeight: 600, fontFamily: "inherit",
          transition: "background .15s",
        }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(74,122,50,0.1)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >✏️ Edit Profil</button>
        <button onClick={onLogout} style={{
          width: "100%", textAlign: "left", padding: "7px 8px", borderRadius: 8,
          border: "none", background: "transparent", cursor: "pointer",
          fontSize: 12, color: "#C0392B", fontWeight: 600, fontFamily: "inherit",
          transition: "background .15s",
        }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(192,57,43,0.08)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >↩ Keluar</button>
      </div>
    </div>
  );
}

function Sidebar({ active, onChange, profile, onLogout, darkMode }) {
  const [showProfile, setShowProfile] = useState(false);

  const handleEdit = () => { setShowProfile(false); onChange("settings"); };
  const handleLogout = () => { setShowProfile(false); onLogout(); };

  return (
    <div style={{
      width: 60, background: "#2D4A1E",
      display: "flex", flexDirection: "column",
      alignItems: "center", padding: "14px 0", gap: 2,
      position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 14 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: "rgba(255,255,255,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 14, color: "white",
          fontFamily: "'Poppins',sans-serif", letterSpacing: -0.5,
        }}>M</div>
      </div>

      {/* Nav */}
      {NAVS.map(({ id, label, Icon }) => (
        <button key={id} title={label} onClick={() => onChange(id)} style={{
          width: 44, height: 44, borderRadius: 12, border: "none", cursor: "pointer",
          transition: "all .2s",
          background: active === id ? "rgba(255,255,255,0.18)" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon active={active === id} />
        </button>
      ))}

      <div style={{ flex: 1 }} />

      {/* Settings */}
      <button title="Pengaturan" onClick={() => onChange("settings")} style={{
        width: 44, height: 44, borderRadius: 12, border: "none", cursor: "pointer",
        transition: "all .2s",
        background: active === "settings" ? "rgba(255,255,255,0.18)" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 6,
      }}>
        <IconSettings active={active === "settings"} />
      </button>

      {/* Avatar */}
      <div style={{ position: "relative", marginBottom: 8 }}>
        <button
          title={profile?.name ?? "Profil"}
          onClick={() => setShowProfile(v => !v)}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: showProfile ? "rgba(255,255,255,0.38)" : "rgba(255,255,255,0.22)",
            border: showProfile ? "2px solid rgba(255,255,255,0.7)" : "2px solid transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, color: "white", fontWeight: 700,
            cursor: "pointer", transition: "all .2s",
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          {getInitials(profile?.name)}
        </button>

        {showProfile && (
          <ProfilePopup
            profile={profile}
            onEdit={handleEdit}
            onLogout={handleLogout}
            darkMode={darkMode}
          />
        )}
      </div>
    </div>
  );
}

export default Sidebar;
