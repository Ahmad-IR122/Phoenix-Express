'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_users_role"
      ADD VALUE IF NOT EXISTS 'company';
    `);
  },

  async down() {
    // Postgres does not safely support removing a single enum value in place.
    // Leaving this as a no-op avoids destructive type recreation on rollback.
  },
};
