import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReview extends Document {
  productId: Types.ObjectId;
  customerId: Types.ObjectId;
  orderId: Types.ObjectId;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String },
    comment: { type: String },
    images: [{ type: String }],
  },
  { timestamps: true }
);

reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ customerId: 1 });
reviewSchema.index({ productId: 1, customerId: 1, orderId: 1 }, { unique: true });

export const Review = mongoose.model<IReview>("Review", reviewSchema);
