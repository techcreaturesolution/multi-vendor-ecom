import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { tenantGuard } from "../middleware/tenancy";
import * as analyticsController from "../controllers/analyticsController";

const router = Router();

router.get(
  "/dashboard",
  authenticate,
  tenantGuard,
  analyticsController.getDashboard
);
router.get(
  "/campaigns/:id",
  authenticate,
  tenantGuard,
  analyticsController.getCampaignReport
);
router.get(
  "/messages/trend",
  authenticate,
  tenantGuard,
  analyticsController.getMessageTrend
);
router.get(
  "/super-admin",
  authenticate,
  authorize("super_admin"),
  analyticsController.getSuperAdminDashboard
);

export default router;
