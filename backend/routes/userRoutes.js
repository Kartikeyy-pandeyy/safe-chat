const express = require('express');
const { registerUser, authUser, updateFace } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/update-face', protect, updateFace);

module.exports = router;