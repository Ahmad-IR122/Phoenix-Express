'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('shipments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'orders',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      tracking_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      current_status: {
        type: Sequelize.ENUM(
          'accepted',
          'picked_up',
          'in_transit',
          'arrived_to_destination_city',
          'out_for_delivery',
          'delivered'
        ),
        allowNull: false,
        defaultValue: 'accepted',
      },
      estimated_delivery_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('shipments');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_shipments_current_status";');
  },
};