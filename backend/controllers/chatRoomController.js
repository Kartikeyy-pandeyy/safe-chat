const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const ChatRoom = require('../models/chatRoomModel');
const User = require('../models/userModel');

// Validation middleware for room creation
const validateRoom = [
  body('roomName').isLength({ min: 3 }).withMessage('Room name must be at least 3 characters'),
];

// @desc    Create a new chat room
// @route   POST /api/chatrooms/create
// @access  Private
const createRoom = [
  validateRoom,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400);
      throw new Error(errors.array()[0].msg);
    }

    const { roomName } = req.body;
    const userId = req.user._id;

    const userRooms = await ChatRoom.countDocuments({ participants: userId });
    if (userRooms >= 5) {
      res.status(400);
      throw new Error('Maximum 5 rooms per user');
    }

    const roomExists = await ChatRoom.findOne({ roomName });
    if (roomExists) {
      res.status(400);
      throw new Error('Room name already exists');
    }

    const chatRoom = await ChatRoom.create({
      roomName,
      participants: [userId],
    });

    res.status(201).json(chatRoom);
  }),
];

// @desc    Join an existing chat room
// @route   POST /api/chatrooms/join
// @access  Private
const joinRoom = asyncHandler(async (req, res) => {
  const { roomName } = req.body;
  const userId = req.user._id;

  const chatRoom = await ChatRoom.findOne({ roomName });
  if (!chatRoom) {
    res.status(404);
    throw new Error('Room not found');
  }

  const userRooms = await ChatRoom.countDocuments({ participants: userId });
  if (userRooms >= 5) {
    res.status(400);
    throw new Error('Maximum 5 rooms per user');
  }

  if (chatRoom.participants.length >= 3) {
    res.status(400);
    throw new Error('Room is full (max 3 participants)');
  }

  if (chatRoom.participants.includes(userId)) {
    res.status(400);
    throw new Error('Already in this room');
  }

  chatRoom.participants.push(userId);
  await chatRoom.save();

  res.json(chatRoom);
});

// @desc    Leave a chat room
// @route   POST /api/chatrooms/leave
// @access  Private
const leaveRoom = asyncHandler(async (req, res) => {
  const { roomName } = req.body;
  const userId = req.user._id;

  const chatRoom = await ChatRoom.findOne({ roomName });
  if (!chatRoom) {
    res.status(404);
    throw new Error('Room not found');
  }

  chatRoom.participants = chatRoom.participants.filter(id => id.toString() !== userId.toString());
  await chatRoom.save();

  res.json({ message: 'Left room successfully' });
});

// @desc    Send a message to a chat room
// @route   POST /api/chatrooms/message
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { roomName, content } = req.body;
  const userId = req.user._id;

  const chatRoom = await ChatRoom.findOne({ roomName });
  if (!chatRoom) {
    res.status(404);
    throw new Error('Room not found');
  }

  if (!chatRoom.participants.includes(userId)) {
    res.status(403);
    throw new Error('Not a participant in this room');
  }

  const message = { sender: userId, content };
  chatRoom.messages.push(message);
  await chatRoom.save();

  res.status(201).json(message);
});

// @desc    Fetch chat room messages
// @route   GET /api/chatrooms/:roomName/messages
// @access  Private
const fetchMessages = asyncHandler(async (req, res) => {
  const { roomName } = req.params;
  const userId = req.user._id;

  const chatRoom = await ChatRoom.findOne({ roomName }).populate('messages.sender', 'username');
  if (!chatRoom) {
    res.status(404);
    throw new Error('Room not found');
  }

  if (!chatRoom.participants.includes(userId)) {
    res.status(403);
    throw new Error('Not a participant in this room');
  }

  res.json(chatRoom.messages);
});

module.exports = { createRoom, joinRoom, leaveRoom, sendMessage, fetchMessages };