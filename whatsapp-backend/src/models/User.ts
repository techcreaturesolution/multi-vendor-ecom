import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: "super_admin" | "tenant_admin" | "agent";
  tenantId: mongoose.Types.ObjectId | null;
  isVerified: boolean;
  otp: string | null;
  otpExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["super_admin", "tenant_admin", "agent"],
      default: "tenant_admin",
    },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", default: null },
    isVerified: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>("User", userSchema);
