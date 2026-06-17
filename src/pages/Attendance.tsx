import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, AlertTriangle, TrendingUp, TrendingDown, Check, X,
  Calculator, Calendar, BookOpen
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { attendance } from '../data/dummyData';

const attendanceTrends = [
  { week: 'W1', overall: 88 },
  { week: 'W2', overall: 85 },
  { week: 'W3', overall: 82 },
  { week: 'W4', overall: 80 },
  { week: 'W5', overall: 78 },
  { week: 'W6', overall: 81 },
  { week: 'W7', overall: 84 },
  { week: 'W8', overall: 83 },
];

const subjectWiseData = attendance.map(a => ({
  name: a.subject.split(' ').map(w => w[0]).join(''),
  full: a.subject,
  percentage: Math.round((a.present / a.total) * 100),
  present: a.present,
  total: a.total,
  color: a.color,
}));

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

export default function Attendance() {
  const [bunkInput, setBunkInput] = useState<{ [key: string]: number }>({});

  const overall = Math.round(attendance.reduce((sum, a) => sum + (a.present / a.total) * 100, 0) / attendance.length);
  const lowAttendance = attendance.filter(a => (a.present / a.total) * 100 < 75);

  const handleBunkChange = (id: string, val: string) => {
    setBunkInput(prev => ({ ...prev, [id]: parseInt(val) || 0 }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Attendance</h1>
        <p className="text-sm text-[#8a8aa3] mt-1">Track your class attendance and bunk budget</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${overall >= 75 ? 'bg-[#2ecc71]/10' : 'bg-[#ff6b6b]/10'}`}>
            <BarChart3 className={`w-7 h-7 ${overall >= 75 ? 'text-[#2ecc71]' : 'text-[#ff6b6b]'}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{overall}%</p>
            <p className="text-xs text-[#8a8aa3]">Overall Attendance</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#f4a261]/10 flex items-center justify-center">
            <Calendar className="w-7 h-7 text-[#f4a261]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{attendance.reduce((s, a) => s + a.total, 0)}</p>
            <p className="text-xs text-[#8a8aa3]">Total Classes</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#5b8def]/10 flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-[#5b8def]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{attendance.reduce((s, a) => s + a.present, 0)}</p>
            <p className="text-xs text-[#8a8aa3]">Classes Attended</p>
          </div>
        </Card>
      </div>

      {/* Danger Alerts */}
      {lowAttendance.length > 0 && (
        <Card className="border border-[#ff6b6b]/30 bg-[#ff6b6b]/5">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-[#ff6b6b]" />
            <h3 className="text-sm font-semibold text-[#ff6b6b]">Attendance Danger Alert</h3>
          </div>
          <div className="space-y-2">
            {lowAttendance.map(a => {
              const pct = Math.round((a.present / a.total) * 100);
              return (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-[#12121a]">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#ff6b6b]" />
                    <span className="text-sm text-white">{a.subject}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#8a8aa3]">{a.present}/{a.total} classes</span>
                    <span className="text-sm font-bold text-[#ff6b6b]">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Subject Cards + Bunk Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#5b8def]/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-[#5b8def]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#d0d0e0]">Subject Analytics</h3>
              <p className="text-xs text-[#5a5a7a]">Attendance per subject</p>
            </div>
          </div>
          <div className="space-y-4">
            {attendance.map((a) => {
              const pct = Math.round((a.present / a.total) * 100);
              const isDanger = pct < 75;
              return (
                <div key={a.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-[#d0d0e0]">{a.subject}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${isDanger ? 'text-[#ff6b6b]' : 'text-[#2ecc71]'}`}>
                        {isDanger ? <TrendingDown className="w-3 h-3 inline mr-1" /> : <TrendingUp className="w-3 h-3 inline mr-1" />}
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#12121a] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: isDanger ? '#ff6b6b' : a.color }}
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-[#5a5a7a]">{a.present} present / {a.total} total</span>
                    {isDanger && (
                      <span className="text-[10px] text-[#ff6b6b] bg-[#ff6b6b]/10 px-2 py-0.5 rounded-full">Below 75%</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Bunk Budget Calculator */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#f4a261]/10 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-[#f4a261]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#d0d0e0]">Bunk Budget Calculator</h3>
              <p className="text-xs text-[#5a5a7a]">How many classes can you safely skip?</p>
            </div>
          </div>
          <div className="space-y-4">
            {attendance.map((a) => {
              const bunks = bunkInput[a.id] || 0;
              const projectedPct = Math.round((a.present / (a.total + bunks)) * 100);
              const safeBunks = Math.max(0, Math.floor((a.present / 0.75) - a.total));
              const canBunk = safeBunks > 0;
              return (
                <div key={a.id} className="p-3 rounded-xl bg-[#12121a]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#d0d0e0]">{a.subject}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${canBunk ? 'bg-[#2ecc71]/10 text-[#2ecc71]' : 'bg-[#ff6b6b]/10 text-[#ff6b6b]'}`}>
                      {canBunk ? `${safeBunks} safe` : 'Unsafe'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <label className="text-xs text-[#8a8aa3]">Skip classes:</label>
                    <input
                      type="number"
                      min="0"
                      value={bunks}
                      onChange={e => handleBunkChange(a.id, e.target.value)}
                      className="w-16 px-2 py-1 rounded-lg bg-[#1a1a24] border border-[#2d2d42] text-white text-xs text-center"
                    />
                    <span className="text-xs text-[#5a5a7a]">
                      Projected: <span className={projectedPct < 75 ? 'text-[#ff6b6b]' : 'text-[#2ecc71]'}>{projectedPct}%</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#1a1a24] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${projectedPct}%`, backgroundColor: projectedPct < 75 ? '#ff6b6b' : a.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Trends Chart */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#4ecdc4]/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-[#4ecdc4]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#d0d0e0]">Attendance Trends</h3>
            <p className="text-xs text-[#5a5a7a]">Weekly overall attendance percentage</p>
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={attendanceTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d42" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: '#8a8aa3', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a5a7a', fontSize: 11 }} axisLine={false} tickLine={false} domain={[60, 100]} />
              <Tooltip
                contentStyle={{ background: '#1a1a24', border: '1px solid #2d2d42', borderRadius: 12, color: '#e8e8f0' }}
                formatter={(val: number) => [`${val}%`, 'Attendance']}
              />
              <Line type="monotone" dataKey="overall" stroke="#4ecdc4" strokeWidth={3} dot={{ fill: '#4ecdc4', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
