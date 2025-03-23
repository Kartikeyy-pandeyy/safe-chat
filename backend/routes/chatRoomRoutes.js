const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createRoom,
  joinRoom,
  leaveRoom,
  sendMessage,
  fetchMessages,
} = require('../controllers/chatRoomController');
const router = express.Router();

router.post('/create', protect, createRoom);
router.post('/join', protect, joinRoom);
router.post('/leave', protect, leaveRoom);
router.post('/message', protect, sendMessage);
router.get('/:roomName/messages', protect, fetchMessages);

module.exports = router;