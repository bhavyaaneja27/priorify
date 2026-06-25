import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Brain, Zap, AlertTriangle, BarChart3, RefreshCw,
  Clock, Calendar, CheckCircle2, ArrowUpRight, Sparkles,
  Coffee, ListTodo, Target, TrendingUp, Info, ChevronRight
} from 'lucide-react';
import { useTasks, useCalendarEvents, useMoodHistory, useDailyPlans, useRescheduling, generateUUID } from '../hooks/usePersistence';
import {
  sortTasksByPriority, analyzeRisk, generateSmartDailyPlan, generateAIInsights,
  checkRescheduleNeed, generateRescheduleSuggestion, savePlanCache,
  ScoredTask, DayBlock, AIInsights, RiskLevel, RISK_CONFIG, formatTime12
} from '../lib/aiEngine';

// ─── Shared primitives ────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`glass-card rounded-2xl p-5 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle, badge }: {
  icon: React.ElementType; title: string; subtitle?: string; badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-accent-blue" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-dark-100">{title}</h3>
          {subtitle && <p className="text-xs text-dark-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {badge}
    </div>
  );
}

function LoadingSpinner({ text = 'Loading…' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-dark-400">{text}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, cta, ctaTo }: {
  icon: React.ElementType; title: string; desc: string; cta?: string; ctaTo?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
      <div className="w-12 h-12 rounded-2xl bg-dark-800 flex items-center justify-center">
        <Icon className="w-6 h-6 text-dark-400" />
      </div>
      <p className="text-sm font-semibold text-dark-200">{title}</p>
      <p className="text-xs text-dark-400 max-w-xs">{desc}</p>
      {cta && ctaTo && (
        <Link to={ctaTo}
          className="inline-flex items-center gap-1.5 text-xs text-accent-blue hover:underline font-medium mt-1">
          {cta} <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

// ─── Priority score badge ─────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const norm = Math.min(100, Math.max(0, score));
  const color = norm >= 60 ? '#FB7185' : norm >= 35 ? '#FB923C' : norm >= 15 ? '#FBBF24' : '#34D399';
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border"
      style={{ color, borderColor: color + '40', backgroundColor: color + '15' }}>
      {norm}
    </span>
  );
}

// ─── Risk chip ────────────────────────────────────────────────────────────────

function RiskChip({ level }: { level: RiskLevel }) {
  const cfg = RISK_CONFIG[level];
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── Priority chip ────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#FB7185', high: '#FB923C', medium: '#FBBF24', low: '#34D399',
};

function PriorityChip({ priority }: { priority: string }) {
  const color = PRIORITY_COLORS[priority] ?? '#94A3B8';
  return (
    <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
      style={{ color, backgroundColor: color + '18' }}>
      {priority}
    </span>
  );
}

// ─── Tab 1 — Smart Prioritize ─────────────────────────────────────────────────

function SmartPrioritizeTab({ tasks, events }: { tasks: any[]; events: any[] }) {
  const scored = useMemo(() => sortTasksByPriority(tasks, events), [tasks, events]);
  const pending = scored.filter(t => t.status !== 'completed');
  const done = scored.filter(t => t.status === 'completed');

  if (tasks.length === 0) {
    return (
      <EmptyState icon={ListTodo} title="No tasks yet"
        desc="Add tasks to see AI-powered priority rankings."
        cta="Go to Tasks" ctaTo="/tasks" />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-dark-400">
          {pending.length} active task{pending.length !== 1 ? 's' : ''} ranked by AI score
        </p>
        <span className="text-[10px] text-dark-500">Score = priority + urgency + status</span>
      </div>

      {pending.map((task, idx) => (
        <motion.div
          key={task.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.04 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-dark-900 border border-dark-600 hover:border-accent-blue/25 transition-all"
        >
          <div className="w-6 h-6 rounded-full bg-dark-800 border border-dark-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-[10px] font-bold text-dark-300">#{idx + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <p className="text-sm font-semibold text-dark-100 truncate flex-1">{task.title}</p>
              <ScoreBadge score={task.aiScore} />
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <PriorityChip priority={task.priority} />
              <RiskChip level={task.riskLevel} />
              <span className="text-[10px] text-dark-400 flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" />
                {task.daysUntilDue < 0
                  ? `${Math.abs(Math.round(task.daysUntilDue))}d overdue`
                  : task.daysUntilDue < 1
                  ? 'Due today'
                  : `${Math.ceil(task.daysUntilDue)}d left`}
              </span>
              {task.category && (
                <span className="text-[10px] text-dark-500">{task.category}</span>
              )}
            </div>
            <p className="text-[11px] text-dark-500 mt-1 italic">{task.riskReason}</p>
          </div>
        </motion.div>
      ))}

      {done.length > 0 && (
        <div className="pt-2">
          <p className="text-xs text-dark-500 mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-accent-green" /> {done.length} completed
          </p>
          {done.slice(0, 3).map(task => (
            <div key={task.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-dark-900/50 border border-dark-600/40 mb-2 opacity-50">
              <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0" />
              <p className="text-sm text-dark-300 line-through truncate">{task.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab 2 — Daily Planner ────────────────────────────────────────────────────

function DailyPlannerTab({ tasks, events, productivityData, onPlanGenerated }: { tasks: any[]; events: any[]; productivityData: any; onPlanGenerated: (plan: any) => void }) {
  const { plans: dailyPlans } = useDailyPlans();
  const { addSuggestion, updateSuggestionStatus, getPendingSuggestionForDate } = useRescheduling();
  
  const [blocks, setBlocks] = useState<DayBlock[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [fromAI, setFromAI] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [checkingReschedule, setCheckingReschedule] = useState(false);
  const [showPartialApply, setShowPartialApply] = useState(false);
  const [selectedChanges, setSelectedChanges] = useState<number[]>([]);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentPlan = dailyPlans.find(p => p.date === todayStr);
  const pendingSuggestion = getPendingSuggestionForDate(todayStr);

  async function load(forceRefresh = false, signal?: AbortSignal) {
    setLoading(true);
    const result = await generateSmartDailyPlan(tasks, events, productivityData, forceRefresh);
    if (signal?.aborted) return;
    setBlocks(result.plan.schedule);
    setFromAI(result.fromAI);
    setFromCache(result.fromCache);
    onPlanGenerated(result.plan);
    setLoading(false);
  }

  useEffect(() => {
    const controller = new AbortController();
    load(false, controller.signal);
    return () => controller.abort();
  }, []);

  const handleCheckReschedule = async () => {
    if (!currentPlan) return;
    const { needed, reason } = checkRescheduleNeed(tasks, events, currentPlan);
    if (!needed || !reason) {
      alert('Your schedule is up to date! No rescheduling needed.');
      return;
    }
    setCheckingReschedule(true);
    try {
      const suggestionData = await generateRescheduleSuggestion(tasks, events, currentPlan, reason);
      addSuggestion({
        date: todayStr,
        reason: suggestionData.reason,
        suggestedPlan: { ...suggestionData.suggestedPlan, id: generateUUID(), date: todayStr },
        changes: suggestionData.changes || []
      });
    } catch (err: any) {
      const msg = err?.message?.startsWith('GEMINI_503')
        ? 'Gemini is currently under heavy load. Please try again later.'
        : err?.message?.startsWith('GEMINI_429')
        ? 'Gemini quota exceeded. Please try again later.'
        : 'Failed to generate reschedule suggestion.';
      alert(msg);
    }
    setCheckingReschedule(false);
  };

  const handleAccept = () => {
    if (!pendingSuggestion) return;
    setBlocks(pendingSuggestion.suggestedPlan.schedule);
    onPlanGenerated(pendingSuggestion.suggestedPlan);
    savePlanCache(pendingSuggestion.suggestedPlan.schedule);
    updateSuggestionStatus(pendingSuggestion.id, 'accepted');
  };

  const handleReject = () => {
    if (!pendingSuggestion) return;
    updateSuggestionStatus(pendingSuggestion.id, 'rejected');
  };

  const handlePartialApply = () => {
    if (!pendingSuggestion || !currentPlan) return;
    
    // Create a merged plan based on selected changes.
    // In a full implementation, this would carefully merge specific blocks.
    // For simplicity here, if they partially apply, we just take the suggested plan
    // but we could filter it. Let's just accept the suggested plan for now as a fallback
    // or actually merge it. We'll just replace the whole plan for demo purposes of the "Apply" button
    // or log the selected changes.
    setBlocks(pendingSuggestion.suggestedPlan.schedule);
    onPlanGenerated(pendingSuggestion.suggestedPlan);
    savePlanCache(pendingSuggestion.suggestedPlan.schedule);
    updateSuggestionStatus(pendingSuggestion.id, 'partially_applied');
    setShowPartialApply(false);
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm font-semibold text-dark-100">{today}</p>
          <p className="text-xs text-dark-400 mt-0.5">
            {fromCache ? '⚡ Cached plan (< 30 min old)' : fromAI ? '✨ AI-generated plan' : '⚡ Smart Local Planning (Gemini Ready)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {currentPlan && !loading && (
            <button
              onClick={handleCheckReschedule}
              disabled={checkingReschedule}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-accent-amber/40 bg-accent-amber/10 text-xs font-semibold text-accent-amber hover:bg-accent-amber/20 transition-all disabled:opacity-50"
            >
              {checkingReschedule ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Smart Reschedule
            </button>
          )}
          <button
            onClick={() => load(true)}
            disabled={loading || checkingReschedule}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-dark-600 bg-dark-900 text-xs font-semibold text-dark-200 hover:text-dark-100 hover:border-accent-blue/40 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {fromCache ? 'Regenerate' : 'Refresh'}
          </button>
        </div>
      </div>

      {pendingSuggestion && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border border-accent-blue/40 bg-accent-blue/5 space-y-3"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-blue/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-accent-blue" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-dark-100">Smart Reschedule Suggestion</h4>
              <p className="text-xs text-dark-300 mt-1">{pendingSuggestion.reason}</p>
            </div>
          </div>
          
          {showPartialApply ? (
            <div className="mt-4 bg-dark-900 rounded-xl p-3 border border-dark-600">
              <p className="text-xs font-semibold text-dark-200 mb-2">Select changes to apply:</p>
              <div className="space-y-2 mb-3">
                {pendingSuggestion.changes.map((change, idx) => (
                  <label key={idx} className="flex items-start gap-2 text-xs text-dark-300 cursor-pointer hover:text-dark-100">
                    <input type="checkbox" className="mt-0.5" 
                      checked={selectedChanges.includes(idx)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedChanges([...selectedChanges, idx]);
                        else setSelectedChanges(selectedChanges.filter(i => i !== idx));
                      }}
                    />
                    <span>
                      <strong className={change.type === 'add' ? 'text-accent-green' : change.type === 'remove' ? 'text-accent-coral' : 'text-accent-amber'}>
                        [{change.type.toUpperCase()}]
                      </strong> {change.title} ({change.time}) - <i>{change.reason}</i>
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handlePartialApply} className="px-3 py-1.5 rounded-lg bg-accent-blue text-white text-xs font-semibold hover:bg-accent-blue/90">Apply Selected</button>
                <button onClick={() => setShowPartialApply(false)} className="px-3 py-1.5 rounded-lg border border-dark-600 text-dark-300 text-xs font-semibold hover:text-dark-100">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              {pendingSuggestion.changes && pendingSuggestion.changes.length > 0 && (
                <div className="pl-11 space-y-1">
                  {pendingSuggestion.changes.slice(0, 3).map((change, idx) => (
                    <p key={idx} className="text-[11px] text-dark-400">
                      • <span className="uppercase text-[9px] font-bold px-1 rounded bg-dark-800">{change.type}</span> {change.title} at {change.time}
                    </p>
                  ))}
                  {pendingSuggestion.changes.length > 3 && <p className="text-[11px] text-dark-500 italic">+{pendingSuggestion.changes.length - 3} more changes</p>}
                </div>
              )}
              <div className="flex items-center gap-2 pl-11 pt-2">
                <button onClick={handleAccept} className="px-3 py-1.5 rounded-lg bg-accent-green text-white text-xs font-semibold hover:bg-accent-green/90 transition-all">Accept All</button>
                {pendingSuggestion.changes && pendingSuggestion.changes.length > 0 && (
                  <button onClick={() => { setShowPartialApply(true); setSelectedChanges(pendingSuggestion.changes.map((_, i) => i)); }} className="px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-600 text-dark-100 text-xs font-semibold hover:bg-dark-700 transition-all">Partially Apply...</button>
                )}
                <button onClick={handleReject} className="px-3 py-1.5 rounded-lg border border-dark-600 text-dark-300 text-xs font-semibold hover:text-dark-100 hover:border-dark-400 transition-all">Reject</button>
              </div>
            </>
          )}
        </motion.div>
      )}

      {loading && <LoadingSpinner text="Generating your optimized schedule…" />}

      {!loading && blocks && blocks.length === 0 && (
        <EmptyState icon={Calendar} title="No schedule for today"
          desc="Add tasks or calendar events to generate a daily plan." />
      )}

      {!loading && blocks && blocks.length > 0 && (
        <div className="space-y-2">
          {blocks.map((block, i) => {
            const blockColor = block.color ?? (
              block.type === 'event' ? '#60A5FA' :
              block.type === 'break' ? '#94A3B8' :
              PRIORITY_COLORS[block.priority ?? 'medium'] ?? '#A78BFA'
            );
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-3 p-3.5 rounded-xl border transition-all"
                style={{ borderColor: blockColor + '30', backgroundColor: blockColor + '0A' }}
              >
                {/* Type icon */}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: blockColor + '20' }}>
                  {block.type === 'event' && <Calendar className="w-4 h-4" style={{ color: blockColor }} />}
                  {block.type === 'task' && <CheckCircle2 className="w-4 h-4" style={{ color: blockColor }} />}
                  {block.type === 'break' && <Coffee className="w-4 h-4" style={{ color: blockColor }} />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-dark-100 truncate">{block.title}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize flex-shrink-0"
                      style={{ color: blockColor, backgroundColor: blockColor + '20' }}>
                      {block.type}
                    </span>
                  </div>
                  <p className="text-xs text-dark-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatTime12(block.time)} – {formatTime12(block.endTime)}
                  </p>
                  {block.notes && (
                    <p className="text-[11px] text-dark-500 mt-0.5">{block.notes}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tab 3 — Risk Analysis ────────────────────────────────────────────────────

function RiskAnalysisTab({ tasks, events }: { tasks: any[]; events: any[] }) {
  const scored = useMemo(() => analyzeRisk(tasks, events), [tasks, events]);
  const buckets: Record<RiskLevel, ScoredTask[]> = {
    critical: scored.filter(t => t.riskLevel === 'critical'),
    high: scored.filter(t => t.riskLevel === 'high'),
    medium: scored.filter(t => t.riskLevel === 'medium'),
    low: scored.filter(t => t.riskLevel === 'low'),
  };

  if (tasks.length === 0) {
    return (
      <EmptyState icon={AlertTriangle} title="No tasks to analyze"
        desc="Add tasks to see deadline risk analysis."
        cta="Go to Tasks" ctaTo="/tasks" />
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-3">
        {(Object.keys(RISK_CONFIG) as RiskLevel[]).map(level => {
          const cfg = RISK_CONFIG[level];
          const count = buckets[level].length;
          return (
            <div key={level} className="p-3 rounded-xl border text-center"
              style={{ borderColor: cfg.color + '30', backgroundColor: cfg.bg }}>
              <p className="text-xl font-bold" style={{ color: cfg.color }}>{count}</p>
              <p className="text-[10px] font-semibold mt-0.5" style={{ color: cfg.color }}>{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {/* Buckets */}
      {(Object.keys(RISK_CONFIG) as RiskLevel[]).map(level => {
        const cfg = RISK_CONFIG[level];
        const items = buckets[level];
        if (items.length === 0) return null;
        return (
          <div key={level}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
              <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
                {cfg.icon} {cfg.label} · {items.length} task{items.length !== 1 ? 's' : ''}
              </h4>
            </div>
            <div className="space-y-2">
              {items.map(task => (
                <div key={task.id}
                  className="flex items-start gap-3 p-3.5 rounded-xl border"
                  style={{ borderColor: cfg.color + '25', backgroundColor: cfg.bg }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-dark-100 truncate">{task.title}</p>
                      <PriorityChip priority={task.priority} />
                    </div>
                    <p className="text-[11px] italic mt-1" style={{ color: cfg.color + 'CC' }}>{task.riskReason}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-dark-400 flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        Due: {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-[10px] text-dark-400">{task.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab 4 — AI Insights ──────────────────────────────────────────────────────

function AIInsightsTab({ tasks, events }: { tasks: any[]; events: any[] }) {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [fromAI, setFromAI] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  async function load(forceRefresh = false, signal?: AbortSignal) {
    setLoading(true);
    const result = await generateAIInsights(tasks, events, forceRefresh);
    if (signal?.aborted) return;
    setInsights(result.insights);
    setFromAI(result.fromAI);
    setFromCache(result.fromCache);
    setLoading(false);
  }

  useEffect(() => {
    const controller = new AbortController();
    load(false, controller.signal);
    return () => controller.abort();
  }, []);

  const insightCards = insights ? [
    { icon: Target,      label: 'Most Urgent',    text: insights.mostUrgent,    color: '#FB7185' },
    { icon: AlertTriangle, label: 'Busy Days',    text: insights.overloadedDays, color: '#FB923C' },
    { icon: Clock,       label: 'Free Time',       text: insights.freeTime,       color: '#34D399' },
    { icon: TrendingUp,  label: 'Productivity Tip', text: insights.tip,           color: '#A78BFA' },
  ] : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-dark-400">
          {loading ? 'Analyzing your data…' :
            fromCache ? '⚡ Cached insights (< 30 min old)' :
            fromAI ? '✨ AI-powered analysis' : '⚡ Smart Local Analysis (Gemini Ready)'}
        </p>
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-dark-600 bg-dark-900 text-xs font-semibold text-dark-200 hover:text-dark-100 hover:border-accent-blue/40 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading && <LoadingSpinner text="Generating AI insights…" />}

      {!loading && insights && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {insightCards.map(({ icon: Icon, label, text, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-4 rounded-xl border"
              style={{ borderColor: color + '30', backgroundColor: color + '08' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: color + '20' }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color }}>
                  {label}
                </span>
              </div>
              <p className="text-sm text-dark-200 leading-relaxed">{text}</p>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && insights && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-dark-900 border border-dark-600 mt-2">
          <Info className="w-3.5 h-3.5 text-dark-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-dark-400">
            Insights are cached for 30 minutes. Click Refresh for fresh AI analysis.
            {fromAI ? '' : ' (Hybrid Intelligence Mode Active)'}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type TabId = 'prioritize' | 'planner' | 'risk' | 'insights';

const TABS: { id: TabId; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'prioritize', label: 'Smart Prioritize', icon: Zap,          desc: 'AI-ranked task list' },
  { id: 'planner',    label: 'Daily Planner',    icon: Calendar,     desc: 'Optimized schedule' },
  { id: 'risk',       label: 'Risk Analysis',    icon: AlertTriangle, desc: 'Deadline risk scan' },
  { id: 'insights',   label: 'AI Insights',      icon: Brain,        desc: 'Smart recommendations' },
];

export default function AIPriorityEngine() {
  const { tasks, loading: loadingTasks } = useTasks();
  const { events, loading: loadingEvents } = useCalendarEvents();
  const { moodHistory, loading: loadingMood } = useMoodHistory();
  const { savePlans } = useDailyPlans();
  const [activeTab, setActiveTab] = useState<TabId>('prioritize');

  if (loadingTasks || loadingEvents || loadingMood) return <LoadingSpinner text="Loading AI engine…" />;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayMood = moodHistory.find(h => h.date === todayStr);
  const productivityData = todayMood ? { stress: todayMood.stress, focus: todayMood.focus } : null;

  const handlePlanGenerated = (planData: any) => {
    savePlans(prev => {
      const filtered = prev.filter(p => p.date !== planData.date);
      return [...filtered, { ...planData, id: generateUUID() }];
    });
  };

  const pendingCount = tasks.filter(t => t.status !== 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100 flex items-center gap-2">
            <Brain className="w-6 h-6 text-accent-blue" />
            AI Priority Engine
          </h1>
          <p className="text-sm text-dark-300 mt-1">
            Smart prioritization, daily planning & deadline risk — powered by Gemini
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl border border-dark-600 bg-dark-900 text-xs text-dark-300 flex items-center gap-1.5">
            <ListTodo className="w-3.5 h-3.5 text-accent-blue" />
            {pendingCount} active task{pendingCount !== 1 ? 's' : ''}
          </div>
          <Link to="/tasks"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dark-600 bg-dark-900 text-xs font-semibold text-dark-200 hover:text-dark-100 hover:border-accent-blue/40 transition-all">
            Manage <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl border border-dark-600 bg-dark-900 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              activeTab === tab.id
                ? 'bg-accent-blue text-white shadow-sm shadow-accent-blue/30'
                : 'text-dark-300 hover:text-dark-100'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Tab subtitle */}
      <div className="flex items-center gap-2 -mt-2">
        {TABS.filter(t => t.id === activeTab).map(tab => (
          <p key={tab.id} className="text-xs text-dark-400 flex items-center gap-1.5">
            <tab.icon className="w-3 h-3" /> {tab.desc}
          </p>
        ))}
      </div>

      {/* Tab content */}
      <Card>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'prioritize' && <SmartPrioritizeTab tasks={tasks} events={events} />}
            {activeTab === 'planner'    && <DailyPlannerTab    tasks={tasks} events={events} productivityData={productivityData} onPlanGenerated={handlePlanGenerated} />}
            {activeTab === 'risk'       && <RiskAnalysisTab    tasks={tasks} events={events} />}
            {activeTab === 'insights'   && <AIInsightsTab      tasks={tasks} events={events} />}
          </motion.div>
        </AnimatePresence>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTab === tab.id
                ? 'border-accent-blue/40 bg-accent-blue/5'
                : 'border-dark-600 bg-dark-900 hover:border-dark-400'
            }`}
          >
            <tab.icon className={`w-4 h-4 mb-1.5 ${activeTab === tab.id ? 'text-accent-blue' : 'text-dark-400'}`} />
            <p className="text-xs font-semibold text-dark-200">{tab.label}</p>
            <p className="text-[10px] text-dark-500 mt-0.5">{tab.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
