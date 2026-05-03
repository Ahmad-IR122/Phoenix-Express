'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_merchant_settlements_status"
      ADD VALUE IF NOT EXISTS 'requested';
    `);
  },

  async down() {
    return Promise.resolve();
  },
};
