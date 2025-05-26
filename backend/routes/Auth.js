const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, phoneNumber, password } = req.body;
    
    // Check if user with phone number already exists
    const existingUser = await User.findOne({ where: { phoneNumber } });
    if (existingUser) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      username, 
      phoneNumber, 
      password: hashedPassword
    });
    
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ 
      id: user.id, 
      username: user.username,
      phoneNumber: user.phoneNumber,
      token 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    const user = await User.findOne({ where: { phoneNumber } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(401).json({ error: 'Invalid credentials' });

    // Update user status to online
    await user.update({ online: true });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token,
      user: {
        id: user.id,
        username: user.username,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      
      if (user) {
        // Update user status to offline
        await user.update({ online: false });
      }
      
      res.json({ message: 'Logged out successfully' });
    } catch (err) {
      // Token is invalid or expired, but we still return success
      res.json({ message: 'Logged out successfully' });
    }
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'username', 'phoneNumber', 'avatar', 'online']
    });
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;