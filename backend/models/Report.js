const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
  id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  report_type:  { type: DataTypes.ENUM('monthly','quarterly','semestral','yearly'), allowNull: false },
  period_label: { type: DataTypes.STRING(50),  allowNull: false },
  period_start: { type: DataTypes.DATEONLY,    allowNull: false },
  period_end:   { type: DataTypes.DATEONLY,    allowNull: false },
  department:   { type: DataTypes.STRING(100), allowNull: true },
  generated_by: { type: DataTypes.INTEGER,     allowNull: true },
  is_auto:      { type: DataTypes.BOOLEAN,     defaultValue: false },
  report_data:  { type: DataTypes.TEXT('long'), allowNull: true },
}, { tableName: 'reports', timestamps: true });

module.exports = Report;
