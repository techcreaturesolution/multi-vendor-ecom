import { Router } from "express";
import * as webhookController from "../controllers/webhookController";

const router = Router();

router.get("/whatsapp", webhookController.verifyWebhook);
router.post("/whatsapp", webhookController.receiveWebhook);

export default router;
