import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState({ teachers: [], courses: [], enrollments: [], notices: [] });
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  // Paginated Students State
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const [studentTotalPages, setStudentTotalPages] = useState(1);
  const [studentTotalCount, setStudentTotalCount] = useState(0);
  const [isFetchingStudents, setIsFetchingStudents] = useState(false);

  // Other Pagination (Frontend)
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherPage, setTeacherPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Modals & Loading
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit IDs
  const [editStudentId, setEditStudentId] = useState(null);
  const [editTeacherId, setEditTeacherId] = useState(null);
  const [editCourseId, setEditCourseId] = useState(null);

  // Forms
  const [studentForm, setStudentForm] = useState({ firstName: '', lastName: '', email: '', password: '', studentNumber: '' });
  const [teacherForm, setTeacherForm] = useState({ firstName: '', lastName: '', email: '', password: '', employeeId: '', department: '' });
  const [courseForm, setCourseForm] = useState({ courseCode: '', name: '', credits: 3, teacherId: '' });
  const [enrollForm, setEnrollForm] = useState({ studentId: '', courseId: '' });
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '' });

  // FETCH STUDENTS (Backend Paginated)
  const fetchStudents = async () => {
    setIsFetchingStudents(true);
    try {
      const res = await api.get(`/students?page=${studentPage}&limit=5&search=${studentSearch}`);
      setStudents(res.data.data);
      setStudentTotalPages(res.data.totalPages);
      setStudentTotalCount(res.data.total);
    } catch (err) { toast.error('Failed to fetch students'); } 
    finally { setIsFetchingStudents(false); }
  };

  // FETCH OTHER DATA
  const fetchOtherData = async () => {
    try {
      const [t, c, e, n] = await Promise.all([
        api.get('/teachers'), api.get('/courses'), api.get('/enrollments'), api.get('/notices')
      ]);
      setData({ teachers: t.data, courses: c.data, enrollments: e.data, notices: n.data });
    } catch (err) { toast.error('Failed to fetch data'); }
  };

  useEffect(() => {
    if (activeTab === 'students' || activeTab === 'enrollments') fetchStudents();
    fetchOtherData();
  }, [activeTab, studentPage, studentSearch]);

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  // --- FRONTEND PAGINATION (TEACHERS) ---
  const filteredTeachers = data.teachers.filter(t => t.first_name.toLowerCase().includes(teacherSearch.toLowerCase()) || t.last_name.toLowerCase().includes(teacherSearch.toLowerCase()) || t.employee_id.toLowerCase().includes(teacherSearch.toLowerCase()));
  const currentTeachers = filteredTeachers.slice((teacherPage - 1) * ITEMS_PER_PAGE, teacherPage * ITEMS_PER_PAGE);
  const totalTeacherPages = Math.ceil(filteredTeachers.length / ITEMS_PER_PAGE) || 1;

  // --- SUBMIT HANDLERS ---
  const handleStudentSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      if (editStudentId) { await api.put(`/students/${editStudentId}`, studentForm); toast.success('Student updated!'); } 
      else { await api.post('/students', studentForm); toast.success('Student created!'); }
      setIsStudentModalOpen(false); fetchStudents();
    } catch (err) { toast.error(err.response?.data?.error || 'Operation failed'); } 
    finally { setIsSubmitting(false); }
  };

  const handleTeacherSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      if (editTeacherId) { await api.put(`/teachers/${editTeacherId}`, teacherForm); toast.success('Teacher updated!'); } 
      else { await api.post('/teachers', teacherForm); toast.success('Teacher created!'); }
      setIsTeacherModalOpen(false); fetchOtherData();
    } catch (err) { toast.error(err.response?.data?.error || 'Operation failed'); } 
    finally { setIsSubmitting(false); }
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const payload = { ...courseForm, teacherId: courseForm.teacherId || null };
      if (editCourseId) { await api.put(`/courses/${editCourseId}`, payload); toast.success('Course updated!'); } 
      else { await api.post('/courses', payload); toast.success('Course created!'); }
      setIsCourseModalOpen(false); fetchOtherData();
    } catch (err) { toast.error(err.response?.data?.error || 'Operation failed'); } 
    finally { setIsSubmitting(false); }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      await api.post('/enrollments', enrollForm); 
      setIsEnrollModalOpen(false); setEnrollForm({ studentId: '', courseId: '' }); 
      toast.success('Student enrolled successfully!'); 
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to enroll'); } 
    finally { setIsSubmitting(false); }
  };

  const handleNoticeSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      await api.post('/notices', noticeForm);
      setIsNoticeModalOpen(false); setNoticeForm({ title: '', content: '' });
      toast.success('Notice posted!'); fetchOtherData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to post notice'); } 
    finally { setIsSubmitting(false); }
  };

  // --- DELETE HANDLERS ---
  const handleDeleteStudent = async (id) => { if (!window.confirm("Delete student?")) return; try { await api.delete(`/students/${id}`); toast.success('Student deleted.'); fetchStudents(); } catch (err) { toast.error('Failed to delete'); } };
  const handleDeleteTeacher = async (id) => { if (!window.confirm("Delete teacher?")) return; try { await api.delete(`/teachers/${id}`); toast.success('Teacher deleted.'); fetchOtherData(); } catch (err) { toast.error('Failed to delete'); } };
  const handleDeleteCourse = async (id) => { if (!window.confirm("Delete course?")) return; try { await api.delete(`/courses/${id}`); toast.success('Course deleted.'); fetchOtherData(); } catch (err) { toast.error('Failed to delete'); } };
  const handleDeleteNotice = async (id) => { if (!window.confirm("Delete notice?")) return; try { await api.delete(`/notices/${id}`); toast.success('Notice deleted.'); fetchOtherData(); } catch (err) { toast.error('Failed to delete'); } };

  // --- CHART DATA ---
  const chartData = data.courses.map(course => {
    const enrolledCount = data.enrollments?.filter(e => e.course_id === course.id).length || 0;
    return { name: course.course_code, students: enrolledCount };
  });

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-indigo-900 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-indigo-800">SMS Admin</div>
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          {['dashboard', 'students', 'teachers', 'courses', 'enrollments', 'notices'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left p-3 rounded font-medium capitalize transition ${activeTab === tab ? 'bg-indigo-800' : 'hover:bg-indigo-800'}`}>{tab}</button>
          ))}
        </div>
        <div className="p-4 border-t border-indigo-800">
          <button onClick={handleLogout} className="w-full bg-red-500 hover:bg-red-600 py-2 rounded transition font-medium">Log Out</button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 capitalize">{activeTab === 'dashboard' ? `Welcome, ${user?.firstName}` : `Manage ${activeTab}`}</h1>

        {activeTab === 'dashboard' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl border-l-4 border-indigo-500"><p className="text-gray-500 font-medium">Total Students</p><h3 className="text-3xl font-bold">{studentTotalCount}</h3></div>
              <div className="bg-white p-6 rounded-xl border-l-4 border-green-500"><p className="text-gray-500 font-medium">Total Teachers</p><h3 className="text-3xl font-bold">{data.teachers.length}</h3></div>
              <div className="bg-white p-6 rounded-xl border-l-4 border-purple-500"><p className="text-gray-500 font-medium">Total Courses</p><h3 className="text-3xl font-bold">{data.courses.length}</h3></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-700 mb-6">Students per Course</h2>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip cursor={{ fill: '#f3f4f6' }} /><Bar dataKey="students" fill="#4f46e5" radius={[4, 4, 0, 0]} /></BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="bg-white rounded-xl border p-6">
            <div className="flex justify-between items-center mb-6">
              <input type="text" placeholder="Search students..." value={studentSearch} onChange={e => {setStudentSearch(e.target.value); setStudentPage(1);}} className="p-2 border rounded w-64" />
              <button onClick={() => { setEditStudentId(null); setStudentForm({ firstName: '', lastName: '', email: '', password: '', studentNumber: '' }); setIsStudentModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded">+ Add Student</button>
            </div>
            <table className="w-full text-left"><thead><tr className="bg-gray-50 border-b"><th className="p-4">Student No.</th><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4 text-right">Actions</th></tr></thead>
              <tbody>
                {isFetchingStudents ? (
                  <tr><td colSpan="4" className="text-center py-8 text-gray-500">Loading students...</td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-8 text-gray-500">No students found.</td></tr>
                ) : students.map(s => (
                  <tr key={s.id} className="border-b hover:bg-gray-50"><td className="p-4">{s.student_number}</td><td className="p-4">{s.first_name} {s.last_name}</td><td className="p-4">{s.email}</td><td className="p-4 text-right space-x-3"><button onClick={() => { setEditStudentId(s.id); setStudentForm({ firstName: s.first_name, lastName: s.last_name, email: s.email, password: '', studentNumber: s.student_number }); setIsStudentModalOpen(true); }} className="text-blue-600">Edit</button><button onClick={() => handleDeleteStudent(s.id)} className="text-red-600">Delete</button></td></tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between mt-4"><span>Page {studentPage} of {studentTotalPages} ({studentTotalCount} total)</span><div className="space-x-2"><button disabled={studentPage===1} onClick={() => setStudentPage(studentPage-1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button><button disabled={studentPage===studentTotalPages} onClick={() => setStudentPage(studentPage+1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button></div></div>
          </div>
        )}

        {activeTab === 'teachers' && (
          <div className="bg-white rounded-xl border p-6">
            <div className="flex justify-between items-center mb-6">
              <input type="text" placeholder="Search teachers..." value={teacherSearch} onChange={e => {setTeacherSearch(e.target.value); setTeacherPage(1);}} className="p-2 border rounded w-64" />
              <button onClick={() => { setEditTeacherId(null); setTeacherForm({ firstName: '', lastName: '', email: '', password: '', employeeId: '', department: '' }); setIsTeacherModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded">+ Add Teacher</button>
            </div>
            <table className="w-full text-left"><thead><tr className="bg-gray-50 border-b"><th className="p-4">Employee ID</th><th className="p-4">Name</th><th className="p-4">Department</th><th className="p-4 text-right">Actions</th></tr></thead>
              <tbody>
                {currentTeachers.length === 0 ? (<tr><td colSpan="4" className="text-center py-8 text-gray-500">No teachers found.</td></tr>) : currentTeachers.map(t => (<tr key={t.id} className="border-b hover:bg-gray-50"><td className="p-4">{t.employee_id}</td><td className="p-4">{t.first_name} {t.last_name}</td><td className="p-4">{t.department || '-'}</td><td className="p-4 text-right space-x-3"><button onClick={() => { setEditTeacherId(t.id); setTeacherForm({ firstName: t.first_name, lastName: t.last_name, email: t.email, password: '', employeeId: t.employee_id, department: t.department || '' }); setIsTeacherModalOpen(true); }} className="text-blue-600">Edit</button><button onClick={() => handleDeleteTeacher(t.id)} className="text-red-600">Delete</button></td></tr>))}
              </tbody>
            </table>
            <div className="flex justify-between mt-4"><span>Page {teacherPage} of {totalTeacherPages}</span><div className="space-x-2"><button disabled={teacherPage===1} onClick={() => setTeacherPage(teacherPage-1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button><button disabled={teacherPage===totalTeacherPages} onClick={() => setTeacherPage(teacherPage+1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button></div></div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="bg-white rounded-xl border p-6">
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">Course Catalog</h2><button onClick={() => { setEditCourseId(null); setCourseForm({ courseCode: '', name: '', credits: 3, teacherId: '' }); setIsCourseModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded">+ Create Course</button></div>
            <table className="w-full text-left"><thead><tr className="bg-gray-50 border-b"><th className="p-4">Code</th><th className="p-4">Name</th><th className="p-4">Credits</th><th className="p-4">Teacher</th><th className="p-4 text-right">Actions</th></tr></thead>
              <tbody>{data.courses.map(c => (<tr key={c.id} className="border-b hover:bg-gray-50"><td className="p-4 font-medium">{c.course_code}</td><td className="p-4">{c.name}</td><td className="p-4">{c.credits}</td><td className="p-4">{c.teacher_first ? `${c.teacher_first} ${c.teacher_last}` : 'Unassigned'}</td><td className="p-4 text-right space-x-3"><button onClick={() => { setEditCourseId(c.id); setCourseForm({ courseCode: c.course_code, name: c.name, credits: c.credits, teacherId: c.teacher_id || '' }); setIsCourseModalOpen(true); }} className="text-blue-600">Edit</button><button onClick={() => handleDeleteCourse(c.id)} className="text-red-600">Delete</button></td></tr>))}</tbody>
            </table>
          </div>
        )}

        {activeTab === 'enrollments' && (
          <div className="bg-white rounded-xl border p-6 max-w-2xl">
            <h2 className="text-xl font-bold mb-2">Enroll a Student</h2>
            <p className="text-gray-500 mb-6">Select a student and assign them to an available course.</p>
            <button onClick={() => setIsEnrollModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded">Enroll Student Now</button>
          </div>
        )}

        {activeTab === 'notices' && (
          <div className="bg-white rounded-xl border p-6">
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">Notice Board</h2><button onClick={() => setIsNoticeModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded">+ Post Notice</button></div>
            <div className="space-y-4">
              {data.notices.length === 0 ? (<p className="text-gray-500">No notices posted yet.</p>) : data.notices.map(n => (
                <div key={n.id} className="p-4 border rounded-lg bg-gray-50 relative">
                  <button onClick={() => handleDeleteNotice(n.id)} className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                  <h3 className="font-bold text-lg text-gray-800">{n.title}</h3>
                  <p className="text-gray-600 mt-2">{n.content}</p>
                  <div className="mt-3 text-xs text-gray-400">Posted by {n.first_name} {n.last_name} on {new Date(n.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      <Modal isOpen={isStudentModalOpen} onClose={() => setIsStudentModalOpen(false)} title={editStudentId ? "Edit Student" : "Create Student"}>
        <form onSubmit={handleStudentSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm">First Name</label><input type="text" required value={studentForm.firstName} onChange={e => setStudentForm({...studentForm, firstName: e.target.value})} className="w-full p-2 border rounded"/></div><div><label className="block text-sm">Last Name</label><input type="text" required value={studentForm.lastName} onChange={e => setStudentForm({...studentForm, lastName: e.target.value})} className="w-full p-2 border rounded"/></div></div>
          <div><label className="block text-sm">Student Number</label><input type="text" required value={studentForm.studentNumber} onChange={e => setStudentForm({...studentForm, studentNumber: e.target.value})} className="w-full p-2 border rounded"/></div>
          <div><label className="block text-sm">Email</label><input type="email" required value={studentForm.email} onChange={e => setStudentForm({...studentForm, email: e.target.value})} className="w-full p-2 border rounded"/></div>
          {!editStudentId && <div><label className="block text-sm">Password</label><input type="password" required value={studentForm.password} onChange={e => setStudentForm({...studentForm, password: e.target.value})} className="w-full p-2 border rounded"/></div>}
          <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-2 rounded disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Save Student'}</button>
        </form>
      </Modal>

      <Modal isOpen={isTeacherModalOpen} onClose={() => setIsTeacherModalOpen(false)} title={editTeacherId ? "Edit Teacher" : "Create Teacher"}>
        <form onSubmit={handleTeacherSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm">First Name</label><input type="text" required value={teacherForm.firstName} onChange={e => setTeacherForm({...teacherForm, firstName: e.target.value})} className="w-full p-2 border rounded"/></div><div><label className="block text-sm">Last Name</label><input type="text" required value={teacherForm.lastName} onChange={e => setTeacherForm({...teacherForm, lastName: e.target.value})} className="w-full p-2 border rounded"/></div></div>
          <div><label className="block text-sm">Employee ID</label><input type="text" required value={teacherForm.employeeId} onChange={e => setTeacherForm({...teacherForm, employeeId: e.target.value})} className="w-full p-2 border rounded"/></div>
          <div><label className="block text-sm">Department</label><input type="text" value={teacherForm.department} onChange={e => setTeacherForm({...teacherForm, department: e.target.value})} className="w-full p-2 border rounded"/></div>
          <div><label className="block text-sm">Email</label><input type="email" required value={teacherForm.email} onChange={e => setTeacherForm({...teacherForm, email: e.target.value})} className="w-full p-2 border rounded"/></div>
          {!editTeacherId && <div><label className="block text-sm">Password</label><input type="password" required value={teacherForm.password} onChange={e => setTeacherForm({...teacherForm, password: e.target.value})} className="w-full p-2 border rounded"/></div>}
          <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-2 rounded disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Save Teacher'}</button>
        </form>
      </Modal>

      <Modal isOpen={isCourseModalOpen} onClose={() => setIsCourseModalOpen(false)} title={editCourseId ? "Edit Course" : "Create Course"}>
        <form onSubmit={handleCourseSubmit} className="space-y-4">
          <div><label className="block text-sm">Course Code</label><input type="text" required value={courseForm.courseCode} onChange={e => setCourseForm({...courseForm, courseCode: e.target.value})} className="w-full p-2 border rounded"/></div>
          <div><label className="block text-sm">Course Name</label><input type="text" required value={courseForm.name} onChange={e => setCourseForm({...courseForm, name: e.target.value})} className="w-full p-2 border rounded"/></div>
          <div><label className="block text-sm">Credits</label><input type="number" required value={courseForm.credits} onChange={e => setCourseForm({...courseForm, credits: parseInt(e.target.value)})} className="w-full p-2 border rounded"/></div>
          <div><label className="block text-sm">Assign Teacher</label><select value={courseForm.teacherId} onChange={e => setCourseForm({...courseForm, teacherId: e.target.value})} className="w-full p-2 border rounded bg-white"><option value="">-- Unassigned --</option>{data.teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}</select></div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-2 rounded disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Save Course'}</button>
        </form>
      </Modal>

      <Modal isOpen={isEnrollModalOpen} onClose={() => setIsEnrollModalOpen(false)} title="Enroll Student">
        <form onSubmit={handleEnrollStudent} className="space-y-4">
          <div><label className="block text-sm">Select Student</label><select required value={enrollForm.studentId} onChange={e => setEnrollForm({...enrollForm, studentId: e.target.value})} className="w-full p-2 border rounded bg-white"><option value="">-- Choose Student --</option>{students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select></div>
          <div><label className="block text-sm">Select Course</label><select required value={enrollForm.courseId} onChange={e => setEnrollForm({...enrollForm, courseId: e.target.value})} className="w-full p-2 border rounded bg-white"><option value="">-- Choose Course --</option>{data.courses.map(c => <option key={c.id} value={c.id}>{c.course_code} - {c.name}</option>)}</select></div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-2 rounded disabled:opacity-50">{isSubmitting ? 'Enrolling...' : 'Enroll Student'}</button>
        </form>
      </Modal>

      <Modal isOpen={isNoticeModalOpen} onClose={() => setIsNoticeModalOpen(false)} title="Post a Notice">
        <form onSubmit={handleNoticeSubmit} className="space-y-4">
          <div><label className="block text-sm">Title</label><input type="text" required value={noticeForm.title} onChange={e => setNoticeForm({...noticeForm, title: e.target.value})} className="w-full p-2 border rounded" placeholder="e.g. Final Exams Schedule" /></div>
          <div><label className="block text-sm">Message</label><textarea required rows="4" value={noticeForm.content} onChange={e => setNoticeForm({...noticeForm, content: e.target.value})} className="w-full p-2 border rounded" placeholder="Write your announcement here..."></textarea></div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-2 rounded disabled:opacity-50">{isSubmitting ? 'Posting...' : 'Post Notice'}</button>
        </form>
      </Modal>
    </div>
  );
}