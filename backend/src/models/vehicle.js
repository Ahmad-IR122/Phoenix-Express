'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Vehicle extends Model {
    static associate(models) {
      Vehicle.belongsTo(models.Employee, {
        foreignKey: 'employee_id',
        as: 'employee',
      });
    }
  }

  Vehicle.init(
    {
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      brand: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      model: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      color: DataTypes.STRING,
      year: DataTypes.INTEGER,
      type: DataTypes.STRING,
      plate_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      vehicle_photo_url: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Vehicle',
      tableName: 'vehicles',
      underscored: true,
    }
  );

  return Vehicle;
};