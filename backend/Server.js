const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  } 
});
const { Message, Channel, User } = require('./models');
const sequelize = require('./config/sequelize');
const authRoutes = require('./routes/Auth');
const messageRoutes = require('./routes/Messages');
const userRoutes = require('./routes/users');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

// Database connection test
sequelize.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// Set up CORS for Express - Use very permissive settings for local development
app.use(cors({
  origin: "*", // Allow all origins for testing
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add raw request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api', messageRoutes);
app.use('/api/users', userRoutes);

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  let currentUserId = null;

  // Authenticate user
  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      currentUserId = decoded.id;
      
      // Update user's online status
      await User.update({ online: true }, { where: { id: currentUserId } });
      
      // Notify others that user is online
      socket.broadcast.emit('user_status_change', {
        userId: currentUserId,
        online: true
      });
      
      // Join user's personal room for direct messages
      socket.join(`user_${currentUserId}`);
    } catch (error) {
      console.error('Socket authentication error:', error);
    }
  });

  // Create new chat channel
  socket.on('create_channel', async (data) => {
    try {
      const { userId, targetUserId } = data;
      
      // Check if channel already exists
      const existingChannel = await Channel.findOne({
        where: {
          [Op.or]: [
            { user1Id: userId, user2Id: targetUserId },
            { user1Id: targetUserId, user2Id: userId }
          ]
        }
      });

      if (existingChannel) {
        socket.emit('channel_created', existingChannel);
        return;
      }

      // Create new channel
      const channel = await Channel.create({
        user1Id: userId,
        user2Id: targetUserId
      });

      // Get user details for the response
      const targetUser = await User.findByPk(targetUserId, {
        attributes: ['id', 'username', 'phoneNumber', 'avatar', 'online']
      });

      const channelData = {
        id: channel.id,
        name: targetUser.username,
        avatar: targetUser.avatar,
        online: targetUser.online,
        lastMessage: null,
        lastMessageTime: null
      };

      // Join both users to the channel
      socket.join(channel.id);
      io.to(`user_${targetUserId}`).emit('new_channel', channelData);
      
      socket.emit('channel_created', channelData);
    } catch (error) {
      console.error('Create channel error:', error);
      socket.emit('channel_error', { error: 'Failed to create chat' });
    }
  });

  // Join a channel
  socket.on('join_channel', async (channelId) => {
    socket.join(channelId);
    console.log(`User joined channel ${channelId}`);
    
    // Fetch last 50 messages from the channel
    const messages = await Message.findAll({
      where: { channelId },
      limit: 50,
      order: [['createdAt', 'DESC']],
      include: [{ 
        model: User, 
        attributes: ['id', 'username', 'avatar'] 
      }],
    });
    
    // Mark messages as delivered for this user
    if (currentUserId) {
      await Message.update(
        { delivered: true },
        { 
          where: { 
            channelId,
            userId: { [Op.ne]: currentUserId },
            delivered: false
          }
        }
      );
    }

    socket.emit('message_history', messages.reverse());
  });

  // Send message
  socket.on('send_message', async (data) => {
    try {
      const message = await Message.create({
        content: data.content,
        userId: data.userId,
        channelId: data.channelId,
        delivered: false
      });

      const messageWithUser = await Message.findByPk(message.id, {
        include: [{ 
          model: User, 
          attributes: ['id', 'username', 'avatar'] 
        }],
      });

      // Update channel's last message
      await Channel.update(
        { 
          lastMessageId: message.id,
          lastMessageTime: message.createdAt
        },
        { where: { id: data.channelId } }
      );

      // Emit to all users in the channel
      io.to(data.channelId).emit('receive_message', messageWithUser);

      // Update message as delivered for online users in the channel
      const socketsInChannel = await io.in(data.channelId).fetchSockets();
      if (socketsInChannel.length > 1) {
        await message.update({ delivered: true });
        io.to(data.channelId).emit('message_delivered', {
          messageId: message.id,
          channelId: data.channelId
        });
      }
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Handle message delivered status
  socket.on('message_seen', async ({ messageId, channelId }) => {
    try {
      await Message.update(
        { delivered: true },
        { where: { id: messageId } }
      );
      io.to(channelId).emit('message_delivered', { messageId, channelId });
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  });

  // Disconnect
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    if (currentUserId) {
      // Update user's online status
      await User.update({ online: false }, { where: { id: currentUserId } });
      
      // Notify others that user is offline
      socket.broadcast.emit('user_status_change', {
        userId: currentUserId,
        online: false
      });
    }
  });
});

// Add simple test endpoint that doesn't use database
app.get('/api/ping', (req, res) => {
  res.status(200).json({ message: 'pong', time: new Date().toISOString() });
});

// Add health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Test endpoint for frontend connectivity
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'Backend connection successful' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start the server
const PORT = process.env.PORT || 5000;
console.log('Starting server...');

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server URL: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Ping test: http://localhost:${PORT}/api/ping`);
});