'use strict';

module.exports = {
  async up(queryInterface) {
    const [legacyTables] = await queryInterface.sequelize.query(`
      SELECT to_regclass('"TrackingUpdates"') AS legacy_table,
             to_regclass('tracking_updates') AS canonical_table;
    `);

    const { legacy_table: legacyTable, canonical_table: canonicalTable } =
      legacyTables[0] || {};

    if (legacyTable && !canonicalTable) {
      await queryInterface.renameTable('TrackingUpdates', 'tracking_updates');
    }
  },

  async down(queryInterface) {
    const [tables] = await queryInterface.sequelize.query(`
      SELECT to_regclass('"TrackingUpdates"') AS legacy_table,
             to_regclass('tracking_updates') AS canonical_table;
    `);

    const { legacy_table: legacyTable, canonical_table: canonicalTable } =
      tables[0] || {};

    if (!legacyTable && canonicalTable) {
      await queryInterface.renameTable('tracking_updates', 'TrackingUpdates');
    }
  },
};
