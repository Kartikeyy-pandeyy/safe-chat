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

// Log AWS credentials to verify they’re loaded
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID || 'Not set');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set');
console.log('AWS_REGION:', process.env.AWS_REGION || 'Not set');
console.log('AWS_REKOGNITION_COLLECTION:', process.env.AWS_REKOGNITION_COLLECTION || 'Not set');

connectDB();

const app = express();

// Trust Render's proxy for correct IP detection with rate limiting
app.set('trust proxy', 1);

// Middleware for JSON parsing (with increased limit for Base64 if still used)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration for Netlify frontend
const cors = require('cors');

app.use(cors({
  origin: [
    'https://safechatapp.netlify.app', // Your Netlify domain
    'http://localhost:3000',           // Vite default port (if using Vite)
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Rate limiting for login/register endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use('/api/users', limiter);

// Root endpoint
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Routes with multer middleware applied where needed
app.use('/api/users', upload.single('image'), userRoutes);
app.use('/api/chatrooms', chatRoomRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));