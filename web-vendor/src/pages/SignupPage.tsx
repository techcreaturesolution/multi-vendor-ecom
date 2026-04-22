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
  businessName: string;
  businessType: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  gstNumber?: string;
  panNumber?: string;
}

export default function SignupPage() {
  const { register, handleSubmit, formState } = useForm<FormData>();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const onSubmit = async (d: FormData) => {
    try {
      const res = await api.post("/api/auth/signup/vendor", {
        name: d.name,
        email: d.email,
        phone: d.phone,
        password: d.password,
        businessName: d.businessName,
        businessType: d.businessType,
        gstNumber: d.gstNumber || undefined,
        panNumber: d.panNumber || undefined,
        address: {
          line1: d.line1,
          city: d.city,
          state: d.state,
          pincode: d.pincode,
          country: "India",
        },
        bankDetails: {
          accountName: d.accountName,
          accountNumber: d.accountNumber,
          ifscCode: d.ifscCode,
          bankName: d.bankName,
        },
      });
      setAuth({
        user: res.data.user,
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      });
      toast.success("Applied! Awaiting admin approval.");
      navigate("/");
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Signup failed"
      );
    }
  };

  const field = "mt-1 w-full rounded-md border-gray-300";

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-2xl bg-white p-8 rounded-xl shadow"
      >
        <h1 className="text-2xl font-bold mb-4">Vendor Application</h1>
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm">Contact name<input className={field} {...register("name", { required: true })} /></label>
          <label className="block text-sm">Email<input type="email" className={field} {...register("email", { required: true })} /></label>
          <label className="block text-sm">Phone<input className={field} {...register("phone", { required: true })} /></label>
          <label className="block text-sm">Password<input type="password" className={field} {...register("password", { required: true, minLength: 8 })} /></label>
          <label className="block text-sm">Business name<input className={field} {...register("businessName", { required: true })} /></label>
          <label className="block text-sm">Business type<input className={field} {...register("businessType", { required: true })} /></label>
          <label className="block text-sm">GST (optional)<input className={field} {...register("gstNumber")} /></label>
          <label className="block text-sm">PAN (optional)<input className={field} {...register("panNumber")} /></label>
          <label className="block text-sm col-span-2">Address line 1<input className={field} {...register("line1", { required: true })} /></label>
          <label className="block text-sm">City<input className={field} {...register("city", { required: true })} /></label>
          <label className="block text-sm">State<input className={field} {...register("state", { required: true })} /></label>
          <label className="block text-sm">Pincode<input className={field} {...register("pincode", { required: true })} /></label>
          <div />
          <label className="block text-sm">Bank account name<input className={field} {...register("accountName", { required: true })} /></label>
          <label className="block text-sm">Account number<input className={field} {...register("accountNumber", { required: true })} /></label>
          <label className="block text-sm">IFSC<input className={field} {...register("ifscCode", { required: true })} /></label>
          <label className="block text-sm">Bank name<input className={field} {...register("bankName", { required: true })} /></label>
        </div>
        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="mt-6 w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-md disabled:opacity-50"
        >
          {formState.isSubmitting ? "Submitting..." : "Apply"}
        </button>
        <p className="text-sm text-gray-500 mt-4 text-center">
          Already a vendor? <Link to="/login" className="text-primary-600">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
