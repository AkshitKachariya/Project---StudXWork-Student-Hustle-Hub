const express = require('express');
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Use Google DNS for SRV record resolution
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, credentials: true }
});

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: false }));

// Rate limiter: max 1000 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased for development/testing
  message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Pass socket.io to controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// DB Connect
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB Atlas Connected');
    // Force drop indexes to fix the "one transaction only" bug
    try {
      const collections = ['transactions', 'wallettransactions', 'wallet_transactions'];
      for (const col of collections) {
        const c = mongoose.connection.db.collection(col);
        await c.dropIndexes().catch(() => { });
      }
      console.log('🚀 ALL INDEXES CLEARED - No more duplicate errors!');
    } catch (err) {
      console.error('Index Clear Error:', err);
    }
  })
  .catch(err => { console.error('❌ MongoDB Error:', err.message); process.exit(1); });

// Real-time chat via Socket.IO
const activeUsers = {}; // Map of userId -> Set of socketIds

io.on('connection', (socket) => {
  console.log('⚡ Socket connected:', socket.id);

  socket.on('join', (userId) => {
    if (!activeUsers[userId]) {
      activeUsers[userId] = new Set();
    }
    activeUsers[userId].add(socket.id);

    // Store userId on socket for disconnect handling
    socket.userId = userId;
    io.emit('activeUsers', Object.keys(activeUsers));
  });

  socket.on('sendMessage', (data) => {
    const receiverSockets = activeUsers[data.receiverId];
    if (receiverSockets) {
      receiverSockets.forEach(socketId => {
        io.to(socketId).emit('receiveMessage', data);
      });
    }
  });

  socket.on('typing', (data) => {
    const receiverSockets = activeUsers[data.receiverId];
    if (receiverSockets) {
      receiverSockets.forEach(socketId => {
        io.to(socketId).emit('userTyping', { senderId: data.senderId, isTyping: data.isTyping });
      });
    }
  });

  socket.on('markRead', (data) => {
    const senderSockets = activeUsers[data.senderId];
    if (senderSockets) {
      senderSockets.forEach(socketId => {
        io.to(socketId).emit('messagesRead', { receiverId: data.receiverId });
      });
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId && activeUsers[socket.userId]) {
      activeUsers[socket.userId].delete(socket.id);
      if (activeUsers[socket.userId].size === 0) {
        delete activeUsers[socket.userId];
      }
      io.emit('activeUsers', Object.keys(activeUsers));
    }
  });
});

// ── ROUTES ──────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/tasks', require('./routes/task'));
app.use('/api/jobs', require('./routes/job'));
app.use('/api/applications', require('./routes/application'));
app.use('/api/notes', require('./routes/note'));
app.use('/api/messages', require('./routes/message'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/ratings', require('./routes/rating'));
app.use('/api/notices', require('./routes/notice'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/workflow', require('./routes/workflow'));
app.use('/api/support', require('./routes/support'));
app.use('/api/search', require('./routes/search'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/stats', require('./routes/stats'));

// Health check
app.get('/', (req, res) => res.json({ success: true, message: 'StudXWork API Running 🚀' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ success: false, error: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
