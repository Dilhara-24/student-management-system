import pool from '../config/db.js';
import { createLog } from './logController.js';

export const addStudent = async (req, res) => {
  const { first_name, last_name, address, birthday, national_id, degree_program, intake_id } = req.body;

  const missingFields = [];
  if (!first_name)     missingFields.push('first_name');
  if (!last_name)      missingFields.push('last_name');
  if (!address)        missingFields.push('address');
  if (!birthday)       missingFields.push('birthday');
  if (!national_id)    missingFields.push('national_id');
  if (!degree_program) missingFields.push('degree_program');
  if (!intake_id)      missingFields.push('intake_id');

  if (missingFields.length > 0) {
    return res.status(400).json({ success: false, message: 'Missing required fields.', missing: missingFields });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO students (first_name, last_name, address, birthday, national_id, degree_program, intake_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, student_number, first_name, last_name, address, birthday, national_id, degree_program, intake_id, created_at`,
      [first_name.trim(), last_name.trim(), address.trim(), birthday, national_id.trim(), degree_program.trim(), intake_id]
    );
    await createLog(req.admin.id, 'CREATE', 'student', rows[0].id, `Added student ${rows[0].first_name} ${rows[0].last_name}`);
    return res.status(201).json({ success: true, message: 'Student added successfully.', data: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'National ID already exists.' });
    }
    console.error('[addStudent]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to add student.' });
  }
};

export const getStudents = async (req, res) => {
  const { search, intake_id, degree_program, page = 1, limit = 20 } = req.query;

  const parsedPage  = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset      = (parsedPage - 1) * parsedLimit;

  const conditions = [];
  const values     = [];

  if (search) {
    values.push(`%${search.trim()}%`);
    conditions.push(
      `(first_name ILIKE $${values.length} OR last_name ILIKE $${values.length} OR student_number::text ILIKE $${values.length} OR national_id ILIKE $${values.length})`
    );
  }

  if (degree_program) {
    values.push(`%${degree_program.trim()}%`);
    conditions.push(`degree_program ILIKE $${values.length}`);
  }

  if (intake_id) {
    const parsedIntake = parseInt(intake_id, 10);
    if (isNaN(parsedIntake)) {
      return res.status(400).json({ success: false, message: 'intake_id must be a valid integer.' });
    }
    values.push(parsedIntake);
    conditions.push(`intake_id = $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const countResult = await pool.query(`SELECT COUNT(*) FROM students ${whereClause}`, values);
    const totalCount  = parseInt(countResult.rows[0].count, 10);

    values.push(parsedLimit, offset);
    const { rows } = await pool.query(
      `SELECT id, student_number, first_name, last_name, address, birthday, national_id, degree_program, intake_id, created_at
       FROM students
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: { total: totalCount, page: parsedPage, limit: parsedLimit, totalPages: Math.ceil(totalCount / parsedLimit) },
    });
  } catch (err) {
    console.error('[getStudents]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve students.' });
  }
};

export const getStudentById = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.student_number, s.first_name, s.last_name, s.address, s.birthday,
              s.national_id, s.degree_program, s.intake_id, s.created_at,
              i.name AS intake_name
       FROM students s
       LEFT JOIN intakes i ON i.id = s.intake_id
       WHERE s.id = $1`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Student not found.' });
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[getStudentById]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve student.' });
  }
};

export const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, address, birthday, national_id, degree_program, intake_id } = req.body;

  if (!first_name || !last_name || !address || !birthday || !national_id || !degree_program || !intake_id) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE students
       SET first_name=$1, last_name=$2, address=$3, birthday=$4,
           national_id=$5, degree_program=$6, intake_id=$7
       WHERE id=$8
       RETURNING id, student_number, first_name, last_name, address, birthday, national_id, degree_program, intake_id, created_at`,
      [first_name.trim(), last_name.trim(), address.trim(), birthday, national_id.trim(), degree_program.trim(), intake_id, id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Student not found.' });
    await createLog(req.admin.id, 'UPDATE', 'student', rows[0].id, `Updated student ${rows[0].first_name} ${rows[0].last_name}`);
    return res.status(200).json({ success: true, message: 'Student updated.', data: rows[0] });
  } catch (err) {
    console.error('[updateStudent]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update student.' });
  }
};

export const deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(`DELETE FROM students WHERE id=$1 RETURNING id`, [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Student not found.' });
    await createLog(req.admin.id, 'DELETE', 'student', parseInt(id), `Deleted student ID ${id}`);
    return res.status(200).json({ success: true, message: 'Student deleted.' });
  } catch (err) {
    console.error('[deleteStudent]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to delete student.' });
  }
};

export const getStudentCourses = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT sch.id, sch.student_id, sch.course_id, sch.semester, sch.year,
              sch.status, sch.assigned_at, sch.removed_at,
              c.course_code, c.course_name
       FROM student_course_history sch
       JOIN courses c ON c.id = sch.course_id
       WHERE sch.student_id = $1
       ORDER BY sch.removed_at ASC NULLS FIRST, sch.year DESC NULLS LAST`,
      [id]
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('[getStudentCourses]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve student courses.' });
  }
};

export const assignCourseToStudent = async (req, res) => {
  const { id } = req.params;
  const { course_id, semester, year, status } = req.body;

  if (!course_id) {
    return res.status(400).json({ success: false, message: 'course_id is required.' });
  }

  try {
    const existing = await pool.query(
      `SELECT id FROM student_course_history WHERE student_id=$1 AND course_id=$2`,
      [id, course_id]
    );

    if (existing.rows.length > 0) {
      const { rows } = await pool.query(
        `UPDATE student_course_history
         SET removed_at=NULL, status='active', semester=$3, year=$4
         WHERE student_id=$1 AND course_id=$2
         RETURNING *`,
        [id, course_id, semester || null, year || null]
      );
      return res.status(200).json({ success: true, data: rows[0] });
    }

    const { rows } = await pool.query(
      `INSERT INTO student_course_history (student_id, course_id, semester, year, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, course_id, semester || null, year || null, status || 'active']
    );
    return res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[assignCourseToStudent]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to assign course.' });
  }
};

export const removeCourseFromStudent = async (req, res) => {
  const { id, courseId } = req.params;
  try {
    const { rows } = await pool.query(
      `UPDATE student_course_history
       SET removed_at = NOW()
       WHERE student_id = $1 AND course_id = $2 AND removed_at IS NULL
       RETURNING id`,
      [id, courseId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }
    return res.status(200).json({ success: true, message: 'Course removed from student.' });
  } catch (err) {
    console.error('[removeCourseFromStudent]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to remove course.' });
  }
};