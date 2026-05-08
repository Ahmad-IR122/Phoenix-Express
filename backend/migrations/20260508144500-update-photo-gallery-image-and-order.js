'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('photo_galleries', 'image_url', {
      type: Sequelize.TEXT,
      allowNull: false,
    });

    await queryInterface.addColumn('photo_galleries', 'display_order', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('photo_galleries', 'display_order');

    await queryInterface.changeColumn('photo_galleries', 'image_url', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
