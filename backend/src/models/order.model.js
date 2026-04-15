'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer',
      });

      Order.belongsTo(models.Region, {
        foreignKey: 'region_id',
        as: 'region',
      });

      Order.hasOne(models.Shipment, {
        foreignKey: 'order_id',
        as: 'shipment',
      });
    }
  }

  Order.init(
    {
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      region_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      sender_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      sender_phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      sender_address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      receiver_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      receiver_phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      receiver_address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      origin_city: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      destination_city: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      package_size: {
        type: DataTypes.ENUM('small', 'medium', 'large'),
        allowNull: false,
      },

      delivery_speed: {
        type: DataTypes.ENUM('normal', 'urgent', 'express'),
        allowNull: false,
        defaultValue: 'normal',
      },

      is_fragile: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      declared_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },

      package_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

     status: {
  type: DataTypes.STRING,
  allowNull: false,
  defaultValue: 'pending',
},

      delivered_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Order',
      tableName: 'orders',
      underscored: true,
    }
  );

  return Order;
};