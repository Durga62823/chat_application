const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Channel = sequelize.define('Channel', {
  user1Id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  user2Id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  lastMessageId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Messages',
      key: 'id'
    }
  },
  lastMessageTime: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

module.exports = Channel;