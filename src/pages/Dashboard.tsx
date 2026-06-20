import { motion } from 'framer-motion';
import {
  Flame, Zap, Clock, BookOpen, TrendingUp, Award,
  Sun, Calendar, MapPin
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import {
  useMood,
  useMoodHistory,
  useUserProfile,
  useSubjects,
  useTimetable,
  usePomodoroHistory,
  useAIPlans
} from '../hooks/usePersistence';


function CircularProgress({ value, color, size = 56, strokeWidth = 5, label }: { value: number; color: string; size?: number; strokeWidth?: number; label: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--border-color)" strokeWidth={strokeWidth} fill="none" />
          <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-dark-100">{value}%</span>
        </div>
      </div>
      <span className="text-xs text-dark-300 text-center leading-tight max-w-[80px]">{label}</span>
    </div>
  );
}

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

function SectionTitle({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
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
  const { subjectsList: subjects, loading: loadingSubjects } = useSubjects();
  const { schedule, loading: loadingTimetable } = useTimetable();
  const { moodHistory, loading: loadingMoodHistory } = useMoodHistory();
  const { selectedMood, saveMood: setSelectedMood, loading: loadingMood } = useMood();
  const { history: pomoHistory, loading: loadingPomo } = usePomodoroHistory();
  const { plans, loading: loadingPlans } = useAIPlans();

  const moodColors: Record<string, string> = { great: 'var(--accent-green)', okay: 'var(--accent-blue)', tired: 'var(--accent-amber)', stressed: 'var(--accent-coral)', overwhelmed: 'var(--accent-pink)' };
  const moodLabels: Record<string, string> = { great: 'Feeling amazing!', okay: 'Decent energy.', tired: 'Take short breaks.', stressed: 'Try breathing exercises.', overwhelmed: 'Focus on one thing.' };

  if (loadingProfile || loadingSubjects || loadingTimetable || loadingMoodHistory || loadingMood || loadingPomo || loadingPlans || !profile) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-dark-400">Loading dashboard...</p>
      </div>
    );
  }

  // 1. Heatmap study hours over last 7 days
  const weeklyHeatmap = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const dateStr = d.toISOString().split('T')[0];
    const match = pomoHistory.find((h: any) => h.date === dateStr);
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      day: weekdayNames[d.getDay()],
      hours: match ? parseFloat((match.totalMinutes / 60).toFixed(1)) : 0
    };
  });

  // 2. Stress & Focus over last 7 days
  const stressData = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const dateStr = d.toISOString().split('T')[0];
    const match = moodHistory.find((h: any) => h.date === dateStr);
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      day: weekdayNames[d.getDay()],
      stress: match ? match.stress : 5.0,
      focus: match ? match.focus : 5.0
    };
  });

  // 3. Upcoming classes for today
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = weekdays[new Date().getDay()];
  const todayTimetable = schedule.find((d: any) => d.day === todayName);
  const upcomingClasses = todayTimetable ? todayTimetable.slots.map((s: any, idx: number) => ({
    id: idx.toString(),
    subject: s.subject,
    time: s.time,
    room: s.room,
    duration: s.duration || 90,
    color: s.color
  })) : [];



  // 4. Today's AI Plan
  const latestPlan = plans && plans.length > 0 ? plans[plans.length - 1] : null;
  const currentDayItem = latestPlan ? latestPlan.schedule.find((d: any) => !d.completed) || latestPlan.schedule[0] : null;

  const getGreeting = (name: string) => {
    const hour = new Date().getHours();
    let greetingPrefix = 'Good night';
    if (hour >= 5 && hour < 12) {
      greetingPrefix = 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      greetingPrefix = 'Good afternoon';
    } else if (hour >= 17 && hour < 21) {
      greetingPrefix = 'Good evening';
    }
    return `${greetingPrefix}, ${name}!`;
  };

  const todayAIPlan = {
    greeting: getGreeting(profile.name),
    mood: selectedMood,
    totalDuration: currentDayItem ? currentDayItem.hours * 60 : 0,
    breaks: currentDayItem ? Math.max(1, currentDayItem.hours - 1) : 0,
    plan: currentDayItem ? currentDayItem.topics.map((topic: string, idx: number) => {
      const hoursPerTopic = currentDayItem.hours / currentDayItem.topics.length;
      return {
        time: idx === 0 ? "09:00" : idx === 1 ? "11:30" : "14:00",
        subject: latestPlan.subject,
        topic: topic,
        priority: latestPlan.difficulty.toLowerCase() === 'hard' ? 'high' : latestPlan.difficulty.toLowerCase() === 'medium' ? 'medium' : 'low',
        duration: Math.round(hoursPerTopic * 60)
      };
    }) : []
  };

  // 5. Achievements
  const achievements = [
    { id: '1', name: 'Study Streak', description: '7 days in a row', icon: 'flame', unlocked: (profile.streak || 0) >= 7, xp: 100 },
    { id: '2', name: 'Deep Focus', description: '5 hours without break', icon: 'target', unlocked: pomoHistory.some((h: any) => h.totalMinutes >= 300), xp: 150 },
    { id: '3', name: 'Early Bird', description: 'Study before 7 AM', icon: 'sun', unlocked: false, xp: 75 },
    { id: '4', name: 'Perfect Attendance', description: '100% for a week', icon: 'check', unlocked: false, xp: 200 },
    { id: '5', name: 'AI Planner', description: 'Created first plan', icon: 'sparkles', unlocked: plans.length > 0, xp: 50 },
    { id: '6', name: 'Master', description: '1000 XP earned', icon: 'crown', unlocked: (profile.totalXP || 0) >= 1000, xp: 500 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">{todayAIPlan.greeting}</h1>
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

      {/* Top row: Progress rings + Attendance + Streak */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Progress */}
        <Card className="lg:col-span-2">
          <SectionTitle icon={TrendingUp} title="Subject Progress" subtitle="Your learning journey across all subjects" />
          <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
            {subjects.length === 0 ? (
              <p className="text-sm text-dark-300 py-4">No active subjects. Add them via settings or logs.</p>
            ) : (
              subjects.map((s) => (
                <CircularProgress key={s.id} value={s.progress} color={s.color} label={s.name} />
              ))
            )}
          </div>
        </Card>

        {/* Quick Stats */}
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
                  <p className="text-xs text-dark-400">Total study time</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-900 border border-dark-600">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent-teal/10 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-accent-teal" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-100">{subjects.length}</p>
                  <p className="text-xs text-dark-400">Active subjects</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-900 border border-dark-600">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent-amber/10 flex items-center justify-center">
                  <Sun className="w-4 h-4 text-accent-amber" />
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

      {/* Second row: Weekly heatmap + Stress graph + Mood */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Heatmap */}
        <Card>
          <SectionTitle icon={TrendingUp} title="Weekly Study" subtitle="Hours per day this week" />
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyHeatmap}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-primary)' }}
                  formatter={(val: any) => [`${val} hours`, 'Study Time']}
                />
                <Bar dataKey="hours" fill="var(--accent-blue)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Stress Level */}
        <Card>
          <SectionTitle icon={TrendingUp} title="Stress & Focus" subtitle="Daily tracking" />
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 10]} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-primary)' }}
                />
                <Area type="monotone" dataKey="stress" stroke="var(--accent-coral)" fill="var(--accent-coral)" fillOpacity={0.12} strokeWidth={2} />
                <Area type="monotone" dataKey="focus" stroke="var(--accent-teal)" fill="var(--accent-teal)" fillOpacity={0.12} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Mood Check-in */}
        <Card>
          <SectionTitle icon={Sun} title="Mood Check-in" subtitle="How are you feeling today?" />
          <div className="space-y-2">
            {['great', 'okay', 'tired', 'stressed', 'overwhelmed'].map((mood) => (
              <button
                key={mood}
                onClick={() => setSelectedMood(mood)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border ${selectedMood === mood
                    ? 'bg-dark-800 border-dark-600'
                    : 'bg-transparent border-transparent hover:bg-dark-800'
                  }`}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: moodColors[mood] + '20' }}>
                  {mood === 'great' && '😊'}
                  {mood === 'okay' && '🙂'}
                  {mood === 'tired' && '😴'}
                  {mood === 'stressed' && '😓'}
                  {mood === 'overwhelmed' && '😭'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium capitalize text-dark-100">{mood}</p>
                  {selectedMood === mood && (
                    <p className="text-xs text-dark-400">{moodLabels[mood]}</p>
                  )}
                </div>
                {selectedMood === mood && (
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: moodColors[mood] }} />
                )}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Third row: AI Plan + Upcoming Classes + Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's AI Plan */}
        <Card className="lg:col-span-2">
          <SectionTitle icon={Zap} title="Today's AI Study Plan" subtitle={todayAIPlan.plan.length > 0 ? `${todayAIPlan.totalDuration} minutes • ${todayAIPlan.breaks} breaks` : 'Get started with AI'} />
          <div className="space-y-3">
            {todayAIPlan.plan.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <p className="text-sm text-dark-300">No active AI study plans found.</p>
                <p className="text-xs text-dark-400">Head over to the AI Planner tab to generate your first study schedule!</p>
              </div>
            ) : (
              todayAIPlan.plan.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-dark-900 border border-dark-600 hover:bg-dark-800 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-accent-blue/10 border border-accent-blue/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-accent-blue">{item.time}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-dark-100 truncate">{item.subject}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${item.priority === 'high' ? 'bg-accent-coral/10 text-accent-coral border border-accent-coral/10' :
                          item.priority === 'medium' ? 'bg-accent-amber/10 text-accent-amber border border-accent-amber/10' :
                            'bg-accent-green/10 text-accent-green border border-accent-green/10'
                        }`}>{item.priority}</span>
                    </div>
                    <p className="text-xs text-dark-300 truncate">{item.topic}</p>
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

        {/* Upcoming Classes */}
        <Card>
          <SectionTitle icon={Calendar} title="Upcoming Classes" subtitle="Today" />
          <div className="space-y-3">
            {upcomingClasses.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-dark-400">No classes scheduled for today.</p>
              </div>
            ) : (
              upcomingClasses.map((cls: any) => (
                <div key={cls.id} className="flex items-center gap-3 p-3 rounded-xl bg-dark-900 border border-dark-600">
                  <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: cls.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark-100 truncate">{cls.subject}</p>
                    <div className="flex items-center gap-2 text-xs text-dark-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{cls.time}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{cls.room}</span>
                    </div>
                  </div>
                  <span className="text-xs text-dark-300 flex-shrink-0">{cls.duration}m</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Bottom row: Achievements */}
      <Card>
        <SectionTitle icon={Award} title="Achievements" subtitle={`${achievements.filter(a => a.unlocked).length} / ${achievements.length} unlocked`} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-xl text-center transition-all ${ach.unlocked
                  ? 'bg-accent-blue/5 border border-accent-blue/20'
                  : 'bg-dark-900 border border-dark-600 opacity-50'
                }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ach.unlocked
                  ? ach.icon === 'flame' || ach.icon === 'sun' || ach.icon === 'crown'
                    ? 'bg-accent-amber/10 text-accent-amber border border-accent-amber/20'
                    : ach.icon === 'check'
                      ? 'bg-accent-green/10 text-accent-green border border-accent-green/20'
                      : ach.icon === 'sparkles'
                        ? 'bg-accent-purple/10 text-accent-purple border border-accent-purple/20'
                        : 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20'
                  : 'bg-dark-800 text-dark-400'
                }`}>
                {ach.icon === 'flame' && <Flame className="w-5 h-5" />}
                {ach.icon === 'target' && <Zap className="w-5 h-5" />}
                {ach.icon === 'sun' && <Sun className="w-5 h-5" />}
                {ach.icon === 'check' && <Award className="w-5 h-5" />}
                {ach.icon === 'sparkles' && <Zap className="w-5 h-5" />}
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
      </Card>
    </div>
  );
}
