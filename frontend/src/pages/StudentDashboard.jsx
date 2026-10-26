import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import ChangePasswordModal from '../components/ChangePasswordModal';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [notices, setNotices] = useState([]);
  const [schedule, setSchedule] = useState([]); // <-- SCHEDULE STATE
  const [loading, setLoading] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const payload = JSON.parse(atob(token.split('.')[1]));
        const studentId = payload.profileId;

        const [gRes, aRes, nRes, sRes] = await Promise.all([
          api.get(`/students/${studentId}/grades`),
          api.get(`/students/${studentId}/attendance`),
          api.get('/notices'),
          api.get('/enrollments') // <-- FETCH SCHEDULE
        ]);

        setGrades(gRes.data.courses || []);
        setAttendance(aRes.data.summary || {});
        setNotices(nRes.data);
        setSchedule(sRes.data); // <-- SET SCHEDULE
      } catch (err) {
        toast.error("Error fetching your data");
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const downloadPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      const studentId = payload.profileId;

      const res = await api.get(`/students/${studentId}/report-card`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Report_Card_${user.firstName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error("Failed to download PDF.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl font-bold text-purple-700">Loading your profile...</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 flex flex-col text-white" style={{ backgroundColor: '#4c1d95' }}>
        <div className="p-6 text-2xl font-bold border-b border-purple-800">Student Portal</div>
        
        <div className="p-4 text-sm text-purple-200 border-b border-purple-800">
          <p className="font-bold text-white text-lg">{user?.firstName} {user?.lastName}</p>
          <p>{user?.email}</p>
        </div>
        
        <div className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('overview')} className={`w-full text-left p-3 rounded font-medium transition ${activeTab === 'overview' ? 'bg-purple-800' : 'hover:bg-purple-800'}`}>My Overview</button>
          <button onClick={() => setActiveTab('schedule')} className={`w-full text-left p-3 rounded font-medium transition ${activeTab === 'schedule' ? 'bg-purple-800' : 'hover:bg-purple-800'}`}>My Schedule</button>
        </div>

        <div className="p-4 border-t border-purple-800 space-y-3">
          <button onClick={downloadPDF} className="w-full bg-purple-600 hover:bg-purple-500 py-2 rounded transition font-medium shadow-md flex justify-center items-center gap-2">
            📄 Download PDF Report
          </button>
          <button onClick={() => setIsPasswordModalOpen(true)} className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded transition font-medium shadow-md">
            Change Password
          </button>
          <button onClick={handleLogout} className="w-full bg-red-500 hover:bg-red-600 py-2 rounded transition font-medium shadow-md">
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 capitalize">
          {activeTab === 'overview' ? 'My Dashboard' : 'My Course Schedule'}
        </h1>

        {/* NOTICES BANNER */}
        {notices.length > 0 && (
          <div className="mb-8 space-y-4">
            {notices.slice(0, 2).map(n => ( // Only show top 2 so it doesn't take up the whole screen
              <div key={n.id} className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded shadow-sm">
                <h3 className="font-bold text-purple-800">{n.title}</h3>
                <p className="text-purple-700 text-sm mt-1">{n.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* --- OVERVIEW TAB --- */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ATTENDANCE */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2 flex items-center gap-2"><span className="text-2xl">📅</span> Attendance Summary</h2>
              {Object.keys(attendance).length === 0 ? (<p className="text-gray-500">No attendance records found.</p>) : (
                <div className="space-y-6">
                  {Object.values(attendance).map((course, index) => {
                    const rate = (course.attendanceRate * 100).toFixed(1);
                    const color = rate >= 90 ? 'bg-green-500' : rate >= 75 ? 'bg-yellow-500' : 'bg-red-500';
                    return (
                      <div key={index}>
                        <div className="flex justify-between text-sm font-medium mb-2"><span className="text-gray-700">{course.courseName}</span><span className="text-gray-900 font-bold">{rate}%</span></div>
                        <div className="w-full bg-gray-200 rounded-full h-3"><div className={`${color} h-3 rounded-full transition-all duration-500`} style={{ width: `${rate}%` }}></div></div>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500"><span>Present: <b className="text-gray-800">{course.present}</b></span><span>Absent: <b className="text-gray-800">{course.absent}</b></span><span>Late: <b className="text-gray-800">{course.late}</b></span></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* GRADES */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2 flex items-center gap-2"><span className="text-2xl">🎓</span> My Grades</h2>
              {grades.length === 0 ? (<p className="text-gray-500">No grades posted yet.</p>) : (
                <div className="space-y-6">
                  {grades.map((course, index) => (
                    <div key={index} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <div><h3 className="font-bold text-gray-900">{course.courseName}</h3><p className="text-sm text-gray-500">{course.courseCode}</p></div>
                        <div className="text-right"><p className="text-2xl font-bold text-purple-700">{course.weightedPercent !== null ? `${course.weightedPercent}%` : 'N/A'}</p><p className="text-xs text-gray-500 uppercase tracking-wide">Grade</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- SCHEDULE TAB --- */}
        {activeTab === 'schedule' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2 flex items-center gap-2"><span className="text-2xl">📚</span> Enrolled Courses</h2>
            
            {schedule.length === 0 ? (
              <p className="text-gray-500">You are not enrolled in any courses yet.</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-4 font-semibold text-gray-600">Course Code</th>
                    <th className="p-4 font-semibold text-gray-600">Course Name</th>
                    <th className="p-4 font-semibold text-gray-600">Credits</th>
                    <th className="p-4 font-semibold text-gray-600">Teacher</th>
                    <th className="p-4 font-semibold text-gray-600">Enrolled On</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map(s => (
                    <tr key={s.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-bold text-purple-700">{s.course_code}</td>
                      <td className="p-4 text-gray-800">{s.course_name}</td>
                      <td className="p-4 text-gray-600">{s.credits}</td>
                      <td className="p-4 text-gray-600">{s.teacher_first ? `${s.teacher_first} ${s.teacher_last}` : 'Unassigned'}</td>
                      <td className="p-4 text-gray-500 text-sm">{new Date(s.enrolled_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
    </div>
  );
}