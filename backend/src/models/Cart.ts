import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICartItem {
  productId: Types.ObjectId;
  vendorId: Types.ObjectId;
  quantity: number;
  priceAtAdd: number;
}

export interface ICart extends Document {
  userId: Types.ObjectId;
  items: ICartItem[];
  updatedAt: Date;
  createdAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtAdd: { type: Number, required: true },
  },
  { _id: false }
);

const cartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

cartSchema.index({ userId: 1 });

export const Cart = mongoose.model<ICart>("Cart", cartSchema);
