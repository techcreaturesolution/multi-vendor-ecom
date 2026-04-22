import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { IUser, UserRole } from "../models/User";
import { AuthPayload } from "../middleware/auth";

export function signAccessToken(user: Pick<IUser, "_id" | "role" | "email">): string {
  const payload: AuthPayload = {
    sub: String(user._id),
    role: user.role as UserRole,
    email: user.email,
  };
  const options: SignOptions = { expiresIn: env.jwt.expiresIn as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.jwt.secret, options);
}

export function signRefreshToken(user: Pick<IUser, "_id" | "role" | "email">): string {
  const payload: AuthPayload = {
    sub: String(user._id),
    role: user.role as UserRole,
    email: user.email,
  };
  const options: SignOptions = {
    expiresIn: env.jwt.refreshExpiresIn as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.jwt.refreshSecret, options);
}

export function verifyRefreshToken(token: string): AuthPayload {
  return jwt.verify(token, env.jwt.refreshSecret) as AuthPayload;
}
