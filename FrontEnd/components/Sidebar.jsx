import React, { useState } from "react";

const IconDashboard = ({ active }) => (
  <svg width="22" height="23" viewBox="0 0 38 39" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M37 31.2073V18.6468C37 17.437 36.999 16.8318 36.8528 16.2689C36.7232 15.7701 36.5106 15.298 36.2228 14.8714C35.898 14.39 35.4465 13.9908 34.5417 13.1942L23.7417 3.68536C22.0618 2.20632 21.2219 1.46717 20.2766 1.18589C19.4437 0.938037 18.5559 0.938037 17.7229 1.18589C16.7784 1.46696 15.9397 2.20541 14.2623 3.68221L3.45874 13.1942C2.55394 13.9908 2.10259 14.39 1.77783 14.8714C1.49003 15.298 1.27573 15.7701 1.14619 16.2689C1 16.8318 1 17.437 1 18.6468V31.2073C1 33.3171 1 34.3716 1.34254 35.2037C1.79926 36.3132 2.67472 37.1958 3.77734 37.6553C4.60431 38 5.65268 38 7.74942 38C9.84616 38 10.8957 38 11.7227 37.6553C12.8253 37.1958 13.7005 36.3134 14.1572 35.2039C14.4998 34.3718 14.5 33.3169 14.5 31.2071V28.9431C14.5 26.4424 16.5147 24.4151 19 24.4151C21.4853 24.4151 23.5 26.4424 23.5 28.9431V31.2071C23.5 33.3169 23.5 34.3718 23.8425 35.2039C24.2993 36.3134 25.1747 37.1958 26.2773 37.6553C27.1043 38 28.1527 38 30.2494 38C32.3462 38 33.3957 38 34.2227 37.6553C35.3253 37.1958 36.2005 36.3132 36.6572 35.2037C36.9998 34.3716 37 33.3171 37 31.2073Z"
      fill={active ? "white" : "none"} stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={active ? 1 : 0.55}/>
  </svg>
);

