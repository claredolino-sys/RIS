const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { User } = require('../models');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, employee_id: user.employee_id },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '24h' }
  );

const safeUser = (user) => ({
  id:          user.id,
  employee_id: user.employee_id,
  full_name:   user.full_name,
  email:       user.email,
  role:        user.role,
  department:  user.department,
  division:    user.division,
  office:      user.office,
  designation: user.designation,
  is_active:   user.is_active,
});

exports.login = async (req, res) => {
  try {
    const { employee_id, password } = req.body;
    if (!employee_id || !password)
      return res.status(400).json({ message: 'Employee ID and password are required' });

    const user = await User.findOne({ where: { employee_id: employee_id.trim() } });
    if (!user)
      return res.status(400).json({ message: 'Invalid Employee ID or password' });
    if (!user.is_active)
      return res.status(403).json({ message: 'Your account has been deactivated. Contact your administrator.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ message: 'Invalid Employee ID or password' });

    const token = signToken(user);
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    console.error('[AUTH LOGIN]', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.register = async (req, res) => {
  try {
    const { employee_id, full_name, email, password, department, division, office, designation } = req.body;
    if (!employee_id || !full_name || !password)
      return res.status(400).json({ message: 'Employee ID, full name, and password are required' });

    const exists = await User.findOne({ where: { employee_id: employee_id.trim() } });
    if (exists)
      return res.status(400).json({ message: 'Employee ID is already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      employee_id: employee_id.trim(),
      full_name:   full_name.trim(),
      email:       email?.trim() || null,
      password:    hashed,
      role:        'employee',
      department:  department?.trim() || null,
      division:    division?.trim() || null,
      office:      office?.trim() || null,
      designation: designation?.trim() || null,
    });

    const token = signToken(user);
    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    console.error('[AUTH REGISTER]', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

exports.me = async (req, res) => {
  res.json(safeUser(req.user));
};
