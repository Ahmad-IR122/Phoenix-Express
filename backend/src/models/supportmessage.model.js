'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SupportMessage extends Model {
    static associate(models) {
      SupportMessage.belongsTo(models.SupportConversation, {
        foreignKey: 'conversation_id',
        as: 'conversation',
      });

      SupportMessage.belongsTo(models.User, {
        foreignKey: 'sender_user_id',
        as: 'sender',
      });
    }
  }

  SupportMessage.init(
    {
      conversation_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      sender_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      sender_role: {
        type: DataTypes.ENUM('customer', 'employee'),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      read_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'SupportMessage',
      tableName: 'support_messages',
      underscored: true,
    }
  );

  return SupportMessage;
};
