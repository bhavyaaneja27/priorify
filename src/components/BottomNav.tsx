import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, BarChart3, Sparkles, Smile,
  Timer, Settings
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/timetable', label: 'Timetable', icon: CalendarDays },
  { path: '/attendance', label: 'Attend', icon: BarChart3 },
  { path: '/ai-planner', label: 'AI', icon: Sparkles },
  { path: '/mood', label: 'Mood', icon: Smile },
  { path: '/pomodoro', label: 'Focus', icon: Timer },
  { path: '/settings', label: 'More', icon: Settings },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-dark-900 border-t border-dark-600">
      <div className="flex items-center justify-around px-1 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-2 py-1 rounded-xl min-w-[44px] transition-all duration-200 ${
                isActive ? 'text-accent-blue' : 'text-dark-400 hover:text-dark-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.6} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
