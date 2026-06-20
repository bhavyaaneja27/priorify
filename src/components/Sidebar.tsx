import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, BarChart3, Sparkles, Smile,
  Timer, Settings, LogOut, Brain
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/timetable', label: 'Timetable', icon: CalendarDays },
  { path: '/attendance', label: 'Attendance', icon: BarChart3 },
  { path: '/ai-planner', label: 'AI Planner', icon: Sparkles },
  { path: '/mood', label: 'Mood Check', icon: Smile },
  { path: '/pomodoro', label: 'Pomodoro', icon: Timer },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { signOut } = useAuth();

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-dark-900 border-r border-dark-600 flex flex-col z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center">
          <Brain className="w-5 h-5 text-accent-blue" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-dark-100 tracking-tight">StudyAI</h1>
          <p className="text-[10px] text-dark-400 font-semibold tracking-wider uppercase">Engineering Planner</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-accent-blue/10 text-accent-blue font-semibold'
                  : 'text-dark-300 hover:text-dark-100 hover:bg-dark-800 border border-transparent'
              }`
            }
          >
            <item.icon className="w-[18px] h-[18px]" strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-dark-600">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-dark-300 hover:text-accent-coral hover:bg-accent-coral/10 border border-transparent transition-all duration-200"
        >
          <LogOut className="w-[18px] h-[18px]" strokeWidth={2} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
