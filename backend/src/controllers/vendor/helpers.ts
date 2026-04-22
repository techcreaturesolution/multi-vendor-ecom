import { Request } from "express";
import { Vendor } from "../../models/Vendor";
import { ApiError } from "../../utils/apiError";

export async function getVendorForRequest(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  const vendor = await Vendor.findOne({ userId: req.user.sub });
  if (!vendor) throw ApiError.notFound("Vendor profile not found");
  return vendor;
}

export async function getApprovedVendorForRequest(req: Request) {
  const vendor = await getVendorForRequest(req);
  if (vendor.status !== "approved") {
    throw ApiError.forbidden(`Vendor is not approved (status: ${vendor.status})`);
  }
  return vendor;
}
