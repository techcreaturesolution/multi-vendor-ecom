import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import * as categories from "../../controllers/admin/categories.controller";
import * as vendors from "../../controllers/admin/vendors.controller";
import * as mou from "../../controllers/admin/mou.controller";
import * as customers from "../../controllers/admin/customers.controller";
import * as payouts from "../../controllers/admin/payouts.controller";
import * as reports from "../../controllers/admin/reports.controller";
import * as returns from "../../controllers/admin/returns.controller";
import {
  createCategorySchema,
  updateCategorySchema,
  approveVendorSchema,
  createMouSchema,
  updateMouSchema,
  updateUserStatusSchema,
  generatePayoutSchema,
  markPayoutPaidSchema,
  setReturnStatusSchema,
} from "../../validators/admin/admin.validators";

const router = Router();

router.use(authenticate, requireRole("master_admin"));

// Dashboard
router.get("/dashboard", reports.dashboard);

// Categories
router.get("/categories", categories.list);
router.get("/categories/:id", categories.getOne);
router.post("/categories", validate(createCategorySchema), categories.create);
router.patch("/categories/:id", validate(updateCategorySchema), categories.update);
router.delete("/categories/:id", categories.remove);

// Vendors
router.get("/vendors", vendors.list);
router.get("/vendors/:id", vendors.getOne);
router.post("/vendors/:id/approve", validate(approveVendorSchema), vendors.approve);
router.patch("/vendors/:id/status", validate(updateUserStatusSchema), vendors.setStatus);

// MOUs
router.get("/mous", mou.list);
router.get("/mous/:id", mou.getOne);
router.post("/mous", validate(createMouSchema), mou.create);
router.patch("/mous/:id", validate(updateMouSchema), mou.update);
router.post("/mous/:id/deactivate", mou.deactivate);

// Customers
router.get("/customers", customers.list);
router.get("/customers/:id", customers.getOne);
router.patch("/customers/:id/status", validate(updateUserStatusSchema), customers.setStatus);

// Payouts
router.get("/payouts", payouts.list);
router.get("/payouts/:id", payouts.getOne);
router.post("/payouts/generate", validate(generatePayoutSchema), payouts.generate);
router.post("/payouts/:id/mark-paid", validate(markPayoutPaidSchema), payouts.markPaid);

// Returns
router.get("/returns", returns.list);
router.get("/returns/:id", returns.getOne);
router.patch("/returns/:id/status", validate(setReturnStatusSchema), returns.setStatus);
router.post("/returns/:id/refund", returns.retryRefund);

export default router;
