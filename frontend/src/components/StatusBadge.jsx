const STATUSES = {
  new:         { label: "Новая",                cls: "bg-blue-50 text-blue-800 border-blue-200" },
  in_review:   { label: "На рассмотрении",      cls: "bg-amber-50 text-amber-800 border-amber-200" },
  assigned:    { label: "Назначен исполнитель", cls: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  in_progress: { label: "В работе",             cls: "bg-purple-50 text-purple-800 border-purple-200" },
  needs_info:  { label: "Нужны уточнения",      cls: "bg-orange-50 text-orange-800 border-orange-200" },
  resolved:    { label: "Решена",               cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  rejected:    { label: "Отклонена",            cls: "bg-rose-50 text-rose-800 border-rose-200" },
};

export const STATUS_LIST = Object.entries(STATUSES).map(([value, v]) => ({
  value,
  label: v.label,
}));

export default function StatusBadge({ status }) {
  const s = STATUSES[status] || { label: status, cls: "bg-slate-100 text-slate-700 border-slate-200" };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}