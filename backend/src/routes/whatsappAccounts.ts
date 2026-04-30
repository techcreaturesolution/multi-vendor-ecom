import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { tenantGuard } from "../middleware/tenancy";
import * as waController from "../controllers/whatsappAccountController";

const router = Router();

router.use(authenticate, authorize("tenant_admin", "super_admin"), tenantGuard);

router.post("/", waController.addAccount);
router.get("/", waController.getAccounts);
router.patch("/:id", waController.updateAccount);
router.delete("/:id", waController.deleteAccount);

export default router;
