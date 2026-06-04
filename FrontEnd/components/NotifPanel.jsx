import { T } from "../constants/translations.js";

export default function NotifPanel({ notifs, onClose, onReadAll, lang = "en" }) {
  const t = T[lang] || T.en;

  return (
    <div className="notif-panel">
      {/* Header */}
      <div className="notif-panel-header">
        <span>{t.notifications}</span>
        <div className="notif-panel-actions">
          <button className="notif-panel-action-button read-all" onClick={onReadAll}>{t.markAllRead}</button>
          <button className="notif-panel-action-button close" onClick={onClose}>✕</button>
        </div>
      </div>

      {/* Empty state */}
      {notifs.length === 0 && (
        <div className="notif-panel-empty">{t.noNotifications}</div>
      )}

      {/* List */}
      {notifs.map((n) => (
        <div
          key={n.id}
          className={`notif-item${n.read ? "" : " unread"}`}
        >
          <div className={`notif-item-title${n.type === "overbudget" ? " overbudget" : ""}`}>
            {n.type === "overbudget" ? "⚠️" : n.type === "rutin" ? "🔔" : "ℹ️"} {n.title}
          </div>
          <div className="notif-item-text">{n.msg}</div>
          <div className="notif-item-time">{n.time}</div>
        </div>
      ))}
    </div>
  );
}