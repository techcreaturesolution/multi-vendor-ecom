import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import {
  LayoutGrid,
  Tags,
  Store,
  Users,
  Wallet,
  FileText,
  LogOut,
  Undo2,
} from "lucide-react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/vendors", label: "Vendors", icon: Store },
  { to: "/mous", label: "MOUs", icon: FileText },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/payouts", label: "Payouts", icon: Wallet },
  { to: "/returns", label: "Returns", icon: Undo2 },
];

export default function Layout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <div className="flex h-full">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b">
          <Link to="/" className="text-lg font-bold">
            MVE Admin
          </Link>
        </div>
        <nav className="flex-1 py-4 space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-2.5 text-sm ${
                  isActive
                    ? "bg-primary-50 text-primary-700 border-r-2 border-primary-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t">
          <div className="text-xs text-gray-500">Signed in as</div>
          <div className="text-sm font-medium truncate">{user?.email}</div>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-gray-700 hover:text-red-600"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
