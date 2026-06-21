const route = require("../routes/userRoutes");
const userService = require("../services/userService");
const adminService = require("../services/adminService");
const utils = require("../utils/helperFunction");
const config = require("../config/config");
const { userMiddleware } = require("../middleware/authMiddleware");
/**
 * @swagger
 * /user/getproduct:
 *   get:
 *     summary: Get all products
 *     description: Fetch all products from database
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: Products fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 getProduct:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                 msg:
 *                   type: string
 *                   example: product fetch success
 *       500:
 *         description: Server error
 */
const getProducts = async (req, res) => {
	try {
		const getPoduct = await userService.getProducts();
		if (getPoduct.length >0) {
			return res
				.status(200)
				.json({ getPoduct, msg: "product fetch success" });
		} else {
			return res.status(400).json({ msg: "no product found" });
		}
	} catch (err) {
		console.log(err);
		return res.status(500).json({ msg: "internal server error" });
	}
};
const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.user.id;

        // Validation
        if (!productId || !quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                msg: "Invalid productId or quantity",
            });
        }

        // Check product exists
        const product = await userService.findProductById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                msg: "Product not found",
            });
        }

        // Find or create cart
        let cart = await userService.findCart(userId);

        if (!cart) {
            cart = await userService.createCart(userId);
        }

        // Check if product already exists in cart
        const existingCartItem = await userService.findCartItem(
            cart.id,
            productId
        );

        if (existingCartItem) {
            await userService.updateCartItem(
                existingCartItem.id,
                existingCartItem.quantity + quantity
            );

            return res.status(200).json({
                success: true,
                msg: "Cart updated successfully",
            });
        }

        await userService.addToCart({
            cartId: cart.id,
            productId,
            quantity,
        });

        return res.status(201).json({
            success: true,
            msg: "Product added to cart",
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            msg: "Internal server error",
        });
    }
};
module.exports = {
	getProducts,
    addToCart,
};
