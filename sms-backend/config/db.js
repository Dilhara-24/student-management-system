import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'sms_db',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '0077',
});

export default pool;