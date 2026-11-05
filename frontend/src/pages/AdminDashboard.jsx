import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { endpoints } from "../api/client";
import StatusBadge, { STATUS_LIST } from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [locationId, setLocationId] = useState("");
  const [locations, setLocations] = useState([]);
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    endpoints.listLocations().then((r) => setLocations(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      endpoints
        .listTickets({ q: q || undefined, status: status || undefined, location_id: locationId || undefined })
        .then((r) => setTickets(r.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [q, status, locationId]);

  const logout = () => {
    auth.logout();
    navigate("/login", { replace: true });
  };

  const rows = useMemo(() => tickets, [tickets]);

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="font-semibold">Панель УПК</div>
            <div className="muted text-xs">Заявки и обращения</div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/locations" className="btn">QR-локации</Link>
            <button className="btn" onClick={logout}>Выйти</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="card p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            className="input md:col-span-2"
            placeholder="Поиск по номеру или тексту"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Все статусы</option>
            {STATUS_LIST.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select className="input" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
            <option value="">Все помещения</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.building}, каб. {l.room}
              </option>
            ))}
          </select>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Номер</th>
                <th className="px-3 py-2 font-medium">Дата</th>
                <th className="px-3 py-2 font-medium">Категория</th>
                <th className="px-3 py-2 font-medium">Помещение</th>
                <th className="px-3 py-2 font-medium">Статус</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-3 py-6 muted text-center">Загрузка…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 muted text-center">Заявок по выбранным фильтрам нет</td></tr>
              )}
              {rows.map((t) => (
                <tr key={t.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-3 py-2 font-mono text-xs">{t.public_number}</td>
                  <td className="px-3 py-2 muted">{new Date(t.created_at).toLocaleDateString("ru-RU")}</td>
                  <td className="px-3 py-2">{t.category || "—"}</td>
                  <td className="px-3 py-2">{t.location || "—"}</td>
                  <td className="px-3 py-2"><StatusBadge status={t.status} /></td>
                  <td className="px-3 py-2 text-right">
                    <Link to={`/admin/ticket/${t.id}`} className="btn text-xs">Открыть</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}