import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  // UI States
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- ATTENDANCE STATES ---
  const [attCourse, setAttCourse] = useState('');
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attRecords, setAttRecords] = useState({}); // { studentId: 'present' }

  // --- ASSESSMENT STATES ---
  const [assCourse, setAssCourse] = useState('');
  const [assForm, setAssForm] = useState({ name: '', assessmentType: 'quiz', maxScore: 100, weight: 1 });

  // --- GRADING STATES ---
  const [gradeCourse, setGradeCourse] = useState('');
  const [gradeAssessments, setGradeAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [gradeRecords, setGradeRecords] = useState({}); // { studentId: score }

  const fetchData = async () => {
    try {
      const [cRes, eRes] = await Promise.all([api.get('/courses'), api.get('/enrollments')]);
      setCourses(cRes.data);
      setEnrollments(eRes.data);
      
      // Auto-select first course for forms
      if (cRes.data.length > 0) {
        setAttCourse(cRes.data[0].id);
        setAssCourse(cRes.data[0].id);
        setGradeCourse(cRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Fetch assessments when a course is selected in the grading tab
  useEffect(() => {
    if (activeTab === 'grades' && gradeCourse) {
      const fetchAssessments = async () => {
        try {
          const res = await api.get(`/courses/${gradeCourse}/assessments`);
          setGradeAssessments(res.data);
          if (res.data.length > 0) setSelectedAssessment(res.data[0].id);
          else setSelectedAssessment('');
        } catch (err) { console.error(err); }
      };
      fetchAssessments();
    }
  }, [gradeCourse, activeTab]);

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  // --- SUBMIT FUNCTIONS ---
  const submitAttendance = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); setSuccessMsg('');
    
    // Format records for the API: [{ studentId, status }]
    const formattedRecords = Object.keys(attRecords).map(id => ({
      studentId: parseInt(id),
      status: attRecords[id]
    }));

    if (formattedRecords.length === 0) {
      setError('Please mark attendance for at least one student.'); setLoading(false); return;
    }

    try {
      await api.post(`/courses/${attCourse}/attendance`, { date: attDate, records: formattedRecords });
      setSuccessMsg('Attendance saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save attendance');
    } finally {
      setLoading(false);
    }
  };

  const submitAssessment = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); setSuccessMsg('');
    try {
      await api.post(`/courses/${assCourse}/assessments`, assForm);
      setSuccessMsg('Assessment created successfully!');
      setAssForm({ name: '', assessmentType: 'quiz', maxScore: 100, weight: 1 });
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create assessment');
    } finally {
      setLoading(false);
    }
  };

  const submitGrades = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); setSuccessMsg('');

    const formattedRecords = Object.keys(gradeRecords)
      .filter(id => gradeRecords[id] !== '')
      .map(id => ({
        studentId: parseInt(id),
        score: parseFloat(gradeRecords[id])
      }));

    if (formattedRecords.length === 0) {
      setError('Please enter at least one grade.'); setLoading(false); return;
    }

    try {
      await api.post(`/assessments/${selectedAssessment}/grades`, { records: formattedRecords });
      setSuccessMsg('Grades saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save grades');
    } finally {
      setLoading(false);
    }
  };

  // Filter students based on selected course
  const getStudentsForCourse = (courseId) => {
    return enrollments.filter(e => e.course_id === parseInt(courseId));
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-emerald-900 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-emerald-800">Teacher Portal</div>
        <div className="p-4 text-sm text-emerald-200">Logged in as: {user?.firstName} {user?.lastName}</div>
        <div className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('attendance')} className={`w-full text-left p-3 rounded font-medium transition ${activeTab === 'attendance' ? 'bg-emerald-800' : 'hover:bg-emerald-800'}`}>Take Attendance</button>
          <button onClick={() => setActiveTab('assessments')} className={`w-full text-left p-3 rounded font-medium transition ${activeTab === 'assessments' ? 'bg-emerald-800' : 'hover:bg-emerald-800'}`}>Create Assessment</button>
          <button onClick={() => setActiveTab('grades')} className={`w-full text-left p-3 rounded font-medium transition ${activeTab === 'grades' ? 'bg-emerald-800' : 'hover:bg-emerald-800'}`}>Enter Grades</button>
        </div>
        <div className="p-4 border-t border-emerald-800">
          <button onClick={handleLogout} className="w-full bg-red-500 hover:bg-red-600 py-2 rounded transition font-medium">Log Out</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          {activeTab === 'attendance' && 'Take Attendance'}
          {activeTab === 'assessments' && 'Create New Assessment'}
          {activeTab === 'grades' && 'Enter Student Grades'}
        </h1>

        {successMsg && <div className="bg-green-100 text-green-700 p-3 rounded mb-6 font-medium">{successMsg}</div>}
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-6 font-medium">{error}</div>}

        {courses.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">You have no assigned courses.</div>
        ) : (
          <>
            {/* --- ATTENDANCE TAB --- */}
            {activeTab === 'attendance' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <form onSubmit={submitAttendance}>
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">Select Course</label>
                      <select required value={attCourse} onChange={(e) => { setAttCourse(e.target.value); setAttRecords({}); }} className="mt-1 w-full p-2 border rounded bg-white">
                        {courses.map(c => <option key={c.id} value={c.id}>{c.course_code} - {c.name}</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <input type="date" required value={attDate} onChange={(e) => setAttDate(e.target.value)} className="mt-1 w-full p-2 border rounded" />
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-700 border-b pb-2 mb-4">Student List</h3>
                  {getStudentsForCourse(attCourse).length === 0 ? (
                    <p className="text-gray-500">No students enrolled in this course yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {getStudentsForCourse(attCourse).map(student => (
                        <div key={student.student_id} className="flex justify-between items-center p-3 bg-gray-50 border rounded">
                          <span className="font-medium text-gray-800">{student.student_first} {student.student_last} ({student.student_number})</span>
                          <div className="flex gap-4">
                            {['present', 'absent', 'late'].map(status => (
                              <label key={status} className="flex items-center gap-1 cursor-pointer capitalize text-sm font-medium text-gray-700">
                                <input type="radio" name={`att_${student.student_id}`} value={status} required
                                  checked={attRecords[student.student_id] === status}
                                  onChange={() => setAttRecords({...attRecords, [student.student_id]: status})} 
                                /> {status}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button type="submit" disabled={loading} className="mt-6 bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700 transition font-medium">
                        {loading ? 'Saving...' : 'Submit Attendance'}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* --- ASSESSMENTS TAB --- */}
            {activeTab === 'assessments' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
                <form onSubmit={submitAssessment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Select Course</label>
                    <select required value={assCourse} onChange={(e) => setAssCourse(e.target.value)} className="mt-1 w-full p-2 border rounded bg-white">
                      {courses.map(c => <option key={c.id} value={c.id}>{c.course_code} - {c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assessment Name</label>
                    <input type="text" required placeholder="e.g. Midterm Exam" value={assForm.name} onChange={(e) => setAssForm({...assForm, name: e.target.value})} className="mt-1 w-full p-2 border rounded" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <select value={assForm.assessmentType} onChange={(e) => setAssForm({...assForm, assessmentType: e.target.value})} className="mt-1 w-full p-2 border rounded bg-white">
                        <option value="quiz">Quiz</option>
                        <option value="assignment">Assignment</option>
                        <option value="midterm">Midterm</option>
                        <option value="final">Final Exam</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max Score</label>
                      <input type="number" required min="1" value={assForm.maxScore} onChange={(e) => setAssForm({...assForm, maxScore: parseInt(e.target.value)})} className="mt-1 w-full p-2 border rounded" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700 transition font-medium">
                    {loading ? 'Creating...' : 'Create Assessment'}
                  </button>
                </form>
              </div>
            )}

            {/* --- GRADING TAB --- */}
            {activeTab === 'grades' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <form onSubmit={submitGrades}>
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">Select Course</label>
                      <select required value={gradeCourse} onChange={(e) => { setGradeCourse(e.target.value); setGradeRecords({}); }} className="mt-1 w-full p-2 border rounded bg-white">
                        {courses.map(c => <option key={c.id} value={c.id}>{c.course_code} - {c.name}</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">Select Assessment</label>
                      <select required value={selectedAssessment} onChange={(e) => { setSelectedAssessment(e.target.value); setGradeRecords({}); }} className="mt-1 w-full p-2 border rounded bg-white">
                        <option value="">-- Choose Assessment --</option>
                        {gradeAssessments.map(a => <option key={a.id} value={a.id}>{a.name} (Max: {a.max_score})</option>)}
                      </select>
                    </div>
                  </div>

                  {selectedAssessment && (
                    <>
                      <h3 className="font-bold text-gray-700 border-b pb-2 mb-4">Enter Scores</h3>
                      {getStudentsForCourse(gradeCourse).length === 0 ? (
                        <p className="text-gray-500">No students enrolled.</p>
                      ) : (
                        <div className="space-y-3">
                          {getStudentsForCourse(gradeCourse).map(student => (
                            <div key={student.student_id} className="flex justify-between items-center p-3 bg-gray-50 border rounded">
                              <span className="font-medium text-gray-800">{student.student_first} {student.student_last}</span>
                              <input type="number" step="0.1" min="0" placeholder="Score" 
                                value={gradeRecords[student.student_id] || ''} 
                                onChange={(e) => setGradeRecords({...gradeRecords, [student.student_id]: e.target.value})}
                                className="w-24 p-2 border rounded text-center" 
                              />
                            </div>
                          ))}
                          <button type="submit" disabled={loading} className="mt-6 bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700 transition font-medium">
                            {loading ? 'Saving...' : 'Submit Grades'}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}