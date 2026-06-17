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
    <aside className="w-64 h-screen fixed left-0 top-0 glass-card-strong border-r border-[#2d2d42] flex flex-col z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5b8def] to-[#4ecdc4] flex items-center justify-center shadow-lg">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">StudyAI</h1>
          <p className="text-[10px] text-[#5a5a7a] font-medium tracking-wider uppercase">Engineering Planner</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-[#5b8def]/15 to-[#4ecdc4]/10 text-[#5b8def] border border-[#5b8def]/20'
                  : 'text-[#8a8aa3] hover:text-[#d0d0e0] hover:bg-[#1e1e2e]/60'
              }`
            }
          >
            <item.icon className="w-[18px] h-[18px]" strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-[#2d2d42]">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#8a8aa3] hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10 transition-all duration-200"
        >
          <LogOut className="w-[18px] h-[18px]" strokeWidth={2} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
