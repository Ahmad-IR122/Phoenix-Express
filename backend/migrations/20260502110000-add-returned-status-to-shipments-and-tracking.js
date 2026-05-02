'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_shipments_current_status"
      ADD VALUE IF NOT EXISTS 'returned';
    `);
  },

  async down() {
    return Promise.resolve();
  },
};
