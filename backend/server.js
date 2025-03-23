const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const multer = require('multer');
const userRoutes = require('./routes/userRoutes');
const chatRoomRoutes = require('./routes/chatRoomRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const rateLimit = require('express-rate-limit');

dotenv.config();

// Log environment variables for debugging
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID || 'Not set');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set');
console.log('AWS_REGION:', process.env.AWS_REGION || 'Not set');
console.log('AWS_REKOGNITION_COLLECTION:', process.env.AWS_REKOGNITION_COLLECTION || 'Not set');

// Connect to MongoDB
connectDB();

const app = express();

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
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Added PUT and DELETE for completeness
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
app.use('/api/users', upload.single('image'), userRoutes); // Apply multer middleware for user routes
app.use('/api/chatrooms', chatRoomRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));