require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

if (process.env.DATABASE_URL) {
  // Use DATABASE_URL if provided (e.g., Supabase PostgreSQL)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: false,
    dialectOptions: process.env.DB_SSL === 'true' ? {
      ssl: { require: true, rejectUnauthorized: false }
    } : {}
  });
} else if (process.env.DB_DIALECT === 'mysql' || process.env.DB_DIALECT === 'postgres') {
  // Use individual env vars for MySQL or Postgres
  sequelize = new Sequelize(
    process.env.DB_NAME || 'ris_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || (process.env.DB_DIALECT === 'postgres' ? 5432 : 3306),
      dialect: process.env.DB_DIALECT,
      logging: false,
    }
  );
} else {
  // Fallback to SQLite
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: false,
  });
}

module.exports = sequelize;
