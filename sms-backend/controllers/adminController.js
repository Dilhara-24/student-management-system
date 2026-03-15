import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import { createLog } from './logController.js';

export const getAdmins = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, username, full_name, email, role, last_active, created_at
       FROM admins ORDER BY created_at DESC`
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('[getAdmins]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve admins.' });
  }
};

export const getAdminCount = async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT COUNT(*) FROM admins`);
    return res.status(200).json({ success: true, count: parseInt(rows[0].count, 10) });
  } catch (err) {
    console.error('[getAdminCount]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to get admin count.' });
  }
};

export const addAdmin = async (req, res) => {
  const { username, password, full_name, email, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'username and password are required.' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO admins (username, password, full_name, email, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, full_name, email, role, created_at`,
      [username.trim(), hashedPassword, full_name?.trim() || null, email?.trim() || null, role || 'Admin']
    );
    await createLog(req.admin.id, 'CREATE', 'admin', rows[0].id, `Added admin ${rows[0].username}`);
    return res.status(201).json({ success: true, message: 'Admin added successfully.', data: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'Username already exists.' });
    }
    console.error('[addAdmin]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to add admin.' });
  }
};

export const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { username, full_name, email, role, password } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, message: 'username is required.' });
  }
  try {
    let query, values;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = `UPDATE admins SET username=$1, full_name=$2, email=$3, role=$4, password=$5
               WHERE id=$6 RETURNING id, username, full_name, email, role, last_active, created_at`;
      values = [username.trim(), full_name?.trim() || null, email?.trim() || null, role || 'Admin', hashedPassword, id];
    } else {
      query = `UPDATE admins SET username=$1, full_name=$2, email=$3, role=$4
               WHERE id=$5 RETURNING id, username, full_name, email, role, last_active, created_at`;
      values = [username.trim(), full_name?.trim() || null, email?.trim() || null, role || 'Admin', id];
    }
    const { rows } = await pool.query(query, values);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Admin not found.' });
    await createLog(req.admin.id, 'UPDATE', 'admin', rows[0].id, `Updated admin ${rows[0].username}`);
    return res.status(200).json({ success: true, message: 'Admin updated.', data: rows[0] });
  } catch (err) {
    console.error('[updateAdmin]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update admin.' });
  }
};

export const deleteAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(`DELETE FROM admins WHERE id=$1 RETURNING id, username`, [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Admin not found.' });
    await createLog(req.admin.id, 'DELETE', 'admin', parseInt(id), `Deleted admin ${rows[0].username}`);
    return res.status(200).json({ success: true, message: 'Admin deleted.' });
  } catch (err) {
    console.error('[deleteAdmin]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to delete admin.' });
  }
};