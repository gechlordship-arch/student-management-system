import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState({ students: [], teachers: [], courses: [] });
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, t, c] = await Promise.all([
          api.get('/students'), api.get('/teachers'), api.get('/courses')
        ]);
        setData({ 
          students: s.data, 
          teachers: t.data, 
          courses: c.data 
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-900 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-indigo-800">SMS Admin</div>
        <div className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left p-3 rounded font-medium transition ${activeTab === 'dashboard' ? 'bg-indigo-800' : 'hover:bg-indigo-800'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('students')}
            className={`w-full text-left p-3 rounded font-medium transition ${activeTab === 'students' ? 'bg-indigo-800' : 'hover:bg-indigo-800'}`}
          >
            Students
          </button>
          <button 
            onClick={() => setActiveTab('teachers')}
            className={`w-full text-left p-3 rounded font-medium transition ${activeTab === 'teachers' ? 'bg-indigo-800' : 'hover:bg-indigo-800'}`}
          >
            Teachers
          </button>
        </div>
        <div className="p-4 border-t border-indigo-800">
          <button onClick={handleLogout} className="w-full bg-red-500 hover:bg-red-600 py-2 rounded transition font-medium">
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          {activeTab === 'dashboard' && `Welcome, ${user?.firstName}`}
          {activeTab === 'students' && 'Manage Students'}
          {activeTab === 'teachers' && 'Manage Teachers'}
        </h1>

        {/* --- DASHBOARD TAB --- */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-indigo-500">
              <p className="text-gray-500 font-medium">Total Students</p>
              <h3 className="text-3xl font-bold text-gray-800">{data.students.length}</h3>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
              <p className="text-gray-500 font-medium">Total Teachers</p>
              <h3 className="text-3xl font-bold text-gray-800">{data.teachers.length}</h3>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
              <p className="text-gray-500 font-medium">Total Courses</p>
              <h3 className="text-3xl font-bold text-gray-800">{data.courses.length}</h3>
            </div>
          </div>
        )}

        {/* --- STUDENTS TAB --- */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-700">Student Directory</h2>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition">
                + Add Student
              </button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 font-semibold text-gray-600">ID</th>
                  <th className="p-4 font-semibold text-gray-600">Student No.</th>
                  <th className="p-4 font-semibold text-gray-600">Name</th>
                  <th className="p-4 font-semibold text-gray-600">Email</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 text-gray-600">{s.id}</td>
                    <td className="p-4 font-medium text-gray-800">{s.student_number}</td>
                    <td className="p-4 text-gray-800">{s.first_name} {s.last_name}</td>
                    <td className="p-4 text-gray-600">{s.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- TEACHERS TAB --- */}
        {activeTab === 'teachers' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-700">Teacher Directory</h2>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition">
                + Add Teacher
              </button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 font-semibold text-gray-600">ID</th>
                  <th className="p-4 font-semibold text-gray-600">Employee ID</th>
                  <th className="p-4 font-semibold text-gray-600">Name</th>
                  <th className="p-4 font-semibold text-gray-600">Department</th>
                </tr>
              </thead>
              <tbody>
                {data.teachers.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 text-gray-600">{t.id}</td>
                    <td className="p-4 font-medium text-gray-800">{t.employee_id}</td>
                    <td className="p-4 text-gray-800">{t.first_name} {t.last_name}</td>
                    <td className="p-4 text-gray-600">{t.department || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}