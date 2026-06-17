const express = require('express')
const router = express.Router();
const userController = require('../controllers/userController')
router.get('/health',userController.gethealth);

router.post('/register',userController.register);

module.exports = router;