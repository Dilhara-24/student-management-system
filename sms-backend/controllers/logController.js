import pool from '../config/db.js';

// GET /api/logs
export const getLogs = async (req, res) => {
  const { admin_id, page = 1, limit = 20 } = req.query;

  const parsedPage  = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset      = (parsedPage - 1) * parsedLimit;

  const conditions = [];
  const values     = [];

  if (admin_id) {
    values.push(parseInt(admin_id, 10));
    conditions.push(`l.admin_id = $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM audit_logs l ${whereClause}`, values
    );
    const totalCount = parseInt(countResult.rows[0].count, 10);

    values.push(parsedLimit, offset);
    const { rows } = await pool.query(
      `SELECT l.id, l.action_type, l.entity_type, l.entity_id, l.timestamp, l.details,
              a.username AS admin_username, a.full_name AS admin_name
       FROM audit_logs l
       LEFT JOIN admins a ON a.id = l.admin_id
       ${whereClause}
       ORDER BY l.timestamp DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: totalCount,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(totalCount / parsedLimit),
      },
    });
  } catch (err) {
    console.error('[getLogs]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve logs.' });
  }
};

// createLog — called internally by other controllers to log actions
export const createLog = async (admin_id, action_type, entity_type, entity_id = null, details = null) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action_type, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [admin_id, action_type, entity_type, entity_id, details]
    );
  } catch (err) {
    console.error('[createLog]', err.message);
  }
};