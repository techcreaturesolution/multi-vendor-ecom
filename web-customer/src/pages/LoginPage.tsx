import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
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
      if (res.data.user.role !== "customer") {
        toast.error("Use the appropriate portal for your role.");
        return;
      }
      setAuth({
        user: res.data.user,
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      });
      navigate("/");
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Login failed"
      );
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Sign in</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white border rounded-lg p-6">
        <label className="block text-sm">
          Email
          <input type="email" className="mt-1 w-full rounded-md border-gray-300" {...register("email", { required: true })} />
        </label>
        <label className="block text-sm">
          Password
          <input type="password" className="mt-1 w-full rounded-md border-gray-300" {...register("password", { required: true })} />
        </label>
        <button
          disabled={formState.isSubmitting}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-md disabled:opacity-50"
        >
          {formState.isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-4 text-center">
        New to MVE? <Link to="/signup" className="text-primary-600">Create an account</Link>
      </p>
    </div>
  );
}
