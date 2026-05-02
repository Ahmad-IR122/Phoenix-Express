'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_shipments_current_status"
      ADD VALUE IF NOT EXISTS 'cancelled';
    `);
  },

  async down() {
    return Promise.resolve();
  },
};
