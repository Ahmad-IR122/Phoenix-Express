'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class IndividualCustomerProfile extends Model {
    static associate(models) {
      IndividualCustomerProfile.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer',
      });
    }
  }

  IndividualCustomerProfile.init(
    {
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      full_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'IndividualCustomerProfile',
      tableName: 'individual_customer_profiles',
      underscored: true,
    }
  );

  return IndividualCustomerProfile;
};