const IconGrafik = ({ active }) => (
  <svg width="22" height="20" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path opacity={active ? 1 : 0.55} d="M13 15V33M13 15H4.2C3.08 15 2.52 15 2.09 15.22C1.72 15.41 1.41 15.72 1.22 16.09C1 16.52 1 17.08 1 18.2V33H13M13 15V4.2C13 3.08 13 2.52 13.22 2.09C13.41 1.72 13.72 1.41 14.09 1.22C14.52 1 15.08 1 16.2 1H21.8C22.92 1 23.48 1 23.91 1.22C24.28 1.41 24.59 1.72 24.78 2.09C25 2.52 25 3.08 25 4.2V9M13 33H25M25 33L37 33V12.2C37 11.08 37 10.52 36.78 10.09C36.59 9.72 36.29 9.41 35.91 9.22C35.48 9 34.92 9 33.8 9H25M25 33V9"
      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconBudget = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path opacity={active ? 1 : 0.55} d="M10 1H8.2C5.68 1 4.42 1 3.46 1.49C2.61 1.92 1.92 2.61 1.49 3.46C1 4.42 1 5.68 1 8.2V29.8C1 32.32 1 33.58 1.49 34.54C1.92 35.39 2.61 36.08 3.46 36.51C4.42 37 5.68 37 8.19 37H10M10 1H29.8C32.32 1 33.58 1 34.54 1.49C35.39 1.92 36.08 2.61 36.51 3.46C37 4.42 37 5.68 37 8.19V29.81C37 32.32 37 33.58 36.51 34.54C36.08 35.39 35.39 36.08 34.54 36.51C33.58 37 32.32 37 29.81 37H10M10 1V37M19 16.75H28M19 10H28"
      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconCatatan = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path opacity={active ? 1 : 0.55} d="M13 5H7.4C5.16 5 4.04 5 3.18 5.44C2.43 5.82 1.82 6.43 1.44 7.18C1 8.04 1 9.16 1 11.4V30.6C1 32.84 1 33.96 1.44 34.82C1.82 35.57 2.43 36.18 3.18 36.56C4.04 37 5.16 37 7.39 37H26.61C28.84 37 29.96 37 30.81 36.56C31.57 36.18 32.18 35.57 32.56 34.82C33 33.96 33 32.84 33 30.61V25M25 7L13 19V25H19L31 13M25 7L31 1L37 7L31 13M25 7L31 13"
      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Settings icon — gear yang bersih tanpa syntax error
const IconSettings = ({ active }) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path opacity={active ? 1 : 0.55}
      d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
      stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path opacity={active ? 1 : 0.55}
      d="M19.4 15C19.1277 15.6171 19.2583 16.3378 19.73 16.82L19.79 16.88C20.1656 17.2551 20.3766 17.7642 20.3766 18.295C20.3766 18.8258 20.1656 19.3349 19.79 19.71C19.4149 20.0856 18.9058 20.2966 18.375 20.2966C17.8442 20.2966 17.3351 20.0856 16.96 19.71L16.9 19.65C16.4178 19.1783 15.6971 19.0477 15.08 19.32C14.4755 19.5791 14.0826 20.1724 14.08 20.83V21C14.08 22.1046 13.1846 23 12.08 23C10.9754 23 10.08 22.1046 10.08 21V20.91C10.0642 20.2327 9.63587 19.6339 9 19.4C8.38291 19.1277 7.66219 19.2583 7.18 19.73L7.12 19.79C6.74486 20.1656 6.23577 20.3766 5.705 20.3766C5.17423 20.3766 4.66514 20.1656 4.29 19.79C3.91445 19.4149 3.70343 18.9058 3.70343 18.375C3.70343 17.8442 3.91445 17.3351 4.29 16.96L4.35 16.9C4.82167 16.4178 4.95231 15.6971 4.68 15.08C4.42093 14.4755 3.82764 14.0826 3.17 14.08H3C1.89543 14.08 1 13.1846 1 12.08C1 10.9754 1.89543 10.08 3 10.08H3.09C3.76733 10.0642 4.36613 9.63587 4.6 9C4.87231 8.38291 4.74167 7.66219 4.27 7.18L4.21 7.12C3.83445 6.74486 3.62343 6.23577 3.62343 5.705C3.62343 5.17423 3.83445 4.66514 4.21 4.29C4.58514 3.91445 5.09423 3.70343 5.625 3.70343C6.15577 3.70343 6.66486 3.91445 7.04 4.29L7.1 4.35C7.58219 4.82167 8.30291 4.95231 8.92 4.68H9C9.60447 4.42093 9.99738 3.82764 10 3.17V3C10 1.89543 10.8954 1 12 1C13.1046 1 14 1.89543 14 3V3.09C14.0026 3.74764 14.3955 4.34093 15 4.6C15.6171 4.87231 16.3378 4.74167 16.82 4.27L16.88 4.21C17.2551 3.83445 17.7642 3.62343 18.295 3.62343C18.8258 3.62343 19.3349 3.83445 19.71 4.21C20.0856 4.58514 20.2966 5.09423 20.2966 5.625C20.2966 6.15577 20.0856 6.66486 19.71 7.04L19.65 7.1C19.1783 7.58219 19.0477 8.30291 19.32 8.92V9C19.5791 9.60447 20.1724 9.99738 20.83 10H21C22.1046 10 23 10.8954 23 12C23 13.1046 22.1046 14 21 14H20.91C20.2524 14.0026 19.6591 14.3955 19.4 15Z"
      stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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
      <div style={{ position:"absolute", left:-7, bottom:18, width:12, height:12, background:bg, border:`1.5px solid ${bdr}`, borderRight:"none", borderTop:"none", transform:"rotate(45deg)" }} />
      <div style={{ fontWeight:700, fontSize:14, color:txt, marginBottom:2 }}>{profile?.name ?? "—"}</div>
      <div style={{ fontSize:11, color:sub, marginBottom:10 }}>{profile?.email ?? "—"}</div>
      {(profile?.city || profile?.province) && (
        <div style={{ fontSize:11, color:sub, marginBottom:4 }}>📍 {[profile.city, profile.province].filter(Boolean).join(", ")}</div>
      )}
      {profile?.umr_value > 0 && (
        <div style={{ fontSize:11, color:sub, marginBottom:10 }}>💰 UMR: Rp {profile.umr_value.toLocaleString("id-ID")}</div>
      )}
      <div style={{ borderTop:`1px solid ${bdr}`, paddingTop:8, display:"flex", flexDirection:"column", gap:2 }}>
        <button onClick={onEdit} style={{ width:"100%", textAlign:"left", padding:"7px 8px", borderRadius:8, border:"none", background:"transparent", cursor:"pointer", fontSize:12, color:"#4A7A32", fontWeight:600, fontFamily:"inherit" }}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(74,122,50,0.1)"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>✏️ Edit Profil</button>
        <button onClick={onLogout} style={{ width:"100%", textAlign:"left", padding:"7px 8px", borderRadius:8, border:"none", background:"transparent", cursor:"pointer", fontSize:12, color:"#C0392B", fontWeight:600, fontFamily:"inherit" }}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(192,57,43,0.08)"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>↩ Keluar</button>
      </div>
    </div>
  );
}

