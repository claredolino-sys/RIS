const { InventoryItem } = require('../models');

const CATEGORY_PREFIXES = {
  'Office Supplies':   'OF',
  'Janitorial':        'JA',
  'Medical':           'ME',
  'Technical':         'TE',
  'Electrical':        'EL',
  'Furniture':         'FU',
  'Computer':          'CO',
  'Food':              'FO',
  'Printing':          'PR',
  'Safety':            'SA',
  'Stationery':        'ST',
  'Cleaning':          'CL',
  'Hardware':          'HW',
  'Other':             'OT',
};

const getCategoryPrefix = (category) => {
  if (CATEGORY_PREFIXES[category]) return CATEGORY_PREFIXES[category];
  return category.replace(/[^A-Za-z]/g, '').substring(0, 2).toUpperCase() || 'OT';
};

const generateStockNo = async (category) => {
  const prefix = getCategoryPrefix(category);
  const existing = await InventoryItem.findAll({
    where: { category_prefix: prefix },
    order: [['id', 'DESC']],
    limit: 1,
  });

  let nextNum = 1;
  let nextCounter = 1;

  if (existing.length > 0) {
    const last = existing[0].stock_no;
    const parts = last.split('-');
    if (parts.length === 3) {
      nextNum     = parseInt(parts[1], 10);
      nextCounter = parseInt(parts[2], 10) + 1;
      if (nextCounter > 99) {
        nextNum++;
        nextCounter = 1;
      }
    }
  }

  const numStr     = String(nextNum).padStart(3, '0');
  const counterStr = String(nextCounter).padStart(2, '0');
  return `${prefix}-${numStr}-${counterStr}`;
};

module.exports = { generateStockNo, getCategoryPrefix, CATEGORY_PREFIXES };
