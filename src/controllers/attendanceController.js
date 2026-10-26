const db = require('../config/db');

const VALID_STATUSES = ['present', 'absent', 'late', 'excused'];
const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

// POST /api/courses/:courseId/attendance
const markAttendance = async (req, res) => {
  const { courseId } = req.params;
  const { date, records } = req.body;

  if (!isDate(date)) {
    return res.status(400).json({ error: 'Valid date (YYYY-MM-DD) required' });
  }
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'records must be a non-empty array' });
  }
  for (const r of records) {
    if (!Number.isInteger(r.studentId) || !VALID_STATUSES.includes(r.status)) {
      return res.status(400).json({
        error: `Invalid record ${JSON.stringify(r)} — need integer studentId and status in ${VALID_STATUSES.join(', ')}`,
      });
    }
  }

  const enrollRes = await db.query(
    'SELECT id, student_id FROM enrollments WHERE course_id = $1',
    [courseId]
  );
  const enrollmentByStudent = new Map(
    enrollRes.rows.map((r) => [r.student_id, r.id])
  );

  const params = [];
  const valueClauses = [];
  const recordedByParam = records.length * 3 + 1;

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const enrollmentId = enrollmentByStudent.get(r.studentId);
    if (!enrollmentId) {
      return res.status(400).json({
        error: `Student ${r.studentId} is not enrolled in this course`,
      });
    }
    const base = i * 3;
    valueClauses.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${recordedByParam})`);
    params.push(enrollmentId, date, r.status);
  }
  params.push(req.user.profileId); // recorded_by

  const sql = `
    INSERT INTO attendance (enrollment_id, attendance_date, status, recorded_by)
    VALUES ${valueClauses.join(', ')}
    ON CONFLICT (enrollment_id, attendance_date)
    DO UPDATE SET status = EXCLUDED.status, recorded_by = EXCLUDED.recorded_by
    RETURNING id, enrollment_id, attendance_date, status
  `;

  const { rows } = await db.query(sql, params);
  res.status(200).json({ date, courseId: Number(courseId), marked: rows.length, records: rows });
};

// GET /api/courses/:courseId/attendance?date=YYYY-MM-DD
const getCourseAttendance = async (req, res) => {
  const { courseId } = req.params;
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  if (!isDate(date)) {
    return res.status(400).json({ error: 'Valid date (YYYY-MM-DD) required' });
  }

  const { rows } = await db.query(
    `SELECT e.id AS enrollment_id,
            s.id AS student_id, s.student_number,
            u.first_name, u.last_name,
            a.id AS attendance_id, a.status
       FROM enrollments e
       JOIN students s ON s.id = e.student_id
       JOIN users u ON u.id = s.user_id
       LEFT JOIN attendance a
         ON a.enrollment_id = e.id AND a.attendance_date = $2
      WHERE e.course_id = $1
      ORDER BY u.last_name, u.first_name`,
    [courseId, date]
  );

  res.json({ date, courseId: Number(courseId), records: rows });
};

// GET /api/students/:id/attendance
const getStudentAttendance = async (req, res) => {
  const studentId = Number(req.params.id);

  if (req.user.role === 'student' && req.user.profileId !== studentId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (req.user.role === 'teacher') {
    const check = await db.query(
      `SELECT 1
         FROM enrollments e
         JOIN courses c ON c.id = e.course_id
        WHERE e.student_id = $1 AND c.teacher_id = $2
        LIMIT 1`,
      [studentId, req.user.profileId]
    );
    if (check.rowCount === 0) return res.status(403).json({ error: 'Forbidden' });
  }

  const { rows } = await db.query(
    `SELECT a.id, a.attendance_date, a.status,
            c.id AS course_id, c.course_code, c.name AS course_name
       FROM attendance a
       JOIN enrollments e ON e.id = a.enrollment_id
       JOIN courses c ON c.id = e.course_id
      WHERE e.student_id = $1
      ORDER BY a.attendance_date DESC, c.course_code`,
    [studentId]
  );

  const summary = {};
  for (const r of rows) {
    const key = r.course_code;
    if (!summary[key]) {
      summary[key] = {
        courseId: r.course_id,
        courseName: r.course_name,
        present: 0, absent: 0, late: 0, excused: 0, total: 0,
      };
    }
    summary[key][r.status]++;
    summary[key].total++;
  }
  for (const s of Object.values(summary)) {
    s.attendanceRate = s.total === 0
      ? null
      : Number(((s.present + s.late * 0.5 + s.excused) / s.total).toFixed(3));
  }

  res.json({ studentId, records: rows, summary });
};
const exportCourseAttendanceCSV = async (req, res) => {
  const { courseId } = req.params;
  try {
    const { rows } = await db.query(
      `SELECT u.first_name, u.last_name, s.student_number, 
              a.attendance_date, a.status
       FROM enrollments e
       JOIN students s ON s.id = e.student_id
       JOIN users u ON u.id = s.user_id
       LEFT JOIN attendance a ON a.enrollment_id = e.id
       WHERE e.course_id = $1
       ORDER BY u.last_name, u.first_name, a.attendance_date`,
      [courseId]
    );

    // Group rows by student
    const students = {};
    rows.forEach(r => {
      const key = r.student_number;
      if (!students[key]) {
        students[key] = { name: `${r.first_name} ${r.last_name}`, dates: {} };
      }
      if (r.attendance_date) {
        // Convert timestamp to YYYY-MM-DD
        const dateStr = new Date(r.attendance_date).toISOString().split('T')[0];
        students[key].dates[dateStr] = r.status;
      }
    });

    // Get unique dates for CSV headers
    const uniqueDates = [...new Set(rows.map(r => r.attendance_date ? new Date(r.attendance_date).toISOString().split('T')[0] : null).filter(Boolean))].sort();

    // Build CSV String
    let csv = `Student Number,Name,${uniqueDates.join(',')}\n`;
    Object.keys(students).forEach(sNum => {
      const s = students[sNum];
      const rowStatuses = uniqueDates.map(date => s.dates[date] || 'N/A');
      csv += `"${sNum}","${s.name}","${rowStatuses.join('","')}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-${courseId}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
};
module.exports = { markAttendance, getCourseAttendance, getStudentAttendance, exportCourseAttendanceCSV };