import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { endpoints } from "../api/client";
import StatusBadge from "../components/StatusBadge";

export default function TrackTicket() {
  const { token } = useParams();
  const { state } = useLocation();
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    endpoints
      .trackTicket(token)
      .then((r) => setTicket(r.data))
      .catch(() => setError("Заявка не найдена или ссылка недействительна"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="p-6 muted">Загрузка…</div>;
  if (error) return <div className="p-6 text-rose-700">{error}</div>;

  return (
    <div className="min-h-screen flex justify-center px-4 py-8">
      <div className="w-full max-w-xl space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Заявка {ticket.public_number}</h1>
          <p className="muted text-sm mt-1">
            Сохраните эту ссылку — по ней можно проверить статус.
          </p>
        </div>

        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="muted text-sm">Статус</span>
            <StatusBadge status={ticket.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="muted text-sm">Категория</span>
            <span className="text-sm">{ticket.category || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="muted text-sm">Помещение</span>
            <span className="text-sm">{ticket.location || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="muted text-sm">Создана</span>
            <span className="text-sm">{new Date(ticket.created_at).toLocaleString("ru-RU")}</span>
          </div>
          <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            <p className="muted text-sm mb-1">Описание</p>
            <p className="text-sm whitespace-pre-line">{ticket.description}</p>
          </div>
        </div>

        {ticket.comments?.length > 0 && (
          <div className="card p-5">
            <h2 className="text-sm font-medium mb-3">Комментарии</h2>
            <div className="space-y-3">
              {ticket.comments.map((c) => (
                <div key={c.id} className="text-sm">
                  <div className="muted text-xs">
                    {new Date(c.created_at).toLocaleString("ru-RU")}
                  </div>
                  <div className="whitespace-pre-line">{c.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {state?.public_number && (
          <p className="muted text-xs">
            Номер вашей заявки: {state.public_number}
          </p>
        )}
      </div>
    </div>
  );
}