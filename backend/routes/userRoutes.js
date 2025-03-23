const express = require('express');
const { registerUser, authUser, getUserProfile, updateUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');
const router = express.Router();

// User routes
router.post('/register', registerUser); // Register a new user
router.post('/login', authUser); // Login a user
router.get('/profile', protect, getUserProfile); // Get user profile
router.put('/update', protect, updateUserProfile); // Update user profile

// Route to serve the user's face image
router.get(
  '/image/:id',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user || !user.faceImage) {
      res.status(404);
      throw new Error('Image not found');
    }
    res.set('Content-Type', 'image/jpeg'); // Adjust content type based on your image format
    res.send(user.faceImage);
  })
);

module.exports = router;