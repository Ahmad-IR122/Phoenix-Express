'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    static associate(models) {
      Customer.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });

      Customer.hasOne(models.IndividualCustomerProfile, {
        foreignKey: 'customer_id',
        as: 'individual_profile',
      });

      Customer.hasOne(models.CompanyCustomerProfile, {
        foreignKey: 'customer_id',
        as: 'company_profile',
      });

      Customer.hasMany(models.Order, {
        foreignKey: 'customer_id',
        as: 'orders',
      });

      Customer.hasMany(models.Feedback, {
        foreignKey: 'customer_id',
        as: 'feedbacks',
      });
    }
  }

  Customer.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      customer_type: {
        type: DataTypes.ENUM('individual', 'company'),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Customer',
      tableName: 'customers',
      underscored: true,
    }
  );

  return Customer;
};