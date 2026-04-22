import mongoose, { Schema, Document, Types } from "mongoose";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "returned";

export interface IOrderItem {
  productId: Types.ObjectId;
  vendorId: Types.ObjectId;
  name: string;
  sku: string;
  variantSku?: string;
  variantAttributes?: Record<string, string>;
  image?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface IVendorSplit {
  vendorId: Types.ObjectId;
  subtotal: number;
  shippingCost: number;
  adminCommissionPercent: number;
  adminCommissionAmount: number;
  vendorNetAmount: number;
  payoutStatus: "pending" | "processing" | "paid" | "failed";
  payoutId?: Types.ObjectId;
}

export interface IOrder extends Document {
  orderNumber: string;
  customerId: Types.ObjectId;
  items: IOrderItem[];
  vendorSplits: IVendorSplit[];

  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };

  subtotal: number;
  shippingTotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;

  status: OrderStatus;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentId?: Types.ObjectId;

  placedAt: Date;
  cancelledAt?: Date;
  cancellationReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    variantSku: { type: String },
    variantAttributes: { type: Schema.Types.Mixed },
    image: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const vendorSplitSchema = new Schema<IVendorSplit>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, required: true, default: 0 },
    adminCommissionPercent: { type: Number, required: true },
    adminCommissionAmount: { type: Number, required: true },
    vendorNetAmount: { type: Number, required: true },
    payoutStatus: {
      type: String,
      enum: ["pending", "processing", "paid", "failed"],
      default: "pending",
    },
    payoutId: { type: Schema.Types.ObjectId, ref: "Payout" },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    vendorSplits: [vendorSplitSchema],

    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: "India" },
    },

    subtotal: { type: Number, required: true },
    shippingTotal: { type: Number, required: true, default: 0 },
    taxTotal: { type: Number, required: true, default: 0 },
    discountTotal: { type: Number, required: true, default: 0 },
    grandTotal: { type: Number, required: true },

    status: {
      type: String,
      enum: [
        "pending_payment",
        "paid",
        "processing",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "refunded",
        "returned",
      ],
      default: "pending_payment",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },

    placedAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
  },
  { timestamps: true }
);

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ "vendorSplits.vendorId": 1 });
orderSchema.index({ status: 1 });

export const Order = mongoose.model<IOrder>("Order", orderSchema);
