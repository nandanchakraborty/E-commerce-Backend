const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { adminMiddleware } = require("../middleware/authMiddleware");

router.post("/addCategory", adminController.addCategory);
router.get("/categories", adminController.getCategories);

router.put("/category/:id", adminController.updateCategory);

router.delete("/category/:id", adminController.deleteCategory);
router.post("/addProduct", adminController.addProduct);
router.patch('/updateProduct/:productId',adminController.updateProduct);
router.get('getProduct/:productId',adminController.getProductByID);
router.delete("/Delete-products/:id",adminMiddleware,adminController.deleteProduct
);
module.exports = router;
