'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class WithdrawalRequest extends Model {
    static associate(models) {
      WithdrawalRequest.belongsTo(models.Employee, {
        foreignKey: 'employee_id',
        as: 'employee',
      });
    }
  }

  WithdrawalRequest.init(
    {
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      withdrawal_method: {
        type: DataTypes.ENUM('bank_transfer', 'cash', 'ewallet'),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'paid'),
        allowNull: false,
        defaultValue: 'pending',
      },
      requested_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      processed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'WithdrawalRequest',
      tableName: 'withdrawal_requests',
      underscored: true,
      hooks: {
        afterUpdate: async (request, options) => {
          if (!request.changed('status') || request.status !== 'paid') {
            return;
          }

          const wallet = await sequelize.models.EmployeeWallet.findOne({
            where: { employee_id: request.employee_id },
            transaction: options.transaction,
          });

          if (!wallet) {
            return;
          }

          const existingHandover = await sequelize.models.WalletTransaction.findOne({
            where: {
              wallet_id: wallet.id,
              transaction_type: 'handover',
              description: `تسليم مبالغ للشركة - طلب #${request.id}`,
            },
            transaction: options.transaction,
          });

          if (existingHandover) {
            return;
          }

          await wallet.update(
            {
              available_balance: Number(wallet.available_balance || 0) - Number(request.amount || 0),
            },
            { transaction: options.transaction }
          );

          await sequelize.models.WalletTransaction.create(
            {
              wallet_id: wallet.id,
              order_id: null,
              transaction_type: 'handover',
              amount: -Math.abs(Number(request.amount || 0)),
              description: `تسليم مبالغ للشركة - طلب #${request.id}`,
            },
            { transaction: options.transaction }
          );
        },
      },
    }
  );

  return WithdrawalRequest;
};
