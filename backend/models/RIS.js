const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RIS = sequelize.define('RIS', {
  id:                       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ris_no:                   { type: DataTypes.STRING(50),  allowNull: true },
  entity_name:              { type: DataTypes.STRING(200), allowNull: true },
  fund_cluster:             { type: DataTypes.STRING(100), allowNull: true },
  division:                 { type: DataTypes.STRING(100), allowNull: true },
  office:                   { type: DataTypes.STRING(100), allowNull: true },
  responsibility_center_code: { type: DataTypes.STRING(100), allowNull: true },
  purpose:                  { type: DataTypes.TEXT,        allowNull: true },
  status: {
    type: DataTypes.ENUM('draft','sent','received','ris_no_assigned'),
    defaultValue: 'draft',
  },
  employee_id:              { type: DataTypes.INTEGER,    allowNull: true },
  admin_department:         { type: DataTypes.STRING(100), allowNull: true },
  requested_by_name:        { type: DataTypes.STRING(150), allowNull: true },
  requested_by_designation: { type: DataTypes.STRING(100), allowNull: true },
  requested_by_date:        { type: DataTypes.DATEONLY,    allowNull: true },
  approved_by_name:         { type: DataTypes.STRING(150), allowNull: true },
  approved_by_designation:  { type: DataTypes.STRING(100), allowNull: true },
  approved_by_date:         { type: DataTypes.DATEONLY,    allowNull: true },
  issued_by_name:           { type: DataTypes.STRING(150), allowNull: true },
  issued_by_designation:    { type: DataTypes.STRING(100), allowNull: true },
  issued_by_date:           { type: DataTypes.DATEONLY,    allowNull: true },
  received_by_name:         { type: DataTypes.STRING(150), allowNull: true },
  received_by_designation:  { type: DataTypes.STRING(100), allowNull: true },
  received_by_date:         { type: DataTypes.DATEONLY,    allowNull: true },
}, { tableName: 'ris_forms', timestamps: true });

module.exports = RIS;
