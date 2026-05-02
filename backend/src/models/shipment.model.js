'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Shipment extends Model {
    static associate(models) {
      Shipment.belongsTo(models.Order, {
        foreignKey: 'order_id',
        as: 'order',
      });
     Shipment.belongsTo(models.Employee, {
  foreignKey: 'driver_id',
  as: 'driver',
});
      Shipment.hasMany(models.TrackingUpdate, {
        foreignKey: 'shipment_id',
        as: 'tracking_updates',
      });
    }
  }

  Shipment.init(
    {
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      driver_id: {
  type: DataTypes.INTEGER,
  allowNull: true,
},
      tracking_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      current_status: {
        type: DataTypes.ENUM(
          'accepted',
          'picked_up',
          'in_transit',
          'arrived_to_destination_city',
          'out_for_delivery',
          'delivered',
          'returned',
          'cancelled'
        ),
        defaultValue: 'accepted',
      },
      estimated_delivery_date: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Shipment',
      tableName: 'shipments',
      underscored: true,
    }
  );

  return Shipment;
};
