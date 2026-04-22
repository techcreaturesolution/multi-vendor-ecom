import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import * as products from "../../controllers/vendor/products.controller";
import * as bulk from "../../controllers/vendor/bulk.controller";
import * as orders from "../../controllers/vendor/orders.controller";
import * as customers from "../../controllers/vendor/customers.controller";
import * as earnings from "../../controllers/vendor/earnings.controller";
import * as profile from "../../controllers/vendor/profile.controller";
import { uploadCsv } from "../../middleware/upload";
import {
  createProductSchema,
  updateProductSchema,
  markShippedSchema,
  updateOrderStatusSchema,
  uploadKycSchema,
} from "../../validators/vendor/vendor.validators";

const router = Router();

router.use(authenticate, requireRole("vendor"));

// Profile / KYC
router.get("/me", profile.me);
router.post("/kyc", validate(uploadKycSchema), profile.uploadKyc);

// Products
router.get("/products", products.list);
router.get("/products/:id", products.getOne);
router.post("/products", validate(createProductSchema), products.create);
router.patch("/products/:id", validate(updateProductSchema), products.update);
router.delete("/products/:id", products.remove);
router.post("/products/bulk", uploadCsv.single("file"), bulk.bulkUpload);

// Orders
router.get("/orders", orders.list);
router.get("/orders/:id", orders.getOne);
router.post("/orders/:id/ship", validate(markShippedSchema), orders.ship);
router.patch("/orders/:id/status", validate(updateOrderStatusSchema), orders.setStatus);

// Customers who bought from me
router.get("/customers", customers.list);

// Earnings and payouts
router.get("/earnings/summary", earnings.summary);
router.get("/earnings/payouts", earnings.payouts);

export default router;
