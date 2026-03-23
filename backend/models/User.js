const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  employee_id:  { type: DataTypes.STRING(50),  allowNull: false, unique: true },
  full_name:    { type: DataTypes.STRING(150), allowNull: false },
  email:        { type: DataTypes.STRING(150), allowNull: true },
  password:     { type: DataTypes.STRING(255), allowNull: false },
  role:         { type: DataTypes.ENUM('superadmin','admin','admin_administrative','employee'), defaultValue: 'employee' },
  department:   { type: DataTypes.STRING(100), allowNull: true },
  division:     { type: DataTypes.STRING(100), allowNull: true },
  office:       { type: DataTypes.STRING(100), allowNull: true },
  designation:  { type: DataTypes.STRING(100), allowNull: true },
  is_active:    { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'users', timestamps: true });

module.exports = User;
