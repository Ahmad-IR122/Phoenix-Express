'use strict';

module.exports = {
  async up(queryInterface) {
    const table = await queryInterface.describeTable('tracking_updates');

    if (table.created_at && !table.createdAt) {
      await queryInterface.renameColumn('tracking_updates', 'created_at', 'createdAt');
    }

    if (table.updated_at && !table.updatedAt) {
      await queryInterface.renameColumn('tracking_updates', 'updated_at', 'updatedAt');
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('tracking_updates');

    if (table.createdAt && !table.created_at) {
      await queryInterface.renameColumn('tracking_updates', 'createdAt', 'created_at');
    }

    if (table.updatedAt && !table.updated_at) {
      await queryInterface.renameColumn('tracking_updates', 'updatedAt', 'updated_at');
    }
  },
};
