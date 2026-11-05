import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { endpoints } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await endpoints.login({ login, password });
      auth.login(r.data.access_token, r.data.role);
      navigate("/admin", { replace: true });
    } catch {
      setError("Неверный логин или пароль");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={submit} className="card p-6 w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Вход для сотрудников</h1>
          <p className="muted text-sm mt-1">Панель УПК</p>
        </div>
        <div>
          <label className="label">Логин</label>
          <input className="input" value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" />
        </div>
        <div>
          <label className="label">Пароль</label>
          <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        {error && <div className="text-sm text-rose-700">{error}</div>}
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Входим…" : "Войти"}
        </button>
      </form>
    </div>
  );
}