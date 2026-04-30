import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { TenantRequest } from "../middleware/tenancy";
import * as authService from "../services/authService";
import { registerSchema, loginSchema, verifyOtpSchema, addAgentSchema } from "../validators/auth";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data.email, data.password);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const data = verifyOtpSchema.parse(req.body);
    const result = await authService.verifyOtp(data.email, data.otp);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await authService.getMe((req.user!._id as unknown as string).toString());
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function addAgent(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const data = addAgentSchema.parse(req.body);
    const result = await authService.addAgent(req.tenantId!, data);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
