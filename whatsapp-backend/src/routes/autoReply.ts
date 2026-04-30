import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { tenantGuard } from "../middleware/tenancy";
import * as autoReplyController from "../controllers/autoReplyController";

const router = Router();

router.use(authenticate, authorize("tenant_admin", "super_admin"), tenantGuard);

router.post("/", autoReplyController.createRule);
router.get("/", autoReplyController.getRules);
router.patch("/:id", autoReplyController.updateRule);
router.delete("/:id", autoReplyController.deleteRule);

export default router;
