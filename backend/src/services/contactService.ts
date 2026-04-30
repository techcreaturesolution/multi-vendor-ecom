import * as XLSX from "xlsx";
import { parse as csvParse } from "csv-parse/sync";
import { Contact, IContact } from "../models/Contact";
import { AppError } from "../middleware/errorHandler";

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9+]/g, "");
  if (!cleaned.startsWith("+")) {
    if (cleaned.startsWith("0")) {
      cleaned = "+91" + cleaned.slice(1);
    } else {
      cleaned = "+" + cleaned;
    }
  }
  return cleaned;
}

export async function createContact(tenantId: string, data: {
  name: string;
  phone: string;
  email?: string;
  tags?: string[];
  notes?: string;
}) {
  const phone = normalizePhone(data.phone);

  const existing = await Contact.findOne({ tenantId, phone });
  if (existing) {
    throw new AppError("Contact with this phone number already exists", 409);
  }

  const contact = new Contact({
    tenantId,
    name: data.name,
    phone,
    email: data.email || "",
    tags: data.tags || [],
    notes: data.notes || "",
    source: "manual",
  });

  await contact.save();
  return contact;
}

export async function bulkUploadContacts(tenantId: string, fileBuffer: Buffer, filename: string) {
  const ext = filename.toLowerCase().split(".").pop();
  let rows: Record<string, string>[];

  if (ext === "csv") {
    rows = csvParse(fileBuffer, { columns: true, skip_empty_lines: true });
  } else {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    rows = XLSX.utils.sheet_to_json<Record<string, string>>(workbook.Sheets[sheetName]);
  }

  const results = { created: 0, skipped: 0, errors: [] as string[] };

  for (const row of rows) {
    const name = row.name || row.Name || row.NAME || "";
    const phone = row.phone || row.Phone || row.PHONE || row.mobile || row.Mobile || "";
    const email = row.email || row.Email || row.EMAIL || "";
    const tags = (row.tags || row.Tags || row.TAGS || "").split(",").map((t: string) => t.trim()).filter(Boolean);

    if (!name || !phone) {
      results.errors.push(`Missing name or phone for row: ${JSON.stringify(row)}`);
      results.skipped++;
      continue;
    }

    const normalizedPhone = normalizePhone(phone);

    try {
      const existing = await Contact.findOne({ tenantId, phone: normalizedPhone });
      if (existing) {
        results.skipped++;
        continue;
      }

      await Contact.create({
        tenantId,
        name,
        phone: normalizedPhone,
        email,
        tags,
        source: "excel",
      });
      results.created++;
    } catch {
      results.errors.push(`Error processing: ${name} / ${phone}`);
      results.skipped++;
    }
  }

  return results;
}

export async function getContacts(tenantId: string, query: {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string[];
}) {
  const page = query.page || 1;
  const limit = query.limit || 50;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { tenantId };

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { phone: { $regex: query.search, $options: "i" } },
      { email: { $regex: query.search, $options: "i" } },
    ];
  }

  if (query.tags && query.tags.length > 0) {
    filter.tags = { $in: query.tags };
  }

  const [contacts, total] = await Promise.all([
    Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Contact.countDocuments(filter),
  ]);

  return { contacts, total, page, totalPages: Math.ceil(total / limit) };
}

export async function updateContact(tenantId: string, contactId: string, data: Partial<IContact>) {
  const contact = await Contact.findOneAndUpdate(
    { _id: contactId, tenantId },
    { $set: data },
    { new: true }
  );
  if (!contact) throw new AppError("Contact not found", 404);
  return contact;
}

export async function deleteContact(tenantId: string, contactId: string) {
  const contact = await Contact.findOneAndDelete({ _id: contactId, tenantId });
  if (!contact) throw new AppError("Contact not found", 404);
  return { message: "Contact deleted" };
}

export async function getTags(tenantId: string): Promise<string[]> {
  const result = await Contact.distinct("tags", { tenantId });
  return result;
}
