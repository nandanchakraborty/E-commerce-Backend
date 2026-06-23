const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { adminMiddleware } = require("../middleware/authMiddleware");

const validationMiddleware = require("../middleware/validationMiddleware");
const adminValidators = require("../validators/adminValidators");

router.post(
	"/addCategory",
	adminMiddleware,
	validationMiddleware(adminValidators.CategorySchema),
	adminController.addCategory,
);
router.get("/categories", adminMiddleware, adminController.getCategories);

router.put(
	"/category/:id",
	adminMiddleware,
	validationMiddleware(adminValidators.CategorySchema),
	adminController.updateCategory,
);

router.delete("/category/:id", adminMiddleware, adminController.deleteCategory);
router.post(
	"/addProduct",
	adminMiddleware,
	validationMiddleware(adminValidators.ProductSchema),
	adminController.addProduct,
);
router.patch(
	"/updateProduct/:productId",
	adminMiddleware,
	validationMiddleware(adminValidators.ProductSchema),
	adminController.updateProduct,
);
router.get(
	"/getProduct/:productId",
	adminMiddleware,
	adminController.getProductByID,
);
router.delete(
	"/Delete-products/:id",
	adminMiddleware,
	adminController.deleteProduct,
);
module.exports = router;
