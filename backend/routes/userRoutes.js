const express = require('express');
const { registerUser, authUser, getUserProfile, updateUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.get('/me', protect, getUserProfile);
router.put('/update', protect, updateUserProfile);

module.exports = router;