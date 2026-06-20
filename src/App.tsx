import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
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
import Welcome from './pages/Welcome';
import Layout from './components/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function App() {
  const { loading } = useAuth();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    function apply() {
      const savedTheme = localStorage.getItem('theme') || 'light';
      let resolvedTheme = savedTheme;
      if (savedTheme === 'system') {
        resolvedTheme = mediaQuery.matches ? 'dark' : 'light';
      }
      if (resolvedTheme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
    }
    
    apply();
    
    mediaQuery.addEventListener('change', apply);
    return () => {
      mediaQuery.removeEventListener('change', apply);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-dark-400">Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Default: always show welcome first */}
      <Route path="/" element={<Navigate to="/welcome" replace />} />
      <Route path="/welcome" element={<GuestRoute><Welcome /></GuestRoute>} />

      {/* Auth pages — redirect to dashboard if already signed in */}
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><SignUp /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />

      {/* Protected app pages */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/timetable" element={<ProtectedRoute><Timetable /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
      <Route path="/ai-planner" element={<ProtectedRoute><AIPlanner /></ProtectedRoute>} />
      <Route path="/mood" element={<ProtectedRoute><MoodCheckIn /></ProtectedRoute>} />
      <Route path="/pomodoro" element={<ProtectedRoute><Pomodoro /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
