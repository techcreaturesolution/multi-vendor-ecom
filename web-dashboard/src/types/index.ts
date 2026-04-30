export interface User {
  _id: string;
  email: string;
  name: string;
  role: "super_admin" | "tenant_admin" | "agent";
  tenantId: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface Tenant {
  _id: string;
  name: string;
  slug: string;
  plan: "free" | "starter" | "pro" | "enterprise";
  status: "active" | "suspended" | "cancelled";
  messageQuota: number;
  messagesUsed: number;
}

export interface WhatsAppAccount {
  _id: string;
  tenantId: string;
  name: string;
  phoneNumber: string;
  phoneNumberId: string;
  wabaId: string;
  webhookVerified: boolean;
  status: "active" | "inactive" | "disconnected";
}

export interface Contact {
  _id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string;
  tags: string[];
  source: "manual" | "excel" | "api";
  notes: string;
  createdAt: string;
}

export interface Campaign {
  _id: string;
  tenantId: string;
  waAccountId: WhatsAppAccount | string;
  name: string;
  templateName: string;
  templateLanguage: string;
  status: "draft" | "queued" | "in_progress" | "paused" | "completed" | "cancelled";
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  stats: {
    total: number;
    queued: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
  createdAt: string;
}

export interface Message {
  _id: string;
  direction: "outbound" | "inbound";
  type: string;
  content: string;
  status: "queued" | "sent" | "delivered" | "read" | "failed";
  createdAt: string;
  contactId: Contact | string;
}

export interface Conversation {
  _id: string;
  contactId: Contact;
  waAccountId: WhatsAppAccount;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
  assignedAgentId: User | null;
  status: "open" | "closed";
}

export interface AutoReplyRule {
  _id: string;
  name: string;
  triggerType: "keyword" | "exact" | "time";
  triggerValue: string;
  responseType: "text" | "template";
  responseContent: string;
  templateName: string;
  isActive: boolean;
  priority: number;
}

export interface Subscription {
  _id: string;
  plan: "free" | "starter" | "pro" | "enterprise";
  status: "active" | "past_due" | "cancelled" | "trialing";
  messageQuota: number;
  priceMonthly: number;
  currentPeriodEnd: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  totalPages: number;
  [key: string]: T[] | number;
}

export interface DashboardStats {
  tenant: {
    name: string;
    plan: string;
    messagesUsed: number;
    messageQuota: number;
  };
  campaigns: { total: number; active: number };
  contacts: { total: number };
  conversations: { total: number; unread: number };
  messages: {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    queued: number;
  };
}
