import pool from '../config/db.js';
import { createLog } from './logController.js';

export const getIntakes = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.id, i.name, i.start_date, i.end_date, i.created_at, i.status,
              COUNT(s.id) AS student_count
       FROM intakes i
       LEFT JOIN students s ON s.intake_id = i.id
       GROUP BY i.id
       ORDER BY i.created_at DESC`
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('[getIntakes]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve intakes.' });
  }
};

export const getIntakeCount = async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT COUNT(*) FROM intakes`);
    return res.status(200).json({ success: true, count: parseInt(rows[0].count, 10) });
  } catch (err) {
    console.error('[getIntakeCount]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to get intake count.' });
  }
};

export const getIntakeStudents = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT id, first_name, last_name, degree_program, created_at
       FROM students WHERE intake_id = $1 ORDER BY last_name ASC`,
      [id]
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('[getIntakeStudents]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve students for intake.' });
  }
};

export const addIntake = async (req, res) => {
  const { name, start_date, end_date } = req.body;
  if (!name || !start_date || !end_date) {
    return res.status(400).json({ success: false, message: 'name, start_date and end_date are required.' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO intakes (name, start_date, end_date)
       VALUES ($1, $2, $3)
       RETURNING id, name, start_date, end_date, created_at`,
      [name.trim(), start_date, end_date]
    );
    await createLog(req.admin.id, 'CREATE', 'intake', rows[0].id, `Added intake ${rows[0].name}`);
    return res.status(201).json({ success: true, message: 'Intake created successfully.', data: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'Intake name already exists.' });
    }
    console.error('[addIntake]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to create intake.' });
  }
};

export const deleteIntake = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(`DELETE FROM intakes WHERE id=$1 RETURNING id, name`, [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Intake not found.' });
    await createLog(req.admin.id, 'DELETE', 'intake', parseInt(id), `Deleted intake ${rows[0].name}`);
    return res.status(200).json({ success: true, message: 'Intake deleted.' });
  } catch (err) {
    console.error('[deleteIntake]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to delete intake.' });
  }
};

export const assignCourseToIntake = async (req, res) => {
  const { id } = req.params;
  const { course_id } = req.body;
  if (!course_id) {
    return res.status(400).json({ success: false, message: 'course_id is required.' });
  }
  try {
    await pool.query(
      `INSERT INTO intake_courses (intake_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [id, course_id]
    );
    await pool.query(
      `INSERT INTO student_course_history (student_id, course_id, status)
       SELECT s.id, $2, 'active'
       FROM students s
       WHERE s.intake_id = $1
       ON CONFLICT (student_id, course_id) DO NOTHING`,
      [id, course_id]
    );
    await createLog(req.admin.id, 'ASSIGN', 'intake_course', parseInt(id), `Assigned course ID ${course_id} to intake ID ${id}`);
    return res.status(201).json({ success: true, message: 'Course assigned to intake and all its students.' });
  } catch (err) {
    console.error('[assignCourseToIntake]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to assign course.' });
  }
};

export const removeCourseFromIntake = async (req, res) => {
  const { id, courseId } = req.params;
  try {
    await pool.query(
      `DELETE FROM intake_courses WHERE intake_id=$1 AND course_id=$2`,
      [id, courseId]
    );
    await pool.query(
      `UPDATE student_course_history
       SET removed_at = NOW()
       WHERE course_id = $2
       AND student_id IN (SELECT id FROM students WHERE intake_id = $1)
       AND removed_at IS NULL`,
      [id, courseId]
    );
    await createLog(req.admin.id, 'REMOVE', 'intake_course', parseInt(id), `Removed course ID ${courseId} from intake ID ${id}`);
    return res.status(200).json({ success: true, message: 'Course removed from intake and all its students.' });
  } catch (err) {
    console.error('[removeCourseFromIntake]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to remove course.' });
  }
};

export const updateIntake = async (req, res) => {
  const { id } = req.params;
  const { name, start_date, end_date, status } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'name is required.' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE intakes SET name=$1, start_date=$2, end_date=$3, status=$4 WHERE id=$5
       RETURNING id, name, start_date, end_date, status, created_at`,
      [name.trim(), start_date || null, end_date || null, status || 'planned', id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Intake not found.' });
    await createLog(req.admin.id, 'UPDATE', 'intake', rows[0].id, `Updated intake ${rows[0].name}`);
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[updateIntake]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update intake.' });
  }
};

export const getIntakeCourses = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.course_code, c.course_name, c.description
       FROM intake_courses ic
       JOIN courses c ON c.id = ic.course_id
       WHERE ic.intake_id = $1
       ORDER BY c.course_code ASC`,
      [id]
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('[getIntakeCourses]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to get intake courses.' });
  }
};