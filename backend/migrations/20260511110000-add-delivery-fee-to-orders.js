'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('orders');

    if (!table.delivery_fee) {
      await queryInterface.addColumn('orders', 'delivery_fee', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      });
    }

    await queryInterface.sequelize.query(`
      UPDATE orders
      SET delivery_fee = regions.price
      FROM regions
      WHERE orders.region_id = regions.id
        AND orders.delivery_fee IS NULL
    `);
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('orders');

    if (table.delivery_fee) {
      await queryInterface.removeColumn('orders', 'delivery_fee');
    }
  },
};
