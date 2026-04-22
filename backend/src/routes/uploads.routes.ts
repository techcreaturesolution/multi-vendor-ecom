import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { uploadImage } from "../middleware/upload";
import { uploadSingleImage, uploadMultipleImages } from "../controllers/uploads.controller";

const router = Router();

// Any authenticated user (vendor/admin/customer) can upload images for their
// own objects (products, categories, KYC, review photos, etc.). Ownership is
// enforced when the returned URL is attached to a resource.
router.use(authenticate);

router.post("/image", uploadImage.single("file"), uploadSingleImage);
router.post("/images", uploadImage.array("files", 10), uploadMultipleImages);

export default router;
