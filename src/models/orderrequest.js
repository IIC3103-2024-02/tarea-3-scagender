'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class OrderRequest extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  OrderRequest.init({
    orderId: DataTypes.STRING,
    status: DataTypes.STRING,
    sku: DataTypes.STRING,
    quantity: DataTypes.INTEGER,
    createdAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'OrderRequest',
  });
  return OrderRequest;
};