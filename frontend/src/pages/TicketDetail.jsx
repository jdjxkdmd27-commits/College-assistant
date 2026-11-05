import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { endpoints } from "../api/client";
import StatusBadge, { STATUS_LIST } from "../components/StatusBadge";

export default function TicketDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [comment, setComment] = useState("");
  const [commentPublic, setCommentPublic] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    endpoints
      .getTicket(id)
      .then((r) => {
        setTicket(r.data);
        setStatus(r.data.status);
      })
      .catch(() => setError("Не удалось загрузить заявку"));
  };

  useEffect(load, [id]);

  const saveStatus = async () => {
    setError("");
    setSaving(true);
    try {
      await endpoints.updateStatus(id, { status, note: note || undefined });
      setNote("");
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || "Не удалось изменить статус");
    } finally {
      setSaving(false);
    }
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    setError("");
    setSaving(true);
    try {
      await endpoints.addComment(id, {
        body: comment,
        visibility: commentPublic ? "public" : "internal",
      });
      setComment("");
      load();
    } catch {
      setError("Не удалось добавить комментарий");
    } finally {
      setSaving(false);
    }
  };

  if (error && !ticket) return <div className="p-6 text-rose-700">{error}</div>;
  if (!ticket) return <div className="p-6 muted">Загрузка…</div>;

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/admin" className="btn text-xs">← К списку</Link>
          <span className="font-mono text-sm">{ticket.public_number}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 space-y-4">
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold">Описание</h1>
              <StatusBadge status={ticket.status} />
            </div>
            <p className="text-sm whitespace-pre-line">{ticket.description}</p>
            <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <div><span className="muted">Категория: </span>{ticket.category || "—"}</div>
              <div><span className="muted">Помещение: </span>{ticket.location || "—"}</div>
              <div><span className="muted">Создана: </span>{new Date(ticket.created_at).toLocaleString("ru-RU")}</div>
              <div><span className="muted">Обновлена: </span>{new Date(ticket.updated_at).toLocaleString("ru-RU")}</div>
            </div>
            {ticket.photo_url && (
              <img src={ticket.photo_url} alt="Фото к заявке" className="rounded-md border max-h-72 object-contain" style={{ borderColor: "var(--border)" }} />
            )}
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-medium mb-3">История</h2>
            {ticket.history?.length ? (
              <ul className="space-y-2 text-sm">
                {ticket.history.map((h) => (
                  <li key={h.id} className="flex justify-between gap-3">
                    <span>{h.old_status || "—"} → {h.new_status}{h.note ? ` — ${h.note}` : ""}</span>
                    <span className="muted text-xs whitespace-nowrap">
                      {new Date(h.created_at).toLocaleString("ru-RU")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted text-sm">Изменений пока не было.</p>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="card p-4 space-y-3">
            <h2 className="text-sm font-medium">Изменить статус</h2>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_LIST.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            {(status === "resolved" || status === "rejected") && (
              <textarea
                className="input min-h-[70px]"
                placeholder={status === "resolved" ? "Итоговый комментарий" : "Причина отклонения"}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            )}
            <button className="btn btn-primary w-full" onClick={saveStatus} disabled={saving}>Сохранить</button>
          </div>

          <div className="card p-4 space-y-3">
            <h2 className="text-sm font-medium">Комментарий</h2>
            <textarea
              className="input min-h-[70px]"
              placeholder="Текст комментария"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={commentPublic} onChange={(e) => setCommentPublic(e.target.checked)} />
              Публичный (виден заявителю)
            </label>
            <button className="btn w-full" onClick={addComment} disabled={saving || !comment.trim()}>Добавить</button>
          </div>

          {error && <div className="text-sm text-rose-700">{error}</div>}
        </aside>
      </main>
    </div>
  );
}