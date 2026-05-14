'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('regions');

    if (!table.is_active) {
      await queryInterface.addColumn('regions', 'is_active', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }

    await queryInterface.sequelize.query(`
      UPDATE regions
      SET is_active = TRUE
      WHERE is_active IS NULL
    `);
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('regions');

    if (table.is_active) {
      await queryInterface.removeColumn('regions', 'is_active');
    }
  },
};
