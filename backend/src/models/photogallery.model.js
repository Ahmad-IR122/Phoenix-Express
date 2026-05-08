'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PhotoGallery extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  PhotoGallery.init({
    name: DataTypes.STRING,
    image_url: DataTypes.TEXT,
    description: DataTypes.TEXT,
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_visible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    sequelize,
    modelName: 'PhotoGallery',
    tableName: 'photo_galleries',
    underscored: true,
  });
  return PhotoGallery;
};
