import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import * as catalog from "../../controllers/customer/catalog.controller";
import * as cart from "../../controllers/customer/cart.controller";
import * as address from "../../controllers/customer/address.controller";
import * as checkout from "../../controllers/customer/checkout.controller";
import * as orders from "../../controllers/customer/orders.controller";
import {
  addToCartSchema,
  updateCartItemSchema,
  addressSchema,
  getShippingRatesSchema,
  checkoutSchema,
  verifyPaymentSchema,
  createReviewSchema,
  createReturnSchema,
} from "../../validators/customer/customer.validators";

const router = Router();

// Public catalog
router.get("/categories", catalog.listCategories);
router.get("/products", catalog.listProducts);
router.get("/products/:slug", catalog.getProduct);

// Authenticated customer-only below
router.use(authenticate, requireRole("customer"));

// Cart
router.get("/cart", cart.get);
router.post("/cart/items", validate(addToCartSchema), cart.addItem);
router.patch("/cart/items/:productId", validate(updateCartItemSchema), cart.updateItem);
router.delete("/cart/items/:productId", cart.removeItem);
router.delete("/cart", cart.clear);

// Addresses
router.get("/addresses", address.list);
router.post("/addresses", validate(addressSchema), address.create);
router.patch("/addresses/:id", validate(addressSchema.partial()), address.update);
router.delete("/addresses/:id", address.remove);

// Checkout + payment
router.post("/checkout/shipping-rates", validate(getShippingRatesSchema), checkout.quoteShipping);
router.post("/checkout/orders", validate(checkoutSchema), checkout.createOrder);
router.post("/checkout/verify", validate(verifyPaymentSchema), checkout.verifyPayment);

// Orders
router.get("/orders", orders.list);
router.get("/orders/:id", orders.getOne);
router.get("/orders/:id/track", orders.track);
router.post("/reviews", validate(createReviewSchema), orders.createReview);
router.post("/returns", validate(createReturnSchema), orders.createReturn);

export default router;
