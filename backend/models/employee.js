'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Employee extends Model {
    static associate(models) {
      Employee.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });

      Employee.hasOne(models.Vehicle, {
        foreignKey: 'employee_id',
        as: 'vehicle',
      });

      Employee.hasMany(models.EmployeeDocument, {
        foreignKey: 'employee_id',
        as: 'documents',
      });

      Employee.hasMany(models.Order, {
        foreignKey: 'employee_id',
        as: 'orders',
      });

      Employee.hasMany(models.Feedback, {
        foreignKey: 'employee_id',
        as: 'feedbacks',
      });

      Employee.hasOne(models.EmployeeWallet, {
        foreignKey: 'employee_id',
        as: 'wallet',
      });

      Employee.hasMany(models.WithdrawalRequest, {
        foreignKey: 'employee_id',
        as: 'withdrawal_requests',
      });
    }
  }

  Employee.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      full_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: DataTypes.STRING,
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      }
    },
    {
      sequelize,
      modelName: 'Employee',
      tableName: 'employees',
      underscored: true,
    }
  );

  return Employee;
};