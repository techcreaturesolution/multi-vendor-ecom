import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { tenantGuard } from "../middleware/tenancy";
import { uploadExcel } from "../middleware/upload";
import * as contactController from "../controllers/contactController";

const router = Router();

router.use(authenticate, tenantGuard);

router.post("/", contactController.createContact);
router.get("/", contactController.getContacts);
router.get("/tags", contactController.getTags);
router.patch("/:id", contactController.updateContact);
router.delete("/:id", contactController.deleteContact);
router.post("/upload", uploadExcel, contactController.bulkUpload);

export default router;
