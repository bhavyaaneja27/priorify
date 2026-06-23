import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, ListTodo, Sparkles, Smile,
  Timer, Settings, LogOut, BarChart3, Zap, Brain
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tasks', label: 'Tasks', icon: ListTodo },
  { path: '/calendar', label: 'Calendar', icon: CalendarDays },
  { path: '/ai-engine', label: 'AI Engine', icon: Brain },
  { path: '/action-planner', label: 'Action Planner', icon: Sparkles },
  { path: '/productivity-check', label: 'Productivity Check', icon: Smile },
  { path: '/focus', label: 'Focus Sessions', icon: Timer },
  { path: '/insights', label: 'Insights', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { signOut } = useAuth();

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-dark-900 border-r border-dark-600 flex flex-col z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center">
          <Zap className="w-5 h-5 text-accent-blue" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-dark-100 tracking-tight">Priorify</h1>
          <p className="text-[10px] text-dark-400 font-semibold tracking-wider uppercase">AI Productivity</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
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
