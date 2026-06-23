const route = require("../routes/userRoutes");
const userService = require("../services/userService");
const adminService = require("../services/adminService");
const utils = require("../utils/helperFunction");
const config = require("../config/config");
const { userMiddleware } = require("../middleware/authMiddleware");
const { success } = require("zod");
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
		if (getPoduct.length > 0) {
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
 /**
 * @swagger
 * /user/add-to-cart:
 *   post:
 *     summary: Add product to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "prod_123"
 *               quantity:
 *                 type: number
 *                 example: 2
 *     responses:
 *       201:
 *         description: Product added to cart
 *       200:
 *         description: Cart updated successfully
 *       400:
 *         description: Invalid input or stock issue
 *       404:
 *         description: Product not found
 */
const addToCart = async (req, res) => {
	try {
		const { productId, quantity } = req.body;
		const userId = req.user.id;

		if (quantity <= 0) {
			return res.status(400).json({
				success: false,
				msg: "Quantity must be greater than 0",
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

		// Stock validation
		if (quantity > product.stock) {
			return res.status(400).json({
				success: false,
				msg: "Not enough stock available",
			});
		}

		// Find or create cart
		let cart = await userService.findCart(userId);

		if (!cart) {
			cart = await userService.createCart(userId);
		}

		// Check existing cart item
		const existingCartItem = await userService.findCartItem(
			cart.id,
			productId,
		);

		// CASE 1: Update existing item (SET quantity)
		if (existingCartItem) {
			if (quantity === 0) {
				await userService.deleteCartItem(existingCartItem.id);

				return res.status(200).json({
					success: true,
					msg: "Item removed from cart",
				});
			}

			await userService.updateCartItem(existingCartItem.id, quantity);

			return res.status(200).json({
				success: true,
				msg: "Cart updated successfully",
			});
		}

		// CASE 2: Create new cart item
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
 /**
 * @swagger
 * /user/update-cart/{id}:
 *   patch:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *                 example: 3
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 *       400:
 *         description: Invalid quantity or stock issue
 *       404:
 *         description: Cart item not found
 */
const updateCart = async (req, res) => {
	try {
		const cartItemId = req.params.id;
		const { quantity } = req.body;
		const userId = req.user.id;


		

		// Find cart item (and ensure it belongs to user)
		const cartItem = await userService.findCartItemById(cartItemId);

		if (!cartItem) {
			return res.status(404).json({
				success: false,
				msg: "Cart item not found",
			});
		}

		// Optional safety check: ensure ownership
		const cart = await userService.findCartItemById(cartItem.cartId);

		if (!cart || cart.userId !== userId) {
			return res.status(403).json({
				success: false,
				msg: "Unauthorized access to cart item",
			});
		}

		// Get product for stock validation
		const product = await userService.findProductById(cartItem.productId);

		if (!product) {
			return res.status(404).json({
				success: false,
				msg: "Product not found",
			});
		}

		

		// Stock check
		if (quantity > product.stock) {
			return res.status(400).json({
				success: false,
				msg: "Not enough stock available",
			});
		}

		// Update cart item (SET behavior)
		await userService.updateCartItem(cartItemId, quantity);

		return res.status(200).json({
			success: true,
			msg: "Cart item updated successfully",
		});
	} catch (err) {
		console.error(err);

		return res.status(500).json({
			success: false,
			msg: "Internal server error",
		});
	}
};
 /**
 * @swagger
 * /user/getCartItem/{cartId}:
 *   get:
 *     summary: Get all items in a cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart ID
 *     responses:
 *       200:
 *         description: Cart items fetched successfully
 *       404:
 *         description: Cart not found
 */
const getCartItem = async(req,res)=>{
    try{
        const cartId = req.params;
        const cartItems= await userService.findCartItemById(cartId);
        return res.status(200).json({
			cartItems: true,
			msg: "Cart item updated successfully",
		});

    }catch(err){
        console.log(err);
       return res.status(500).json({
			success: false,
			msg: "Internal server error",
		});
    }

}
 /**
 * @swagger
 * /user/deleteCartItem/{productId}:
 *   delete:
 *     summary: Remove product from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Item removed from cart
 *       404:
 *         description: Product not found in cart
 */
const deleteCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        // find user's cart
        const cart = await userService.findCart(userId);

        if (!cart) {
            return res.status(404).json({
                success: false,
                msg: "Cart not found",
            });
        }

        // find cart item
        const cartItem = await userService.findCartItem(
            cart.id,
            productId
        );

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                msg: "Product not found in cart",
            });
        }

        // delete item
        await userService.deleteCartItem(cart.id, productId);

        return res.status(200).json({
            success: true,
            msg: "Item removed from cart",
        });

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            success: false,
            msg: "Internal server error",
        });
    }
};

module.exports = {
	getProducts,
	addToCart,
	updateCart,
    getCartItem,
    deleteCartItem,
};
