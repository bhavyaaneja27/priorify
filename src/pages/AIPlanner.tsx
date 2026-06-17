import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, BookOpen, Clock, Calendar, Check, ChevronRight,
  ChevronLeft, GraduationCap, Layers, AlertCircle
} from 'lucide-react';
import { aiPlans } from '../data/dummyData';

interface PlanItem {
  id: string;
  subject: string;
  topic: string;
  difficulty: string;
  examDate: string;
  daysLeft: number;
  schedule: { day: string; topics: string[]; hours: number; completed: boolean }[];
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

export default function AIPlanner() {
  const [plans, setPlans] = useState<PlanItem[]>(aiPlans);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<'list' | 'calendar' | 'table'>('list');
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    difficulty: 'Medium',
    examDate: '',
  });
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!formData.subject || !formData.topic || !formData.examDate) return;
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1500));
    const daysLeft = Math.ceil((new Date(formData.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const newPlan: PlanItem = {
      id: Date.now().toString(),
      subject: formData.subject,
      topic: formData.topic,
      difficulty: formData.difficulty,
      examDate: formData.examDate,
      daysLeft: Math.max(0, daysLeft),
      schedule: [
        { day: 'Day 1', topics: ['Introduction & fundamentals', 'Basic concepts overview'], hours: 2, completed: false },
        { day: 'Day 2', topics: ['Core theory', 'Practice problems'], hours: 3, completed: false },
        { day: 'Day 3', topics: ['Advanced topics', 'Problem solving'], hours: 3, completed: false },
        { day: 'Day 4', topics: ['Revision', 'Mock test'], hours: 2, completed: false },
      ]
    };
    setPlans(prev => [...prev, newPlan]);
    setGenerating(false);
    setShowForm(false);
    setFormData({ subject: '', topic: '', difficulty: 'Medium', examDate: '' });
  };

  const toggleComplete = (planId: string, dayIdx: number) => {
    setPlans(prev => prev.map(p => p.id === planId ? {
      ...p,
      schedule: p.schedule.map((s, i) => i === dayIdx ? { ...s, completed: !s.completed } : s)
    } : p));
  };

  const difficultyColors: Record<string, string> = {
    Easy: '#2ecc71',
    Medium: '#f4a261',
    Hard: '#ff6b6b',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Study Planner</h1>
          <p className="text-sm text-[#8a8aa3] mt-1">Generate personalized study schedules with AI</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#12121a] rounded-xl p-1 border border-[#2d2d42]">
            {(['list', 'calendar', 'table'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  view === v ? 'bg-[#5b8def]/20 text-[#5b8def]' : 'text-[#5a5a7a] hover:text-[#8a8aa3]'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#5b8def] to-[#4ecdc4] text-white font-medium text-sm hover:shadow-lg transition-all"
          >
            <Sparkles className="w-4 h-4" />
            New Plan
          </button>
        </div>
      </div>

      {/* Generate Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-2xl p-6 overflow-hidden"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#5b8def]" />
              Generate AI Study Plan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-[#8a8aa3] mb-2">Subject</label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a7a]" />
                  <input
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Data Structures"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#12121a] border border-[#2d2d42] text-white text-sm focus:border-[#5b8def] outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#8a8aa3] mb-2">Topic</label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a7a]" />
                  <input
                    value={formData.topic}
                    onChange={e => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="e.g., Binary Trees"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#12121a] border border-[#2d2d42] text-white text-sm focus:border-[#5b8def] outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#8a8aa3] mb-2">Difficulty</label>
                <div className="flex gap-2">
                  {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => setFormData({ ...formData, difficulty: d })}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                        formData.difficulty === d
                          ? 'bg-[#5b8def]/20 text-[#5b8def] border border-[#5b8def]/30'
                          : 'bg-[#12121a] text-[#8a8aa3] border border-[#2d2d42] hover:border-[#5a5a7a]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#8a8aa3] mb-2">Exam Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a7a]" />
                  <input
                    type="date"
                    value={formData.examDate}
                    onChange={e => setFormData({ ...formData, examDate: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#12121a] border border-[#2d2d42] text-white text-sm focus:border-[#5b8def] outline-none transition-all"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={generating || !formData.subject || !formData.topic || !formData.examDate}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#5b8def] to-[#4ecdc4] text-white font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-60"
              >
                {generating ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate AI Schedule
                  </>
                )}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-3 rounded-xl bg-[#2d2d42] text-[#8a8aa3] font-medium text-sm hover:text-white transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plans Display */}
      <AnimatePresence mode="wait">
        {view === 'list' && (
          <motion.div key="list" className="space-y-4">
            {plans.map((plan) => (
              <Card key={plan.id}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5b8def]/20 to-[#4ecdc4]/20 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-[#5b8def]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-white">{plan.subject}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ backgroundColor: difficultyColors[plan.difficulty] + '20', color: difficultyColors[plan.difficulty] }}>
                          {plan.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-[#8a8aa3]">{plan.topic} • {plan.daysLeft} days until exam</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#5a5a7a]">{plan.schedule.filter(s => s.completed).length}/{plan.schedule.length} completed</span>
                    <button
                      onClick={() => setSelectedPlan(selectedPlan?.id === plan.id ? null : plan)}
                      className="p-2 rounded-xl bg-[#12121a] text-[#8a8aa3] hover:text-white transition-all"
                    >
                      {selectedPlan?.id === plan.id ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-[#12121a] overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(plan.schedule.filter(s => s.completed).length / plan.schedule.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full rounded-full bg-gradient-to-r from-[#5b8def] to-[#4ecdc4]"
                  />
                </div>

                {/* Expanded schedule */}
                <AnimatePresence>
                  {selectedPlan?.id === plan.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2 mt-4 pt-4 border-t border-[#2d2d42]">
                        {plan.schedule.map((day, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                              day.completed ? 'bg-[#2ecc71]/5 border border-[#2ecc71]/20' : 'bg-[#12121a]'
                            }`}
                          >
                            <button
                              onClick={() => toggleComplete(plan.id, idx)}
                              className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                                day.completed
                                  ? 'bg-[#2ecc71] border-[#2ecc71]'
                                  : 'border-[#2d2d42] hover:border-[#5b8def]'
                              }`}
                            >
                              {day.completed && <Check className="w-3.5 h-3.5 text-white" />}
                            </button>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[#d0d0e0]">{day.day}</p>
                              <p className="text-xs text-[#8a8aa3]">{day.topics.join(', ')}</p>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-[#5a5a7a]">
                              <Clock className="w-3 h-3" />
                              {day.hours}h
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            ))}
          </motion.div>
        )}

        {view === 'calendar' && (
          <motion.div key="calendar" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="relative">
                <div className="absolute top-4 right-4 w-3 h-3 rounded-full" style={{ backgroundColor: difficultyColors[plan.difficulty] }} />
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5b8def]/20 to-[#4ecdc4]/20 flex items-center justify-center mb-3">
                  <GraduationCap className="w-5 h-5 text-[#5b8def]" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{plan.subject}</h3>
                <p className="text-xs text-[#8a8aa3] mb-3">{plan.topic}</p>
                <div className="space-y-1 mb-3">
                  {plan.schedule.slice(0, 3).map((day, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span className={`w-2 h-2 rounded-full ${day.completed ? 'bg-[#2ecc71]' : 'bg-[#2d2d42]'}`} />
                      <span className={day.completed ? 'text-[#8a8aa3] line-through' : 'text-[#d0d0e0]'}>{day.day}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-[#5a5a7a]">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{plan.schedule.reduce((s, d) => s + d.hours, 0)}h total</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{plan.daysLeft}d left</span>
                </div>
              </Card>
            ))}
          </motion.div>
        )}

        {view === 'table' && (
          <motion.div key="table" className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2d2d42]">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5a5a7a] uppercase tracking-wider">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5a5a7a] uppercase tracking-wider">Topic</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5a5a7a] uppercase tracking-wider">Difficulty</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5a5a7a] uppercase tracking-wider">Days Left</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5a5a7a] uppercase tracking-wider">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#5a5a7a] uppercase tracking-wider">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.id} className="border-b border-[#2d2d42]/50 hover:bg-[#12121a]/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-white">{plan.subject}</td>
                      <td className="px-4 py-3 text-xs text-[#8a8aa3]">{plan.topic}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase" style={{ backgroundColor: difficultyColors[plan.difficulty] + '20', color: difficultyColors[plan.difficulty] }}>
                          {plan.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#8a8aa3]">{plan.daysLeft}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-[#2d2d42] overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-[#5b8def] to-[#4ecdc4]" style={{ width: `${(plan.schedule.filter(s => s.completed).length / plan.schedule.length) * 100}%` }} />
                          </div>
                          <span className="text-xs text-[#5a5a7a]">{plan.schedule.filter(s => s.completed).length}/{plan.schedule.length}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#8a8aa3]">{plan.schedule.reduce((s, d) => s + d.hours, 0)}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
