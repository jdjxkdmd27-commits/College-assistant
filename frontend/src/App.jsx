import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import CreateTicket from "./pages/CreateTicket";
import TrackTicket from "./pages/TrackTicket";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import TicketDetail from "./pages/TicketDetail";
import AdminLocations from "./pages/AdminLocations";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CreateTicket />} />
          <Route path="/track/:token" element={<TrackTicket />} />
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/ticket/:id" element={<TicketDetail />} />
            <Route path="/admin/locations" element={<AdminLocations />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}