// Logo Moni SVG (disederhanakan agar tidak terlalu berat)
const MoniLogo = () => (
  <svg width="30" height="22" viewBox="0 0 699 488" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M613.491 83.5835C614.037 83.8489 614.635 83.9869 615.242 83.9869H655.149C658.476 83.9869 660.349 87.8126 658.308 90.4404L537.161 246.426C536.616 247.127 536.32 247.991 536.32 248.879V475.709C536.32 477.918 534.529 479.709 532.32 479.709H442.32C440.111 479.709 438.32 477.918 438.32 475.709V385.362C438.32 381.552 433.498 379.9 431.161 382.909L386.754 440.152L375.213 475.213C374.681 476.866 373.143 477.987 371.406 477.987H359.713C358.24 477.987 356.885 477.177 356.189 475.878L229.845 240.387C228.336 237.575 224.304 237.575 222.795 240.387L96.4516 475.878C95.7549 477.177 94.4006 477.987 92.9269 477.987H4.00556C0.981521 477.987 -0.948857 474.761 0.480811 472.096L176.189 144.596C176.885 143.297 178.24 142.487 179.713 142.487H272.927C274.401 142.487 275.755 143.297 276.452 144.596L372.332 323.305C373.7 325.856 377.24 326.154 379.016 323.868L438.195 247.67C438.276 247.565 438.32 247.437 438.32 247.304V247.126C438.738 246.709 439.068 246.547 565.32 83.9869L576.828 69.2587C577.99 67.7715 580.033 67.2989 581.73 68.1249L613.491 83.5835Z" fill="white" opacity="0.9"/>
    <path d="M674.651 148.825C674.218 151.873 670.648 153.31 668.224 151.411L646.351 134.272C644.607 132.906 642.084 133.217 640.725 134.967L432.307 403.323L378.096 473.133C376.32 475.417 372.782 475.117 371.414 472.568L246.846 240.386C245.337 237.574 241.305 237.574 239.796 240.386L113.452 475.877C112.756 477.176 111.401 477.986 109.928 477.986H21.0063C17.9823 477.986 16.0519 474.76 17.4815 472.095L193.189 144.595C193.886 143.296 195.24 142.486 196.714 142.486H289.928C291.401 142.486 292.756 143.296 293.452 144.595L389.333 323.305C390.701 325.855 394.241 326.153 396.016 323.867L579.822 87.2029C581.173 85.4635 580.864 82.9592 579.13 81.6008L561.485 67.7748C559.062 65.8757 559.603 62.0649 562.459 60.9154L688.26 10.295C691.116 9.14556 694.146 11.5195 693.713 14.5682L674.651 148.825Z" fill="white" opacity="0.7"/>
  </svg>
);

function Sidebar({ active, onChange, profile, onLogout, darkMode }) {
  const [showProfile, setShowProfile] = useState(false);

  const handleEdit   = () => { setShowProfile(false); onChange("settings"); };
  const handleLogout = () => { setShowProfile(false); onLogout(); };

  return (
    <div style={{
      width:60, background:"#2D4A1E", display:"flex", flexDirection:"column",
      alignItems:"center", padding:"14px 0", gap:2,
      position:"fixed", left:0, top:0, bottom:0, zIndex:100,
    }}>
      {/* Logo Moni */}
      <div style={{ marginBottom:14, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <MoniLogo />
      </div>

      {/* Nav */}
      {NAVS.map(({ id, label, Icon }) => (
        <button key={id} title={label} onClick={() => onChange(id)} style={{
          width:44, height:44, borderRadius:12, border:"none", cursor:"pointer",
          transition:"all .2s",
          background: active===id ? "rgba(255,255,255,0.18)" : "transparent",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <Icon active={active===id} />
        </button>
      ))}

      <div style={{ flex:1 }} />

      {/* Settings */}
      <button title="Pengaturan" onClick={() => onChange("settings")} style={{
        width:44, height:44, borderRadius:12, border:"none", cursor:"pointer",
        transition:"all .2s",
        background: active==="settings" ? "rgba(255,255,255,0.18)" : "transparent",
        display:"flex", alignItems:"center", justifyContent:"center",
        marginBottom:6,
      }}>
        <IconSettings active={active==="settings"} />
      </button>

      {/* Avatar */}
      <div style={{ position:"relative", marginBottom:8 }}>
        <button
          title={profile?.name ?? "Profil"}
          onClick={() => setShowProfile(v => !v)}
          style={{
            width:36, height:36, borderRadius:"50%",
            background: showProfile ? "rgba(255,255,255,0.38)" : "rgba(255,255,255,0.22)",
            border: showProfile ? "2px solid rgba(255,255,255,0.7)" : "2px solid transparent",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:12, color:"white", fontWeight:700,
            cursor:"pointer", transition:"all .2s",
            fontFamily:"'Poppins',sans-serif",
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