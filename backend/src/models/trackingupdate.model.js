'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TrackingUpdate extends Model {
    static associate(models) {
      TrackingUpdate.belongsTo(models.Shipment, {
        foreignKey: 'shipment_id',
        as: 'shipment',
      });
    }
  }

  TrackingUpdate.init(
    {
      shipment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          'accepted',
          'picked_up',
          'in_transit',
          'arrived_to_destination_city',
          'out_for_delivery',
          'delivered'
        ),
        allowNull: false,
      },
      note: DataTypes.TEXT,
      current_location: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'TrackingUpdate',
      tableName: 'tracking_updates',
      underscored: true,
    }
  );

  return TrackingUpdate;
};