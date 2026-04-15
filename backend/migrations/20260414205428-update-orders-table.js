'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('orders');

    if (table.employee_id) {
      await queryInterface.removeColumn('orders', 'employee_id');
    }

    if (table.pickup_location) {
      await queryInterface.removeColumn('orders', 'pickup_location');
    }

    if (table.delivery_location) {
      await queryInterface.removeColumn('orders', 'delivery_location');
    }

    if (table.package_type) {
      await queryInterface.removeColumn('orders', 'package_type');
    }

    if (table.distance_km) {
      await queryInterface.removeColumn('orders', 'distance_km');
    }

    if (table.price) {
      await queryInterface.removeColumn('orders', 'price');
    }

    if (table.scheduled_time_from) {
      await queryInterface.removeColumn('orders', 'scheduled_time_from');
    }

    if (table.scheduled_time_to) {
      await queryInterface.removeColumn('orders', 'scheduled_time_to');
    }

    if (table.accepted_at) {
      await queryInterface.removeColumn('orders', 'accepted_at');
    }

    if (!table.region_id) {
      await queryInterface.addColumn('orders', 'region_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'regions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      });
    }

    if (!table.sender_address) {
      await queryInterface.addColumn('orders', 'sender_address', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!table.receiver_address) {
      await queryInterface.addColumn('orders', 'receiver_address', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!table.origin_city) {
      await queryInterface.addColumn('orders', 'origin_city', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!table.destination_city) {
      await queryInterface.addColumn('orders', 'destination_city', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!table.delivery_speed) {
      await queryInterface.addColumn('orders', 'delivery_speed', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'normal',
      });
    }

    if (!table.declared_value) {
      await queryInterface.addColumn('orders', 'declared_value', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      });
    }

    if (!table.package_description) {
      await queryInterface.addColumn('orders', 'package_description', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    await queryInterface.changeColumn('orders', 'sender_phone', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn('orders', 'package_size', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    const refreshedTable = await queryInterface.describeTable('orders');

    // fix status safely using STRING instead of ENUM
    if (refreshedTable.status) {
      await queryInterface.renameColumn('orders', 'status', 'old_status');
    }

    await queryInterface.addColumn('orders', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'pending',
    });

    await queryInterface.sequelize.query(`
      UPDATE orders
      SET status = CASE
        WHEN old_status = 'available' THEN 'pending'
        WHEN old_status = 'accepted' THEN 'confirmed'
        WHEN old_status = 'in_progress' THEN 'in_transit'
        WHEN old_status = 'completed' THEN 'delivered'
        WHEN old_status = 'cancelled' THEN 'cancelled'
        ELSE 'pending'
      END
    `);

    await queryInterface.removeColumn('orders', 'old_status');
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('orders');

    if (table.status) {
      await queryInterface.renameColumn('orders', 'status', 'new_status');

      await queryInterface.addColumn('orders', 'status', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'available',
      });

      await queryInterface.sequelize.query(`
        UPDATE orders
        SET status = CASE
          WHEN new_status = 'pending' THEN 'available'
          WHEN new_status = 'confirmed' THEN 'accepted'
          WHEN new_status = 'picked_up' THEN 'in_progress'
          WHEN new_status = 'in_transit' THEN 'in_progress'
          WHEN new_status = 'delivered' THEN 'completed'
          WHEN new_status = 'cancelled' THEN 'cancelled'
          ELSE 'available'
        END
      `);

      await queryInterface.removeColumn('orders', 'new_status');
    }

    const refreshedTable = await queryInterface.describeTable('orders');

    if (refreshedTable.region_id) {
      await queryInterface.removeColumn('orders', 'region_id');
    }

    if (refreshedTable.sender_address) {
      await queryInterface.removeColumn('orders', 'sender_address');
    }

    if (refreshedTable.receiver_address) {
      await queryInterface.removeColumn('orders', 'receiver_address');
    }

    if (refreshedTable.origin_city) {
      await queryInterface.removeColumn('orders', 'origin_city');
    }

    if (refreshedTable.destination_city) {
      await queryInterface.removeColumn('orders', 'destination_city');
    }

    if (refreshedTable.delivery_speed) {
      await queryInterface.removeColumn('orders', 'delivery_speed');
    }

    if (refreshedTable.declared_value) {
      await queryInterface.removeColumn('orders', 'declared_value');
    }

    if (refreshedTable.package_description) {
      await queryInterface.removeColumn('orders', 'package_description');
    }
  },
};