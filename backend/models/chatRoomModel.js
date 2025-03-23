const mongoose = require('mongoose');

const chatRoomSchema = mongoose.Schema(
  {
    roomName: { type: String, required: true, unique: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    roomCode: { type: String, required: true, unique: true }, // Added roomCode
    messages: [
      {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now, expires: '7d' }, // TTL index for 7-day expiration
      },
    ],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);
module.exports = ChatRoom;