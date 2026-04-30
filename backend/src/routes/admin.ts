import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import * as adminController from "../controllers/adminController";

const router = Router();

router.use(authenticate, authorize("super_admin"));

router.get("/tenants", adminController.listTenants);
router.get("/tenants/:id", adminController.getTenantById);
router.post("/tenants/:id/suspend", adminController.suspendTenant);
router.post("/tenants/:id/activate", adminController.activateTenant);
router.delete("/tenants/:id", adminController.deleteTenant);

export default router;
