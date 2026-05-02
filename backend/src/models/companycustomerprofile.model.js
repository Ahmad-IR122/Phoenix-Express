'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CompanyCustomerProfile extends Model {
    static associate(models) {
      CompanyCustomerProfile.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer',
      });

      CompanyCustomerProfile.hasMany(models.Order, {
        foreignKey: 'customer_id',
        sourceKey: 'customer_id',
        as: 'orders',
      });
    }
  }

  CompanyCustomerProfile.init(
    {
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      company_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      company_phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      company_location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'CompanyCustomerProfile',
      tableName: 'company_customer_profiles',
      underscored: true,
    }
  );

  return CompanyCustomerProfile;
};
