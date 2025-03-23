const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getRooms,
  createRoom,
  joinRoom,
  leaveRoom,
  sendMessage,
  fetchMessages,
} = require('../controllers/chatRoomController');
const router = express.Router();

router.get('/', protect, getRooms);
router.post('/create', protect, createRoom);
router.post('/join', protect, joinRoom);
router.post('/leave', protect, leaveRoom);
router.post('/message', protect, sendMessage);
router.get('/:roomId/messages', protect, fetchMessages);

module.exports = router;