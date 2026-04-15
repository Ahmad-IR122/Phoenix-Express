'use strict';

module.exports = {
  async up(queryInterface) {
    const table = await queryInterface.describeTable('feedback');

    if (table.order_id) {
      await queryInterface.removeColumn('feedback', 'order_id');
    }

    if (table.employee_id) {
      await queryInterface.removeColumn('feedback', 'employee_id');
    }

    if (table.satisfaction) {
      await queryInterface.removeColumn('feedback', 'satisfaction');
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('feedback');

    if (!table.order_id) {
      await queryInterface.addColumn('feedback', 'order_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    if (!table.employee_id) {
      await queryInterface.addColumn('feedback', 'employee_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    if (!table.satisfaction) {
      await queryInterface.addColumn('feedback', 'satisfaction', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },
};