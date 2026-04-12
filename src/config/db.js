const { Pool } = require('pg');

const connectionString = process.env.CONNECTION_STRING || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Missing CONNECTION_STRING (or DATABASE_URL) in environment variables.');
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
