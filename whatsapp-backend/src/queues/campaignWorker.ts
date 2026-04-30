import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis";
import { Message } from "../models/Message";
import { Campaign } from "../models/Campaign";
import { sendTemplateMessage } from "../services/whatsappApiService";
import { logger } from "../config/logger";

interface SendMessageJob {
  messageId: string;
  phoneNumberId: string;
  accessToken: string;
  to: string;
  templateName: string;
  languageCode: string;
  headerParams?: string[];
  bodyParams?: string[];
  mediaUrl?: string;
  campaignId: string;
  tenantId: string;
}

export function startCampaignWorker() {
  const worker = new Worker<SendMessageJob>(
    "campaign-messages",
    async (job: Job<SendMessageJob>) => {
      const {
        messageId,
        phoneNumberId,
        accessToken,
        to,
        templateName,
        languageCode,
        headerParams,
        bodyParams,
        mediaUrl,
        campaignId,
      } = job.data;

      const campaign = await Campaign.findById(campaignId);
      if (!campaign || campaign.status === "cancelled" || campaign.status === "paused") {
        logger.info(`Skipping message ${messageId} — campaign ${campaignId} is ${campaign?.status}`);
        return;
      }

      if (campaign.status === "queued") {
        campaign.status = "in_progress";
        await campaign.save();
      }

      const result = await sendTemplateMessage({
        phoneNumberId,
        accessToken,
        to,
        templateName,
        languageCode,
        headerParams,
        bodyParams,
        mediaUrl,
      });

      const message = await Message.findById(messageId);
      if (!message) return;

      if (result.success) {
        message.status = "sent";
        message.waMessageId = result.waMessageId || "";
        message.sentAt = new Date();
      } else {
        message.status = "failed";
        message.errorMessage = result.error || "Unknown error";
      }

      await message.save();
    },
    {
      connection: redisConnection,
      concurrency: 5,
      limiter: {
        max: 80,
        duration: 1000,
      },
    }
  );

  worker.on("completed", (job) => {
    logger.debug(`Message job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`Message job ${job?.id} failed:`, err);
  });

  return worker;
}
