import { Router } from "express";
import * as ctrl from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import {
  signupCustomerSchema,
  signupVendorSchema,
  loginSchema,
  refreshSchema,
} from "../validators/auth.validators";

const router = Router();

router.post("/signup/customer", validate(signupCustomerSchema), ctrl.signupCustomer);
router.post("/signup/vendor", validate(signupVendorSchema), ctrl.signupVendor);
router.post("/login", validate(loginSchema), ctrl.login);
router.post("/refresh", validate(refreshSchema), ctrl.refresh);
router.post("/logout", authenticate, ctrl.logout);
router.get("/me", authenticate, ctrl.me);

export default router;
