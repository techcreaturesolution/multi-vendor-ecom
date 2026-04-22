import mongoose, { Schema, Document, Types } from "mongoose";

export type ShipmentStatus =
  | "pending"
  | "booked"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "returned"
  | "cancelled"
  | "failed";

export interface ITrackingEvent {
  status: string;
  location?: string;
  message?: string;
  at: Date;
}

export interface IShipment extends Document {
  orderId: Types.ObjectId;
  vendorId: Types.ObjectId;
  provider: "shipway" | "other";
  awbNumber?: string;
  courierName?: string;
  labelUrl?: string;
  pickupAddressId?: Types.ObjectId;
  weightGrams: number;
  dimensions?: { length: number; width: number; height: number };
  chargedAmount: number;
  status: ShipmentStatus;
  trackingEvents: ITrackingEvent[];
  bookedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const trackingEventSchema = new Schema<ITrackingEvent>(
  {
    status: { type: String, required: true },
    location: { type: String },
    message: { type: String },
    at: { type: Date, required: true },
  },
  { _id: false }
);

const shipmentSchema = new Schema<IShipment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    provider: { type: String, enum: ["shipway", "other"], default: "shipway" },
    awbNumber: { type: String },
    courierName: { type: String },
    labelUrl: { type: String },
    pickupAddressId: { type: Schema.Types.ObjectId },
    weightGrams: { type: Number, required: true, default: 500 },
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
    },
    chargedAmount: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: [
        "pending",
        "booked",
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "returned",
        "cancelled",
        "failed",
      ],
      default: "pending",
    },
    trackingEvents: [trackingEventSchema],
    bookedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

shipmentSchema.index({ orderId: 1 });
shipmentSchema.index({ vendorId: 1 });
shipmentSchema.index({ awbNumber: 1 });
shipmentSchema.index({ status: 1 });

export const Shipment = mongoose.model<IShipment>("Shipment", shipmentSchema);
