'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.Admin, { foreignKey: 'user_id', as: 'admin' });
      User.hasOne(models.Customer, { foreignKey: 'user_id', as: 'customer' });
      User.hasOne(models.Employee, { foreignKey: 'user_id', as: 'employee' });
    }

    toJSON() {
      const values = { ...this.get() };
      delete values.password;
      return values;
    }
  }

  User.init(
    {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: 'هذا البريد الإلكتروني مستخدم بالفعل'
        },
        validate: {
          isEmail: { msg: 'يرجى إدخال بريد إلكتروني صحيح' },
          notEmpty: { msg: 'البريد الإلكتروني لا يمكن أن يكون فارغاً' }
        },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: 'رقم الهاتف هذا مسجل مسبقاً'
        },
        validate: {
          notEmpty: { msg: 'رقم الهاتف مطلوب' },
          is: {
            args: /^[0-9]{7,15}$/,
            msg: 'رقم الهاتف غير صحيح، يجب أن يحتوي على أرقام فقط'
          }
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'كلمة المرور مطلوبة' },
          len: {
            args: [8, 100],
            msg: 'كلمة المرور يجب أن لا تقل عن 8 خانات'
          }
        },
      },
      role: {
        type: DataTypes.ENUM('admin', 'employee', 'customer', 'company'),
        allowNull: false,
        validate: {
          isIn: {
            args: [['admin', 'employee', 'customer', 'company']],
            msg: 'نوع الحساب غير معروف'
          }
        }
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      underscored: true,
      hooks: {
        beforeSave: async (user) => {
          if (user.changed('password')) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
    }
  );

  return User;
};