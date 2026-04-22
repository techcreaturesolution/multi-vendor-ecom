import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./store/auth";
import LoginPage from "./pages/LoginPage";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import CategoriesPage from "./pages/CategoriesPage";
import VendorsPage from "./pages/VendorsPage";
import MousPage from "./pages/MousPage";
import CustomersPage from "./pages/CustomersPage";
import PayoutsPage from "./pages/PayoutsPage";
import ReturnsPage from "./pages/ReturnsPage";

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
        <Route path="mous" element={<MousPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="payouts" element={<PayoutsPage />} />
        <Route path="returns" element={<ReturnsPage />} />
      </Route>
    </Routes>
  );
}
