const route = require("../routes/userRoutes");
const userService = require("../services/userService");
const adminService = require("../services/adminService");
const utils = require("../utils/helperFunction");
const config = require("../config/config");
const { userMiddleware } = require("../middleware/authMiddleware");
const { success } = require("zod");
const stripe = require("stripe");
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
		const userId = req.userId;

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
		const userId = req.userId;


		

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
        const userId = req.userId;
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

/**
 * @swagger
 * /user/create-order:
 *   post:
 *     summary: Create a new order
 *     tags: [Order]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *               - phone
 *               - items
 *             properties:
 *               shippingAddress:
 *                 type: string
 *                 example: "Dhaka, Bangladesh"
 *               phone:
 *                 type: string
 *                 example: "01700000000"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
const createOrder = async (req, res) => {
    try {
        const order = await userService.createOrder(
            req.userId,
            req.body
        );
         utils.sendNotificationEmail(order.user.email,"Order Creation",
    `Your order ${order.id} has been created successfully.`
).catch(err=>{
    console.log('email error :'+err);

})

        return res.status(201).json({
            success: true,
            message: 'Order created successfully.Check your email inbox or spam ',
            data: order,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
/**
 * @swagger
 * /user/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Order]
 *     responses:
 *       200:
 *         description: Orders fetched successfully
 *       500:
 *         description: Internal server error
 */
const getOrders = async (req, res) => {
    try {
        const orders = await userService.getOrders();

        return res.status(200).json({
            success: true,
            data: orders,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
/**
 * @swagger
 * /user/orders/{id}:
 *   get:
 *     summary: Get a single order by ID
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order fetched successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
const getOrderById = async (req, res) => {
    try {
        const order = await userService.getOrderById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        return res.status(200).json({
            success: true,
            data: order,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
const webhook = async (
    req,
    res
) => {

    const signature =
        req.headers[
            "stripe-signature"
        ];

    let event;

    try {

        event =
            stripe.webhooks
                .constructEvent(
                    req.body,
                    signature,
                    config.WEBHOOK_SECRET
                );

    } catch (err) {

        return res
            .status(400)
            .send(
                `Webhook Error: ${err.message}`
            );
    }

    switch (event.type) {

        case "checkout.session.completed":

            await userService
                .handlePaymentSuccess(
                    event.data.object
                );
                try {

        utils.sendNotificationEmail(
            order.user.email,
            "Payment Successful",
            `Your payment for order ${order.id} was successful.`
        );

    } catch (err) {

        console.error(
            "Payment email failed:",
            err.message
        );
    }

            break;
    }

    res.json({
        received: true,
    });
};
/**
 * @swagger
 * /user/create-intent/{orderId}:
 *   post:
 *     summary: Create Stripe Payment Intent
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */

const createPaymentIntent = async (req,res) => {
  try {

    const { orderId } = req.params;

    const result =
      await userService.createPaymentIntent(
        orderId,
        req.userId
      );

    return res.status(200).json({
      success: true,
      message:
        "Payment intent created successfully",
      data: result,
    });

  } catch (error) {

    return res.status(400).json({
      success: false,
      message: error.message,
    });

  }
};
/**
 * @swagger
 * /user/checkout/{orderId}:
 *   post:
 *     summary: Create Stripe Checkout Session
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to be paid
 *     responses:
 *       200:
 *         description: Stripe Checkout Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 url:
 *                   type: string
 *                   example: https://checkout.stripe.com/c/pay/cs_test_xxxxxxxxx
 *       400:
 *         description: Invalid order or checkout creation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Order not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

const createCheckoutSession =
    async (req, res) => {

        try {

            const { orderId } =
                req.params;

            const session =
                await userService
                    .createCheckoutSession(
                        orderId,
                        req.userId
                    );

            return res.status(200)
                .json({
                    success: true,
                    url: session.url,
                });

        } catch (error) {

            return res.status(400)
                .json({
                    success: false,
                    message:
                        error.message,
                });

        }
    };

    /**
 * @swagger
 * /user/profile:
 *   patch:
 *     summary: Update user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Nandan Chakraborty
 *               email:
 *                 type: string
 *                 example: nandan@gmail.com
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error or email already exists
 *       401:
 *         description: Unauthorized
 */
    const updateProfile = async (
    req,
    res
) => {

    try {

        const user =
            await userService
                .updateProfile(
                    req.user.id,
                    req.body
                );

        return res.status(200).json({
            success: true,
            message:
                "Profile updated successfully",
            data: user,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message:
                error.message,
        });

    }
};
/**
 * @swagger
 * /user/cancel-order/{orderId}:
 *   patch:
 *     summary: Cancel an order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to cancel
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 msg:
 *                   type: string
 *                   example: Order cancelled successfully
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Order cannot be cancelled
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
const cancelOrder = async(req,res)=>{
    const {orderId} = req.params;
    const userId = req.userId;


    try{
        const getOrderInfo = await userService.getOrderById(orderId);
        if(!getOrderInfo){
            return res.status(404).json({msg:'Order not found'})
        }
        if(getOrderInfo.userId !== userId){
            return res.status(401).json({msg:'User not matched'})
        }
        if ( getOrderInfo.status === "SHIPPED" || getOrderInfo.status === "DELIVERED") {
             return res.status(400).json({
             msg: "Order cannot be cancelled"});
            }
        if (getOrderInfo.status === "CANCELLED") {
            return res.status(400).json({
             msg: "Order already cancelled"
        });
}    
        const order = await userService.cancelOrder(orderId)
     utils.sendNotificationEmail(order.user.email,"Order Cancelled",
    `Your order ${order.id} has been cancelled successfully.`
).catch(err =>{
    console.log("email error :"+err);
});
        return res.status(200).json({
            success: true,
            msg: "Order cancelled successfully",
            data: order
});

    }catch(err){
        console.log(err);
        return res.status(500).json({msg:'internal server error'})
    }
}
const createReview = async (
    req,
    res
) => {

    try {

        const { productId } =
            req.params;

        const review =
            await userService
                .createReview(
                    req.userId,
                    productId,
                    req.body
                );

        return res.status(201).json({
            success: true,
            data: review,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }
};
const updateReview = async (
    req,
    res
) => {

    try {

        const { reviewId } =
            req.params;

        const review =
            await userService
                .updateReview(
                    reviewId,
                    req.userId,
                    req.body
                );

        return res.status(200).json({
            success: true,
            data: review,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }
};
const deleteReview = async (
    req,
    res
) => {

    try {

        const { reviewId } =
            req.params;

        await userService
            .deleteReview(
                reviewId,
                req.userId
            );

        return res.status(200).json({
            success: true,
            message:
                "Review deleted successfully",
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }
};
const getProductReviews = async (
    req,
    res
) => {

    try {

        const { productId } =
            req.params;

        const reviews =
            await userService
                .getProductReviews(
                    productId
                );

        return res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};


module.exports = {
    getProductReviews,
    deleteReview,
    updateReview,
    createReview,
    updateProfile,
	getProducts,
	addToCart,
	updateCart,
    getCartItem,
    deleteCartItem,
	createOrder,
    getOrders,
    getOrderById,
	webhook,
	createPaymentIntent,
	createCheckoutSession,
    cancelOrder,
};
