const express = require('express');
const router = express.Router();
const { Message, Channel, User } = require('../models');
const authenticate = require('../middleware/Auth');

// Get messages in a channel (with pagination)
router.get('/channels/:channelId/messages', authenticate, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const messages = await Message.findAll({
      where: { channelId },
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, attributes: ['username'] }],
    });

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;