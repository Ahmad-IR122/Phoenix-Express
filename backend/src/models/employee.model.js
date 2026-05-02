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
      },
      availability_status: {
        type: DataTypes.ENUM('available', 'busy', 'offline'),
        allowNull: false,
        defaultValue: 'available',
      },
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
