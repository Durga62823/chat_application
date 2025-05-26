'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if the table exists
      const tableExists = await queryInterface.sequelize.query(
        `SELECT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'Channels'
        );`
      );
      
      const exists = tableExists[0][0].exists;
      
      if (exists) {
        // Drop the existing Channels table
        await queryInterface.dropTable('Channels', { cascade: true });
      }
      
      // Create the table with the correct structure
      await queryInterface.createTable('Channels', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        user1Id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Users',
            key: 'id'
          }
        },
        user2Id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Users',
            key: 'id'
          }
        },
        lastMessageId: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        lastMessageTime: {
          type: Sequelize.DATE,
          allowNull: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      });
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Channels');
  }
}; 