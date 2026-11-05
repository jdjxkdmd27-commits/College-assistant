import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
});

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export const endpoints = {
  createTicket: (data) => api.post("/tickets", data),
  trackTicket: (token) => api.get(`/tickets/track/${token}`),
  login: (data) => api.post("/auth/login", data),
  listTickets: (params) => api.get("/tickets", { params }),
  getTicket: (id) => api.get(`/tickets/${id}`),
  updateStatus: (id, data) => api.patch(`/tickets/${id}/status`, data),
  addComment: (id, data) => api.post(`/tickets/${id}/comments`, data),
  listLocations: () => api.get("/locations"),
  createLocation: (data) => api.post("/locations", data),
  aiAssist: (data) => api.post("/ai/assist", data),
};