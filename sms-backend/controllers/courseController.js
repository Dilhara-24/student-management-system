import pool from '../config/db.js';
import { createLog } from './logController.js';

export const getCourses = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, course_code, course_name, description, created_at FROM courses ORDER BY created_at DESC`
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('[getCourses]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve courses.' });
  }
};

export const getCourseCount = async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT COUNT(*) FROM courses`);
    return res.status(200).json({ success: true, count: parseInt(rows[0].count, 10) });
  } catch (err) {
    console.error('[getCourseCount]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to get course count.' });
  }
};

export const getCourseIntakes = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT i.id, i.name, i.start_date, i.end_date
       FROM intakes i
       JOIN intake_courses ic ON ic.intake_id = i.id
       WHERE ic.course_id = $1`,
      [id]
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('[getCourseIntakes]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve intakes for course.' });
  }
};

export const addCourse = async (req, res) => {
  const { course_code, course_name, description, intake_id } = req.body;
  if (!course_code || !course_name) {
    return res.status(400).json({ success: false, message: 'course_code and course_name are required.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO courses (course_code, course_name, description)
       VALUES ($1, $2, $3)
       RETURNING id, course_code, course_name, description, created_at`,
      [course_code.trim().toUpperCase(), course_name.trim(), description?.trim() || null]
    );
    const course = rows[0];
    if (intake_id) {
      await client.query(
        `INSERT INTO intake_courses (intake_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [intake_id, course.id]
      );
    }
    await client.query('COMMIT');
    await createLog(req.admin.id, 'CREATE', 'course', course.id, `Added course ${course.course_code}`);
    return res.status(201).json({ success: true, message: 'Course created successfully.', data: course });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'Course code already exists.' });
    }
    console.error('[addCourse]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to create course.' });
  } finally {
    client.release();
  }
};

export const updateCourse = async (req, res) => {
  const { id } = req.params;
  const { course_code, course_name, description } = req.body;
  if (!course_code || !course_name) {
    return res.status(400).json({ success: false, message: 'course_code and course_name are required.' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE courses SET course_code=$1, course_name=$2, description=$3 WHERE id=$4
       RETURNING id, course_code, course_name, description, created_at`,
      [course_code.trim().toUpperCase(), course_name.trim(), description?.trim() || null, id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Course not found.' });
    await createLog(req.admin.id, 'UPDATE', 'course', rows[0].id, `Updated course ${rows[0].course_code}`);
    return res.status(200).json({ success: true, message: 'Course updated.', data: rows[0] });
  } catch (err) {
    console.error('[updateCourse]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update course.' });
  }
};

export const deleteCourse = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(`DELETE FROM courses WHERE id=$1 RETURNING id, course_code`, [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Course not found.' });
    await createLog(req.admin.id, 'DELETE', 'course', parseInt(id), `Deleted course ${rows[0].course_code}`);
    return res.status(200).json({ success: true, message: 'Course deleted.' });
  } catch (err) {
    console.error('[deleteCourse]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to delete course.' });
  }
};