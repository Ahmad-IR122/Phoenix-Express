'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('employees', 'total_deliveries');
    await queryInterface.removeColumn('employees', 'average_rating');
    await queryInterface.removeColumn('employees', 'completion_rate');
    await queryInterface.removeColumn('employees', 'avg_delivery_time_minutes');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('employees', 'total_deliveries', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    await queryInterface.addColumn('employees', 'average_rating', {
      type: Sequelize.FLOAT,
      defaultValue: 0
    });

    await queryInterface.addColumn('employees', 'completion_rate', {
      type: Sequelize.FLOAT,
      defaultValue: 0
    });

    await queryInterface.addColumn('employees', 'avg_delivery_time_minutes', {
      type: Sequelize.FLOAT,
      defaultValue: 0
    });
  }
};