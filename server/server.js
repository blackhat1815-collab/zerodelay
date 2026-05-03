import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import emergencyRoutes from './routes/emergency.js';
import contactRoutes from './routes/contacts.js';
import hospitalRoutes from './routes/hospitals.js';
import firstAidRoutes from './routes/firstAid.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requireDatabase } from './middleware/database.js';
import { setupSocketHandlers } from './services/socketService.js';

dotenv.config();
mongoose.set('bufferCommands', false);

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});
app.use('/api', limiter);

// Emergency endpoint has higher limit
const emergencyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: 'Emergency rate limit reached.'
});
app.use('/api/emergency/trigger', emergencyLimiter);

// Make io accessible to routes
app.set('io', io);

// Root route for deployment previews and direct API checks
app.get('/', (req, res) => {
  res.json({
    name: 'ZeroDelay API',
    status: 'running',
    health: '/api/health'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/first-aid', firstAidRoutes);

// Error handler
app.use(errorHandler);

// Socket handlers
setupSocketHandlers(io);

// Database connection
mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
