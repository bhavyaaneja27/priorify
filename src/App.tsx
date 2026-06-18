import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Timetable from './pages/Timetable';
import Attendance from './pages/Attendance';
import AIPlanner from './pages/AIPlanner';
import MoodCheckIn from './pages/MoodCheckIn';
import Pomodoro from './pages/Pomodoro';
import Settings from './pages/Settings';
import Layout from './components/Layout';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-[#5b8def] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#5a5a7a]">Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Welcome />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <SignUp />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} />
      <Route path="/dashboard" element={user ? <Layout><Dashboard /></Layout> : <Navigate to="/login" replace />} />
      <Route path="/timetable" element={user ? <Layout><Timetable /></Layout> : <Navigate to="/login" replace />} />
      <Route path="/attendance" element={user ? <Layout><Attendance /></Layout> : <Navigate to="/login" replace />} />
      <Route path="/ai-planner" element={user ? <Layout><AIPlanner /></Layout> : <Navigate to="/login" replace />} />
      <Route path="/mood" element={user ? <Layout><MoodCheckIn /></Layout> : <Navigate to="/login" replace />} />
      <Route path="/pomodoro" element={user ? <Layout><Pomodoro /></Layout> : <Navigate to="/login" replace />} />
      <Route path="/settings" element={user ? <Layout><Settings /></Layout> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
