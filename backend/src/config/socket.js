const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { getDBStatus } = require('./db');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (token) {
        const secret = process.env.JWT_SECRET;
        if (!secret) return next();
        const decoded = jwt.verify(token, secret);
        if (getDBStatus()) {
          const user = await User.findById(decoded.id).select('-password');
          if (user) {
            socket.user = user;
          }
        }
      }
      return next();
    } catch (err) {
      // Allow guest connection, socket.user will be undefined
      return next();
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user ? socket.user._id.toString() : 'guest';

    // Join user-specific notification room if authenticated
    if (socket.user) {
      socket.join(`user_${userId}`);
    }

    socket.on('join_user_room', (id) => {
      const targetId = socket.user ? socket.user._id.toString() : id;
      if (targetId) {
        socket.join(`user_${targetId}`);
      }
    });

    socket.on('disconnect', () => {
      // Handled cleanly
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initSocket, getIO };
