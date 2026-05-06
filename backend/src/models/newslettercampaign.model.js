'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class NewsletterCampaign extends Model {
    static associate(models) {
      NewsletterCampaign.belongsTo(models.User, {
        foreignKey: 'employee_user_id',
        as: 'employee_user',
      });
    }
  }

  NewsletterCampaign.init(
    {
      employee_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      recipients_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      sent_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'NewsletterCampaign',
      tableName: 'newsletter_campaigns',
      underscored: true,
    }
  );

  return NewsletterCampaign;
};
