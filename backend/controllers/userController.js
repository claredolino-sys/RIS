const bcrypt   = require('bcryptjs');
const { User } = require('../models');
const { Op }   = require('sequelize');

const safeUser = (u) => {
  const obj = u.toJSON ? u.toJSON() : { ...u };
  delete obj.password;
  return obj;
};

exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await User.findAll({
      where:      { role: { [Op.in]: ['admin','admin_administrative','superadmin'] } },
      attributes: { exclude: ['password'] },
      order:      [['full_name','ASC']],
    });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await User.findAll({
      where:      { role: 'employee' },
      attributes: { exclude: ['password'] },
      order:      [['full_name','ASC']],
    });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { employee_id, full_name, email, password, department, division, office, designation, role } = req.body;
    if (!employee_id || !full_name || !password)
      return res.status(400).json({ message: 'Employee ID, full name, and password are required' });

    const validRoles = ['admin','admin_administrative','superadmin'];
    if (role && !validRoles.includes(role))
      return res.status(400).json({ message: 'Invalid role' });

    const exists = await User.findOne({ where: { employee_id: employee_id.trim() } });
    if (exists) return res.status(400).json({ message: 'Employee ID already exists' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      employee_id: employee_id.trim(),
      full_name:   full_name.trim(),
      email:       email?.trim() || null,
      password:    hashed,
      role:        role || 'admin',
      department:  department?.trim()  || null,
      division:    division?.trim()    || null,
      office:      office?.trim()      || null,
      designation: designation?.trim() || null,
    });
    res.status(201).json(safeUser(user));
  } catch (err) {
    console.error('[USER createAdmin]', err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { full_name, email, department, division, office, designation, role, password, employee_id } = req.body;
    const updateData = {};
    if (full_name)   updateData.full_name   = full_name.trim();
    if (email)       updateData.email       = email.trim();
    if (department)  updateData.department  = department.trim();
    if (division)    updateData.division    = division.trim();
    if (office)      updateData.office      = office.trim();
    if (designation) updateData.designation = designation.trim();
    if (role)        updateData.role        = role;
    if (password)    updateData.password    = await bcrypt.hash(password, 12);
    if (employee_id) {
      const exists = await User.findOne({ where: { employee_id: employee_id.trim() } });
      if (exists && exists.id !== user.id) return res.status(400).json({ message: 'Employee ID already exists' });
      updateData.employee_id = employee_id.trim();
    }

    await user.update(updateData);
    res.json(safeUser(user));
  } catch (err) {
    console.error('[USER updateUser]', err);
    res.status(500).json({ message: err.message });
  }
};

exports.toggleActive = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.update({ is_active: !user.is_active });
    res.json({ id: user.id, is_active: user.is_active });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const rows = await User.findAll({
      attributes: ['department'],
      where:      { role: { [Op.in]: ['admin','admin_administrative'] }, department: { [Op.ne]: null } },
      group:      ['department'],
    });
    const departments = [...new Set(rows.map(r => r.department).filter(Boolean))].sort();
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSystemStats = async (req, res) => {
  try {
    const { RIS } = require('../models');
    const [totalAdmins, totalEmployees, totalRIS, totalActive] = await Promise.all([
      User.count({ where: { role: { [Op.in]: ['admin','admin_administrative'] } } }),
      User.count({ where: { role: 'employee' } }),
      RIS.count(),
      User.count({ where: { is_active: true } }),
    ]);
    res.json({ totalAdmins, totalEmployees, totalRIS, totalActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
