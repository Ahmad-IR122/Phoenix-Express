'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SupportConversation extends Model {
    static associate(models) {
      SupportConversation.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer',
      });

      SupportConversation.belongsTo(models.User, {
        foreignKey: 'customer_user_id',
        as: 'customer_user',
      });

      SupportConversation.belongsTo(models.Employee, {
        foreignKey: 'assigned_employee_id',
        as: 'assigned_employee',
      });

      SupportConversation.hasMany(models.SupportMessage, {
        foreignKey: 'conversation_id',
        as: 'messages',
      });
    }
  }

  SupportConversation.init(
    {
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      customer_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      assigned_employee_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('open', 'answered', 'closed'),
        allowNull: false,
        defaultValue: 'open',
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'محادثة دعم',
      },
      employee_hidden_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'SupportConversation',
      tableName: 'support_conversations',
      underscored: true,
    }
  );

  return SupportConversation;
};
