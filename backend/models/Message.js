const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Message = sequelize.define('Message', {
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  channelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Channels',
      key: 'id'
    }
  },
  delivered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = Message; 