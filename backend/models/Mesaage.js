const { DataTypes } = require('sequelize');
const sequelize = require("../config/database");

const Message = sequelize.define('Message', {
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  // Foreign keys for associations
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  channelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = Message;