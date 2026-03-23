const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RISItem = sequelize.define('RISItem', {
  id:                   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ris_id:               { type: DataTypes.INTEGER, allowNull: false },
  stock_no:             { type: DataTypes.STRING(20),  allowNull: true },
  unit:                 { type: DataTypes.STRING(30),  allowNull: true },
  description:          { type: DataTypes.STRING(255), allowNull: true },
  quantity_requisition: { type: DataTypes.INTEGER,     defaultValue: 0 },
  stock_available_yes:  { type: DataTypes.BOOLEAN,     defaultValue: false },
  stock_available_no:   { type: DataTypes.BOOLEAN,     defaultValue: false },
  quantity_issue:       { type: DataTypes.INTEGER,     defaultValue: 0 },
  remarks:              { type: DataTypes.STRING(255), allowNull: true },
  row_order:            { type: DataTypes.INTEGER,     defaultValue: 0 },
}, { tableName: 'ris_items', timestamps: true });

module.exports = RISItem;
