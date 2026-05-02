'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('merchant_settlements', 'payment_method', {
      type: Sequelize.ENUM('cash', 'bank_transfer', 'ewallet'),
      allowNull: false,
      defaultValue: 'cash',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('merchant_settlements', 'payment_method');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_merchant_settlements_payment_method";'
    );
  },
};
