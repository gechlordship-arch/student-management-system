const db = require('../config/db');

const VALID_TYPES = ['quiz', 'assignment', 'midterm', 'final', 'project'];

const createAssessment = async (req, res) => {
  const { courseId } = req.params;
  const { name, assessmentType, maxScore, weight, dueDate } = req.body;

  if (!name || !assessmentType || maxScore == null) {
    return res.status(400).json({ error: 'name, assessmentType, maxScore required' });
  }
  if (!VALID_TYPES.includes(assessmentType)) {
    return res.status(400).json({ error: `assessmentType must be one of ${VALID_TYPES.join(', ')}` });
  }
  if (typeof maxScore !== 'number' || maxScore <= 0) {
    return res.status(400).json({ error: 'maxScore must be a positive number' });
  }
  const w = weight == null ? 1 : weight;
  if (typeof w !== 'number' || w <= 0) {
    return res.status(400).json({ error: 'weight must be a positive number' });
  }

  const { rows } = await db.query(
    `INSERT INTO assessments (course_id, name, assessment_type, max_score, weight, due_date)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [courseId, name, assessmentType, maxScore, w, dueDate || null]
  );
  res.status(201).json(rows[0]);
};

const listAssessments = async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, course_id, name, assessment_type, max_score, weight, due_date
       FROM assessments
      WHERE course_id = $1
      ORDER BY due_date NULLS LAST, id`,
    [req.params.courseId]
  );
  res.json(rows);
};

const deleteAssessment = async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM assessments WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Assessment not found' });
  res.status(204).end();
};

const enterGrades = async (req, res) => {
  const assessmentId = Number(req.params.id);
  const { records } = req.body;
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'records must be a non-empty array' });
  }

  const aRes = await db.query(
    'SELECT id, course_id, max_score FROM assessments WHERE id = $1',
    [assessmentId]
  );
  const assessment = aRes.rows[0];
  if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

  const maxScore = Number(assessment.max_score);
  for (const r of records) {
    if (!Number.isInteger(r.studentId)) {
      return res.status(400).json({ error: `Invalid studentId in ${JSON.stringify(r)}` });
    }
    if (typeof r.score !== 'number' || r.score < 0 || r.score > maxScore) {
      return res.status(400).json({
        error: `score must be 0..${maxScore} for student ${r.studentId}`,
      });
    }
  }

  const enrollRes = await db.query(
    'SELECT id, student_id FROM enrollments WHERE course_id = $1',
    [assessment.course_id]
  );
  const enrollmentByStudent = new Map(enrollRes.rows.map((r) => [r.student_id, r.id]));

  const params = [];
  const valueClauses = [];
  const gradedByParam = records.length * 3 + 1;

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const enrollmentId = enrollmentByStudent.get(r.studentId);
    if (!enrollmentId) {
      return res.status(400).json({
        error: `Student ${r.studentId} is not enrolled in this course`,
      });
    }
    const base = i * 3;
    valueClauses.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${gradedByParam})`);
    params.push(assessmentId, enrollmentId, r.score);
  }
  params.push(req.user.profileId);

  const sql = `
    INSERT INTO grades (assessment_id, enrollment_id, score, graded_by)
    VALUES ${valueClauses.join(', ')}
    ON CONFLICT (assessment_id, enrollment_id)
    DO UPDATE SET score = EXCLUDED.score, graded_by = EXCLUDED.graded_by, graded_at = NOW()
    RETURNING id, assessment_id, enrollment_id, score
  `;

  const { rows } = await db.query(sql, params);
  res.json({ assessmentId, graded: rows.length, records: rows });
};

const getCourseGradebook = async (req, res) => {
  const { courseId } = req.params;

  const assessRes = await db.query(
    `SELECT id, name, assessment_type, max_score, weight, due_date
       FROM assessments WHERE course_id = $1
      ORDER BY due_date NULLS LAST, id`,
    [courseId]
  );

  const rowsRes = await db.query(
    `SELECT e.id AS enrollment_id,
            s.id AS student_id, s.student_number,
            u.first_name, u.last_name,
            a.id AS assessment_id,
            g.score
       FROM enrollments e
       JOIN students s ON s.id = e.student_id
       JOIN users u ON u.id = s.user_id
       LEFT JOIN assessments a ON a.course_id = e.course_id
       LEFT JOIN grades g ON g.assessment_id = a.id AND g.enrollment_id = e.id
      WHERE e.course_id = $1
      ORDER BY u.last_name, u.first_name, a.due_date NULLS LAST, a.id`,
    [courseId]
  );

  const byStudent = new Map();
  for (const r of rowsRes.rows) {
    if (!byStudent.has(r.student_id)) {
      byStudent.set(r.student_id, {
        studentId: r.student_id,
        studentNumber: r.student_number,
        firstName: r.first_name,
        lastName: r.last_name,
        grades: {},
        weightedPercent: null,
      });
    }
    if (r.assessment_id && r.score != null) {
      byStudent.get(r.student_id).grades[r.assessment_id] = Number(r.score);
    }
  }

  const assessments = assessRes.rows.map((a) => ({
    ...a,
    max_score: Number(a.max_score),
    weight: Number(a.weight),
  }));

  for (const entry of byStudent.values()) {
    let sum = 0, weightSum = 0;
    for (const a of assessments) {
      const score = entry.grades[a.id];
      if (score != null) {
        sum += (score / a.max_score) * a.weight;
        weightSum += a.weight;
      }
    }
    entry.weightedPercent =
      weightSum === 0 ? null : Number(((sum / weightSum) * 100).toFixed(2));
  }

  res.json({
    courseId: Number(courseId),
    assessments,
    students: Array.from(byStudent.values()),
  });
};

const getStudentGrades = async (req, res) => {
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

  const rowsRes = await db.query(
    `SELECT c.id AS course_id, c.course_code, c.name AS course_name,
            a.id AS assessment_id, a.name AS assessment_name,
            a.assessment_type, a.max_score, a.weight,
            g.score
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       LEFT JOIN assessments a ON a.course_id = c.id
       LEFT JOIN grades g ON g.assessment_id = a.id AND g.enrollment_id = e.id
      WHERE e.student_id = $1
      ORDER BY c.course_code, a.due_date NULLS LAST, a.id`,
    [studentId]
  );

  const byCourse = new Map();
  for (const r of rowsRes.rows) {
    if (!byCourse.has(r.course_id)) {
      byCourse.set(r.course_id, {
        courseId: r.course_id,
        courseCode: r.course_code,
        courseName: r.course_name,
        assessments: [],
        weightedPercent: null,
      });
    }
    if (r.assessment_id) {
      byCourse.get(r.course_id).assessments.push({
        assessmentId: r.assessment_id,
        name: r.assessment_name,
        type: r.assessment_type,
        maxScore: Number(r.max_score),
        weight: Number(r.weight),
        score: r.score == null ? null : Number(r.score),
      });
    }
  }

  for (const c of byCourse.values()) {
    let sum = 0, weightSum = 0;
    for (const a of c.assessments) {
      if (a.score != null) {
        sum += (a.score / a.maxScore) * a.weight;
        weightSum += a.weight;
      }
    }
    c.weightedPercent =
      weightSum === 0 ? null : Number(((sum / weightSum) * 100).toFixed(2));
  }

  res.json({ studentId, courses: Array.from(byCourse.values()) });
};

module.exports = {
  createAssessment, listAssessments, deleteAssessment,
  enterGrades, getCourseGradebook, getStudentGrades,
};