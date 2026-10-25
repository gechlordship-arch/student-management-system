const PDFDocument = require('pdfkit');
const db = require('../config/db');

// GET /api/students/:id/report-card
const generateStudentReportCard = async (req, res) => {
  const studentId = Number(req.params.id);

  // Access Control (Admin, the student themselves, or their teacher)
  if (req.user.role === 'student' && req.user.profileId !== studentId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    // 1. Fetch Student Info
    const studentRes = await db.query(
      `SELECT s.student_number, u.first_name, u.last_name 
       FROM students s JOIN users u ON u.id = s.user_id WHERE s.id = $1`,
      [studentId]
    );
    if (!studentRes.rows[0]) return res.status(404).json({ error: 'Student not found' });
    const student = studentRes.rows[0];

    // 2. Fetch Grades (Reusing the logic from Phase 4)
    const gradesRes = await db.query(
      `SELECT c.course_code, c.name AS course_name, 
              SUM((g.score / a.max_score) * a.weight) AS weighted_sum,
              SUM(a.weight) AS total_weight
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       JOIN assessments a ON a.course_id = c.id
       LEFT JOIN grades g ON g.assessment_id = a.id AND g.enrollment_id = e.id
       WHERE e.student_id = $1 AND g.score IS NOT NULL
       GROUP BY c.id, c.course_code, c.name`,
      [studentId]
    );

    // 3. Fetch Attendance Summary
    const attendanceRes = await db.query(
      `SELECT c.course_code, 
              COUNT(a.id) AS total_days,
              COUNT(CASE WHEN a.status = 'present' THEN 1 END) AS present_days,
              COUNT(CASE WHEN a.status = 'absent' THEN 1 END) AS absent_days
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       LEFT JOIN attendance a ON a.enrollment_id = e.id
       WHERE e.student_id = $1
       GROUP BY c.id, c.course_code`,
      [studentId]
    );

    // 4. Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Set headers so the browser downloads it as a PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-card-${student.student_number}.pdf"`);
    
    doc.pipe(res);

    // -- Build the PDF layout --
    doc.fontSize(20).text('Official Student Report Card', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(14).text(`Student: ${student.first_name} ${student.last_name}`);
    doc.text(`Student Number: ${student.student_number}`);
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(16).text('Academic Grades');
    doc.fontSize(12);
    gradesRes.rows.forEach(row => {
      const pct = ((row.weighted_sum / row.total_weight) * 100).toFixed(2);
      doc.text(`${row.course_code} - ${row.course_name}: ${pct}%`);
    });
    doc.moveDown();

    doc.fontSize(16).text('Attendance Summary');
    doc.fontSize(12);
    attendanceRes.rows.forEach(row => {
      doc.text(`${row.course_code}: Present ${row.present_days} / ${row.total_days} days`);
    });

    doc.end(); // Finalize PDF
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to generate report' });
  }
};

// GET /api/courses/:courseId/grades/csv
const exportCourseGradesCSV = async (req, res) => {
  const { courseId } = req.params;

  try {
    const { rows } = await db.query(
      `SELECT s.student_number, u.first_name, u.last_name, 
              a.name AS assessment_name, g.score, a.max_score
       FROM enrollments e
       JOIN students s ON s.id = e.student_id
       JOIN users u ON u.id = s.user_id
       JOIN assessments a ON a.course_id = e.course_id
       LEFT JOIN grades g ON g.assessment_id = a.id AND g.enrollment_id = e.id
       WHERE e.course_id = $1
       ORDER BY u.last_name, u.first_name, a.id`,
      [courseId]
    );

    // Group rows by student for CSV format
    const students = {};
    rows.forEach(r => {
      const key = r.student_number;
      if (!students[key]) {
        students[key] = { name: `${r.first_name} ${r.last_name}`, scores: {} };
      }
      students[key].scores[r.assessment_name] = r.score !== null ? `${r.score}/${r.max_score}` : 'N/A';
    });

    // Get unique assessment names for CSV headers
    const assessments = [...new Set(rows.map(r => r.assessment_name))];

    // Build CSV String
    let csv = `Student Number,Name,${assessments.join(',')}\n`;
    Object.keys(students).forEach(sNum => {
      const s = students[sNum];
      const rowScores = assessments.map(a => s.scores[a] || 'N/A');
      csv += `"${sNum}","${s.name}","${rowScores.join('","')}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="course-${courseId}-grades.csv"`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
};

module.exports = { generateStudentReportCard, exportCourseGradesCSV };