const { RIS, RISItem, User, InventoryItem } = require('../models');
const { Op } = require('sequelize');

const ALLOWED_FIELDS = [
  'entity_name','fund_cluster','division','office','responsibility_center_code',
  'purpose','ris_no','admin_department',
  'requested_by_name','requested_by_designation','requested_by_date',
  'approved_by_name','approved_by_designation','approved_by_date',
  'issued_by_name','issued_by_designation','issued_by_date',
  'received_by_name','received_by_designation','received_by_date',
];

const cleanForm = (formData = {}) => {
  const clean = {};
  ALLOWED_FIELDS.forEach(k => { if (formData[k] !== undefined) clean[k] = formData[k] || null; });
  return clean;
};

const cleanItems = (items = [], ris_id) =>
  items
    .filter(it => it && it.description)
    .map((it, i) => ({
      ris_id,
      stock_no:             it.stock_no             || null,
      unit:                 it.unit                 || null,
      description:          it.description          || null,
      quantity_requisition: parseInt(it.quantity_requisition) || 0,
      stock_available_yes:  !!it.stock_available_yes,
      stock_available_no:   !!it.stock_available_no,
      quantity_issue:       parseInt(it.quantity_issue) || 0,
      remarks:              it.remarks              || null,
      row_order:            i,
    }));

exports.saveGuest = async (req, res) => {
  try {
    const { formData = {}, items = [] } = req.body;
    const ris = await RIS.create({ ...cleanForm(formData), status: 'draft', employee_id: null });
    const risItems = cleanItems(items, ris.id);
    if (risItems.length > 0) await RISItem.bulkCreate(risItems);
    res.status(201).json({ id: ris.id });
  } catch (err) {
    console.error('[RIS saveGuest]', err);
    res.status(500).json({ message: err.message });
  }
};

exports.claimRIS = async (req, res) => {
  try {
    const { ris_id } = req.body;
    if (!ris_id) return res.status(400).json({ message: 'ris_id is required' });
    const ris = await RIS.findByPk(ris_id);
    if (!ris)            return res.status(404).json({ message: 'RIS not found' });
    if (ris.employee_id) return res.status(400).json({ message: 'RIS already claimed' });
    await ris.update({ employee_id: req.user.id, admin_department: req.user.department });
    res.json({ success: true, ris });
  } catch (err) {
    console.error('[RIS claimRIS]', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getMyRIS = async (req, res) => {
  try {
    const list = await RIS.findAll({
      where: { employee_id: req.user.id },
      include: [{ model: RISItem, as: 'items', order: [['row_order', 'ASC']] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(list);
  } catch (err) {
    console.error('[RIS getMyRIS]', err);
    res.status(500).json({ message: err.message });
  }
};

exports.createDirect = async (req, res) => {
  try {
    const { formData = {}, items = [] } = req.body;
    const ris = await RIS.create({
      ...cleanForm(formData),
      status:           'draft',
      employee_id:      req.user.id,
      admin_department: req.user.department,
    });
    const risItems = cleanItems(items, ris.id);
    if (risItems.length > 0) await RISItem.bulkCreate(risItems);
    const full = await RIS.findByPk(ris.id, {
      include: [{ model: RISItem, as: 'items', order: [['row_order', 'ASC']] }],
    });
    res.status(201).json(full);
  } catch (err) {
    console.error('[RIS createDirect]', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const ris = await RIS.findByPk(req.params.id, {
      include: [
        { model: RISItem, as: 'items', order: [['row_order', 'ASC']] },
        { model: User,    as: 'employee', attributes: ['full_name','employee_id','department','designation'] },
      ],
    });
    if (!ris) return res.status(404).json({ message: 'RIS not found' });

    const isOwner = ris.employee_id === req.user.id;
    const isAdmin = ['admin','admin_administrative','superadmin'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    res.json(ris);
  } catch (err) {
    console.error('[RIS getOne]', err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateRIS = async (req, res) => {
  try {
    const ris = await RIS.findByPk(req.params.id);
    if (!ris) return res.status(404).json({ message: 'RIS not found' });
    if (ris.employee_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    if (ris.status !== 'draft') return res.status(400).json({ message: 'Only draft RIS can be edited' });

    const { formData = {}, items = [] } = req.body;
    await ris.update(cleanForm(formData));
    await RISItem.destroy({ where: { ris_id: ris.id } });
    const risItems = cleanItems(items, ris.id);
    if (risItems.length > 0) await RISItem.bulkCreate(risItems);

    const full = await RIS.findByPk(ris.id, {
      include: [{ model: RISItem, as: 'items', order: [['row_order', 'ASC']] }],
    });
    res.json(full);
  } catch (err) {
    console.error('[RIS updateRIS]', err);
    res.status(500).json({ message: err.message });
  }
};

exports.sendRIS = async (req, res) => {
  try {
    const ris = await RIS.findByPk(req.params.id);
    if (!ris) return res.status(404).json({ message: 'RIS not found' });
    if (ris.employee_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    const admin = await User.findOne({
      where: {
        department: req.user.department,
        role:       { [Op.in]: ['admin','admin_administrative'] },
        is_active:  true,
      },
    });

    await ris.update({
      status:           'sent',
      admin_department: req.user.department,
    });

    res.json({
      message:    'RIS sent successfully',
      admin_name: admin ? admin.full_name : 'Department Admin',
    });
  } catch (err) {
    console.error('[RIS sendRIS]', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getAdminInbox = async (req, res) => {
  try {
    const where = { status: { [Op.in]: ['sent','received','ris_no_assigned'] } };
    if (req.user.role !== 'superadmin') {
      where.admin_department = req.user.department;
    }
    const list = await RIS.findAll({
      where,
      include: [
        { model: RISItem, as: 'items', order: [['row_order', 'ASC']] },
        { model: User,    as: 'employee', attributes: ['full_name','employee_id','department','designation'] },
      ],
      order: [['updatedAt', 'DESC']],
    });
    res.json(list);
  } catch (err) {
    console.error('[RIS getAdminInbox]', err);
    res.status(500).json({ message: err.message });
  }
};

exports.markReceived = async (req, res) => {
  try {
    const ris = await RIS.findByPk(req.params.id);
    if (!ris) return res.status(404).json({ message: 'RIS not found' });
    await ris.update({ status: 'received' });
    res.json({ success: true, status: 'received' });
  } catch (err) {
    console.error('[RIS markReceived]', err);
    res.status(500).json({ message: err.message });
  }
};

exports.assignRISNo = async (req, res) => {
  try {
    const { ris_no } = req.body;
    if (!ris_no || !ris_no.trim())
      return res.status(400).json({ message: 'RIS number is required' });

    const ris = await RIS.findByPk(req.params.id);
    if (!ris) return res.status(404).json({ message: 'RIS not found' });

    await ris.update({ ris_no: ris_no.trim(), status: 'ris_no_assigned' });
    res.json({ success: true, ris_no: ris_no.trim() });
  } catch (err) {
    console.error('[RIS assignRISNo]', err);
    res.status(500).json({ message: err.message });
  }
};
