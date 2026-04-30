import { Request, Response } from "express";
import { env } from "../config/env";
import { WhatsAppAccount } from "../models/WhatsAppAccount";
import { handleIncomingMessage, handleStatusUpdate } from "../services/webhookService";
import { logger } from "../config/logger";

export async function verifyWebhook(req: Request, res: Response) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === env.metaWebhookVerifyToken) {
    logger.info("Webhook verified successfully");
    res.status(200).send(challenge);
    return;
  }

  res.status(403).send("Forbidden");
}

export async function receiveWebhook(req: Request, res: Response) {
  try {
    const body = req.body;

    if (body.object !== "whatsapp_business_account") {
      res.sendStatus(404);
      return;
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== "messages") continue;

        const value = change.value;
        const phoneNumberId = value?.metadata?.phone_number_id;

        if (!phoneNumberId) continue;

        const account = await WhatsAppAccount.findOne({ phoneNumberId });
        if (!account) {
          logger.warn(`No account found for phone_number_id: ${phoneNumberId}`);
          continue;
        }

        if (value.messages) {
          for (const message of value.messages) {
            await handleIncomingMessage(account._id.toString(), message);
          }
        }

        if (value.statuses) {
          for (const status of value.statuses) {
            await handleStatusUpdate(status);
          }
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    logger.error("Webhook processing error:", error);
    res.sendStatus(200);
  }
}
