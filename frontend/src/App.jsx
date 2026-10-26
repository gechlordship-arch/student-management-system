import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard'; // <-- NEW IMPORT

function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) return <Navigate to="/" replace />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to={`/${user.role}`} replace />;

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>
        } />

        <Route path="/teacher" element={
          <ProtectedRoute allowedRole="teacher"><TeacherDashboard /></ProtectedRoute>
        } />

        {/* NEW STUDENT ROUTE */}
        <Route path="/student" element={
          <ProtectedRoute allowedRole="student"><StudentDashboard /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;