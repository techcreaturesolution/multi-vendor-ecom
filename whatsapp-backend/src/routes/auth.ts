import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { tenantGuard } from "../middleware/tenancy";
import * as authController from "../controllers/authController";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/verify-otp", authController.verifyOtp);
router.get("/me", authenticate, authController.getMe);
router.post(
  "/agents",
  authenticate,
  authorize("tenant_admin"),
  tenantGuard,
  authController.addAgent
);

export default router;
