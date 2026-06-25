const { z } = require("zod");

const CartSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.coerce
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1"),
});

const createOrderSchema = z.object({
    shippingAddress: z
        .string()
        .min(5, 'Shipping address is required'),

    phone: z
        .string()
        .min(11, 'Phone number must be at least 11 digits'),

    items: z
        .array(
            z.object({
                productId: z
                    .string()
                    .uuid('Invalid product id'),

                quantity: z
                    .number()
                    .int()
                    .positive('Quantity must be greater than 0'),
            })
        )
        .min(1, 'At least one item is required'),
});

module.exports = {
    CartSchema,
    createOrderSchema
}