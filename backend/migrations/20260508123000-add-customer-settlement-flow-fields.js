'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('merchant_settlements', 'requested_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('merchant_settlements', 'customer_confirmed_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('merchant_settlements', 'bank_name', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('merchant_settlements', 'bank_account_holder', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('merchant_settlements', 'bank_account_number', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('merchant_settlements', 'bank_iban', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('merchant_settlements', 'bank_iban');
    await queryInterface.removeColumn('merchant_settlements', 'bank_account_number');
    await queryInterface.removeColumn('merchant_settlements', 'bank_account_holder');
    await queryInterface.removeColumn('merchant_settlements', 'bank_name');
    await queryInterface.removeColumn('merchant_settlements', 'customer_confirmed_at');
    await queryInterface.removeColumn('merchant_settlements', 'requested_at');
  },
};
