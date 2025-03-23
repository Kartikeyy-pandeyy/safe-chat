const mongoose = require('mongoose');

const chatRoomSchema = mongoose.Schema(
  {
    roomName: { type: String, required: true, unique: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    roomCode: { type: String, required: true, unique: true },
    messages: [
      {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now, expires: 604800 }, // 7 days in seconds, TTL index created here
      },
    ],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Removed the duplicate TTL index definition
// chatRoomSchema.index({ 'messages.timestamp': 1 }, { expireAfterSeconds: 604800 });

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);
module.exports = ChatRoom;