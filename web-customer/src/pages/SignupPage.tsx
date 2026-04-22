import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export default function SignupPage() {
  const { register, handleSubmit, formState } = useForm<FormData>();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const onSubmit = async (d: FormData) => {
    try {
      const r = await api.post("/api/auth/signup/customer", d);
      setAuth({
        user: r.data.user,
        accessToken: r.data.accessToken,
        refreshToken: r.data.refreshToken,
      });
      navigate("/");
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Signup failed"
      );
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Create an account</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white border rounded-lg p-6">
        <label className="block text-sm">Name<input className="mt-1 w-full rounded-md border-gray-300" {...register("name", { required: true })} /></label>
        <label className="block text-sm">Email<input type="email" className="mt-1 w-full rounded-md border-gray-300" {...register("email", { required: true })} /></label>
        <label className="block text-sm">Phone<input className="mt-1 w-full rounded-md border-gray-300" {...register("phone", { required: true })} /></label>
        <label className="block text-sm">Password<input type="password" className="mt-1 w-full rounded-md border-gray-300" {...register("password", { required: true, minLength: 8 })} /></label>
        <button
          disabled={formState.isSubmitting}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-md disabled:opacity-50"
        >
          {formState.isSubmitting ? "Creating..." : "Create account"}
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-4 text-center">
        Already have an account? <Link to="/login" className="text-primary-600">Sign in</Link>
      </p>
    </div>
  );
}
