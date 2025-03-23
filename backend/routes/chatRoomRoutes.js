const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getRooms,
  createRoom,
  joinRoom,
  leaveRoom,
  sendMessage,
  fetchMessages,
  getRoomDetails,
} = require('../controllers/chatRoomController');

const router = express.Router();

// Fetch all user chat rooms
router.get('/', protect, getRooms);

// Create a new chat room
router.post('/create', protect, createRoom);

// Join an existing chat room
router.post('/join', protect, joinRoom);

// Leave a chat room
router.post('/leave', protect, leaveRoom);

// Send a message to a chat room (optional, since WebSocket handles this)
router.post('/message', protect, sendMessage);

// Fetch chat room messages
router.get('/:roomId/messages', protect, fetchMessages);

// Fetch chat room details
router.get('/:roomId', protect, getRoomDetails);

module.exports = router;