import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, AlertTriangle, TrendingUp, TrendingDown,
  Calculator, Calendar, BookOpen, Plus, X
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { useAttendance, useSubjects } from '../hooks/usePersistence';
import { validateSubjectName, validateSubjectCode, validateAttendanceCounts } from '../lib/validation';


const COLOR_PRESETS = [
  { value: '#5b8def', label: 'Blue' },
  { value: '#4ecdc4', label: 'Teal' },
  { value: '#ff6b6b', label: 'Red' },
  { value: '#f4a261', label: 'Orange' },
  { value: '#2ecc71', label: 'Green' },
  { value: '#e84393', label: 'Pink' },
  { value: '#9b59b6', label: 'Purple' }
];

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
  const { attendanceList, saveAttendance, loading: loadingAttendance } = useAttendance();
  const { subjectsList, saveSubjects, loading: loadingSubjects } = useSubjects();

  const [showAddModal, setShowAddModal] = useState(false);
  const [bunkInput, setBunkInput] = useState<{ [key: string]: number }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    subjectName: '',
    subjectCode: '',
    color: '#5b8def',
    classesAttended: 0,
    totalClasses: 1
  });


  const loading = loadingAttendance || loadingSubjects;

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-[#5b8def] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[#5a5a7a]">Loading attendance...</p>
      </div>
    );
  }

  const overall = attendanceList.length > 0
    ? Math.round(attendanceList.reduce((sum, a) => sum + (a.present / a.total) * 100, 0) / attendanceList.length)
    : 0;
  const lowAttendance = attendanceList.filter(a => (a.present / a.total) * 100 < 75);

  const handleBunkChange = (id: string, val: string) => {
    setBunkInput(prev => ({ ...prev, [id]: parseInt(val) || 0 }));
  };

  const handleSubmit = async () => {
    setFormError(null);

    // Validate all fields before saving
    const nameResult = validateSubjectName(form.subjectName);
    if (!nameResult.valid) { setFormError(nameResult.error!); return; }
    const codeResult = validateSubjectCode(form.subjectCode);
    if (!codeResult.valid) { setFormError(codeResult.error!); return; }
    const countsResult = validateAttendanceCounts(form.classesAttended, form.totalClasses);
    if (!countsResult.valid) { setFormError(countsResult.error!); return; }

    // 1. Save to attendanceList
    const newAttendanceItem = {
      id: Date.now().toString(),
      subject: form.subjectName.trim(),
      present: form.classesAttended,
      total: form.totalClasses,
      color: form.color
    };

    // 2. Save to subjectsList
    const newSubjectItem = {
      id: Date.now().toString(),
      name: form.subjectName.trim(),
      code: form.subjectCode.trim() || '',
      color: form.color,
      totalHours: 40,
      completedHours: 0,
      progress: 0
    };

    await saveAttendance([...attendanceList, newAttendanceItem]);
    await saveSubjects([...subjectsList, newSubjectItem]);

    // Reset and close
    setForm({
      subjectName: '',
      subjectCode: '',
      color: '#5b8def',
      classesAttended: 0,
      totalClasses: 1
    });
    setFormError(null);
    setShowAddModal(false);
  };


  // Generate dynamic weekly trends based on current overall attendance
  const dynamicTrends = [
    { week: 'W1', overall: Math.max(50, Math.min(100, overall - 8)) },
    { week: 'W2', overall: Math.max(50, Math.min(100, overall - 6)) },
    { week: 'W3', overall: Math.max(50, Math.min(100, overall - 9)) },
    { week: 'W4', overall: Math.max(50, Math.min(100, overall - 4)) },
    { week: 'W5', overall: Math.max(50, Math.min(100, overall - 5)) },
    { week: 'W6', overall: Math.max(50, Math.min(100, overall - 2)) },
    { week: 'W7', overall: Math.max(50, Math.min(100, overall - 1)) },
    { week: 'W8', overall: overall || 80 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Attendance Tracker</h1>
          <p className="text-sm text-dark-300 mt-1">Monitor your class attendance and bunk budget</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-blue text-white font-medium text-sm transition-all hover:bg-accent-blue/90"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${overall >= 75 ? 'bg-accent-green/10' : 'bg-accent-coral/10'}`}>
            <BarChart3 className={`w-7 h-7 ${overall >= 75 ? 'text-accent-green' : 'text-accent-coral'}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-dark-100">{overall}%</p>
            <p className="text-xs text-dark-300">Overall Attendance</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-accent-amber/10 flex items-center justify-center">
            <Calendar className="w-7 h-7 text-accent-amber" />
          </div>
          <div>
            <p className="text-2xl font-bold text-dark-100">{attendanceList.reduce((s, a) => s + a.total, 0)}</p>
            <p className="text-xs text-dark-300">Total Classes</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-accent-blue/10 flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-accent-blue" />
          </div>
          <div>
            <p className="text-2xl font-bold text-dark-100">{attendanceList.reduce((s, a) => s + a.present, 0)}</p>
            <p className="text-xs text-dark-300">Classes Attended</p>
          </div>
        </Card>
      </div>

      {/* Danger Alerts */}
      {lowAttendance.length > 0 && (
        <Card className="border border-accent-coral/20 bg-accent-coral/5">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-accent-coral" />
            <h3 className="text-sm font-semibold text-accent-coral">Attendance Danger Alert (Below 75%)</h3>
          </div>
          <div className="space-y-2">
            {lowAttendance.map(a => {
              const pct = Math.round((a.present / a.total) * 100);
              return (
                <div key={a.id || a.subject} className="flex items-center justify-between p-3 rounded-xl bg-dark-900 border border-dark-600/50">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent-coral" />
                    <span className="text-sm text-dark-100">{a.subject}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-dark-300">{a.present}/{a.total} classes</span>
                    <span className="text-sm font-bold text-accent-coral">{pct}%</span>
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
            <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-accent-blue" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-dark-100">Subject Analytics</h3>
              <p className="text-xs text-dark-300">Attendance per subject</p>
            </div>
          </div>
          <div className="space-y-4">
            {attendanceList.length === 0 ? (
              <div className="text-center py-8 text-dark-400">
                <p className="text-sm">No attendance records found.</p>
                <p className="text-xs mt-1">Add subjects to start tracking attendance.</p>
              </div>
            ) : (
              attendanceList.map((a) => {
                const pct = Math.round((a.present / a.total) * 100);
                const isDanger = pct < 75;
                return (
                  <div key={a.id || a.subject} className="p-3 rounded-xl bg-dark-900/40 border border-dark-600/30">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-dark-100">{a.subject}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium flex items-center gap-1 ${isDanger ? 'text-accent-coral' : 'text-accent-green'}`}>
                          {isDanger ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-dark-950 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: isDanger ? 'var(--accent-coral)' : a.color }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 mt-3 pt-2.5 border-t border-dark-600/30">
                      <span className="text-xs text-dark-300">{a.present} present / {a.total} total</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const updated = attendanceList.map(item => item.subject === a.subject ? { ...item, present: item.present + 1, total: item.total + 1 } : item);
                            saveAttendance(updated);
                          }}
                          className="px-2.5 py-1 rounded bg-accent-green/10 text-accent-green hover:bg-accent-green/20 text-[10px] font-semibold transition-all"
                        >
                          + Present
                        </button>
                        <button
                          onClick={() => {
                            const updated = attendanceList.map(item => item.subject === a.subject ? { ...item, total: item.total + 1 } : item);
                            saveAttendance(updated);
                          }}
                          className="px-2.5 py-1 rounded bg-accent-coral/10 text-accent-coral hover:bg-accent-coral/20 text-[10px] font-semibold transition-all"
                        >
                          + Absent
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Bunk Budget Calculator */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent-amber/10 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-accent-amber" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-dark-100">Bunk Budget Calculator</h3>
              <p className="text-xs text-dark-300">How many classes can you safely skip?</p>
            </div>
          </div>
          <div className="space-y-4">
            {attendanceList.length === 0 ? (
              <div className="text-center py-8 text-dark-400">
                <p className="text-sm">No subjects available.</p>
                <p className="text-xs mt-1">Add subjects to calculate bunk budget.</p>
              </div>
            ) : (
              attendanceList.map((a) => {
                const bunks = bunkInput[a.id || a.subject] || 0;
                const projectedPct = Math.round((a.present / (a.total + bunks)) * 100);
                const safeBunks = Math.max(0, Math.floor((a.present / 0.75) - a.total));
                const canBunk = safeBunks > 0;
                return (
                  <div key={a.id || a.subject} className="p-3 rounded-xl bg-dark-900/40 border border-dark-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-dark-100">{a.subject}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${canBunk ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-coral/10 text-accent-coral'}`}>
                        {canBunk ? `${safeBunks} safe` : 'Unsafe to skip'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <label className="text-xs text-dark-300">Skip classes:</label>
                      <input
                        type="number"
                        min="0"
                        value={bunks}
                        onChange={e => handleBunkChange(a.id || a.subject, e.target.value)}
                        className="w-16 px-2 py-1 rounded-lg bg-dark-950 border border-dark-600 text-dark-100 text-xs text-center outline-none focus:border-accent-blue"
                      />
                      <span className="text-xs text-dark-300">
                        Projected: <span className={projectedPct < 75 ? 'text-accent-coral font-semibold' : 'text-accent-green font-semibold'}>{projectedPct}%</span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-dark-950 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${projectedPct}%`, backgroundColor: projectedPct < 75 ? 'var(--accent-coral)' : a.color }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Trends Chart */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-accent-teal/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-accent-teal" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-dark-100">Attendance Trends</h3>
            <p className="text-xs text-dark-300">Weekly overall attendance percentage</p>
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dynamicTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[50, 100]} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-primary)' }}
                formatter={(val: any) => [`${val}%`, 'Attendance']}
              />
              <Line type="monotone" dataKey="overall" stroke="var(--accent-teal)" strokeWidth={3} dot={{ fill: 'var(--accent-teal)', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Add Subject Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card-strong rounded-2xl p-6 max-w-md w-full mx-4 relative border border-dark-600 bg-dark-900"
          >
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-dark-950 text-dark-300 hover:text-dark-100 transition-all border border-dark-600"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-semibold text-dark-100 mb-6">Add New Subject</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Subject Name</label>
                <input
                  type="text"
                  value={form.subjectName}
                  onChange={e => setForm({ ...form, subjectName: e.target.value })}
                  placeholder="e.g. Operating Systems"
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-950 border border-dark-600 text-dark-100 text-sm focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Subject Code (Optional)</label>
                <input
                  type="text"
                  value={form.subjectCode}
                  onChange={e => setForm({ ...form, subjectCode: e.target.value })}
                  placeholder="e.g. CS203"
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-950 border border-dark-600 text-dark-100 text-sm focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Theme Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setForm({ ...form, color: c.value })}
                      className="w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center"
                      style={{
                        backgroundColor: c.value,
                        borderColor: form.color === c.value ? 'var(--text-primary)' : 'transparent'
                      }}
                      title={c.label}
                    >
                      {form.color === c.value && (
                        <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Classes Attended</label>
                  <input
                    type="number"
                    min="0"
                    max={form.totalClasses}
                    value={form.classesAttended}
                    onChange={e => setForm({ ...form, classesAttended: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-dark-950 border border-dark-600 text-dark-100 text-sm focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Total Classes</label>
                  <input
                    type="number"
                    min="1"
                    value={form.totalClasses}
                    onChange={e => setForm({ ...form, totalClasses: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-dark-950 border border-dark-600 text-dark-100 text-sm focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {formError && (
              <div className="mt-4 px-4 py-2.5 rounded-xl bg-accent-coral/10 border border-accent-coral/20 text-xs text-accent-coral">
                {formError}
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => { setShowAddModal(false); setFormError(null); }}
                className="flex-1 py-2.5 rounded-xl bg-dark-800 border border-dark-600 text-dark-200 font-medium text-sm hover:bg-dark-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.subjectName.trim() || form.classesAttended > form.totalClasses}
                className="flex-1 py-2.5 rounded-xl bg-accent-blue text-white font-semibold text-sm hover:bg-accent-blue/90 transition-all disabled:opacity-50"
              >
                Create
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </div>
  );
}
