import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";

interface FormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { register, handleSubmit, formState } = useForm<FormData>();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post("/api/auth/login", data);
      if (res.data.user.role !== "master_admin") {
        toast.error("This portal is for master admins only.");
        return;
      }
      setAuth({
        user: res.data.user,
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      });
      toast.success("Welcome back");
      navigate("/");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Login failed";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md bg-white p-8 rounded-xl shadow"
      >
        <h1 className="text-2xl font-bold mb-1">Master Admin</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to manage the marketplace</p>

        <label className="block mb-3">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            {...register("email", { required: true })}
          />
        </label>

        <label className="block mb-5">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            {...register("password", { required: true })}
          />
        </label>

        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-md transition"
        >
          {formState.isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
