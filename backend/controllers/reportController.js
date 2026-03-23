const { Report, InventoryItem, RIS, RISItem } = require('../models');
const { Op }  = require('sequelize');
const XLSX    = require('xlsx');

const getPeriodDates = (type, year, month, quarter, semester) => {
  const y = parseInt(year) || new Date().getFullYear();
  let start, end, label;

  if (type === 'monthly') {
    const m = (parseInt(month) || new Date().getMonth() + 1) - 1;
    start = new Date(y, m, 1);
    end   = new Date(y, m + 1, 0);
    label = `${start.toLocaleString('default', { month: 'long' })} ${y}`;
  } else if (type === 'quarterly') {
    const q = parseInt(quarter) || Math.ceil((new Date().getMonth() + 1) / 3);
    const qMap = { 1: [0,2], 2: [3,5], 3: [6,8], 4: [9,11] };
    start = new Date(y, qMap[q][0], 1);
    end   = new Date(y, qMap[q][1] + 1, 0);
    label = `Q${q} ${y}`;
  } else if (type === 'semestral') {
    const s = parseInt(semester) || (new Date().getMonth() < 6 ? 1 : 2);
    start = s === 1 ? new Date(y, 0,  1) : new Date(y, 6,  1);
    end   = s === 1 ? new Date(y, 5, 30) : new Date(y, 11, 31);
    label = `${s === 1 ? '1st' : '2nd'} Semester ${y}`;
  } else { // yearly
    start = new Date(y, 0,  1);
    end   = new Date(y, 11, 31);
    label = `Year ${y}`;
  }

  return {
    start: start.toISOString().split('T')[0],
    end:   end.toISOString().split('T')[0],
    label,
  };
};

const buildReportData = async (start, end, department) => {
  const allItems = await InventoryItem.findAll({
    order: [['category','ASC'],['description','ASC']],
  });

  const risWhere = {
    status:    { [Op.in]: ['sent','received','ris_no_assigned'] },
    createdAt: { [Op.between]: [new Date(start + 'T00:00:00'), new Date(end + 'T23:59:59')] },
  };
  if (department) risWhere.admin_department = department;

  const risItems = await RISItem.findAll({
    include: [{ model: RIS, required: true, where: risWhere }],
  });

  const issuedMap = {};
  for (const ri of risItems) {
    if (ri.stock_no) {
      issuedMap[ri.stock_no] = (issuedMap[ri.stock_no] || 0) + (ri.quantity_issue || 0);
    }
  }

  return allItems.map(item => ({
    stock_no:      item.stock_no,
    description:   item.description,
    category:      item.category,
    unit:          item.unit,
    opening_qty:   item.quantity,
    issued_qty:    issuedMap[item.stock_no] || 0,
    remaining_qty: item.quantity - (issuedMap[item.stock_no] || 0),
    status:        item.is_available ? 'Available' : 'Out of Stock',
  }));
};

exports.generate = async (req, res) => {
  try {
    const { type, year, month, quarter, semester } = req.body;
    if (!type) return res.status(400).json({ message: 'Report type is required' });

    const { start, end, label } = getPeriodDates(type, year, month, quarter, semester);
    const department = req.user.role !== 'superadmin' ? req.user.department : (req.body.department || null);
    const data = await buildReportData(start, end, department);

    const report = await Report.create({
      report_type:  type,
      period_label: label,
      period_start: start,
      period_end:   end,
      department,
      generated_by: req.user.id,
      is_auto:      false,
      report_data:  JSON.stringify(data),
    });

    res.status(201).json({ ...report.toJSON(), data });
  } catch (err) {
    console.error('[REPORT generate]', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const where = {};
    if (req.user.role !== 'superadmin') where.department = req.user.department;
    const reports = await Report.findAll({ where, order: [['createdAt','DESC']] });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    const data = JSON.parse(report.report_data || '[]');
    res.json({ ...report.toJSON(), data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.downloadExcel = async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const data = JSON.parse(report.report_data || '[]');
    const rows = [
      [`INVENTORY QUANTITY REPORT — ${report.period_label}`],
      [`Department: ${report.department || 'All'}`],
      [`Generated: ${new Date(report.createdAt).toLocaleString()}`],
      [],
      ['Stock No.','Description','Category','Unit','Opening Qty','Issued Qty','Remaining Qty','Status'],
      ...data.map(d => [d.stock_no, d.description, d.category, d.unit, d.opening_qty, d.issued_qty, d.remaining_qty, d.status]),
      [],
      ['TOTALS','','','',
        data.reduce((a,b) => a + b.opening_qty, 0),
        data.reduce((a,b) => a + b.issued_qty, 0),
        data.reduce((a,b) => a + b.remaining_qty, 0),
        '',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch:14 },{wch:35 },{wch:20 },{wch:8 },{wch:12 },{wch:12 },{wch:14 },{wch:14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const filename = `Report_${report.period_label.replace(/[ /]/g,'_')}_${report.department || 'All'}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    console.error('[REPORT downloadExcel]', err);
    res.status(500).json({ message: err.message });
  }
};

exports.autoGenerate = async () => {
  try {
    const now   = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth() + 1;

    const tasks = [];

    tasks.push({ type: 'monthly', year, month });

    if ([1,4,7,10].includes(month)) {
      const q      = Math.ceil(month / 3);
      const prevQ  = q === 1 ? 4 : q - 1;
      const prevYr = q === 1 ? year - 1 : year;
      tasks.push({ type: 'quarterly', year: prevYr, quarter: prevQ });
    }

    if (month === 7) tasks.push({ type: 'semestral', year, semester: 1 });
    if (month === 1) tasks.push({ type: 'semestral', year: year - 1, semester: 2 });

    if (month === 1) tasks.push({ type: 'yearly', year: year - 1 });

    for (const task of tasks) {
      const { start, end, label } = getPeriodDates(task.type, task.year, task.month, task.quarter, task.semester);
      const data = await buildReportData(start, end, null);
      await Report.create({
        report_type: task.type, period_label: label,
        period_start: start, period_end: end,
        department: null, generated_by: null,
        is_auto: true, report_data: JSON.stringify(data),
      });
      console.log(`[CRON] Auto-generated ${task.type} report: ${label}`);
    }
  } catch (err) {
    console.error('[CRON autoGenerate]', err);
  }
};
