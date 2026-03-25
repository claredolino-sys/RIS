import express from 'express';
console.log('🚀 Server script starting...');
import cors from 'cors';
import path from 'path';
import cron from 'node-cron';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

dotenv.config();

const models = require('./backend/models/index.js');
const { sequelize, User } = models;
const routes = require('./backend/routes/index.js');
const reportController = require('./backend/controllers/reportController.js');
const { autoGenerate } = reportController;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));
  app.use('/uploads', express.static(path.join(process.cwd(), 'backend/uploads')));

  // API routes
  app.use('/api', routes);
  app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
  app.use('/api/*', (req, res) => res.status(404).json({ message: 'API route not found' }));

  // Vite middleware for development
  let vite: any;
  if (process.env.NODE_ENV !== 'production') {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const seedSuperAdmin = async () => {
    const exists = await User.findOne({ where: { role: 'superadmin' } });
    if (!exists) {
      const hashed = await bcrypt.hash('superadmin123', 12);
      await User.create({ employee_id: 'SUPERADMIN', full_name: 'Super Administrator', email: 'superadmin@ris.local', password: hashed, role: 'superadmin', department: 'System Administration', designation: 'System Administrator', is_active: true });
      console.log('✅ Super Admin seeded — ID: SUPERADMIN  Password: superadmin123');
    }
  };

  cron.schedule('0 0 1 * *', () => { console.log('[CRON] Auto-generating reports...'); autoGenerate(); });

  // Auto-delete RIS forms older than 48 hours (runs every hour)
  cron.schedule('0 * * * *', async () => {
    try {
      const { Op } = require('sequelize');
      const { RIS } = models;
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const deletedCount = await RIS.destroy({
        where: {
          createdAt: { [Op.lt]: fortyEightHoursAgo }
        }
      });
      if (deletedCount > 0) {
        console.log(`[CRON] Auto-deleted ${deletedCount} RIS forms older than 48 hours.`);
      }
    } catch (error) {
      console.error('[CRON] Error auto-deleting old RIS forms:', error);
    }
  });

  console.log('🔄 Syncing database...');
  sequelize.sync({ alter: true })
    .then(async () => {
      console.log(`✅ Database synced (${sequelize.getDialect()})`);
      await seedSuperAdmin();
      console.log('🚀 Starting server...');
      const server = app.listen(PORT, '0.0.0.0', () => console.log(`🚀 RIS Portal API -> http://localhost:${PORT}`));

      server.on('error', (e: any) => {
        if (e.code === 'EADDRINUSE') {
          console.error(`❌ Port ${PORT} is already in use. Retrying in 1 second...`);
          setTimeout(() => {
            server.close();
            server.listen(PORT, '0.0.0.0');
          }, 1000);
        } else {
          console.error('❌ Server error:', e);
        }
      });

      const shutdown = async () => {
        console.log('Shutting down gracefully...');
        if (vite) {
          await vite.close();
          console.log('Vite server closed.');
        }
        server.close(() => {
          console.log('HTTP server closed.');
          sequelize.close().then(() => {
            console.log('Database connection closed.');
            process.exit(0);
          });
        });
      };

      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);
    })
    .catch((err: any) => { console.error('❌ DB sync failed:', err.message); process.exit(1); });
}

startServer();
