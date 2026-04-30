import { Response, NextFunction } from "express";
import { TenantRequest } from "../middleware/tenancy";
import { WhatsAppAccount } from "../models/WhatsAppAccount";
import { addWhatsAppAccountSchema, updateWhatsAppAccountSchema } from "../validators/whatsappAccount";
import { AppError } from "../middleware/errorHandler";

export async function addAccount(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const data = addWhatsAppAccountSchema.parse(req.body);
    const existing = await WhatsAppAccount.findOne({
      tenantId: req.tenantId,
      phoneNumberId: data.phoneNumberId,
    });
    if (existing) {
      throw new AppError("This WhatsApp account is already connected", 409);
    }

    const account = new WhatsAppAccount({
      tenantId: req.tenantId,
      ...data,
    });
    await account.save();
    res.status(201).json(account);
  } catch (error) {
    next(error);
  }
}

export async function getAccounts(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const accounts = await WhatsAppAccount.find({ tenantId: req.tenantId });
    res.json({ accounts });
  } catch (error) {
    next(error);
  }
}

export async function updateAccount(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const data = updateWhatsAppAccountSchema.parse(req.body);
    const account = await WhatsAppAccount.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { $set: data },
      { new: true }
    );
    if (!account) throw new AppError("Account not found", 404);
    res.json(account);
  } catch (error) {
    next(error);
  }
}

export async function deleteAccount(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const account = await WhatsAppAccount.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.tenantId,
    });
    if (!account) throw new AppError("Account not found", 404);
    res.json({ message: "Account removed" });
  } catch (error) {
    next(error);
  }
}
