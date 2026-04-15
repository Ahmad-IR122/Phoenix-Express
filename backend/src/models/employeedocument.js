'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EmployeeDocument extends Model {
    static associate(models) {
      EmployeeDocument.belongsTo(models.Employee, {
        foreignKey: 'employee_id',
        as: 'employee',
      });

      EmployeeDocument.belongsTo(models.Admin, {
        foreignKey: 'verified_by_admin_id',
        as: 'verified_by_admin',
      });
    }
  }

  EmployeeDocument.init(
    {
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      document_type: {
        type: DataTypes.ENUM(
          'driving_license',
          'vehicle_license',
          'vehicle_insurance',
          'national_id'
        ),
        allowNull: false,
      },
      file_url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      expiry_date: DataTypes.DATEONLY,
      status: {
        type: DataTypes.ENUM('valid', 'expiring_soon', 'expired'),
        defaultValue: 'valid',
      },
      verified_by_admin_id: DataTypes.INTEGER,
      verified_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'EmployeeDocument',
      tableName: 'employee_documents',
      underscored: true,
    }
  );

  return EmployeeDocument;
};