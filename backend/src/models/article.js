'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Article extends Model {
    static associate() {}
  }

  Article.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category: DataTypes.STRING,
      description: DataTypes.TEXT,
      published_date: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Article',
      tableName: 'articles',
      underscored: true,
    }
  );

  return Article;
};