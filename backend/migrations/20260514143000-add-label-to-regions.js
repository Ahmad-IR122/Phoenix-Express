'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('regions');

    if (!table.label) {
      await queryInterface.addColumn('regions', 'label', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    await queryInterface.sequelize.query(`
      UPDATE regions
      SET label = CASE name
        WHEN 'west_bank' THEN 'الضفة الغربية'
        WHEN 'jerusalem' THEN 'القدس'
        WHEN 'inside' THEN 'الداخل'
        ELSE name
      END
      WHERE label IS NULL
    `);

    await queryInterface.changeColumn('regions', 'label', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('regions');

    if (table.label) {
      await queryInterface.removeColumn('regions', 'label');
    }
  },
};
