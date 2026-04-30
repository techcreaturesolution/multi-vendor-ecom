import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { tenantGuard } from "../middleware/tenancy";
import * as campaignController from "../controllers/campaignController";

const router = Router();

router.use(authenticate, tenantGuard);

router.post("/", campaignController.createCampaign);
router.get("/", campaignController.getCampaigns);
router.get("/:id", campaignController.getCampaignById);
router.post("/:id/start", campaignController.startCampaign);
router.post("/:id/pause", campaignController.pauseCampaign);
router.post("/:id/cancel", campaignController.cancelCampaign);

export default router;
