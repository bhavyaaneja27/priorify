import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, BookOpen, Clock, Calendar, Check, ChevronRight,
  ChevronLeft, GraduationCap, Layers
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { checkAIRateLimit, recordAIRequest, getRemainingGenerations } from '../lib/aiRateLimit';
import { validateAIPlannerForm } from '../lib/validation';


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

import { useAIPlans, generateUUID } from '../hooks/usePersistence';
import { generateStudyPlan } from '../lib/gemini';

export default function AIPlanner() {
  const { user } = useAuth();
  const { plans, savePlans: setPlans, loading, error: saveError } = useAIPlans();
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
  const [aiError, setAiError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);


  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-[#5b8def] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[#5a5a7a]">Loading AI planner...</p>
      </div>
    );
  }

  const handleGenerate = async () => {
    setValidationError(null);
    setAiError(null);

    // Input validation
    const validation = validateAIPlannerForm(formData.subject, formData.topic, formData.examDate);
    if (!validation.valid) {
      setValidationError(validation.error || 'Please check your inputs.');
      return;
    }

    // AI rate limiting (only for authenticated non-demo users)
    const userId = user?.id || 'demo';
    if (user && !user.isDemo) {
      const rateCheck = checkAIRateLimit(userId, formData.subject, formData.topic, formData.difficulty, formData.examDate);
      if (!rateCheck.allowed) {
        setAiError(rateCheck.reason || 'Rate limit exceeded. Please try again later.');
        return;
      }
    }

    setGenerating(true);

    const examTime = new Date(formData.examDate).getTime();
    const nowTime = new Date().getTime();
    const daysLeft = Math.max(1, Math.ceil((examTime - nowTime) / (1000 * 60 * 60 * 24)));

    let scheduleItems;
    try {
      scheduleItems = await generateStudyPlan(formData.subject, formData.topic, formData.difficulty, daysLeft);
    } catch (err) {
      console.warn("Failed to generate with Gemini, falling back to local generator:", err);

      const planDays = Math.min(5, daysLeft);
      const subtopics = [
        `Introduction to ${formData.topic} & core concepts`,
        `Deep dive into ${formData.topic} algorithms and workflows`,
        `Practical implementations and coding exercises for ${formData.topic}`,
        `Advanced edge cases, problem-solving, and optimizations`,
        `Comprehensive review of ${formData.subject} notes & mock test`
      ];

      scheduleItems = Array.from({ length: planDays }).map((_, idx) => {
        const dayNum = idx + 1;
        const topicIndex = Math.min(subtopics.length - 1, Math.floor((idx / planDays) * subtopics.length));
        const hours = formData.difficulty === 'Hard' ? 4 : formData.difficulty === 'Medium' ? 3 : 2;
        return {
          day: `Day ${dayNum}`,
          topics: [subtopics[topicIndex], `${formData.topic} practice session`],
          hours,
          completed: false
        };
      });
    }

    const newPlan: PlanItem = {
      id: generateUUID(),
      subject: formData.subject,
      topic: formData.topic,
      difficulty: formData.difficulty,
      examDate: formData.examDate,
      daysLeft,
      schedule: scheduleItems
    };
    const result = await setPlans(prev => [...prev, newPlan]);
    if (result?.error) {
      setAiError(result.error);
    } else {
      // Record successful generation for rate limiting
      if (user && !user.isDemo) {
        recordAIRequest(user.id, formData.subject, formData.topic, formData.difficulty, formData.examDate);
      }
    }
    setGenerating(false);
    if (!result?.error) {
      setShowForm(false);
      setFormData({ subject: '', topic: '', difficulty: 'Medium', examDate: '' });
    }
  };


  const toggleComplete = (planId: string, dayIdx: number) => {
    setPlans(prev => prev.map(p => p.id === planId ? {
      ...p,
      schedule: p.schedule.map((s: any, i: number) => i === dayIdx ? { ...s, completed: !s.completed } : s)
    } : p));
  };

  const difficultyColors: Record<string, string> = {
    Easy: 'var(--accent-green)',
    Medium: 'var(--accent-amber)',
    Hard: 'var(--accent-coral)',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">AI Action Planner</h1>
          <p className="text-sm text-dark-300 mt-1">Generate actionable plans and break goals into steps</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-dark-950 rounded-xl p-1 border border-dark-600">
            {(['list', 'calendar', 'table'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${view === v ? 'bg-accent-blue/10 text-accent-blue' : 'text-dark-400 hover:text-dark-300'
                  }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-blue text-white font-medium text-sm transition-all hover:bg-accent-blue/90"
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
            <h3 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-blue" />
              Generate Action Plan
              {user && !user.isDemo && (
                <span className="ml-auto text-xs text-dark-400">
                  {getRemainingGenerations(user.id)} / 5 generations left today
                </span>
              )}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Goal / Project</label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    value={formData.subject}
                    onChange={e => { setFormData({ ...formData, subject: e.target.value }); setValidationError(null); }}
                    placeholder="e.g., Data Structures"
                    maxLength={80}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-950 border border-dark-600 text-dark-100 text-sm focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Topic</label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    value={formData.topic}
                    onChange={e => { setFormData({ ...formData, topic: e.target.value }); setValidationError(null); }}
                    placeholder="e.g., Binary Trees"
                    maxLength={120}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-950 border border-dark-600 text-dark-100 text-sm focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Difficulty</label>
                <div className="flex gap-2">
                  {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => setFormData({ ...formData, difficulty: d })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${formData.difficulty === d
                        ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/30'
                        : 'bg-dark-950 text-dark-300 border border-dark-600 hover:border-dark-400'
                        }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Deadline</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type="date"
                    value={formData.examDate}
                    onChange={e => { setFormData({ ...formData, examDate: e.target.value }); setValidationError(null); }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-950 border border-dark-600 text-dark-100 text-sm focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
            {(validationError || aiError || saveError) && (
              <div className="px-4 py-2.5 rounded-xl bg-accent-coral/10 border border-accent-coral/20 text-xs text-accent-coral mb-4">
                {validationError || aiError || saveError}
              </div>
            )}
            <div className="flex gap-3 mt-2">
              <button
                onClick={handleGenerate}
                disabled={generating || !formData.subject || !formData.topic || !formData.examDate}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent-blue text-white font-semibold text-sm transition-all hover:bg-accent-blue/90 disabled:opacity-60"
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
                onClick={() => { setShowForm(false); setValidationError(null); setAiError(null); }}
                className="px-4 py-2.5 rounded-xl bg-dark-800 border border-dark-600 text-dark-200 font-medium text-sm hover:bg-dark-700 transition-all"
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
                    <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-accent-blue" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-dark-100">{plan.subject}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ backgroundColor: difficultyColors[plan.difficulty] + '15', color: difficultyColors[plan.difficulty] }}>
                          {plan.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-dark-300">{plan.topic} • {plan.daysLeft} days until deadline</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-dark-400">{plan.schedule.filter((s: any) => s.completed).length}/{plan.schedule.length} completed</span>
                    <button
                      onClick={() => setSelectedPlan(selectedPlan?.id === plan.id ? null : plan)}
                      className="p-2 rounded-xl bg-dark-950 border border-dark-600 text-dark-300 hover:text-dark-100 transition-all"
                    >
                      {selectedPlan?.id === plan.id ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-dark-950 overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(plan.schedule.filter((s: any) => s.completed).length / plan.schedule.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full rounded-full bg-accent-blue"
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
                      <div className="space-y-2 mt-4 pt-4 border-t border-dark-600/50">
                        {plan.schedule.map((day: any, idx: number) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${day.completed ? 'bg-accent-green/5 border-accent-green/20' : 'bg-dark-950/60 border-dark-600/30'
                              }`}
                          >
                            <button
                              onClick={() => toggleComplete(plan.id, idx)}
                              className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${day.completed
                                ? 'bg-accent-green border-accent-green'
                                : 'border-dark-600 hover:border-accent-blue'
                                }`}
                            >
                              {day.completed && <Check className="w-3.5 h-3.5 text-white" />}
                            </button>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-dark-100">{day.day}</p>
                              <p className="text-xs text-dark-300">{day.topics.join(', ')}</p>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-dark-400">
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
                <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: difficultyColors[plan.difficulty] }} />
                <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center mb-3">
                  <GraduationCap className="w-5 h-5 text-accent-blue" />
                </div>
                <h3 className="text-sm font-semibold text-dark-100 mb-1">{plan.subject}</h3>
                <p className="text-xs text-dark-300 mb-3">{plan.topic}</p>
                <div className="space-y-1.5 mb-4">
                  {plan.schedule.slice(0, 3).map((day: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span className={`w-2 h-2 rounded-full ${day.completed ? 'bg-accent-green' : 'bg-dark-600'}`} />
                      <span className={day.completed ? 'text-dark-400 line-through' : 'text-dark-200'}>{day.day}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-dark-400 pt-3.5 border-t border-dark-600/30">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{plan.schedule.reduce((s: number, d: any) => s + d.hours, 0)}h total</span>
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
                  <tr className="border-b border-dark-600">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">Goal</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">Topic</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">Difficulty</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">Days Left</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.id} className="border-b border-dark-600/50 hover:bg-dark-800/25 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-dark-100">{plan.subject}</td>
                      <td className="px-4 py-3 text-xs text-dark-300">{plan.topic}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ backgroundColor: difficultyColors[plan.difficulty] + '15', color: difficultyColors[plan.difficulty] }}>
                          {plan.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-dark-300">{plan.daysLeft}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-dark-950 overflow-hidden">
                            <div className="h-full rounded-full bg-accent-blue" style={{ width: `${(plan.schedule.filter((s: any) => s.completed).length / plan.schedule.length) * 100}%` }} />
                          </div>
                          <span className="text-xs text-dark-400">{plan.schedule.filter((s: any) => s.completed).length}/{plan.schedule.length}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-dark-300">{plan.schedule.reduce((s: number, d: any) => s + d.hours, 0)}h</td>
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
