import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Play, Pause, RotateCcw, Coffee, Target, TrendingUp, Clock,
  Flame, Zap, Check
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePomodoroHistory } from '../hooks/usePersistence';

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
        <circle cx="140" cy="140" r="120" stroke="var(--border-color)" strokeWidth="6" fill="none" />
        <circle cx="140" cy="140" r="120" stroke={color} strokeWidth="6" fill="none"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold text-dark-100 tabular-nums">{formatTime(remaining)}</span>
        <span className="text-xs font-semibold text-dark-400 mt-1 uppercase tracking-wider">{label}</span>
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
  const { history, addPomodoroSession } = usePomodoroHistory();
  const [mode, setMode] = useState<'work' | 'break' | 'longBreak'>('work');
  const [timeLeft, setTimeLeft] = useState(WORK_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
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
  const timerColor = mode === 'work' ? 'var(--accent-blue)' : mode === 'break' ? 'var(--accent-teal)' : 'var(--accent-purple)';

  const playChime = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
      audio.volume = 0.5;
      audio.play();
    } catch {}
  };

  const sendNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0) {
      setIsRunning(false);
      playChime();
      if (mode === 'work') {
        setTotalSessions(t => t + 1);
        addPomodoroSession(25);
        sendNotification("Focus Block Completed!", "Great job! Time for a short break.");
        setSessions(s => {
          if (s >= 3) {
            setMode('longBreak');
            return 0;
          } else {
            setMode('break');
            return s + 1;
          }
        });
      } else {
        setMode('work');
        sendNotification("Break Over!", "Time to get back to work.");
      }
    }
  }, [timeLeft, mode]);

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
        <h1 className="text-2xl font-bold text-dark-100">Pomodoro Focus</h1>
        <p className="text-sm text-dark-300 mt-1">Stay focused with timed intervals</p>
      </div>

      {/* Timer Card */}
      <Card className="flex flex-col items-center py-8">
        {/* Mode tabs */}
        <div className="flex items-center gap-2 mb-8 bg-dark-950 rounded-xl p-1 border border-dark-600">
          <button
            onClick={() => setMode('work')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'work' ? 'bg-accent-blue/10 text-accent-blue' : 'text-dark-400 hover:text-dark-300'}`}
          >
            Focus
          </button>
          <button
            onClick={() => setMode('break')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'break' ? 'bg-accent-teal/10 text-accent-teal' : 'text-dark-400 hover:text-dark-300'}`}
          >
            Short Break
          </button>
          <button
            onClick={() => setMode('longBreak')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'longBreak' ? 'bg-accent-purple/10 text-accent-purple' : 'text-dark-400 hover:text-dark-300'}`}
          >
            Long Break
          </button>
        </div>

        <CircularTimer total={totalTime} remaining={timeLeft} color={timerColor} label={mode === 'work' ? 'Focus' : mode === 'break' ? 'Short Break' : 'Long Break'} />

        {/* Controls */}
        <div className="flex items-center gap-4 mt-8">
          <button
            onClick={handleReset}
            className="w-12 h-12 rounded-xl bg-dark-950 border border-dark-600 text-dark-300 hover:text-dark-100 flex items-center justify-center transition-all hover:bg-dark-800"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all hover:scale-105 ${
              isRunning
                ? 'bg-accent-coral/10 text-accent-coral border border-accent-coral/30'
                : 'bg-accent-blue text-white shadow-sm hover:bg-accent-blue/90'
            }`}
          >
            {isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </button>
          <button
            onClick={handleSkip}
            className="w-12 h-12 rounded-xl bg-dark-950 border border-dark-600 text-dark-300 hover:text-dark-100 flex items-center justify-center transition-all hover:bg-dark-800"
          >
            <span className="text-xs font-semibold">Skip</span>
          </button>
        </div>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-accent-blue" />
          </div>
          <div>
            <p className="text-xl font-bold text-dark-100">{totalSessions}</p>
            <p className="text-xs text-dark-300">Sessions Today</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-teal/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-accent-teal" />
          </div>
          <div>
            <p className="text-xl font-bold text-dark-100">{totalSessions * 25}</p>
            <p className="text-xs text-dark-300">Minutes Focused</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-amber/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-accent-amber" />
          </div>
          <div>
            <p className="text-xl font-bold text-dark-100">{4 - (sessions % 4)}</p>
            <p className="text-xs text-dark-300">Until Long Break</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-green/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-accent-green" />
          </div>
          <div>
            <p className="text-xl font-bold text-dark-100">85%</p>
            <p className="text-xs text-dark-300">Focus Score</p>
          </div>
        </Card>
      </div>

      {/* Break Suggestions */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-accent-teal/10 flex items-center justify-center">
            <Coffee className="w-4 h-4 text-accent-teal" />
          </div>
          <h3 className="text-sm font-semibold text-dark-100">Break Suggestions</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {breakSuggestions.map((suggestion, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-dark-950 border border-dark-600/30">
              <div className="w-6 h-6 rounded-full bg-accent-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5 border border-accent-teal/20">
                <Check className="w-3 h-3 text-accent-teal" />
              </div>
              <p className="text-sm text-dark-200">{suggestion}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* History Chart */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-accent-blue" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-dark-100">Study History</h3>
            <p className="text-xs text-dark-300">Last 7 days</p>
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { weekday: 'short' })} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-primary)' }}
                formatter={(val: any, name: any) => [val, name === 'sessions' ? 'Sessions' : 'Minutes']}
              />
              <Bar dataKey="sessions" fill="var(--accent-blue)" radius={[6, 6, 0, 0]} name="sessions" />
              <Bar dataKey="totalMinutes" fill="var(--accent-teal)" radius={[6, 6, 0, 0]} name="minutes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
