'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Feedback extends Model {
    static associate(models) {
      Feedback.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer',
      });

    }
  }

  Feedback.init(
    {
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      customer_location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      comment: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: 'Feedback',
      tableName: 'feedback',
      underscored: true,
    }
  );

  return Feedback;
};
