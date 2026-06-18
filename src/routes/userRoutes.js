const express = require('express')
const router = express.Router();
const userController = require('../controllers/userController');
const { userMiddleware } = require('../middleware/authMiddleware');

router.get('/health',userController.gethealth);

router.post('/register',userController.register);

router.post('/login',userController.login);

module.exports = router;