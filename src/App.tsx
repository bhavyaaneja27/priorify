import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import AIPlanner from './pages/AIPlanner';
import ProductivityCheck from './pages/ProductivityCheck';
import FocusSessions from './pages/FocusSessions';
import Tasks from './pages/Tasks';
import Insights from './pages/Insights';
import AIPriorityEngine from './pages/AIPriorityEngine';
import Settings from './pages/Settings';
import Welcome from './pages/Welcome';
import Layout from './components/Layout';
import { ReminderEngine } from './hooks/useReminders';

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
        <p className="text-sm text-dark-400">Loading Priorify...</p>
      </div>
    );
  }

  return (
    <>
      <ReminderEngine />
      <Routes>
        <Route path="/" element={<Navigate to="/welcome" replace />} />
        <Route path="/welcome" element={<GuestRoute><Welcome /></GuestRoute>} />

        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/signup" element={<GuestRoute><SignUp /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
        <Route path="/action-planner" element={<ProtectedRoute><AIPlanner /></ProtectedRoute>} />
        <Route path="/productivity-check" element={<ProtectedRoute><ProductivityCheck /></ProtectedRoute>} />
        <Route path="/focus" element={<ProtectedRoute><FocusSessions /></ProtectedRoute>} />
        <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
        <Route path="/ai-engine" element={<ProtectedRoute><AIPriorityEngine /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* Legacy StudyAI routes → Priorify */}
        <Route path="/timetable" element={<Navigate to="/calendar" replace />} />
        <Route path="/attendance" element={<Navigate to="/dashboard" replace />} />
        <Route path="/ai-planner" element={<Navigate to="/action-planner" replace />} />
        <Route path="/mood" element={<Navigate to="/productivity-check" replace />} />
        <Route path="/pomodoro" element={<Navigate to="/focus" replace />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;
