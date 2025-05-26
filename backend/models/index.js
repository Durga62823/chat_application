const User = require('./User');
const Message = require('./Message');
const Channel = require('./Channel');

// Message associations
Message.belongsTo(User, { foreignKey: 'userId' });
Message.belongsTo(Channel, { foreignKey: 'channelId' });

// Channel associations
Channel.belongsTo(User, { as: 'User1', foreignKey: 'user1Id' });
Channel.belongsTo(User, { as: 'User2', foreignKey: 'user2Id' });
Channel.hasMany(Message, { foreignKey: 'channelId' });

// User associations
User.hasMany(Message, { foreignKey: 'userId' });
User.hasMany(Channel, { as: 'User1Channels', foreignKey: 'user1Id' });
User.hasMany(Channel, { as: 'User2Channels', foreignKey: 'user2Id' });

module.exports = { User, Message, Channel };