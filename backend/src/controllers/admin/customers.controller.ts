import { Request, Response } from "express";
import { User } from "../../models/User";
import { Order } from "../../models/Order";
import { ApiError } from "../../utils/apiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { parsePagination, paginatedResponse } from "../../utils/pagination";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const p = parsePagination(req);
  const filter: Record<string, unknown> = { role: "customer" };
  if (req.query.q) {
    const q = String(req.query.q);
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } },
    ];
  }
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit),
    User.countDocuments(filter),
  ]);
  res.json(paginatedResponse(items, total, p));
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findOne({ _id: req.params.id, role: "customer" });
  if (!user) throw ApiError.notFound("Customer not found");

  const [orderCount, totalSpent] = await Promise.all([
    Order.countDocuments({ customerId: user._id }),
    Order.aggregate([
      { $match: { customerId: user._id, paymentStatus: "paid" } },
      { $group: { _id: null, sum: { $sum: "$grandTotal" } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      customer: user,
      stats: { orderCount, totalSpent: totalSpent[0]?.sum || 0 },
    },
  });
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.body;
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, role: "customer" },
    { isActive },
    { new: true }
  );
  if (!user) throw ApiError.notFound("Customer not found");
  res.json({ success: true, data: user });
});
