import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Megaphone,
  Bot,
  BarChart3,
  Settings,
  CreditCard,
  Shield,
  Smartphone,
  LogOut,
} from "lucide-react";
import { useAuth } from "../store/AuthContext";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/chat", icon: MessageSquare, label: "Chat Inbox" },
  { to: "/contacts", icon: Users, label: "Contacts" },
  { to: "/campaigns", icon: Megaphone, label: "Campaigns" },
  { to: "/auto-reply", icon: Bot, label: "Auto Reply" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/whatsapp-accounts", icon: Smartphone, label: "WhatsApp Accounts" },
  { to: "/subscription", icon: CreditCard, label: "Subscription" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const adminItems = [
  { to: "/admin", icon: Shield, label: "Admin Panel" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  const items = user?.role === "super_admin"
    ? [...navItems, ...adminItems]
    : navItems;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-700 flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          WA SaaS
        </h1>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <div className="px-3 py-2 text-sm text-gray-500 truncate">{user?.email}</div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
