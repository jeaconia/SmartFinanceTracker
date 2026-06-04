import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar.jsx";
import NotifPanel from "./components/NotifPanel.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import Settings from "./pages/Settings.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Grafik from "./pages/Grafik.jsx";
import Budgeting from "./pages/Budgeting.jsx";
import Catatan from "./pages/Catatan.jsx";
import * as API from "./services/api.js";
import { T } from "./constants/translations.js";
import { supabase } from "./services/supabase.js";

export default function App() {
  const [session,     setSession]     = useState(undefined);
  const [page,        setPage]        = useState("dashboard");
  const [profile,     setProfile]     = useState(null);
  const [notifs,      setNotifs]      = useState([]);
  const [showNotif,   setShowNotif]   = useState(false);
  const [darkMode,    setDarkMode]    = useState(() => localStorage.getItem("darkMode") === "true");
  const [lang,        setLang]        = useState(() => localStorage.getItem("lang") || "en");

  const theme = {
    bg:   darkMode ? "#111c0b" : "#F0EDD8",
    card: darkMode ? "#1a2a12" : "white",
    txt:  darkMode ? "#e8f5e0" : "#1a1a1a",
    sub:  darkMode ? "#8BBB6A" : "#666",
    bdr:  darkMode ? "#2D4A1E" : "#C8D4A0",
    inp:  darkMode ? "#243318" : "white",
  };

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("darkMode", String(next));
  };

  const toggleLang = (code) => {
    setLang(code);
    localStorage.setItem("lang", code);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) API.setAuthToken(s.access_token);
      setSession(s ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (s) API.setAuthToken(s.access_token);
      else   API.clearAuthToken();
      setSession(s ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    API.getProfile().then(setProfile).catch(() => {});
    API.listNotifications().then(setNotifs).catch(() => {});
  }, [session]);

  const handleAuth = (newSession) => {
    API.setAuthToken(newSession.access_token);
    setSession(newSession);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    API.clearAuthToken();
    setSession(null);
    setProfile(null);
    setNotifs([]);
    setPage("dashboard");
  };

  const handleReadAll = async () => {
    try {
      await API.markAllNotifRead();
      setNotifs(p => p.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.warn(e);
    }
  };

  if (session === undefined) {
    const t = T[lang] || T.en;
    return (
      <div className="page-loading">
        <span className="pulse">{t.loading}</span>
      </div>
    );
  }

  if (!session) return <AuthPage onAuth={handleAuth} lang={lang} />;

  return (
    <div className={"app-root" + (darkMode ? " dark" : "")} style={{ background: theme.bg }}>
      <Sidebar
        active={page}
        onChange={p => { setPage(p); setShowNotif(false); }}
        profile={profile}
        onLogout={handleLogout}
        darkMode={darkMode}
        lang={lang}
      />

      {showNotif && <NotifPanel notifs={notifs} onClose={() => setShowNotif(false)} onReadAll={handleReadAll} lang={lang} />}

      <main className="page-main">
        {page === "dashboard"  && <Dashboard profile={profile} notifs={notifs} onBell={() => setShowNotif(v => !v)} theme={theme} darkMode={darkMode} lang={lang} />}
        {page === "grafik"     && <Grafik theme={theme} lang={lang} />}
        {page === "budgeting"  && <Budgeting theme={theme} lang={lang} />}
        {page === "catatan"    && <Catatan theme={theme} lang={lang} />}
        {page === "settings"   && (
          <Settings
            profile={profile}
            onProfileUpdate={setProfile}
            darkMode={darkMode}
            onToggleDark={toggleDark}
            lang={lang}
            onToggleLang={toggleLang}
          />
        )}
      </main>
    </div>
  );
}
