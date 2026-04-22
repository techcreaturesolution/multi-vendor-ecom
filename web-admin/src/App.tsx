import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./store/auth";
import LoginPage from "./pages/LoginPage";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import CategoriesPage from "./pages/CategoriesPage";
import VendorsPage from "./pages/VendorsPage";
import PlaceholderPage from "./pages/PlaceholderPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "master_admin") return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="vendors" element={<VendorsPage />} />
        <Route path="mous" element={<PlaceholderPage title="MOUs" />} />
        <Route path="customers" element={<PlaceholderPage title="Customers" />} />
        <Route path="payouts" element={<PlaceholderPage title="Payouts" />} />
      </Route>
    </Routes>
  );
}
