const { z } = require("zod");

const CartSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.coerce
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1"),
});

module.exports = {
    CartSchema,
}