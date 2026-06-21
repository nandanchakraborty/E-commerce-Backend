const express = require('express')
const router = express.Router();
const userController = require('../controllers/userController');
const {userMiddleware} = require('../middleware/authMiddleware')
router.get('/getproduct',userController.getProducts);

router.post('/add-to-cart',userMiddleware,userController.addToCart)

module.exports = router;
