'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Supply extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Supply.init({
    sku: DataTypes.STRING,
    status: DataTypes.STRING,
    minimum: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Supply',
  });
  return Supply;
};