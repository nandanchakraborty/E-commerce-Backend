const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { userMiddleware } = require("../middleware/authMiddleware");
const validationMiddleware = require("../middleware/validationMiddleware");
const userValidators = require("../validators/userValidators");

router.get("/getproduct", userController.getProducts);

router.post(
	"/add-to-cart",
	userMiddleware,
	validationMiddleware(userValidators.CartSchema),
	userController.addToCart,
);

router.patch(
	"/update-cart",
	userMiddleware,
	validationMiddleware(userValidators.CartSchema),
	userController.updateCart,
);
router.get("/getCartItem/:cartId", userMiddleware, userController.getCartItem);

router.delete("/deleteCartItem", userMiddleware, userController.deleteCartItem);

router.post(
	"/create-order",
	userMiddleware,
	validationMiddleware(userValidators.createOrderSchema),
	userController.createOrder,
);

router.get("/orders", userMiddleware, userController.getOrders);

router.get("/orders/:id", userMiddleware, userController.getOrderById);
router.post(
	"/create-intent/:orderId",
	userMiddleware,
	userController.createPaymentIntent,
);

// router.post(
// 	"/webhook",
// 	express.raw({
// 		type: "application/json",
// 	}),
// 	userController.webhook,
// );

router.post(
    "/checkout/:orderId",
    userMiddleware,
    userController
        .createCheckoutSession
);
router.patch(
    "/profile",
    userMiddleware,validationMiddleware(userValidators.updateProfileSchema),
    userController.updateProfile
);

module.exports = router;
