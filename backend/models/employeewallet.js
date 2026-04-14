'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EmployeeWallet extends Model {
    static associate(models) {
      EmployeeWallet.belongsTo(models.Employee, {
        foreignKey: 'employee_id',
        as: 'employee',
      });

      EmployeeWallet.hasMany(models.WalletTransaction, {
        foreignKey: 'wallet_id',
        as: 'transactions',
      });
    }
  }

  EmployeeWallet.init(
    {
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      available_balance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      total_earnings: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'EmployeeWallet',
      tableName: 'employee_wallets',
      underscored: true,
    }
  );

  return EmployeeWallet;
};