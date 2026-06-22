const {z} = require('zod');

const CategorySchema = z.object({
    name:z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name cannot exceed 50 characters"),

})

const ProductSchema = CategorySchema.extend({
 
  description: z
    .string()
    .trim()
    .min(1, "Description is required"),

  price: z
    .number({
      required_error: "Price is required",
      invalid_type_error: "Price must be a number",
    })
    .nonnegative("Price cannot be negative"),

  stock: z
    .number({
      required_error: "Stock is required",
      invalid_type_error: "Stock must be a number",
    })
    .int("Stock must be an integer")
    .min(5,"stock must be minimum 5")
    .nonnegative("Stock cannot be negative"),

  categoryId: z
    .string({
      required_error: "Category ID is required",
      invalid_type_error: "Category ID must be a number",
    }),
});


module.exports = {
    CategorySchema,
    ProductSchema,
}
