import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Flame, Zap, Clock, TrendingUp, Award,
  Calendar, MapPin, ListTodo, Sparkles, Target
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import {
  useMood,
  useMoodHistory,
  useUserProfile,
  useTimetable,
  usePomodoroHistory,
  useAIPlans
} from '../hooks/usePersistence';
import { energyOptions } from '../data/dummyData';

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`glass-card rounded-2xl p-5 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-accent-blue/10 border border-accent-blue/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-accent-blue" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-dark-100">{title}</h3>
        {subtitle && <p className="text-xs text-dark-400">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { profile, loading: loadingProfile } = useUserProfile();
  const { schedule, loading: loadingTimetable } = useTimetable();
  const { moodHistory, loading: loadingMoodHistory } = useMoodHistory();
  const { selectedMood, saveMood, loading: loadingMood } = useMood();
  const { history: pomoHistory, loading: loadingPomo } = usePomodoroHistory();
  const { plans, loading: loadingPlans } = useAIPlans();

  if (loadingProfile || loadingTimetable || loadingMoodHistory || loadingMood || loadingPomo || loadingPlans || !profile) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-dark-400">Loading dashboard...</p>
      </div>
    );
  }

  const weeklyFocus = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const dateStr = d.toISOString().split('T')[0];
    const match = pomoHistory.find((h: { date: string; totalMinutes: number }) => h.date === dateStr);
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      day: weekdayNames[d.getDay()],
      hours: match ? parseFloat((match.totalMinutes / 60).toFixed(1)) : 0
    };
  });

  const stressData = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const dateStr = d.toISOString().split('T')[0];
    const match = moodHistory.find((h: { date?: string; stress: number; focus: number }) => h.date === dateStr);
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      day: weekdayNames[d.getDay()],
      stress: match ? match.stress : 5.0,
      focus: match ? match.focus : 5.0
    };
  });

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = weekdays[new Date().getDay()];
  const todayCalendar = schedule.find((d: { day: string }) => d.day === todayName);
  const upcomingEvents = todayCalendar ? todayCalendar.slots.map((s: { subject: string; time: string; room: string; duration?: number; color: string }, idx: number) => ({
    id: idx.toString(),
    title: s.subject,
    time: s.time,
    location: s.room,
    duration: s.duration || 90,
    color: s.color
  })) : [];

  const latestPlan = plans && plans.length > 0 ? plans[plans.length - 1] : null;
  const currentDayItem = latestPlan ? latestPlan.schedule.find((d: { completed: boolean }) => !d.completed) || latestPlan.schedule[0] : null;

  const getGreeting = (name: string) => {
    const hour = new Date().getHours();
    let greetingPrefix = 'Good night';
    if (hour >= 5 && hour < 12) greetingPrefix = 'Good morning';
    else if (hour >= 12 && hour < 17) greetingPrefix = 'Good afternoon';
    else if (hour >= 17 && hour < 21) greetingPrefix = 'Good evening';
    return `${greetingPrefix}, ${name}!`;
  };

  const todayActionPlan = currentDayItem ? currentDayItem.topics.map((topic: string, idx: number) => {
    const hoursPerTopic = currentDayItem.hours / currentDayItem.topics.length;
    return {
      time: idx === 0 ? '09:00' : idx === 1 ? '11:30' : '14:00',
      task: latestPlan.subject,
      step: topic,
      priority: latestPlan.difficulty.toLowerCase() === 'hard' ? 'high' : latestPlan.difficulty.toLowerCase() === 'medium' ? 'medium' : 'low',
      duration: Math.round(hoursPerTopic * 60)
    };
  }) : [];

  const productivityScore = Math.min(100, Math.round(
    (profile.streak || 0) * 5 + Math.min(40, (profile.totalHours || 0) / 10) + (plans.length > 0 ? 15 : 0) + 20
  ));

  const achievements = [
    { id: '1', name: 'Productivity Streak', description: '7 days in a row', icon: 'flame', unlocked: (profile.streak || 0) >= 7, xp: 100 },
    { id: '2', name: 'Deep Focus', description: '5 hours in one day', icon: 'target', unlocked: pomoHistory.some((h: { totalMinutes: number }) => h.totalMinutes >= 300), xp: 150 },
    { id: '3', name: 'Early Starter', description: 'Plan before 9 AM', icon: 'sun', unlocked: false, xp: 75 },
    { id: '4', name: 'Action Planner', description: 'Created first plan', icon: 'sparkles', unlocked: plans.length > 0, xp: 50 },
    { id: '5', name: 'Priorify Master', description: '1000 XP earned', icon: 'crown', unlocked: (profile.totalXP || 0) >= 1000, xp: 500 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">{getGreeting(profile.name)}</h1>
          <p className="text-sm text-dark-300 mt-1">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-amber/10 border border-accent-amber/20">
            <Flame className="w-4 h-4 text-accent-amber" />
            <span className="text-sm font-semibold text-accent-amber">{profile.streak} day streak</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-blue/10 border border-accent-blue/20">
            <Zap className="w-4 h-4 text-accent-blue" />
            <span className="text-sm font-semibold text-accent-blue">{profile.totalXP} XP</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <SectionTitle icon={Target} title="Productivity Score" subtitle="Your overall momentum this week" />
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-32 h-32">
              <svg width="128" height="128" className="-rotate-90">
                <circle cx="64" cy="64" r="56" stroke="var(--border-color)" strokeWidth="8" fill="none" />
                <circle cx="64" cy="64" r="56" stroke="var(--accent-blue)" strokeWidth="8" fill="none"
                  strokeLinecap="round" strokeDasharray={351.86} strokeDashoffset={351.86 * (1 - productivityScore / 100)}
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-dark-100">{productivityScore}%</span>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              <Link to="/tasks" className="p-4 rounded-xl bg-dark-900 border border-dark-600 hover:border-accent-blue/30 transition-all">
                <ListTodo className="w-5 h-5 text-accent-blue mb-2" />
                <p className="text-sm font-semibold text-dark-100">Tasks</p>
                <p className="text-xs text-dark-400">Coming in Phase 1</p>
              </Link>
              <Link to="/action-planner" className="p-4 rounded-xl bg-dark-900 border border-dark-600 hover:border-accent-purple/30 transition-all">
                <Sparkles className="w-5 h-5 text-accent-purple mb-2" />
                <p className="text-sm font-semibold text-dark-100">Action Planner</p>
                <p className="text-xs text-dark-400">{plans.length} active plans</p>
              </Link>
              <Link to="/focus" className="p-4 rounded-xl bg-dark-900 border border-dark-600 hover:border-accent-teal/30 transition-all">
                <Clock className="w-5 h-5 text-accent-teal mb-2" />
                <p className="text-sm font-semibold text-dark-100">Focus Sessions</p>
                <p className="text-xs text-dark-400">{profile.totalHours}h total</p>
              </Link>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={Award} title="Quick Stats" />
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-900 border border-dark-600">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent-blue/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-accent-blue" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-100">{profile.totalHours}h</p>
                  <p className="text-xs text-dark-400">Total focus time</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-900 border border-dark-600">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent-teal/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-accent-teal" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-100">{plans.length}</p>
                  <p className="text-xs text-dark-400">Action plans</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-900 border border-dark-600">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent-amber/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-accent-amber" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-100">Level {profile.level}</p>
                  <p className="text-xs text-dark-400">Current level</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <SectionTitle icon={TrendingUp} title="Weekly Focus" subtitle="Hours per day this week" />
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyFocus}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-primary)' }}
                  formatter={(val) => [`${val ?? 0} hours`, 'Focus Time']}
                />
                <Bar dataKey="hours" fill="var(--accent-blue)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={TrendingUp} title="Stress & Focus" subtitle="Daily tracking" />
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 10]} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-primary)' }} />
                <Area type="monotone" dataKey="stress" stroke="var(--accent-coral)" fill="var(--accent-coral)" fillOpacity={0.12} strokeWidth={2} />
                <Area type="monotone" dataKey="focus" stroke="var(--accent-teal)" fill="var(--accent-teal)" fillOpacity={0.12} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={Target} title="Productivity Check" subtitle="How's your energy today?" />
          <div className="grid grid-cols-5 gap-2">
            {energyOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => saveMood(option.value)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all border ${selectedMood === option.value
                  ? 'bg-dark-800 border-dark-600 scale-105'
                  : 'bg-transparent border-transparent hover:bg-dark-800'
                  }`}
                title={option.label}
              >
                <span className="text-xl">{option.emoji}</span>
              </button>
            ))}
          </div>
          <Link to="/productivity-check" className="block mt-3 text-xs text-accent-blue hover:underline text-center">
            Full productivity check-in →
          </Link>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <SectionTitle icon={Zap} title="Today's Action Plan" subtitle={todayActionPlan.length > 0 ? `${currentDayItem?.hours || 0} hours planned` : 'Get started with AI'} />
          <div className="space-y-3">
            {todayActionPlan.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <p className="text-sm text-dark-300">No active action plans found.</p>
                <Link to="/action-planner" className="text-xs text-accent-blue hover:underline">
                  Head to AI Action Planner to generate your first plan →
                </Link>
              </div>
            ) : (
              todayActionPlan.map((item: { time: string; task: string; step: string; priority: string; duration: number }, idx: number) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-dark-900 border border-dark-600 hover:bg-dark-800 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-accent-blue/10 border border-accent-blue/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-accent-blue">{item.time}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-dark-100 truncate">{item.task}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${item.priority === 'high' ? 'bg-accent-coral/10 text-accent-coral border border-accent-coral/10' :
                        item.priority === 'medium' ? 'bg-accent-amber/10 text-accent-amber border border-accent-amber/10' :
                          'bg-accent-green/10 text-accent-green border border-accent-green/10'
                        }`}>{item.priority}</span>
                    </div>
                    <p className="text-xs text-dark-300 truncate">{item.step}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-dark-400 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {item.duration}m
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle icon={Calendar} title="Upcoming Events" subtitle="Today" />
          <div className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-dark-400">No events scheduled for today.</p>
                <Link to="/calendar" className="text-xs text-accent-blue hover:underline mt-2 inline-block">Add to calendar →</Link>
              </div>
            ) : (
              upcomingEvents.map((evt: { id: string; title: string; time: string; location: string; duration: number; color: string }) => (
                <div key={evt.id} className="flex items-center gap-3 p-3 rounded-xl bg-dark-900 border border-dark-600">
                  <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: evt.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark-100 truncate">{evt.title}</p>
                    <div className="flex items-center gap-2 text-xs text-dark-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{evt.time}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{evt.location}</span>
                    </div>
                  </div>
                  <span className="text-xs text-dark-300 flex-shrink-0">{evt.duration}m</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle icon={Award} title="Achievements" subtitle={`${achievements.filter(a => a.unlocked).length} / ${achievements.length} unlocked`} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-xl text-center transition-all ${ach.unlocked
                ? 'bg-accent-blue/5 border border-accent-blue/20'
                : 'bg-dark-900 border border-dark-600 opacity-50'
                }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ach.unlocked ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20' : 'bg-dark-800 text-dark-400'}`}>
                {ach.icon === 'flame' && <Flame className="w-5 h-5" />}
                {ach.icon === 'target' && <Target className="w-5 h-5" />}
                {ach.icon === 'sun' && <Zap className="w-5 h-5" />}
                {ach.icon === 'sparkles' && <Sparkles className="w-5 h-5" />}
                {ach.icon === 'crown' && <Award className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-dark-100">{ach.name}</p>
                <p className="text-[10px] text-dark-400 mt-0.5 leading-tight">{ach.description}</p>
              </div>
              {ach.unlocked && (
                <span className="text-[10px] font-bold text-accent-amber">+{ach.xp} XP</span>
              )}
            </div>
          ))}
        </div>
        <Link to="/insights" className="block mt-4 text-xs text-accent-blue hover:underline text-center">
          View all insights →
        </Link>
      </Card>
    </div>
  );
}
