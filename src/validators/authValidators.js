const { z } = require("zod");

const loginSchema = z.object({
    email: z.string().trim().email("Invalid email format"),

    password: z
        .string()
        .min(6, "Password must be at least 6 characters")
        .max(20, "Password cannot exceed 20 characters"),
});

const registerSchema = loginSchema.extend({
    name: z
        .string()
        .trim()
        .min(3, "Name must be at least 3 characters")
        .max(50, "Name cannot exceed 50 characters"),

    role: z.string().trim(),
});

module.exports = {
    registerSchema,
    loginSchema,
};