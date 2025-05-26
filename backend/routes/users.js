const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { User } = require('../models');

// Search users by phone number
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Search by phone number or username
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { phoneNumber: { [Op.like]: `%${query}%` } },
          { username: { [Op.like]: `%${query}%` } }
        ]
      },
      attributes: ['id', 'username', 'phoneNumber', 'avatar', 'online'],
      limit: 10 // Limit results to prevent large responses
    });

    res.json(users);
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get user profile by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'username', 'phoneNumber', 'avatar', 'online']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

module.exports = router; 