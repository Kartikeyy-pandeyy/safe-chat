const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const multer = require('multer');
const userRoutes = require('./routes/userRoutes');
const chatRoomRoutes = require('./routes/chatRoomRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const ChatRoom = require('./models/chatRoomModel');

dotenv.config();

// Log environment variables for debugging
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID || 'Not set');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set');
console.log('AWS_REGION:', process.env.AWS_REGION || 'Not set');
console.log('AWS_REKOGNITION_COLLECTION:', process.env.AWS_REKOGNITION_COLLECTION || 'Not set');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'https://safechatapp.netlify.app',
      'http://localhost:3000',
      'http://localhost:5173',
    ],
    methods: ['GET', 'POST'],
  },
});

// Trust proxy for rate limiting (if behind a proxy like Render)
app.set('trust proxy', 1);

// Middleware for parsing JSON and URL-encoded data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: [
    'https://safechatapp.netlify.app',
    'http://localhost:3000',
    'http://localhost:5173',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Rate limiting for /api/users routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use('/api/users', limiter);

// Basic route for testing server
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Routes
// Routes
app.use('/api/users', upload.single('image'), userRoutes);
app.use('/api/chatrooms', (req, res, next) => {
  req.io = io; // Attach io to the request object
  next();
}, chatRoomRoutes);

// WebSocket Authentication Middleware
io.use((socket, next) => {
  const authHeader = socket.handshake.auth.token;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new Error('Authentication error: No token provided'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // Attach user data to socket
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// WebSocket Connection Handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.id}`);

  // Join a room
  socket.on('joinRoom', async (roomId) => {
    try {
      const chatRoom = await ChatRoom.findById(roomId);
      if (!chatRoom) {
        socket.emit('error', 'Room not found');
        return;
      }

      if (!chatRoom.participants.some(id => id.toString() === socket.user.id)) {
        socket.emit('error', 'Not a participant in this room');
        return;
      }

      socket.join(roomId);
      console.log(`User ${socket.user.id} joined room ${roomId}`);
    } catch (err) {
      socket.emit('error', 'Failed to join room');
    }
  });

  // Handle sending a message
  socket.on('sendMessage', async (messageData) => {
    try {
      const { roomId, content, sender } = messageData;

      const chatRoom = await ChatRoom.findById(roomId);
      if (!chatRoom) {
        socket.emit('error', 'Room not found');
        return;
      }

      if (!chatRoom.participants.some(id => id.toString() === socket.user.id)) {
        socket.emit('error', 'Not a participant in this room');
        return;
      }

      const message = {
        sender: socket.user.id,
        content,
        timestamp: new Date(),
      };

      chatRoom.messages.push(message);
      await chatRoom.save();

      // Populate the sender details for the message
      const populatedMessage = await ChatRoom.findById(roomId)
        .populate('messages.sender', 'username')
        .then(room => room.messages[room.messages.length - 1]);

      // Broadcast the message to all users in the room
      io.to(roomId).emit('newMessage', populatedMessage);

      // Emit room update to all users (for dashboard updates)
      const updatedRoom = await ChatRoom.findById(roomId)
        .select('roomName roomCode participants createdAt');
      io.emit('roomUpdated', updatedRoom);
    } catch (err) {
      socket.emit('error', 'Failed to send message');
    }
  });

  // Handle room updates (e.g., when a user leaves)
  socket.on('leaveRoom', async (roomId) => {
    try {
      const chatRoom = await ChatRoom.findById(roomId);
      if (!chatRoom) {
        socket.emit('error', 'Room not found');
        return;
      }

      if (!chatRoom.participants.some(id => id.toString() === socket.user.id)) {
        socket.emit('error', 'Not a participant in this room');
        return;
      }

      chatRoom.participants = chatRoom.participants.filter(
        id => id.toString() !== socket.user.id
      );

      if (chatRoom.participants.length === 0) {
        await ChatRoom.deleteOne({ _id: roomId });
        io.emit('roomDeleted', roomId);
      } else {
        await chatRoom.save();
        const updatedRoom = await ChatRoom.findById(roomId)
          .select('roomName roomCode participants createdAt');
        io.emit('roomUpdated', updatedRoom);
      }
    } catch (err) {
      socket.emit('error', 'Failed to leave room');
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.id}`);
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));