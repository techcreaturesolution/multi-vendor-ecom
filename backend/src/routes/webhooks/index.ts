import { Router } from "express";
import { razorpayWebhook } from "../../controllers/webhooks/razorpay.controller";
import { shipwayWebhook } from "../../controllers/webhooks/shipway.controller";

const router = Router();

router.post("/razorpay", razorpayWebhook);
router.post("/shipway", shipwayWebhook);

export default router;
