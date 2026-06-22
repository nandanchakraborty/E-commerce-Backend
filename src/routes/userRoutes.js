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
	userController.updateCart);
router.get('/getCartItem/:cartId',userMiddleware,userController.getCartItem)

router.delete('/deleteCartItem',userMiddleware,userController.deleteCartItem)



module.exports = router;
