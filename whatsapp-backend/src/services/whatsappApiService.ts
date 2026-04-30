import { logger } from "../config/logger";

const META_API_BASE = "https://graph.facebook.com/v19.0";

interface SendMessageResult {
  success: boolean;
  waMessageId?: string;
  error?: string;
}

export async function sendTemplateMessage(params: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  templateName: string;
  languageCode: string;
  headerParams?: string[];
  bodyParams?: string[];
  mediaUrl?: string;
}): Promise<SendMessageResult> {
  try {
    const components: Record<string, unknown>[] = [];

    if (params.mediaUrl) {
      components.push({
        type: "header",
        parameters: [{ type: "image", image: { link: params.mediaUrl } }],
      });
    } else if (params.headerParams && params.headerParams.length > 0) {
      components.push({
        type: "header",
        parameters: params.headerParams.map((p) => ({ type: "text", text: p })),
      });
    }

    if (params.bodyParams && params.bodyParams.length > 0) {
      components.push({
        type: "body",
        parameters: params.bodyParams.map((p) => ({ type: "text", text: p })),
      });
    }

    const body = {
      messaging_product: "whatsapp",
      to: params.to,
      type: "template",
      template: {
        name: params.templateName,
        language: { code: params.languageCode },
        ...(components.length > 0 && { components }),
      },
    };

    const response = await fetch(`${META_API_BASE}/${params.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as { error?: { message?: string }; messages?: Array<{ id: string }> };

    if (!response.ok) {
      logger.error("Meta API error:", data);
      return {
        success: false,
        error: data.error?.message || "Failed to send message",
      };
    }

    return {
      success: true,
      waMessageId: data.messages?.[0]?.id || "",
    };
  } catch (error) {
    logger.error("WhatsApp API send error:", error);
    return { success: false, error: "Network error sending message" };
  }
}

export async function sendTextMessage(params: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  text: string;
}): Promise<SendMessageResult> {
  try {
    const body = {
      messaging_product: "whatsapp",
      to: params.to,
      type: "text",
      text: { body: params.text },
    };

    const response = await fetch(`${META_API_BASE}/${params.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as { error?: { message?: string }; messages?: Array<{ id: string }> };

    if (!response.ok) {
      logger.error("Meta API error:", data);
      return {
        success: false,
        error: data.error?.message || "Failed to send text message",
      };
    }

    return {
      success: true,
      waMessageId: data.messages?.[0]?.id || "",
    };
  } catch (error) {
    logger.error("WhatsApp API send text error:", error);
    return { success: false, error: "Network error sending text message" };
  }
}

export async function markMessageAsRead(params: {
  phoneNumberId: string;
  accessToken: string;
  waMessageId: string;
}): Promise<void> {
  try {
    await fetch(`${META_API_BASE}/${params.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: params.waMessageId,
      }),
    });
  } catch (error) {
    logger.error("Mark as read error:", error);
  }
}
