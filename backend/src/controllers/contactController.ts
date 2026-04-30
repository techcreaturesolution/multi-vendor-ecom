import { Response, NextFunction } from "express";
import { TenantRequest } from "../middleware/tenancy";
import * as contactService from "../services/contactService";
import { createContactSchema, updateContactSchema } from "../validators/contact";

export async function createContact(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const data = createContactSchema.parse(req.body);
    const contact = await contactService.createContact(req.tenantId!, data);
    res.status(201).json(contact);
  } catch (error) {
    next(error);
  }
}

export async function getContacts(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const result = await contactService.getContacts(req.tenantId!, {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      tags: req.query.tags ? (req.query.tags as string).split(",") : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateContact(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const data = updateContactSchema.parse(req.body);
    const contact = await contactService.updateContact(req.tenantId!, req.params.id, data);
    res.json(contact);
  } catch (error) {
    next(error);
  }
}

export async function deleteContact(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const result = await contactService.deleteContact(req.tenantId!, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function bulkUpload(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const result = await contactService.bulkUploadContacts(
      req.tenantId!,
      req.file.buffer,
      req.file.originalname
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getTags(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const tags = await contactService.getTags(req.tenantId!);
    res.json({ tags });
  } catch (error) {
    next(error);
  }
}
