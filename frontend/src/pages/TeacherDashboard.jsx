import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [notices, setNotices] = useState([]); // <-- NOTICES STATE
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const [loading, setLoading] = useState(false);

  // Attendance
  const [attCourse, setAttCourse] = useState('');
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attRecords, setAttRecords] = useState({});

  // Assessments
  const [assCourse, setAssCourse] = useState('');
  const [assForm, setAssForm] = useState({ name: '', assessmentType: 'quiz', maxScore: 100, weight: 1 });

  // Grading
  const [gradeCourse, setGradeCourse] = useState('');
  const [gradeAssessments, setGradeAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [gradeRecords, setGradeRecords] = useState({});

  const fetchData = async () => {
    try {
      const [cRes, eRes, nRes] = await Promise.all([
        api.get('/courses'), 
        api.get('/enrollments'),
        api.get('/notices') // <-- FETCH NOTICES
      ]);
      setCourses(cRes.data);
      setEnrollments(eRes.data);
      setNotices(nRes.data); // <-- SET NOTICES
      if (cRes.data.length > 0) {
        setAttCourse(cRes.data[0].id);
        setAssCourse(cRes.data[0].id);
        setGradeCourse(cRes.data[0].id);
      }
    } catch (err) { toast.error('Failed to load data'); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (activeTab === 'attendance' && attCourse && attDate) {
      const fetchExisting = async () => {
        try {
          const res = await api.get(`/courses/${attCourse}/attendance?date=${attDate}`);
          const existing = {};
          res.data.records.forEach(r => { if (r.status) existing[r.student_id] = r.status; });
          setAttRecords(existing);
        } catch (err) { console.error(err); }
      };
      fetchExisting();
    }
  }, [attCourse, attDate, activeTab]);

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

  useEffect(() => {
    if (selectedAssessment) {
      const fetchGrades = async () => {
        try {
          const res = await api.get(`/courses/${gradeCourse}/grades`);
          const existing = {};
          res.data.students.forEach(s => { if (s.grades[selectedAssessment] !== undefined) existing[s.studentId] = s.grades[selectedAssessment]; });
          setGradeRecords(existing);
        } catch (err) { console.error(err); }
      };
      fetchGrades();
    }
  }, [selectedAssessment, gradeCourse]);

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  const submitAttendance = async (e) => {
    e.preventDefault(); setLoading(true);
    const formatted = Object.keys(attRecords).filter(id => attRecords[id]).map(id => ({ studentId: parseInt(id), status: attRecords[id] }));
    if (formatted.length === 0) { toast.error('Mark at least one student.'); setLoading(false); return; }
    try {
      await api.post(`/courses/${attCourse}/attendance`, { date: attDate, records: formatted });
      toast.success('Attendance saved!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save'); } finally { setLoading(false); }
  };

  const submitAssessment = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post(`/courses/${assCourse}/assessments`, assForm);
      toast.success('Assessment created!'); setAssForm({ name: '', assessmentType: 'quiz', maxScore: 100, weight: 1 });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); } finally { setLoading(false); }
  };

  const submitGrades = async (e) => {
    e.preventDefault(); setLoading(true);
    const formatted = Object.keys(gradeRecords).filter(id => gradeRecords[id] !== '').map(id => ({ studentId: parseInt(id), score: parseFloat(gradeRecords[id]) }));
    if (formatted.length === 0) { toast.error('Enter at least one grade.'); setLoading(false); return; }
    try {
      await api.post(`/assessments/${selectedAssessment}/grades`, { records: formatted });
      toast.success('Grades saved!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); } finally { setLoading(false); }
  };

  const downloadAttendanceCSV = async () => {
    try {
      const res = await api.get(`/courses/${attCourse}/attendance/csv`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Attendance_Course_${attCourse}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { toast.error("Failed to download CSV"); }
  };

  const getStudentsForCourse = (courseId) => enrollments.filter(e => e.course_id === parseInt(courseId));

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-emerald-900 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-emerald-800">Teacher Portal</div>
        <div className="p-4 text-sm text-emerald-200">Logged in: {user?.firstName} {user?.lastName}</div>
        <div className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('attendance')} className={`w-full text-left p-3 rounded font-medium ${activeTab === 'attendance' ? 'bg-emerald-800' : 'hover:bg-emerald-800'}`}>Take Attendance</button>
          <button onClick={() => setActiveTab('assessments')} className={`w-full text-left p-3 rounded font-medium ${activeTab === 'assessments' ? 'bg-emerald-800' : 'hover:bg-emerald-800'}`}>Create Assessment</button>
          <button onClick={() => setActiveTab('grades')} className={`w-full text-left p-3 rounded font-medium ${activeTab === 'grades' ? 'bg-emerald-800' : 'hover:bg-emerald-800'}`}>Enter Grades</button>
        </div>
        <div className="p-4 border-t border-emerald-800"><button onClick={handleLogout} className="w-full bg-red-500 hover:bg-red-600 py-2 rounded">Log Out</button></div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-8">{activeTab === 'attendance' ? 'Take Attendance' : activeTab === 'assessments' ? 'Create Assessment' : 'Enter Grades'}</h1>

        {/* --- NOTICES BANNER HERE --- */}
        {notices.length > 0 && (
          <div className="mb-8 space-y-4">
            {notices.slice(0, 3).map(n => (
              <div key={n.id} className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded shadow-sm">
                <h3 className="font-bold text-emerald-800">{n.title}</h3>
                <p className="text-emerald-700 text-sm mt-1">{n.content}</p>
                <p className="text-xs text-emerald-600 mt-2">Posted: {new Date(n.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}

        {courses.length === 0 ? (
          <div className="bg-white p-6 rounded border text-gray-500">No courses assigned to you yet.</div>
        ) : (
          <>
            {activeTab === 'attendance' && (
              <div className="bg-white rounded-xl border p-6">
                <button onClick={downloadAttendanceCSV} className="mb-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-medium">
                  📥 Export Attendance to CSV
                </button>
                <form onSubmit={submitAttendance}>
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1"><label className="block text-sm font-medium">Course</label><select value={attCourse} onChange={e => setAttCourse(e.target.value)} className="w-full p-2 border rounded bg-white">{courses.map(c => <option key={c.id} value={c.id}>{c.course_code}</option>)}</select></div>
                    <div className="flex-1"><label className="block text-sm font-medium">Date</label><input type="date" value={attDate} onChange={e => setAttDate(e.target.value)} className="w-full p-2 border rounded" /></div>
                  </div>
                  <div className="space-y-3">
                    {getStudentsForCourse(attCourse).length === 0 ? (
                      <p className="text-gray-500">No students enrolled in this course.</p>
                    ) : getStudentsForCourse(attCourse).map(s => (
                      <div key={s.student_id} className="flex justify-between p-3 bg-gray-50 border rounded">
                        <span>{s.student_first} {s.student_last}</span>
                        <div className="flex gap-4">
                          {['present', 'absent', 'late'].map(status => (
                            <label key={status} className="flex items-center gap-1 capitalize text-sm">
                              <input type="radio" name={`att_${s.student_id}`} value={status} checked={attRecords[s.student_id] === status} onChange={() => setAttRecords({...attRecords, [s.student_id]: status})} /> {status}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    {getStudentsForCourse(attCourse).length > 0 && (
                      <button type="submit" disabled={loading} className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded disabled:opacity-50">{loading ? 'Saving...' : 'Submit Attendance'}</button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'assessments' && (
              <div className="bg-white rounded-xl border p-6 max-w-2xl">
                <form onSubmit={submitAssessment} className="space-y-4">
                  <div><label className="block text-sm">Course</label><select value={assCourse} onChange={e => setAssCourse(e.target.value)} className="w-full p-2 border rounded bg-white">{courses.map(c => <option key={c.id} value={c.id}>{c.course_code}</option>)}</select></div>
                  <div><label className="block text-sm">Name</label><input type="text" required value={assForm.name} onChange={e => setAssForm({...assForm, name: e.target.value})} className="w-full p-2 border rounded" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm">Type</label><select value={assForm.assessmentType} onChange={e => setAssForm({...assForm, assessmentType: e.target.value})} className="w-full p-2 border rounded bg-white"><option value="quiz">Quiz</option><option value="midterm">Midterm</option><option value="final">Final</option></select></div>
                    <div><label className="block text-sm">Max Score</label><input type="number" required value={assForm.maxScore} onChange={e => setAssForm({...assForm, maxScore: parseInt(e.target.value)})} className="w-full p-2 border rounded" /></div>
                  </div>
                  <button type="submit" disabled={loading} className="bg-emerald-600 text-white px-6 py-2 rounded disabled:opacity-50">{loading ? 'Creating...' : 'Create'}</button>
                </form>
              </div>
            )}

            {activeTab === 'grades' && (
              <div className="bg-white rounded-xl border p-6">
                <form onSubmit={submitGrades}>
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1"><label className="block text-sm">Course</label><select value={gradeCourse} onChange={e => setGradeCourse(e.target.value)} className="w-full p-2 border rounded bg-white">{courses.map(c => <option key={c.id} value={c.id}>{c.course_code}</option>)}</select></div>
                    <div className="flex-1"><label className="block text-sm">Assessment</label><select value={selectedAssessment} onChange={e => setSelectedAssessment(e.target.value)} className="w-full p-2 border rounded bg-white"><option value="">-- Choose --</option>{gradeAssessments.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
                  </div>
                  {selectedAssessment && (
                    <div className="space-y-3">
                      {getStudentsForCourse(gradeCourse).length === 0 ? (
                        <p className="text-gray-500">No students enrolled.</p>
                      ) : getStudentsForCourse(gradeCourse).map(s => (
                        <div key={s.student_id} className="flex justify-between p-3 bg-gray-50 border rounded">
                          <span>{s.student_first} {s.student_last}</span>
                          <input type="number" step="0.1" placeholder="Score" value={gradeRecords[s.student_id] || ''} onChange={e => setGradeRecords({...gradeRecords, [s.student_id]: e.target.value})} className="w-24 p-2 border rounded text-center" />
                        </div>
                      ))}
                      {getStudentsForCourse(gradeCourse).length > 0 && (
                        <button type="submit" disabled={loading} className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded disabled:opacity-50">{loading ? 'Saving...' : 'Submit Grades'}</button>
                      )}
                    </div>
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