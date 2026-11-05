import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { endpoints } from "../api/client";

export default function CreateTicket() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const qrKey = searchParams.get("loc");

  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [locationId, setLocationId] = useState("");
  const [locations, setLocations] = useState([]);
  const [qrLocation, setQrLocation] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    endpoints
      .listLocations()
      .then((r) => setLocations(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!qrKey) return;
    // ждём, пока локации загрузятся
    if (locations.length === 0) return;
    const found = locations.find((l) => l.qr_key === qrKey);
    if (found) {
      setQrLocation(found);
      setLocationId(String(found.id));
    } else {
      setError("QR-код не распознан. Выберите помещение вручную.");
    }
  }, [qrKey, locations]);

  const askAI = async () => {
    if (!description.trim()) {
      setError("Сначала опишите ситуацию");
      return;
    }
    setError("");
    setAiLoading(true);
    setAiResult(null);
    try {
      const r = await endpoints.aiAssist({ text: description });
      setAiResult(r.data);
    } catch {
      setError("ИИ-помощник временно недоступен");
    } finally {
      setAiLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Опишите проблему");
      return;
    }
    if (!locationId) {
      setError("Укажите помещение");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("description", description);
      fd.append("location_id", locationId);
      if (aiResult?.category_id) fd.append("category_id", aiResult.category_id);
      if (file) fd.append("photo", file);

      const r = await endpoints.createTicket(fd);
      navigate(`/track/${r.data.tracking_token}`, {
        state: { public_number: r.data.public_number },
      });
    } catch {
      setError("Не удалось отправить заявку. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  };

  const aiLabel = {
    question: "Типовой вопрос",
    fault: "Неисправность",
    danger: "Потенциальная опасность",
    unknown: "Недостаточно информации",
  };

  return (
    <div className="min-h-screen flex justify-center px-4 py-8">
      <div className="w-full max-w-xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Обращение в УПК</h1>
          <p className="muted text-sm mt-1">
            Опишите проблему или задайте вопрос — мы направим его ответственному сотруднику.
          </p>
        </div>

        <form onSubmit={submit} className="card p-5 space-y-5">
          {qrLocation && (
            <div className="text-sm px-3 py-2 rounded-md bg-slate-50 border border-slate-200">
              Определено по QR-коду: <span className="font-medium">{qrLocation.building}, каб. {qrLocation.room}</span>
            </div>
          )}

          {qrKey && !qrLocation && locations.length > 0 && (
            <div className="text-sm px-3 py-2 rounded-md border border-amber-200 bg-amber-50 text-amber-900">
              QR-код не распознан. Выберите помещение вручную.
            </div>
          )}

          <div>
            <label className="label">Описание</label>
            <textarea
              className="input min-h-[110px]"
              placeholder="Например: в кабинете 214 не работает проектор"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
            />
          </div>

          <div>
            <label className="label">Помещение</label>
            {qrLocation ? (
              <div className="input bg-slate-50 text-slate-700 cursor-not-allowed">
                {qrLocation.building}, каб. {qrLocation.room}
                {qrLocation.zone_name ? ` (${qrLocation.zone_name})` : ""}
              </div>
            ) : (
              <select
                className="input"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
              >
                <option value="">— выберите помещение —</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.building}, каб. {l.room}
                    {l.zone_name ? ` (${l.zone_name})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="label">Фото (необязательно)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0] || null)}
              className="block text-sm"
            />
            {file && <p className="muted text-xs mt-1">{file.name}</p>}
          </div>

          <div className="flex gap-2">
            <button type="button" className="btn" onClick={askAI} disabled={aiLoading}>
              {aiLoading ? "Анализируем…" : "Спросить ИИ"}
            </button>
          </div>

          {aiResult && (
            <div className="border rounded-md p-3 bg-slate-50 space-y-2">
              <div className="flex items-center gap-2">
                <span className="badge bg-slate-100 text-slate-700 border-slate-200">
                  {aiLabel[aiResult.classification] || aiResult.classification}
                </span>
                {aiResult.category && (
                  <span className="badge bg-slate-100 text-slate-700 border-slate-200">
                    {aiResult.category}
                  </span>
                )}
              </div>
              <p className="text-sm whitespace-pre-line">{aiResult.answer}</p>
              {aiResult.recommend_ticket && (
                <p className="text-sm muted">
                  Рекомендуем оформить заявку — сотрудник проверит и поможет.
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="text-sm px-3 py-2 rounded-md border border-rose-200 bg-rose-50 text-rose-800">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
              {submitting ? "Отправляем…" : "Отправить заявку"}
            </button>
          </div>
        </form>

        <p className="muted text-xs mt-4">
          Не передавайте персональные данные. При опасной ситуации (дым, искры) покиньте помещение и сообщите сотруднику.
        </p>
      </div>
    </div>
  );
}