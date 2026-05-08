'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('shipments', 'current_latitude', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true,
    });

    await queryInterface.addColumn('shipments', 'current_longitude', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true,
    });

    await queryInterface.addColumn('shipments', 'location_updated_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('shipments', 'location_updated_at');
    await queryInterface.removeColumn('shipments', 'current_longitude');
    await queryInterface.removeColumn('shipments', 'current_latitude');
  },
};
