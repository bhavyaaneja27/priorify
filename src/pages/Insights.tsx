import { motion } from 'framer-motion';
import {
  Flame, Zap, Award, TrendingUp, Target, Sparkles, Crown
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useUserProfile, usePomodoroHistory, useAIPlans } from '../hooks/usePersistence';

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`glass-card rounded-2xl p-5 ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function Insights() {
  const { profile, loading: loadingProfile } = useUserProfile();
  const { history: focusHistory, loading: loadingFocus } = usePomodoroHistory();
  const { plans, loading: loadingPlans } = useAIPlans();

  if (loadingProfile || loadingFocus || loadingPlans || !profile) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-dark-400">Loading insights...</p>
      </div>
    );
  }

  const weeklyFocus = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const dateStr = d.toISOString().split('T')[0];
    const match = focusHistory.find((h: { date: string }) => h.date === dateStr);
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      day: weekdayNames[d.getDay()],
      hours: match ? parseFloat((match.totalMinutes / 60).toFixed(1)) : 0,
    };
  });

  const hasData = (profile.totalHours || 0) > 0 || (profile.streak || 0) > 0 || plans.length > 0;
  const productivityScore = hasData ? Math.min(100, Math.round(
    (profile.streak || 0) * 5 +
    Math.min(40, (profile.totalHours || 0) / 10) +
    (plans.length > 0 ? 15 : 0) +
    20
  )) : null;

  const achievements = [
    { id: '1', name: 'Productivity Streak', description: '7 days in a row', icon: 'flame', unlocked: (profile.streak || 0) >= 7, xp: 100 },
    { id: '2', name: 'Deep Focus', description: '5 hours in one day', icon: 'target', unlocked: focusHistory.some((h: { totalMinutes: number }) => h.totalMinutes >= 300), xp: 150 },
    { id: '3', name: 'Early Starter', description: 'Plan before 9 AM', icon: 'sun', unlocked: false, xp: 75 },
    { id: '4', name: 'Deadline Hero', description: 'Completed an action plan', icon: 'check', unlocked: plans.some((p: { schedule: { completed: boolean }[] }) => p.schedule?.every((d) => d.completed)), xp: 200 },
    { id: '5', name: 'Action Planner', description: 'Created first plan', icon: 'sparkles', unlocked: plans.length > 0, xp: 50 },
    { id: '6', name: 'Priorify Master', description: '1000 XP earned', icon: 'crown', unlocked: (profile.totalXP || 0) >= 1000, xp: 500 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-100">Insights</h1>
        <p className="text-sm text-dark-300 mt-1">Track your productivity, streaks, and achievements</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-amber/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-accent-amber" />
          </div>
          <div>
            <p className="text-xl font-bold text-dark-100">{profile.streak}</p>
            <p className="text-xs text-dark-300">Day Streak</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-accent-blue" />
          </div>
          <div>
            <p className="text-xl font-bold text-dark-100">{profile.totalXP}</p>
            <p className="text-xs text-dark-300">Total XP</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-teal/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-accent-teal" />
          </div>
          <div>
            <p className="text-xl font-bold text-dark-100">Level {profile.level}</p>
            <p className="text-xs text-dark-300">Current Level</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-accent-purple" />
          </div>
          <div>
            <p className={`font-bold text-dark-100 ${productivityScore !== null ? 'text-xl' : 'text-sm'}`}>
              {productivityScore !== null ? `${productivityScore}%` : 'No data yet'}
            </p>
            <p className="text-xs text-dark-300">Productivity Score</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-accent-blue" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-dark-100">Weekly Focus</h3>
            <p className="text-xs text-dark-400">Hours per day this week</p>
          </div>
        </div>
        <div className="h-48 relative">
          {focusHistory.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-dark-900/50 backdrop-blur-[2px] z-10 rounded-xl border border-dark-600 border-dashed">
              <p className="text-xs text-dark-400 px-4 text-center">Complete focus sessions to see your weekly trend.</p>
            </div>
          )}
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
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-accent-amber/10 flex items-center justify-center">
            <Award className="w-4 h-4 text-accent-amber" />
          </div>
          <h3 className="text-sm font-semibold text-dark-100">
            Achievements — {achievements.filter(a => a.unlocked).length} / {achievements.length} unlocked
          </h3>
        </div>
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
                ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20'
                : 'bg-dark-800 text-dark-400'
                }`}>
                {ach.icon === 'flame' && <Flame className="w-5 h-5" />}
                {ach.icon === 'target' && <Target className="w-5 h-5" />}
                {ach.icon === 'sun' && <Zap className="w-5 h-5" />}
                {ach.icon === 'check' && <Award className="w-5 h-5" />}
                {ach.icon === 'sparkles' && <Sparkles className="w-5 h-5" />}
                {ach.icon === 'crown' && <Crown className="w-5 h-5" />}
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
