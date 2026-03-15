// controllers/authController.js
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM admins WHERE username = $1',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const admin = rows[0];
    const validPassword = await bcrypt.compare(password, admin.password);

    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

await pool.query(`UPDATE admins SET last_active=NOW() WHERE id=$1`, [admin.id]);

const token = jwt.sign(
  { id: admin.id, username: admin.username },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

return res.json({ token, admin: { id: admin.id, username: admin.username } });
  } catch (err) {
    console.error('[loginAdmin]', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};