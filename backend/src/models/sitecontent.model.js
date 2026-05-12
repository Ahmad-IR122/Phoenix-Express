'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SiteContent extends Model {
    static associate() {}
  }

  SiteContent.init(
    {
      page_key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      content: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
    },
    {
      sequelize,
      modelName: 'SiteContent',
      tableName: 'site_contents',
      underscored: true,
    }
  );

  return SiteContent;
};
