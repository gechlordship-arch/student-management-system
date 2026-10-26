import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Modal from '../components/Modal';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState({ students: [], teachers: [], courses: [] });
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  // --- PAGINATION & SEARCH STATES ---
  const [studentSearch, setStudentSearch] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherPage, setTeacherPage] = useState(1);
  const ITEMS_PER_PAGE = 5; // Change this to show more/less per page

  // Modal & Error States
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit States
  const [editStudentId, setEditStudentId] = useState(null);
  const [editTeacherId, setEditTeacherId] = useState(null);

  // Form States
  const [studentForm, setStudentForm] = useState({ firstName: '', lastName: '', email: '', password: '', studentNumber: '', dateOfBirth: '' });
  const [teacherForm, setTeacherForm] = useState({ firstName: '', lastName: '', email: '', password: '', employeeId: '', department: '' });
  const [courseForm, setCourseForm] = useState({ courseCode: '', name: '', credits: 3, teacherId: '' });
  const [enrollForm, setEnrollForm] = useState({ studentId: '', courseId: '' });

  const fetchData = async () => {
    try {
      const [s, t, c] = await Promise.all([
        api.get('/students'), api.get('/teachers'), api.get('/courses')
      ]);
      setData({ students: s.data, teachers: t.data, courses: c.data });
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // --- SEARCH & PAGINATION LOGIC ---
  // 1. Filter data based on search term
  const filteredStudents = data.students.filter(s => 
    s.first_name.toLowerCase().includes(studentSearch.toLowerCase()) || 
    s.last_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.student_number.toLowerCase().includes(studentSearch.toLowerCase())
  );
  const filteredTeachers = data.teachers.filter(t => 
    t.first_name.toLowerCase().includes(teacherSearch.toLowerCase()) || 
    t.last_name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    t.employee_id.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  // 2. Calculate Pagination
  const indexOfLastStudent = studentPage * ITEMS_PER_PAGE;
  const indexOfFirstStudent = indexOfLastStudent - ITEMS_PER_PAGE;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalStudentPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);

  const indexOfLastTeacher = teacherPage * ITEMS_PER_PAGE;
  const indexOfFirstTeacher = indexOfLastTeacher - ITEMS_PER_PAGE;
  const currentTeachers = filteredTeachers.slice(indexOfFirstTeacher, indexOfLastTeacher);
  const totalTeacherPages = Math.ceil(filteredTeachers.length / ITEMS_PER_PAGE);

  // Reset page to 1 when searching
  const handleStudentSearch = (e) => { setStudentSearch(e.target.value); setStudentPage(1); };
  const handleTeacherSearch = (e) => { setTeacherSearch(e.target.value); setTeacherPage(1); };

  // --- STUDENT ACTIONS ---
  const openAddStudent = () => {
    setEditStudentId(null);
    setStudentForm({ firstName: '', lastName: '', email: '', password: '', studentNumber: '' });
    setIsStudentModalOpen(true);
  };

  const openEditStudent = (student) => {
    setEditStudentId(student.id);
    setStudentForm({ firstName: student.first_name, lastName: student.last_name, email: student.email, password: '', studentNumber: student.student_number });
    setIsStudentModalOpen(true);
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editStudentId) { await api.put(`/students/${editStudentId}`, studentForm); showSuccess('Student updated!'); } 
      else { await api.post('/students', studentForm); showSuccess('Student created!'); }
      setIsStudentModalOpen(false); fetchData();
    } catch (err) { setError(err.response?.data?.error || 'Operation failed'); }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try { await api.delete(`/students/${id}`); showSuccess('Student deleted.'); fetchData(); } 
    catch (err) { alert('Failed to delete student'); }
  };

  // --- TEACHER ACTIONS ---
  const openAddTeacher = () => {
    setEditTeacherId(null);
    setTeacherForm({ firstName: '', lastName: '', email: '', password: '', employeeId: '', department: '' });
    setIsTeacherModalOpen(true);
  };

  const openEditTeacher = (teacher) => {
    setEditTeacherId(teacher.id);
    setTeacherForm({ firstName: teacher.first_name, lastName: teacher.last_name, email: teacher.email, password: '', employeeId: teacher.employee_id, department: teacher.department || '' });
    setIsTeacherModalOpen(true);
  };

  const handleTeacherSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editTeacherId) { await api.put(`/teachers/${editTeacherId}`, teacherForm); showSuccess('Teacher updated!'); } 
      else { await api.post('/teachers', teacherForm); showSuccess('Teacher created!'); }
      setIsTeacherModalOpen(false); fetchData();
    } catch (err) { setError(err.response?.data?.error || 'Operation failed'); }
  };

  const handleDeleteTeacher = async (id) => {
    if (!window.confirm("Are you sure you want to delete this teacher?")) return;
    try { await api.delete(`/teachers/${id}`); showSuccess('Teacher deleted.'); fetchData(); } 
    catch (err) { alert('Failed to delete teacher'); }
  };

  // --- COURSE & ENROLL ACTIONS ---
  const handleCreateCourse = async (e) => {
    e.preventDefault(); setError('');
    try {
      const payload = { ...courseForm, teacherId: courseForm.teacherId || null };
      await api.post('/courses', payload);
      setIsCourseModalOpen(false); setCourseForm({ courseCode: '', name: '', credits: 3, teacherId: '' });
      showSuccess('Course created!'); fetchData();
    } catch (err) { setError(err.response?.data?.error || 'Failed to create course'); }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api.post('/enrollments', enrollForm);
      setIsEnrollModalOpen(false); setEnrollForm({ studentId: '', courseId: '' });
      showSuccess('Student successfully enrolled!');
    } catch (err) { setError(err.response?.data?.error || 'Failed to enroll student'); }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-900 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-indigo-800">SMS Admin</div>
        <div className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left p-3 rounded font-medium transition ${activeTab === 'dashboard' ? 'bg-indigo-800' : 'hover:bg-indigo-800'}`}>Dashboard</button>
          <button onClick={() => setActiveTab('students')} className={`w-full text-left p-3 rounded font-medium transition ${activeTab === 'students' ? 'bg-indigo-800' : 'hover:bg-indigo-800'}`}>Students</button>
          <button onClick={() => setActiveTab('teachers')} className={`w-full text-left p-3 rounded font-medium transition ${activeTab === 'teachers' ? 'bg-indigo-800' : 'hover:bg-indigo-800'}`}>Teachers</button>
          <button onClick={() => setActiveTab('courses')} className={`w-full text-left p-3 rounded font-medium transition ${activeTab === 'courses' ? 'bg-indigo-800' : 'hover:bg-indigo-800'}`}>Courses</button>
          <button onClick={() => setActiveTab('enrollments')} className={`w-full text-left p-3 rounded font-medium transition ${activeTab === 'enrollments' ? 'bg-indigo-800' : 'hover:bg-indigo-800'}`}>Enrollments</button>
        </div>
        <div className="p-4 border-t border-indigo-800">
          <button onClick={handleLogout} className="w-full bg-red-500 hover:bg-red-600 py-2 rounded transition font-medium">Log Out</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 capitalize">
          {activeTab === 'dashboard' ? `Welcome, ${user?.firstName}` : `Manage ${activeTab}`}
        </h1>

        {successMsg && <div className="bg-green-100 text-green-700 p-3 rounded mb-6 font-medium">{successMsg}</div>}

        {/* --- DASHBOARD TAB --- */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-indigo-500"><p className="text-gray-500 font-medium">Total Students</p><h3 className="text-3xl font-bold text-gray-800">{data.students.length}</h3></div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500"><p className="text-gray-500 font-medium">Total Teachers</p><h3 className="text-3xl font-bold text-gray-800">{data.teachers.length}</h3></div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500"><p className="text-gray-500 font-medium">Total Courses</p><h3 className="text-3xl font-bold text-gray-800">{data.courses.length}</h3></div>
          </div>
        )}

        {/* --- STUDENTS TAB --- */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-700">Student Directory</h2>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Search by name or ID..." 
                  value={studentSearch}
                  onChange={handleStudentSearch}
                  className="p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 w-64"
                />
                <button onClick={openAddStudent} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition whitespace-nowrap">+ Add Student</button>
              </div>
            </div>
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 font-semibold text-gray-600">Student No.</th>
                  <th className="p-4 font-semibold text-gray-600">Name</th>
                  <th className="p-4 font-semibold text-gray-600">Email</th>
                  <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentStudents.length === 0 ? (
                  <tr><td colSpan="4" className="p-4 text-center text-gray-500">No students found.</td></tr>
                ) : currentStudents.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">{s.student_number}</td>
                    <td className="p-4 text-gray-800">{s.first_name} {s.last_name}</td>
                    <td className="p-4 text-gray-600">{s.email}</td>
                    <td className="p-4 text-right space-x-3">
                      <button onClick={() => openEditStudent(s)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">Edit</button>
                      <button onClick={() => handleDeleteStudent(s.id)} className="text-red-600 hover:text-red-800 font-medium text-sm">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Student Pagination Controls */}
            <div className="flex justify-between items-center mt-6">
              <span className="text-sm text-gray-600">Showing page {studentPage} of {totalStudentPages || 1} ({filteredStudents.length} results)</span>
              <div className="flex gap-2">
                <button disabled={studentPage === 1} onClick={() => setStudentPage(studentPage - 1)} className="px-4 py-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 transition">Previous</button>
                <button disabled={studentPage >= totalStudentPages} onClick={() => setStudentPage(studentPage + 1)} className="px-4 py-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 transition">Next</button>
              </div>
            </div>
          </div>
        )}

        {/* --- TEACHERS TAB --- */}
        {activeTab === 'teachers' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-700">Teacher Directory</h2>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Search by name or ID..." 
                  value={teacherSearch}
                  onChange={handleTeacherSearch}
                  className="p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 w-64"
                />
                <button onClick={openAddTeacher} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition whitespace-nowrap">+ Add Teacher</button>
              </div>
            </div>
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 font-semibold text-gray-600">Employee ID</th>
                  <th className="p-4 font-semibold text-gray-600">Name</th>
                  <th className="p-4 font-semibold text-gray-600">Department</th>
                  <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentTeachers.length === 0 ? (
                  <tr><td colSpan="4" className="p-4 text-center text-gray-500">No teachers found.</td></tr>
                ) : currentTeachers.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">{t.employee_id}</td>
                    <td className="p-4 text-gray-800">{t.first_name} {t.last_name}</td>
                    <td className="p-4 text-gray-600">{t.department || '-'}</td>
                    <td className="p-4 text-right space-x-3">
                      <button onClick={() => openEditTeacher(t)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">Edit</button>
                      <button onClick={() => handleDeleteTeacher(t.id)} className="text-red-600 hover:text-red-800 font-medium text-sm">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Teacher Pagination Controls */}
            <div className="flex justify-between items-center mt-6">
              <span className="text-sm text-gray-600">Showing page {teacherPage} of {totalTeacherPages || 1} ({filteredTeachers.length} results)</span>
              <div className="flex gap-2">
                <button disabled={teacherPage === 1} onClick={() => setTeacherPage(teacherPage - 1)} className="px-4 py-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 transition">Previous</button>
                <button disabled={teacherPage >= totalTeacherPages} onClick={() => setTeacherPage(teacherPage + 1)} className="px-4 py-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 transition">Next</button>
              </div>
            </div>
          </div>
        )}

        {/* --- COURSES TAB --- */}
        {activeTab === 'courses' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-700">Course Catalog</h2>
              <button onClick={() => setIsCourseModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition">+ Create Course</button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 font-semibold text-gray-600">Code</th><th className="p-4 font-semibold text-gray-600">Course Name</th><th className="p-4 font-semibold text-gray-600">Credits</th><th className="p-4 font-semibold text-gray-600">Teacher</th>
                </tr>
              </thead>
              <tbody>
                {data.courses.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">{c.course_code}</td>
                    <td className="p-4 text-gray-800">{c.name}</td>
                    <td className="p-4 text-gray-600">{c.credits}</td>
                    <td className="p-4 text-gray-600">{c.teacher_first ? `${c.teacher_first} ${c.teacher_last}` : 'Unassigned'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- ENROLLMENTS TAB --- */}
        {activeTab === 'enrollments' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
            <h2 className="text-xl font-bold text-gray-700 mb-2">Enroll a Student</h2>
            <p className="text-gray-500 mb-6">Select a student and assign them to an available course.</p>
            <button onClick={() => setIsEnrollModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700 transition font-medium">Enroll Student Now</button>
          </div>
        )}
      </div>

      {/* --- ADD/EDIT STUDENT MODAL --- */}
      <Modal isOpen={isStudentModalOpen} onClose={() => { setIsStudentModalOpen(false); setError(''); }} title={editStudentId ? "Edit Student" : "Create New Student"}>
        <form onSubmit={handleStudentSubmit} className="space-y-4">
          {error && <div className="bg-red-100 text-red-700 p-2 rounded text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700">First Name</label><input type="text" required value={studentForm.firstName} onChange={(e) => setStudentForm({...studentForm, firstName: e.target.value})} className="mt-1 w-full p-2 border rounded" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Last Name</label><input type="text" required value={studentForm.lastName} onChange={(e) => setStudentForm({...studentForm, lastName: e.target.value})} className="mt-1 w-full p-2 border rounded" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700">Student Number</label><input type="text" required value={studentForm.studentNumber} onChange={(e) => setStudentForm({...studentForm, studentNumber: e.target.value})} className="mt-1 w-full p-2 border rounded" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Email</label><input type="email" required value={studentForm.email} onChange={(e) => setStudentForm({...studentForm, email: e.target.value})} className="mt-1 w-full p-2 border rounded" /></div>
          {!editStudentId && <div><label className="block text-sm font-medium text-gray-700">Password</label><input type="password" required value={studentForm.password} onChange={(e) => setStudentForm({...studentForm, password: e.target.value})} className="mt-1 w-full p-2 border rounded" /></div>}
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition font-medium">{editStudentId ? 'Save Changes' : 'Create Student'}</button>
        </form>
      </Modal>

      {/* --- ADD/EDIT TEACHER MODAL --- */}
      <Modal isOpen={isTeacherModalOpen} onClose={() => { setIsTeacherModalOpen(false); setError(''); }} title={editTeacherId ? "Edit Teacher" : "Create New Teacher"}>
        <form onSubmit={handleTeacherSubmit} className="space-y-4">
          {error && <div className="bg-red-100 text-red-700 p-2 rounded text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700">First Name</label><input type="text" required value={teacherForm.firstName} onChange={(e) => setTeacherForm({...teacherForm, firstName: e.target.value})} className="mt-1 w-full p-2 border rounded" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Last Name</label><input type="text" required value={teacherForm.lastName} onChange={(e) => setTeacherForm({...teacherForm, lastName: e.target.value})} className="mt-1 w-full p-2 border rounded" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700">Employee ID</label><input type="text" required value={teacherForm.employeeId} onChange={(e) => setTeacherForm({...teacherForm, employeeId: e.target.value})} className="mt-1 w-full p-2 border rounded" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Department</label><input type="text" value={teacherForm.department} onChange={(e) => setTeacherForm({...teacherForm, department: e.target.value})} className="mt-1 w-full p-2 border rounded" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Email</label><input type="email" required value={teacherForm.email} onChange={(e) => setTeacherForm({...teacherForm, email: e.target.value})} className="mt-1 w-full p-2 border rounded" /></div>
          {!editTeacherId && <div><label className="block text-sm font-medium text-gray-700">Password</label><input type="password" required value={teacherForm.password} onChange={(e) => setTeacherForm({...teacherForm, password: e.target.value})} className="mt-1 w-full p-2 border rounded" /></div>}
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition font-medium">{editTeacherId ? 'Save Changes' : 'Create Teacher'}</button>
        </form>
      </Modal>

      {/* --- CREATE COURSE MODAL --- */}
      <Modal isOpen={isCourseModalOpen} onClose={() => { setIsCourseModalOpen(false); setError(''); }} title="Create New Course">
        <form onSubmit={handleCreateCourse} className="space-y-4">
          {error && <div className="bg-red-100 text-red-700 p-2 rounded text-sm">{error}</div>}
          <div><label className="block text-sm font-medium text-gray-700">Course Code</label><input type="text" required value={courseForm.courseCode} onChange={(e) => setCourseForm({...courseForm, courseCode: e.target.value})} className="mt-1 w-full p-2 border rounded" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Course Name</label><input type="text" required value={courseForm.name} onChange={(e) => setCourseForm({...courseForm, name: e.target.value})} className="mt-1 w-full p-2 border rounded" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Credits</label><input type="number" required value={courseForm.credits} onChange={(e) => setCourseForm({...courseForm, credits: parseInt(e.target.value)})} className="mt-1 w-full p-2 border rounded" /></div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Assign Teacher</label>
            <select value={courseForm.teacherId} onChange={(e) => setCourseForm({...courseForm, teacherId: e.target.value})} className="mt-1 w-full p-2 border rounded bg-white">
              <option value="">-- Unassigned --</option>
              {data.teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
            </select>
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition font-medium">Create Course</button>
        </form>
      </Modal>

      {/* --- ENROLL STUDENT MODAL --- */}
      <Modal isOpen={isEnrollModalOpen} onClose={() => { setIsEnrollModalOpen(false); setError(''); }} title="Enroll Student">
        <form onSubmit={handleEnrollStudent} className="space-y-4">
          {error && <div className="bg-red-100 text-red-700 p-2 rounded text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Student</label>
            <select required value={enrollForm.studentId} onChange={(e) => setEnrollForm({...enrollForm, studentId: e.target.value})} className="mt-1 w-full p-2 border rounded bg-white">
              <option value="">-- Choose Student --</option>
              {data.students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.student_number})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Course</label>
            <select required value={enrollForm.courseId} onChange={(e) => setEnrollForm({...enrollForm, courseId: e.target.value})} className="mt-1 w-full p-2 border rounded bg-white">
              <option value="">-- Choose Course --</option>
              {data.courses.map(c => <option key={c.id} value={c.id}>{c.course_code} - {c.name}</option>)}
            </select>
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition font-medium">Enroll Student</button>
        </form>
      </Modal>

    </div>
  );
}