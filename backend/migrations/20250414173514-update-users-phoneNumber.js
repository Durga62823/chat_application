'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, update NULL values to a default value
    await queryInterface.sequelize.query(`
      UPDATE "Users" SET "phoneNumber" = 'unknown-' || "id" WHERE "phoneNumber" IS NULL
    `);

    // Then add the NOT NULL constraint
    await queryInterface.changeColumn('Users', 'phoneNumber', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the NOT NULL constraint
    await queryInterface.changeColumn('Users', 'phoneNumber', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
};
