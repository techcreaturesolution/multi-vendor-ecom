import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import Campaigns from "./pages/Campaigns";
import ChatInbox from "./pages/ChatInbox";
import WhatsAppAccounts from "./pages/WhatsAppAccounts";
import AutoReply from "./pages/AutoReply";
import Analytics from "./pages/Analytics";
import SubscriptionPage from "./pages/SubscriptionPage";
import Settings from "./pages/Settings";
import AdminPanel from "./pages/AdminPanel";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="chat" element={<ChatInbox />} />
        <Route path="whatsapp-accounts" element={<WhatsAppAccounts />} />
        <Route path="auto-reply" element={<AutoReply />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="subscription" element={<SubscriptionPage />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin" element={<AdminPanel />} />
      </Route>
    </Routes>
  );
}
