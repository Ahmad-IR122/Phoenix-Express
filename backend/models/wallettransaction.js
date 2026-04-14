'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class WalletTransaction extends Model {
    static associate(models) {
      WalletTransaction.belongsTo(models.EmployeeWallet, {
        foreignKey: 'wallet_id',
        as: 'wallet',
      });

      WalletTransaction.belongsTo(models.Order, {
        foreignKey: 'order_id',
        as: 'order',
      });
    }
  }

  WalletTransaction.init(
    {
      wallet_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      transaction_type: {
        type: DataTypes.ENUM('earning', 'withdrawal', 'adjustment'),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      description: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: 'WalletTransaction',
      tableName: 'wallet_transactions',
      underscored: true,
    }
  );

  return WalletTransaction;
};