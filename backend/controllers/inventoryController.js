const { InventoryItem } = require('../models');
const { generateStockNo, getCategoryPrefix, CATEGORY_PREFIXES } = require('../utils/stockNoGenerator');
const XLSX = require('xlsx');
const { Op } = require('sequelize');
const path = require('path');

exports.getAll = async (req, res) => {
  try {
    const { search, category, status } = req.query;
    const where = {};
    if (search)              where.description = { [Op.like]: `%${search}%` };
    if (category)            where.category    = category;
    if (status === 'available') where.is_available = true;
    if (status === 'out')       where.is_available = false;
    const items = await InventoryItem.findAll({
      where,
      order: [['description', 'ASC']],
    });
    res.json(items);
  } catch (err) {
    console.error('[INVENTORY getAll]', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const item = await InventoryItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCategories = async (req, res) => {
  res.json(Object.keys(CATEGORY_PREFIXES));
};

exports.create = async (req, res) => {
  try {
    const { description, category, unit, quantity } = req.body;
    if (!description || !category || !unit)
      return res.status(400).json({ message: 'Description, category, and unit are required' });

    const stock_no = await generateStockNo(category);
    const prefix   = getCategoryPrefix(category);
    const qty      = parseInt(quantity) || 0;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const item = await InventoryItem.create({
      stock_no,
      description: description.trim(),
      category,
      category_prefix: prefix,
      unit,
      quantity: qty,
      image_url,
      is_available: qty > 0,
      created_by: req.user.id,
    });
    res.status(201).json(item);
  } catch (err) {
    console.error('[INVENTORY create]', err);
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const item = await InventoryItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const { description, unit, quantity, category } = req.body;
    const qty = parseInt(quantity);
    const image_url = req.file ? `/uploads/${req.file.filename}` : item.image_url;

    await item.update({
      description: description?.trim() || item.description,
      unit:        unit        || item.unit,
      quantity:    isNaN(qty)  ? item.quantity : qty,
      category:    category    || item.category,
      image_url,
      is_available: isNaN(qty) ? item.is_available : qty > 0,
    });
    res.json(item);
  } catch (err) {
    console.error('[INVENTORY update]', err);
    res.status(500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await InventoryItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    await item.destroy();
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.parseExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const wb   = XLSX.readFile(req.file.path);
    const ws   = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws);

    if (rows.length === 0)
      return res.status(400).json({ message: 'Excel file is empty or has no valid rows' });

    const preview = rows
      .map(r => ({
        description: String(r['Description'] || r['description'] || '').trim(),
        category:    String(r['Category']    || r['category']    || 'Other').trim(),
        unit:        String(r['Unit']        || r['unit']        || 'pc').trim(),
        quantity:    parseInt(r['Quantity']  || r['quantity']    || 0),
        image_url:   String(r['Image URL']   || r['image_url']   || '').trim() || null,
      }))
      .filter(r => r.description.length > 0);

    res.json({ preview, total: preview.length });
  } catch (err) {
    console.error('[INVENTORY parseExcel]', err);
    res.status(500).json({ message: 'Failed to parse Excel file: ' + err.message });
  }
};

exports.confirmUpload = async (req, res) => {
  try {
    const { items, overwrite } = req.body;
    if (!items || !Array.isArray(items))
      return res.status(400).json({ message: 'No items provided' });

    const results = { created: 0, updated: 0, skipped: 0, errors: [] };

    for (const row of items) {
      try {
        if (!row.description) { results.skipped++; continue; }

        const existing = await InventoryItem.findOne({
          where: { description: row.description },
        });

        if (existing) {
          if (overwrite) {
            await existing.update({
              unit:     row.unit,
              quantity: row.quantity || 0,
              category: row.category,
              is_available: (row.quantity || 0) > 0,
            });
            results.updated++;
          } else {
            results.skipped++;
          }
          continue;
        }

        const stock_no = await generateStockNo(row.category);
        const prefix   = getCategoryPrefix(row.category);
        await InventoryItem.create({
          stock_no,
          description:     row.description,
          category:        row.category,
          category_prefix: prefix,
          unit:            row.unit,
          quantity:        row.quantity || 0,
          image_url:       row.image_url || null,
          is_available:    (row.quantity || 0) > 0,
          created_by:      req.user.id,
        });
        results.created++;
      } catch (e) {
        results.errors.push(`"${row.description}": ${e.message}`);
      }
    }

    res.json(results);
  } catch (err) {
    console.error('[INVENTORY confirmUpload]', err);
    res.status(500).json({ message: err.message });
  }
};

exports.downloadTemplate = async (req, res) => {
  try {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Description', 'Category', 'Unit', 'Quantity', 'Image URL'],
      ['Ballpen, Black, 0.5mm',     'Office Supplies', 'pc',   100, ''],
      ['Bond Paper, A4, 80gsm',     'Office Supplies', 'ream',  50, ''],
      ['Stapler, Heavy Duty',        'Office Supplies', 'pc',   20, ''],
      ['Folder, Long, Brown',        'Office Supplies', 'pc',  200, ''],
      ['Mop Head, Cotton',           'Janitorial',      'pc',   15, ''],
      ['Bleach, 1L',                 'Janitorial',      'bottle', 30, ''],
    ]);

    ws['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 30 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Items');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=inventory_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
