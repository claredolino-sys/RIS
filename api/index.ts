import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const models = require('../backend/models/index.js');
const routes = require('../backend/routes/index.js');

const { sequelize, User } = models;

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use('/uploads', express.static('/tmp/uploads'));

// Initialize DB and seed superadmin lazily
let isDbInitialized = false;
app.use(async (req, res, next) => {
  if (!isDbInitialized) {
    try {
      await sequelize.sync({ alter: true });
      const exists = await User.findOne({ where: { role: 'superadmin' } });
      if (!exists) {
        const hashed = await bcrypt.hash('superadmin123', 12);
        await User.create({ 
          employee_id: 'SUPERADMIN', 
          full_name: 'Super Administrator', 
          email: 'superadmin@ris.local', 
          password: hashed, 
          role: 'superadmin', 
          department: 'System Administration', 
          designation: 'System Administrator', 
          is_active: true 
        });
        console.log('✅ Super Admin seeded via Vercel Serverless');
      }
      isDbInitialized = true;
    } catch (error) {
      console.error('DB Init Error:', error);
    }
  }
  next();
});

// API routes
app.use('/api', routes);
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

export default app;
