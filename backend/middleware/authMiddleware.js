const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for Authorization header and make 'Bearer' case-insensitive
  if (
    req.headers.authorization &&
    req.headers.authorization.toLowerCase().startsWith('bearer')
  ) {
    try {
      // Extract the token
      token = req.headers.authorization.split(' ')[1];

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch the user and attach to req.user (excluding password)
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      next();
    } catch (error) {
      // Log the error with additional context
      console.error(
        `Token verification failed for ${req.method} ${req.originalUrl}: ${error.message}`
      );

      // Provide more specific error messages based on the error type
      if (error.name === 'TokenExpiredError') {
        res.status(401);
        throw new Error('Session expired, please log in again');
      } else if (error.name === 'JsonWebTokenError') {
        res.status(401);
        throw new Error('Invalid token, authentication failed');
      } else {
        res.status(401);
        throw new Error('Not authorized, token failed');
      }
    }
  } else {
    // Log the missing token with request context
    console.error(
      `No token provided for ${req.method} ${req.originalUrl}`
    );
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

module.exports = { protect };