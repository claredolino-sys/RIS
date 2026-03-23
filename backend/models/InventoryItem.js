const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryItem = sequelize.define('InventoryItem', {
  id:              { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  stock_no:        { type: DataTypes.STRING(20),  allowNull: false, unique: true },
  description:     { type: DataTypes.STRING(255), allowNull: false },
  category:        { type: DataTypes.STRING(100), allowNull: false },
  category_prefix: { type: DataTypes.STRING(2),   allowNull: false },
  unit:            { type: DataTypes.STRING(30),  allowNull: false },
  quantity:        { type: DataTypes.INTEGER,     defaultValue: 0 },
  image_url:       { type: DataTypes.STRING(500), allowNull: true },
  is_available:    { type: DataTypes.BOOLEAN,     defaultValue: false },
  created_by:      { type: DataTypes.INTEGER,     allowNull: true },
}, { tableName: 'inventory_items', timestamps: true });

module.exports = InventoryItem;
