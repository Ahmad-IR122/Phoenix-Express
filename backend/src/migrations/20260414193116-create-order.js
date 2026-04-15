'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'employees',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      sender_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      sender_phone: {
        type: Sequelize.STRING
      },
      pickup_location: {
        type: Sequelize.STRING,
        allowNull: false
      },
      delivery_location: {
        type: Sequelize.STRING,
        allowNull: false
      },
      receiver_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      receiver_phone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      package_type: {
        type: Sequelize.STRING
      },
      package_size: {
        type: Sequelize.STRING
      },
      is_fragile: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      distance_km: {
        type: Sequelize.FLOAT
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      scheduled_time_from: {
        type: Sequelize.DATE
      },
      scheduled_time_to: {
        type: Sequelize.DATE
      },
      status: {
        type: Sequelize.ENUM(
          'available',
          'accepted',
          'in_progress',
          'completed',
          'cancelled'
        ),
        allowNull: false,
        defaultValue: 'available'
      },
      accepted_at: {
        type: Sequelize.DATE
      },
      delivered_at: {
        type: Sequelize.DATE
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('orders');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_orders_status";'
    );
  }
};