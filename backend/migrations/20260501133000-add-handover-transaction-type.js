'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        ALTER TYPE "enum_wallet_transactions_transaction_type" ADD VALUE IF NOT EXISTS 'handover';
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      UPDATE wallet_transactions
      SET transaction_type = 'handover'
      WHERE transaction_type = 'withdrawal';
    `);
  },

  async down() {
    // Postgres enums are not safely reversible here.
  },
};
