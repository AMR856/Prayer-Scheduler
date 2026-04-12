const pool = require('../../config/db');

class UserModel {
  static async initUsersTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await pool.query(query);
  }

  static async getEmailUsers() {
    const result = await pool.query(
      'SELECT DISTINCT email FROM users WHERE email IS NOT NULL ORDER BY email ASC'
    );
    return result.rows.map((row) => row.email);
  }

  static async getPhoneUsers() {
    const result = await pool.query(
      'SELECT DISTINCT phone FROM users WHERE phone IS NOT NULL ORDER BY phone ASC'
    );
    return result.rows.map((row) => row.phone);
  }

  static async addUser({ email, phone }) {
    const result = await pool.query(
      `
        INSERT INTO users (email, phone)
        VALUES ($1, $2)
        RETURNING id, email, phone, created_at;
      `,
      [email || null, phone || null]
    );

    return result.rows[0];
  }

  static async removeUserByEmail(email) {
    const result = await pool.query(
      'DELETE FROM users WHERE email = $1',
      [email]
    );

    return result.rowCount;
  }

  static async getAllUsers() {
    const result = await pool.query(
      'SELECT id, email, phone, created_at FROM users ORDER BY created_at DESC'
    );

    return result.rows;
  }
}

module.exports = UserModel;