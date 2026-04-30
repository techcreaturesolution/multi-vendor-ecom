import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { tenantGuard } from "../middleware/tenancy";
import * as chatController from "../controllers/chatController";

const router = Router();

router.use(authenticate, tenantGuard);

router.get("/conversations", chatController.getConversations);
router.get("/conversations/:id/messages", chatController.getMessages);
router.post("/conversations/:id/reply", chatController.sendReply);
router.post("/conversations/:id/read", chatController.markRead);
router.post("/conversations/:id/assign", chatController.assignAgent);

export default router;
