const express = require('express');
const { registerUser, authUser, getUserProfile, updateUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// User routes
router.post('/register', registerUser); // Register a new user
router.post('/login', authUser); // Login a user
router.get('/profile', protect, getUserProfile); // Get user profile
router.get('/me', protect, getUserProfile); // Get user profile (added for compatibility with Profile.js)
router.put('/update', protect, updateUserProfile); // Update user profile

module.exports = router;