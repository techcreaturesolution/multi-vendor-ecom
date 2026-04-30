import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { tenantGuard } from "../middleware/tenancy";
import * as subscriptionController from "../controllers/subscriptionController";

const router = Router();

router.use(authenticate, authorize("tenant_admin", "super_admin"), tenantGuard);

router.get("/current", subscriptionController.getCurrentPlan);
router.get("/plans", subscriptionController.getPlans);
router.post("/change-plan", subscriptionController.changePlan);
router.post("/confirm-payment", subscriptionController.confirmPayment);

export default router;
