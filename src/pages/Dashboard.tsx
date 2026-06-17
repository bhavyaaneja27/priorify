import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Flame, Zap, Clock, BookOpen, TrendingUp, Award,
  ChevronRight, Sun, Calendar, MapPin
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import {
  subjects, weeklyHeatmap, stressData, upcomingClasses, achievements, todayAIPlan, userProfile
} from '../data/dummyData';

function CircularProgress({ value, color, size = 56, strokeWidth = 5, label }: { value: number; color: string; size?: number; strokeWidth?: number; label: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#2d2d42" strokeWidth={strokeWidth} fill="none" />
          <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{value}%</span>
        </div>
      </div>
      <span className="text-xs text-[#8a8aa3] text-center leading-tight max-w-[80px]">{label}</span>
    </div>
  );
}

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

function SectionTitle({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-[#5b8def]/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-[#5b8def]" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-[#d0d0e0]">{title}</h3>
        {subtitle && <p className="text-xs text-[#5a5a7a]">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [selectedMood, setSelectedMood] = useState('okay');
  const moodColors: Record<string, string> = { great: '#2ecc71', okay: '#5b8def', tired: '#f4a261', stressed: '#ff6b6b', overwhelmed: '#e84393' };
  const moodLabels: Record<string, string> = { great: 'Feeling amazing!', okay: 'Decent energy.', tired: 'Take short breaks.', stressed: 'Try breathing exercises.', overwhelmed: 'Focus on one thing.' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{todayAIPlan.greeting}</h1>
          <p className="text-sm text-[#8a8aa3] mt-1">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f4a261]/10 border border-[#f4a261]/20">
            <Flame className="w-4 h-4 text-[#f4a261]" />
            <span className="text-sm font-semibold text-[#f4a261]">{userProfile.streak} day streak</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5b8def]/10 border border-[#5b8def]/20">
            <Zap className="w-4 h-4 text-[#5b8def]" />
            <span className="text-sm font-semibold text-[#5b8def]">{userProfile.totalXP} XP</span>
          </div>
        </div>
      </div>

      {/* Top row: Progress rings + Attendance + Streak */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Progress */}
        <Card className="lg:col-span-2">
          <SectionTitle icon={TrendingUp} title="Subject Progress" subtitle="Your learning journey across all subjects" />
          <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
            {subjects.map((s) => (
              <CircularProgress key={s.id} value={s.progress} color={s.color} label={s.name} />
            ))}
          </div>
        </Card>

        {/* Quick Stats */}
        <Card>
          <SectionTitle icon={Award} title="Quick Stats" />
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#12121a]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#5b8def]/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#5b8def]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{userProfile.totalHours}h</p>
                  <p className="text-xs text-[#5a5a7a]">Total study time</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#12121a]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#2ecc71]/10 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-[#2ecc71]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{subjects.length}</p>
                  <p className="text-xs text-[#5a5a7a]">Active subjects</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#12121a]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#f4a261]/10 flex items-center justify-center">
                  <Sun className="w-4 h-4 text-[#f4a261]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Level {userProfile.level}</p>
                  <p className="text-xs text-[#5a5a7a]">Current level</p>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d42" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#8a8aa3', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5a5a7a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1a1a24', border: '1px solid #2d2d42', borderRadius: 12, color: '#e8e8f0' }}
                  formatter={(val: number) => [`${val} hours`, 'Study Time']}
                />
                <Bar dataKey="hours" fill="#5b8def" radius={[6, 6, 0, 0]} />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d42" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#8a8aa3', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5a5a7a', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 10]} />
                <Tooltip
                  contentStyle={{ background: '#1a1a24', border: '1px solid #2d2d42', borderRadius: 12, color: '#e8e8f0' }}
                />
                <Area type="monotone" dataKey="stress" stroke="#ff6b6b" fill="#ff6b6b" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="focus" stroke="#4ecdc4" fill="#4ecdc4" fillOpacity={0.15} strokeWidth={2} />
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                  selectedMood === mood
                    ? 'bg-[#1e1e2e] border border-[#2d2d42]'
                    : 'hover:bg-[#12121a]'
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
                  <p className="text-sm font-medium capitalize text-[#d0d0e0]">{mood}</p>
                  {selectedMood === mood && (
                    <p className="text-xs text-[#5a5a7a]">{moodLabels[mood]}</p>
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
          <SectionTitle icon={Zap} title="Today's AI Study Plan" subtitle={`${todayAIPlan.totalDuration} minutes • ${todayAIPlan.breaks} breaks`} />
          <div className="space-y-3">
            {todayAIPlan.plan.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-[#12121a] hover:bg-[#1e1e2e] transition-colors">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5b8def]/20 to-[#4ecdc4]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#5b8def]">{item.time}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">{item.subject}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                      item.priority === 'high' ? 'bg-[#ff6b6b]/10 text-[#ff6b6b]' :
                      item.priority === 'medium' ? 'bg-[#f4a261]/10 text-[#f4a261]' :
                      'bg-[#2ecc71]/10 text-[#2ecc71]'
                    }`}>{item.priority}</span>
                  </div>
                  <p className="text-xs text-[#8a8aa3] truncate">{item.topic}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#5a5a7a] flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  {item.duration}m
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Classes */}
        <Card>
          <SectionTitle icon={Calendar} title="Upcoming Classes" subtitle="Today" />
          <div className="space-y-3">
            {upcomingClasses.map((cls) => (
              <div key={cls.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#12121a]">
                <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: cls.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{cls.subject}</p>
                  <div className="flex items-center gap-2 text-xs text-[#5a5a7a]">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{cls.time}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{cls.room}</span>
                  </div>
                </div>
                <span className="text-xs text-[#8a8aa3] flex-shrink-0">{cls.duration}m</span>
              </div>
            ))}
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
              className={`flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all ${
                ach.unlocked
                  ? 'bg-gradient-to-br from-[#5b8def]/10 to-[#4ecdc4]/10 border border-[#5b8def]/20'
                  : 'bg-[#12121a] border border-[#2d2d42] opacity-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                ach.unlocked ? 'bg-gradient-to-br from-[#f4a261] to-[#e84393]' : 'bg-[#2d2d42]'
              }`}>
                {ach.icon === 'flame' && <Flame className="w-5 h-5 text-white" />}
                {ach.icon === 'target' && <Zap className="w-5 h-5 text-white" />}
                {ach.icon === 'sun' && <Sun className="w-5 h-5 text-white" />}
                {ach.icon === 'check' && <Award className="w-5 h-5 text-white" />}
                {ach.icon === 'sparkles' && <Zap className="w-5 h-5 text-white" />}
                {ach.icon === 'crown' && <Award className="w-5 h-5 text-white" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-[#d0d0e0]">{ach.name}</p>
                <p className="text-[10px] text-[#5a5a7a]">{ach.description}</p>
              </div>
              {ach.unlocked && (
                <span className="text-[10px] font-bold text-[#f4a261]">+{ach.xp} XP</span>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
