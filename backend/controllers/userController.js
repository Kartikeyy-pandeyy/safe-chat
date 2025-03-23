const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const rekognition = require('../utils/awsRekognition');
const {
  IndexFacesCommand,
  SearchFacesByImageCommand,
  DeleteFacesCommand,
} = require('@aws-sdk/client-rekognition');

// Validation middleware for registration
const validateRegister = [
  body('username').isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// Validation middleware for login
const validateLogin = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body().custom((value, { req }) => {
    if (!req.body.password && !req.file) {
      throw new Error('Password or image is required');
    }
    return true;
  }),
];

// Validation middleware for updating profile
const validateUpdateProfile = [
  body('username').optional().isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters'),
];

const registerUser = [
  validateRegister,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400);
      throw new Error(errors.array()[0].msg);
    }

    const { username, email, password } = req.body;

    if (!req.file) {
      res.status(400);
      throw new Error('Image is required');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const imageBuffer = req.file.buffer;
    console.log(`Image buffer size: ${imageBuffer.length} bytes`);

    try {
      const sanitizedExternalImageId = email.replace('@', '_');

      const indexCommand = new IndexFacesCommand({
        CollectionId: process.env.AWS_REKOGNITION_COLLECTION,
        Image: { Bytes: imageBuffer },
        ExternalImageId: sanitizedExternalImageId,
      });
      console.log(`Sending IndexFacesCommand for ${email} to collection: ${process.env.AWS_REKOGNITION_COLLECTION}`);
      const result = await rekognition.send(indexCommand);
      console.log(`Rekognition result: ${JSON.stringify(result)}`);

      if (result.FaceRecords.length === 0) {
        res.status(400);
        throw new Error('No face detected in the image');
      }

      const faceId = result.FaceRecords[0].Face.FaceId;

      const user = await User.create({
        username,
        email,
        password,
        faceId,
        faceImage: imageBuffer, // Save the image buffer
      });

      if (user) {
        console.log(`User registered: ${email}`);
        res.status(201).json({
          _id: user._id,
          username: user.username,
          email: user.email,
          faceId: user.faceId,
          token: generateToken(user._id),
        });
      } else {
        res.status(400);
        throw new Error('Invalid user data');
      }
    } catch (error) {
      console.error(`Registration error for ${email}: ${error.message}`);
      res.status(500);
      throw new Error('Face recognition failed');
    }
  }),
];

const authUser = [
  validateLogin,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400);
      throw new Error(errors.array()[0].msg);
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    if (req.file) {
      const imageBuffer = req.file.buffer;

      try {
        const searchCommand = new SearchFacesByImageCommand({
          CollectionId: process.env.AWS_REKOGNITION_COLLECTION,
          Image: { Bytes: imageBuffer },
          MaxFaces: 1,
        });
        const result = await rekognition.send(searchCommand);

        if (
          result.FaceMatches.length === 0 ||
          result.FaceMatches[0].Face.FaceId !== user.faceId ||
          result.FaceMatches[0].Similarity < 90
        ) {
          console.log(`Face login failed for ${email}`);
          res.status(401);
          throw new Error('Face recognition failed');
        }

        console.log(`Face login successful for ${email}`);
        res.json({
          _id: user._id,
          username: user.username,
          email: user.email,
          token: generateToken(user._id),
        });
      } catch (error) {
        console.error(`Face login error for ${email}: ${error.message}`);
        res.status(500);
        throw new Error('Face recognition error');
      }
    } else {
      if (await user.matchPassword(password)) {
        console.log(`Password login successful for ${email}`);
        res.json({
          _id: user._id,
          username: user.username,
          email: user.email,
          token: generateToken(user._id),
        });
      } else {
        console.log(`Password login failed for ${email}`);
        res.status(401);
        throw new Error('Invalid email or password');
      }
    }
  }),
];

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-faceImage'); // Exclude faceImage from response
  if (user) {
    console.log(`Profile fetched for user: ${user.email}`);
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      faceId: user.faceId,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

const updateUserProfile = [
  validateUpdateProfile,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400);
      throw new Error(errors.array()[0].msg);
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const { username } = req.body;

    user.username = username || user.username;

    if (req.file) {
      const imageBuffer = req.file.buffer;

      try {
        if (user.faceId) {
          const deleteCommand = new DeleteFacesCommand({
            CollectionId: process.env.AWS_REKOGNITION_COLLECTION,
            FaceIds: [user.faceId],
          });
          await rekognition.send(deleteCommand);
        }

        const sanitizedExternalImageId = user.email.replace('@', '_');

        const indexCommand = new IndexFacesCommand({
          CollectionId: process.env.AWS_REKOGNITION_COLLECTION,
          Image: { Bytes: imageBuffer },
          ExternalImageId: sanitizedExternalImageId,
        });
        const result = await rekognition.send(indexCommand);

        if (result.FaceRecords.length === 0) {
          res.status(400);
          throw new Error('No face detected in the image');
        }

        user.faceId = result.FaceRecords[0].Face.FaceId;
        user.faceImage = imageBuffer; // Save the new image buffer
      } catch (error) {
        console.error(`Face update error for ${user.email}: ${error.message}`);
        res.status(500);
        throw new Error('Face update failed');
      }
    }

    await user.save();

    console.log(`Profile updated for ${user.email}`);
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      faceId: user.faceId,
      token: generateToken(user._id),
    });
  }),
];

module.exports = { registerUser, authUser, getUserProfile, updateUserProfile };