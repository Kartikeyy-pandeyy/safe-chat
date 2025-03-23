const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const ChatRoom = require('../models/chatRoomModel');

// Validation middleware for room creation
const validateRoom = [
  body('roomName').isLength({ min: 3 }).withMessage('Room name must be at least 3 characters'),
];

// @desc    Fetch all user chat rooms
// @route   GET /api/chatrooms
// @access  Private
const getRooms = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const rooms = await ChatRoom.find({ participants: userId });
  res.json(rooms);
});

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

    const roomCode = Math.random().toString(36).substr(2, 8).toUpperCase(); // Generate 8-char code
    const chatRoom = await ChatRoom.create({
      roomName,
      participants: [userId],
      roomCode,
    });

    res.status(201).json({ room: chatRoom, roomCode });
  }),
];

// @desc    Join an existing chat room
// @route   POST /api/chatrooms/join
// @access  Private
const joinRoom = asyncHandler(async (req, res) => {
  const { roomCode } = req.body; // Changed from roomName to roomCode
  const userId = req.user._id;

  const chatRoom = await ChatRoom.findOne({ roomCode });
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

  res.json({ room: chatRoom });
});

// @desc    Leave a chat room
// @route   POST /api/chatrooms/leave
// @access  Private
const leaveRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.body; // Changed from roomName to roomId
  const userId = req.user._id;

  const chatRoom = await ChatRoom.findById(roomId);
  if (!chatRoom) {
    res.status(404);
    throw new Error('Room not found');
  }

  if (!chatRoom.participants.includes(userId)) {
    res.status(403);
    throw new Error('Not a participant in this room');
  }

  chatRoom.participants = chatRoom.participants.filter(id => id.toString() !== userId.toString());
  if (chatRoom.participants.length === 0) {
    await chatRoom.deleteOne();
  } else {
    await chatRoom.save();
  }

  res.json({ message: 'Left room successfully' });
});

// @desc    Send a message to a chat room
// @route   POST /api/chatrooms/message
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { roomId, content } = req.body; // Changed from roomName to roomId
  const userId = req.user._id;

  const chatRoom = await ChatRoom.findById(roomId);
  if (!chatRoom) {
    res.status(404);
    throw new Error('Room not found');
  }

  if (!chatRoom.participants.includes(userId)) {
    res.status(403);
    throw new Error('Not a participant in this room');
  }

  const message = { sender: userId, content, timestamp: new Date() };
  chatRoom.messages.push(message);
  await chatRoom.save();

  res.status(201).json(message);
});

// @desc    Fetch chat room messages
// @route   GET /api/chatrooms/:roomId/messages
// @access  Private
const fetchMessages = asyncHandler(async (req, res) => {
  const { roomId } = req.params; // Changed from roomName to roomId
  const userId = req.user._id;

  const chatRoom = await ChatRoom.findById(roomId).populate('messages.sender', 'username');
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

module.exports = { getRooms, createRoom, joinRoom, leaveRoom, sendMessage, fetchMessages };