import mongoose, { Schema, Document, Types } from "mongoose";

export interface IProduct extends Document {
  vendorId: Types.ObjectId;
  categoryId: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  images: string[];
  price: number;
  compareAtPrice?: number;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String },
    images: [{ type: String }],
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    sku: { type: String, required: true, unique: true },
    stock: { type: Number, required: true, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    weight: { type: Number },
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
    },
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ vendorId: 1 });
productSchema.index({ categoryId: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ price: 1 });
productSchema.index({ isActive: 1, isFeatured: -1 });

export const Product = mongoose.model<IProduct>("Product", productSchema);
