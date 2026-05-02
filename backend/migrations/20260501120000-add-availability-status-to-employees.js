'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('employees', 'availability_status', {
      type: Sequelize.ENUM('available', 'busy', 'offline'),
      allowNull: false,
      defaultValue: 'available',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('employees', 'availability_status');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_employees_availability_status";'
    );
  },
};
