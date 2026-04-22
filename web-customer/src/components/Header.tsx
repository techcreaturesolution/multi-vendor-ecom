import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, LogOut } from "lucide-react";
import { useAuthStore } from "../store/auth";

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <header className="border-b bg-white sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold">
          MVE Shop
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/" className="text-gray-700 hover:text-primary-600">
            Shop
          </Link>
          {user ? (
            <>
              <Link to="/orders" className="text-gray-700 hover:text-primary-600">
                Orders
              </Link>
              <Link to="/cart" className="relative flex items-center gap-1 text-gray-700">
                <ShoppingCart size={18} /> Cart
              </Link>
              <div className="flex items-center gap-2 text-sm">
                <User size={14} /> {user.name}
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="flex items-center gap-1 text-gray-600 hover:text-red-600"
              >
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <>
              <Link to="/cart" className="flex items-center gap-1 text-gray-700">
                <ShoppingCart size={18} /> Cart
              </Link>
              <Link to="/login" className="text-primary-600 hover:underline">
                Sign in
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
