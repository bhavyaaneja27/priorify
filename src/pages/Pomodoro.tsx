import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Play, Pause, RotateCcw, Coffee, Target, TrendingUp, Clock,
  Flame, Zap, Check
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { pomodoroHistory } from '../data/dummyData';

const WORK_MINUTES = 25;
const BREAK_MINUTES = 5;
const LONG_BREAK_MINUTES = 15;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function CircularTimer({ total, remaining, color, label }: { total: number; remaining: number; color: string; label: string }) {
  const progress = remaining / total;
  const circumference = 2 * Math.PI * 120;
  const offset = circumference * (1 - progress);
  return (
    <div className="relative flex items-center justify-center">
      <svg width="280" height="280" className="-rotate-90">
        <circle cx="140" cy="140" r="120" stroke="#2d2d42" strokeWidth="8" fill="none" />
        <circle cx="140" cy="140" r="120" stroke={color} strokeWidth="8" fill="none"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold text-white tabular-nums">{formatTime(remaining)}</span>
        <span className="text-sm text-[#8a8aa3] mt-1 uppercase tracking-wider">{label}</span>
      </div>
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

export default function Pomodoro() {
  const [mode, setMode] = useState<'work' | 'break' | 'longBreak'>('work');
  const [timeLeft, setTimeLeft] = useState(WORK_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(3);
  const [totalSessions, setTotalSessions] = useState(0);
  const [breakSuggestions] = useState([
    "Stretch your arms and neck",
    "Drink a glass of water",
    "Look out the window for 20 seconds",
    "Do 10 jumping jacks",
    "Take 5 deep breaths",
    "Walk around for a minute"
  ]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalTime = mode === 'work' ? WORK_MINUTES * 60 : mode === 'break' ? BREAK_MINUTES * 60 : LONG_BREAK_MINUTES * 60;
  const timerColor = mode === 'work' ? '#5b8def' : mode === 'break' ? '#4ecdc4' : '#9b59b6';

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            if (mode === 'work') {
              setTotalSessions(s => s + 1);
              setSessions(s => {
                if (s >= 4) {
                  setMode('longBreak');
                  return 0;
                } else {
                  setMode('break');
                  return s + 1;
                }
              });
            } else {
              setMode('work');
            }
            return WORK_MINUTES * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, mode, sessions, totalSessions]);

  useEffect(() => {
    setTimeLeft(mode === 'work' ? WORK_MINUTES * 60 : mode === 'break' ? BREAK_MINUTES * 60 : LONG_BREAK_MINUTES * 60);
    setIsRunning(false);
  }, [mode]);

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'work' ? WORK_MINUTES * 60 : mode === 'break' ? BREAK_MINUTES * 60 : LONG_BREAK_MINUTES * 60);
  };

  const handleSkip = () => {
    setIsRunning(false);
    if (mode === 'work') {
      setMode('break');
    } else {
      setMode('work');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pomodoro Focus</h1>
        <p className="text-sm text-[#8a8aa3] mt-1">Stay focused with timed intervals</p>
      </div>

      {/* Timer Card */}
      <Card className="flex flex-col items-center py-8">
        {/* Mode tabs */}
        <div className="flex items-center gap-2 mb-8 bg-[#12121a] rounded-xl p-1">
          <button
            onClick={() => setMode('work')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'work' ? 'bg-[#5b8def]/20 text-[#5b8def]' : 'text-[#5a5a7a] hover:text-[#8a8aa3]'}`}
          >
            Focus
          </button>
          <button
            onClick={() => setMode('break')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'break' ? 'bg-[#4ecdc4]/20 text-[#4ecdc4]' : 'text-[#5a5a7a] hover:text-[#8a8aa3]'}`}
          >
            Short Break
          </button>
          <button
            onClick={() => setMode('longBreak')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'longBreak' ? 'bg-[#9b59b6]/20 text-[#9b59b6]' : 'text-[#5a5a7a] hover:text-[#8a8aa3]'}`}
          >
            Long Break
          </button>
        </div>

        <CircularTimer total={totalTime} remaining={timeLeft} color={timerColor} label={mode === 'work' ? 'Focus' : mode === 'break' ? 'Short Break' : 'Long Break'} />

        {/* Controls */}
        <div className="flex items-center gap-4 mt-8">
          <button
            onClick={handleReset}
            className="w-12 h-12 rounded-xl bg-[#12121a] text-[#8a8aa3] hover:text-white flex items-center justify-center transition-all"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all hover:scale-105 ${
              isRunning
                ? 'bg-[#ff6b6b]/20 text-[#ff6b6b] border border-[#ff6b6b]/30'
                : 'bg-gradient-to-r from-[#5b8def] to-[#4ecdc4] text-white shadow-lg shadow-[#5b8def]/25'
            }`}
          >
            {isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </button>
          <button
            onClick={handleSkip}
            className="w-12 h-12 rounded-xl bg-[#12121a] text-[#8a8aa3] hover:text-white flex items-center justify-center transition-all"
          >
            <span className="text-xs font-medium">Skip</span>
          </button>
        </div>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5b8def]/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-[#5b8def]" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{totalSessions}</p>
            <p className="text-xs text-[#8a8aa3]">Sessions Today</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4ecdc4]/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#4ecdc4]" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{totalSessions * 25}</p>
            <p className="text-xs text-[#8a8aa3]">Minutes Focused</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f4a261]/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-[#f4a261]" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{sessions}</p>
            <p className="text-xs text-[#8a8aa3]">Until Long Break</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2ecc71]/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#2ecc71]" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">85%</p>
            <p className="text-xs text-[#8a8aa3]">Focus Score</p>
          </div>
        </Card>
      </div>

      {/* Break Suggestions */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#4ecdc4]/10 flex items-center justify-center">
            <Coffee className="w-4 h-4 text-[#4ecdc4]" />
          </div>
          <h3 className="text-sm font-semibold text-[#d0d0e0]">Break Suggestions</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {breakSuggestions.map((suggestion, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[#12121a]">
              <div className="w-6 h-6 rounded-full bg-[#4ecdc4]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-[#4ecdc4]" />
              </div>
              <p className="text-sm text-[#d0d0e0]">{suggestion}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* History Chart */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#5b8def]/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-[#5b8def]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#d0d0e0]">Study History</h3>
            <p className="text-xs text-[#5a5a7a]">Last 7 days</p>
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pomodoroHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d42" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { weekday: 'short' })} tick={{ fill: '#8a8aa3', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a5a7a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1a1a24', border: '1px solid #2d2d42', borderRadius: 12, color: '#e8e8f0' }}
                formatter={(val: number, name: string) => [val, name === 'sessions' ? 'Sessions' : 'Minutes']}
              />
              <Bar dataKey="sessions" fill="#5b8def" radius={[6, 6, 0, 0]} name="sessions" />
              <Bar dataKey="totalMinutes" fill="#4ecdc4" radius={[6, 6, 0, 0]} name="minutes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
