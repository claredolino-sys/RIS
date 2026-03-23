const sequelize = require('../config/database');
const User          = require('./User');
const InventoryItem = require('./InventoryItem');
const RIS           = require('./RIS');
const RISItem       = require('./RISItem');
const Report        = require('./Report');

RIS.hasMany(RISItem, { foreignKey: 'ris_id', as: 'items', onDelete: 'CASCADE' });
RISItem.belongsTo(RIS, { foreignKey: 'ris_id' });

RIS.belongsTo(User, { foreignKey: 'employee_id', as: 'employee' });
User.hasMany(RIS,  { foreignKey: 'employee_id' });

InventoryItem.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

module.exports = { sequelize, User, InventoryItem, RIS, RISItem, Report };
