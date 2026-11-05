import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { endpoints } from "../api/client";

const PUBLIC_ORIGIN =
  (import.meta.env.VITE_PUBLIC_ORIGIN && import.meta.env.VITE_PUBLIC_ORIGIN.trim()) ||
  window.location.origin;

export default function AdminLocations() {
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({ building: "", floor: "", room: "", zone_name: "", qr_key: "" });
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState(PUBLIC_ORIGIN);

  const load = () =>
    endpoints.listLocations().then((r) => setLocations(r.data)).catch(() => {});

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await endpoints.createLocation(form);
      setForm({ building: "", floor: "", room: "", zone_name: "", qr_key: "" });
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || "Не удалось создать локацию");
    }
  };

  const qrUrl = (key) => `${origin.replace(/\/+$/, "")}/?loc=${encodeURIComponent(key)}`;

  const downloadPng = (loc) => {
    window.location.href = `http://127.0.0.1:8000/api/locations/${loc.id}/qr.png?origin=${encodeURIComponent(origin)}`;
  };

  const printPage = () => window.print();

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/admin" className="btn text-xs">← К заявкам</Link>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">QR-локации</span>
            <button className="btn text-xs" onClick={printPage}>Печать</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-4 print:block">
        <form onSubmit={create} className="card p-4 space-y-3 print:hidden">
          <h2 className="text-sm font-medium">Новая локация</h2>
          <div>
            <label className="label">Корпус</label>
            <input className="input" value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Этаж</label>
              <input className="input" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
            </div>
            <div>
              <label className="label">Кабинет</label>
              <input className="input" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="label">Зона (необязательно)</label>
            <input className="input" value={form.zone_name} onChange={(e) => setForm({ ...form, zone_name: e.target.value })} />
          </div>
          <div>
            <label className="label">QR-ключ</label>
            <input className="input" value={form.qr_key} onChange={(e) => setForm({ ...form, qr_key: e.target.value })} placeholder="cab-214" required />
          </div>
          <div>
            <label className="label">Домен для QR-кодов</label>
            <input
              className="input"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="http://localhost:5173"
            />
            <p className="muted text-xs mt-1">Можно вписать IP в локальной сети, например <code>http://192.168.1.10:5173</code> — тогда QR откроется с телефона.</p>
          </div>
          {error && <div className="text-sm text-rose-700">{error}</div>}
          <button type="submit" className="btn btn-primary w-full">Создать</button>
        </form>

        <div className="lg:col-span-2 space-y-3 print:col-span-3 print:grid print:grid-cols-2 print:gap-4 print:space-y-0">
          {locations.length === 0 && (
            <div className="card p-5 muted text-sm print:hidden">Локаций пока нет.</div>
          )}
          {locations.map((l) => (
            <div key={l.id} className="card p-4 flex items-center gap-4 print:border print:rounded-none print:break-inside-avoid">
              <div className="bg-white p-2 rounded border" style={{ borderColor: "var(--border)" }}>
                <QRCodeSVG value={qrUrl(l.qr_key)} size={128} bgColor="#ffffff" fgColor="#1f2429" />
              </div>
              <div className="flex-1">
                <div className="font-medium">
                  {l.building}, каб. {l.room} {l.zone_name ? `· ${l.zone_name}` : ""}
                </div>
                <div className="muted text-xs font-mono mt-1">{l.qr_key}</div>
                <a
                  href={qrUrl(l.qr_key)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs underline mt-1 inline-block print:hidden"
                  style={{ color: "var(--accent)" }}
                >
                  открыть ссылку
                </a>
                <button className="btn text-xs ml-2 mt-1 print:hidden" onClick={() => downloadPng(l)}>
                  Скачать PNG
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
