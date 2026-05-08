'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MerchantSettlement extends Model {
    static associate(models) {
      MerchantSettlement.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer',
      });
    }
  }

  MerchantSettlement.init(
    {
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'requested', 'settled'),
        allowNull: false,
        defaultValue: 'requested',
      },
      payment_method: {
        type: DataTypes.ENUM('cash', 'bank_transfer', 'ewallet'),
        allowNull: false,
        defaultValue: 'cash',
      },
      settled_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      requested_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      customer_confirmed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      bank_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bank_account_holder: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bank_account_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bank_iban: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'MerchantSettlement',
      tableName: 'merchant_settlements',
      underscored: true,
    }
  );

  return MerchantSettlement;
};
