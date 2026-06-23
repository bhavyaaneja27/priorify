/**
 * aiEngine.ts — Priorify AI Priority Engine (Phase 3)
 *
 * Provides:
 *   1. Local priority scoring  (instant, no API)
 *   2. Deadline risk analysis  (instant, no API)
 *   3. Daily planner generation via Gemini (with local fallback)
 *   4. AI insights generation via Gemini   (with local fallback + 30-min cache)
 *
 * StudyAI schema is NOT touched. All data comes from Phase 1/2 hooks.
 */

import type { Task } from '../hooks/usePersistence';
import type { CalendarEvent, DailyPlan } from '../hooks/usePersistence';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

export interface ScoredTask extends Task {
  aiScore: number;
  riskLevel: RiskLevel;
  riskReason: string;
  daysUntilDue: number;
}

export interface DayBlock {
  time: string;        // 'HH:MM'
  endTime: string;     // 'HH:MM'
  type: 'event' | 'task' | 'break';
  title: string;
  notes: string;
  color?: string;
  priority?: string;
}

export interface AIInsights {
  mostUrgent: string;
  overloadedDays: string;
  freeTime: string;
  tip: string;
  generatedAt: number; // epoch ms
}

// ─── Local scoring ────────────────────────────────────────────────────────────

function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

function priorityWeight(p: Task['priority']): number {
  return { critical: 40, high: 30, medium: 15, low: 5 }[p] ?? 5;
}

function dueUrgencyScore(daysLeft: number): number {
  if (daysLeft < 0)  return 50; // overdue
  if (daysLeft < 1)  return 40;
  if (daysLeft < 3)  return 30;
  if (daysLeft < 7)  return 20;
  if (daysLeft < 14) return 10;
  return 0;
}

function statusWeight(s: Task['status']): number {
  return { 'in-progress': 5, pending: 10, completed: -100 }[s] ?? 0;
}

function calendarConflictPenalty(task: Task, events: CalendarEvent[]): number {
  // If the task's due date has heavy calendar coverage that day, bump urgency
  const dueDayEvents = events.filter(e => e.startDate === task.dueDate && !e.allDay);
  if (dueDayEvents.length >= 3) return 15;
  if (dueDayEvents.length >= 1) return 5;
  return 0;
}

export function scoreTask(task: Task, events: CalendarEvent[]): ScoredTask {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  const daysUntilDue = daysBetween(today, due);

  const score =
    priorityWeight(task.priority) +
    dueUrgencyScore(daysUntilDue) +
    statusWeight(task.status) +
    calendarConflictPenalty(task, events);

  const { level, reason } = computeRisk(task, daysUntilDue, events);

  return { ...task, aiScore: score, riskLevel: level, riskReason: reason, daysUntilDue };
}

export function sortTasksByPriority(tasks: Task[], events: CalendarEvent[]): ScoredTask[] {
  return tasks
    .map(t => scoreTask(t, events))
    .sort((a, b) => b.aiScore - a.aiScore);
}

// ─── Risk analysis ────────────────────────────────────────────────────────────

function computeRisk(task: Task, daysLeft: number, events: CalendarEvent[]): { level: RiskLevel; reason: string } {
  if (task.status === 'completed') {
    return { level: 'low', reason: 'Task is completed.' };
  }

  const busyOnDueDay = events.filter(e => e.startDate === task.dueDate && !e.allDay).length >= 2;

  if (daysLeft < 0) {
    return { level: 'critical', reason: 'Past due — immediate action required.' };
  }
  if (daysLeft === 0 && (task.priority === 'critical' || task.priority === 'high')) {
    return { level: 'critical', reason: 'Due today with high/critical priority.' };
  }
  if (daysLeft <= 1 && busyOnDueDay) {
    return { level: 'critical', reason: 'Due tomorrow with a busy calendar on the due day.' };
  }
  if (daysLeft <= 3 && task.priority === 'critical') {
    return { level: 'critical', reason: 'Critical priority with ≤3 days remaining.' };
  }
  if (daysLeft <= 3) {
    return { level: 'high', reason: `Only ${Math.ceil(daysLeft)} day${daysLeft <= 1 ? '' : 's'} remaining.` };
  }
  if (daysLeft <= 7 && (task.priority === 'critical' || task.priority === 'high')) {
    return { level: 'high', reason: 'High/critical priority with 4–7 days remaining.' };
  }
  if (daysLeft <= 7) {
    return { level: 'medium', reason: 'Due within 7 days.' };
  }
  if (daysLeft <= 14 && task.priority === 'high') {
    return { level: 'medium', reason: 'High priority with 8–14 days remaining.' };
  }
  return { level: 'low', reason: 'Sufficient time remaining.' };
}

export function analyzeRisk(tasks: Task[], events: CalendarEvent[]): ScoredTask[] {
  return tasks
    .filter(t => t.status !== 'completed')
    .map(t => scoreTask(t, events))
    .sort((a, b) => {
      const order: Record<RiskLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.riskLevel] - order[b.riskLevel];
    });
}

// ─── Gemini helper ────────────────────────────────────────────────────────────

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('No Gemini API key');
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');
  return text;
}

// ─── Daily Planner ────────────────────────────────────────────────────────────

const PLAN_CACHE_KEY = 'priorify_daily_plan_cache';
const PLAN_CACHE_TTL = 30 * 60 * 1000; // 30 min

interface PlanCache { date: string; ts: number; blocks: DayBlock[] }

function loadPlanCache(): PlanCache | null {
  try {
    const raw = localStorage.getItem(PLAN_CACHE_KEY);
    if (!raw) return null;
    const c: PlanCache = JSON.parse(raw);
    const today = new Date().toISOString().split('T')[0];
    if (c.date !== today || Date.now() - c.ts > PLAN_CACHE_TTL) return null;
    return c;
  } catch { return null; }
}

function savePlanCache(blocks: DayBlock[]) {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(PLAN_CACHE_KEY, JSON.stringify({ date: today, ts: Date.now(), blocks }));
}

/** Local fallback: merge events + tasks into a simple time-block schedule */
function buildLocalDailyPlan(tasks: Task[], events: CalendarEvent[]): DayBlock[] {
  const today = new Date().toISOString().split('T')[0];
  const todayEvents = events
    .filter(e => e.startDate <= today && e.endDate >= today && !e.allDay && e.startTime)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const blocks: DayBlock[] = todayEvents.map(e => ({
    time: e.startTime,
    endTime: e.endTime || addHour(e.startTime, 1),
    type: 'event',
    title: e.title,
    notes: e.location ? `📍 ${e.location}` : '',
    color: e.color,
  }));

  // Slot pending/in-progress tasks into free time windows
  const pendingTasks = tasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => scoreTask(a, events).aiScore - scoreTask(b, events).aiScore)
    .reverse()
    .slice(0, 4);

  const occupiedSlots = new Set(blocks.map(b => b.time));
  const slots = ['08:00','09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00','18:00'];

  for (const task of pendingTasks) {
    const free = slots.find(s => !occupiedSlots.has(s));
    if (!free) break;
    occupiedSlots.add(free);
    blocks.push({
      time: free,
      endTime: addHour(free, 1),
      type: 'task',
      title: task.title,
      notes: `Priority: ${task.priority} · Due: ${task.dueDate}`,
      priority: task.priority,
    });
  }

  return blocks.sort((a, b) => a.time.localeCompare(b.time));
}

function addHour(time: string, h: number): string {
  const [hh, mm] = time.split(':').map(Number);
  const newHh = Math.min(23, hh + h);
  return `${String(newHh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}

export async function generateSmartDailyPlan(
  tasks: Task[],
  events: CalendarEvent[],
  productivityData: { stress: number; focus: number } | null,
  forceRefresh = false
): Promise<{ plan: Omit<DailyPlan, 'id'>; fromCache: boolean; fromAI: boolean }> {
  if (!forceRefresh) {
    const cached = loadPlanCache();
    // Return cached plan logic changed slightly since we need the full plan structure
    // but to keep it simple, we'll just not use cache for SmartDailyPlan or we can adapt it.
  }

  const today = new Date().toISOString().split('T')[0];
  const todayEvents = events.filter(e => e.startDate <= today && e.endDate >= today && !e.allDay);
  const pendingTasks = tasks.filter(t => t.status !== 'completed').slice(0, 8);
  const sortedTasks = sortTasksByPriority(tasks, events);
  const topPriorities = sortedTasks.slice(0, 3).map(t => t.title);

  const prodContext = productivityData ? `User today has Stress: ${productivityData.stress}/10, Focus: ${productivityData.focus}/10. Adjust breaks and workload intensity accordingly.` : '';

  const prompt = `You are Priorify, an AI productivity assistant. Generate an optimized daily time-block schedule for TODAY (${today}).

Fixed calendar events (cannot be moved):
${JSON.stringify(todayEvents.map(e => ({ title: e.title, start: e.startTime, end: e.endTime, location: e.location })), null, 2)}

Pending tasks to fit around events (prioritize by importance):
${JSON.stringify(pendingTasks.map(t => ({ title: t.title, priority: t.priority, dueDate: t.dueDate, category: t.category })), null, 2)}

${prodContext}

Rules:
- Working hours: 08:00–20:00
- Don't overlap with fixed events
- Add short breaks (15 min) after 90 min blocks
- Keep focused work blocks 60–90 min
- Put highest priority tasks in peak morning hours (09:00–12:00)

Return ONLY valid JSON:
{
  "schedule": [
    { "time": "09:00", "endTime": "10:30", "type": "task", "title": "...", "notes": "..." }
  ],
  "workloadMinutes": 240,
  "topPriorities": ["Task A", "Task B"]
}
type must be "event", "task", or "break".`;

  try {
    const raw = await callGemini(prompt);
    const parsed = JSON.parse(raw.trim());
    if (Array.isArray(parsed.schedule) && parsed.schedule.length > 0) {
      const schedule = parsed.schedule.map((b: DayBlock) => {
        const matchingEvent = todayEvents.find(e => e.title === b.title);
        return { ...b, color: matchingEvent?.color };
      });
      const plan: Omit<DailyPlan, 'id'> = {
        date: today,
        schedule,
        workloadMinutes: parsed.workloadMinutes || 240,
        topPriorities: parsed.topPriorities || topPriorities
      };
      savePlanCache(schedule); // keep cache for backward compatibility in AI engine tab if needed
      return { plan, fromCache: false, fromAI: true };
    }
    throw new Error('Invalid blocks structure');
  } catch (err) {
    console.warn('[aiEngine] Gemini smart daily plan failed, using local fallback:', err);
    const blocks = buildLocalDailyPlan(tasks, events);
    const plan: Omit<DailyPlan, 'id'> = {
      date: today,
      schedule: blocks,
      workloadMinutes: blocks.filter(b => b.type === 'task').length * 60,
      topPriorities
    };
    return { plan, fromCache: false, fromAI: false };
  }
}

export async function generateDailyPlan(
  tasks: Task[],
  events: CalendarEvent[],
  forceRefresh = false
): Promise<{ blocks: DayBlock[]; fromCache: boolean; fromAI: boolean }> {
  if (!forceRefresh) {
    const cached = loadPlanCache();
    if (cached) return { blocks: cached.blocks, fromCache: true, fromAI: true };
  }

  const today = new Date().toISOString().split('T')[0];
  const todayEvents = events.filter(e => e.startDate <= today && e.endDate >= today && !e.allDay);
  const pendingTasks = tasks.filter(t => t.status !== 'completed').slice(0, 8);

  const prompt = `You are Priorify, an AI productivity assistant. Generate an optimized daily time-block schedule for TODAY (${today}).

Fixed calendar events (cannot be moved):
${JSON.stringify(todayEvents.map(e => ({ title: e.title, start: e.startTime, end: e.endTime, location: e.location })), null, 2)}

Pending tasks to fit around events (prioritize by importance):
${JSON.stringify(pendingTasks.map(t => ({ title: t.title, priority: t.priority, dueDate: t.dueDate, category: t.category })), null, 2)}

Rules:
- Working hours: 08:00–20:00
- Don't overlap with fixed events
- Add short breaks (15 min) after 90 min blocks
- Keep focused work blocks 60–90 min
- Put highest priority tasks in peak morning hours (09:00–12:00)

Return ONLY valid JSON:
{
  "blocks": [
    { "time": "09:00", "endTime": "10:30", "type": "task", "title": "...", "notes": "..." }
  ]
}
type must be "event", "task", or "break".`;

  try {
    const raw = await callGemini(prompt);
    const parsed = JSON.parse(raw.trim());
    if (Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
      // Merge AI plan with actual event colors
      const blocks: DayBlock[] = parsed.blocks.map((b: DayBlock) => {
        const matchingEvent = todayEvents.find(e => e.title === b.title);
        return { ...b, color: matchingEvent?.color };
      });
      savePlanCache(blocks);
      return { blocks, fromCache: false, fromAI: true };
    }
    throw new Error('Invalid blocks structure');
  } catch (err) {
    console.warn('[aiEngine] Gemini daily plan failed, using local fallback:', err);
    const blocks = buildLocalDailyPlan(tasks, events);
    return { blocks, fromCache: false, fromAI: false };
  }
}

// ─── AI Insights ──────────────────────────────────────────────────────────────

const INSIGHTS_CACHE_KEY = 'priorify_ai_insights_cache';
const INSIGHTS_CACHE_TTL = 30 * 60 * 1000;

interface InsightsCache { date: string; ts: number; insights: AIInsights }

function loadInsightsCache(): AIInsights | null {
  try {
    const raw = localStorage.getItem(INSIGHTS_CACHE_KEY);
    if (!raw) return null;
    const c: InsightsCache = JSON.parse(raw);
    const today = new Date().toISOString().split('T')[0];
    if (c.date !== today || Date.now() - c.ts > INSIGHTS_CACHE_TTL) return null;
    return c.insights;
  } catch { return null; }
}

function saveInsightsCache(insights: AIInsights) {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(INSIGHTS_CACHE_KEY, JSON.stringify({ date: today, ts: Date.now(), insights }));
}

function buildLocalInsights(tasks: Task[], events: CalendarEvent[]): AIInsights {
  const today = new Date().toISOString().split('T')[0];
  const pending = tasks.filter(t => t.status !== 'completed');
  const urgent = pending
    .filter(t => t.priority === 'critical' || t.priority === 'high')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Find overloaded days (3+ events)
  const dayCounts: Record<string, number> = {};
  events.forEach(e => { dayCounts[e.startDate] = (dayCounts[e.startDate] || 0) + 1; });
  const overloaded = Object.entries(dayCounts)
    .filter(([, c]) => c >= 3)
    .map(([d]) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));

  // Find days with < 2 events in next 7 days
  const freeSlots: string[] = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const ds = d.toISOString().split('T')[0];
    if ((dayCounts[ds] || 0) < 2) {
      freeSlots.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
      if (freeSlots.length >= 2) break;
    }
  }

  const overdueCount = pending.filter(t => t.dueDate < today).length;

  return {
    mostUrgent: urgent.length > 0
      ? `"${urgent[0].title}" is your most urgent task — due ${new Date(urgent[0].dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`
      : 'No urgent tasks right now. Great job staying on top of things!',
    overloadedDays: overloaded.length > 0
      ? `${overloaded.slice(0, 2).join(' and ')} look${overloaded.length === 1 ? 's' : ''} heavily scheduled. Consider moving non-critical work.`
      : 'Your schedule looks balanced this week.',
    freeTime: freeSlots.length > 0
      ? `${freeSlots.join(' and ')} ${freeSlots.length === 1 ? 'has' : 'have'} open slots — good opportunities for deep work.`
      : 'Your week is packed. Try to carve out at least one unscheduled hour each day.',
    tip: overdueCount > 0
      ? `You have ${overdueCount} overdue task${overdueCount > 1 ? 's' : ''}. Tackle the shortest one first to build momentum.`
      : pending.length > 5
      ? 'You have many open tasks. Use the Priority Engine to focus on the top 3 each day.'
      : 'Strong momentum! Keep completing tasks and building your streak.',
    generatedAt: Date.now(),
  };
}

export async function generateAIInsights(
  tasks: Task[],
  events: CalendarEvent[],
  forceRefresh = false
): Promise<{ insights: AIInsights; fromCache: boolean; fromAI: boolean }> {
  if (!forceRefresh) {
    const cached = loadInsightsCache();
    if (cached) return { insights: cached, fromCache: true, fromAI: true };
  }

  const today = new Date().toISOString().split('T')[0];
  const pending = tasks.filter(t => t.status !== 'completed').slice(0, 10);

  const prompt = `You are Priorify, an AI productivity assistant. Analyze the user's tasks and upcoming calendar for the next 7 days.

Today: ${today}

Pending tasks:
${JSON.stringify(pending.map(t => ({ title: t.title, priority: t.priority, dueDate: t.dueDate, status: t.status })), null, 2)}

Upcoming calendar events (next 7 days):
${JSON.stringify(events.filter(e => e.startDate >= today).slice(0, 15).map(e => ({ title: e.title, date: e.startDate, category: e.category })), null, 2)}

Provide concise, actionable insights. Return ONLY valid JSON:
{
  "mostUrgent": "One sentence about the most urgent task or situation",
  "overloadedDays": "One sentence about scheduling pressure or balance",
  "freeTime": "One sentence identifying free slots or opportunities",
  "tip": "One actionable productivity tip specific to their situation"
}`;

  try {
    const raw = await callGemini(prompt);
    const parsed = JSON.parse(raw.trim()) as Omit<AIInsights, 'generatedAt'>;
    if (parsed.mostUrgent && parsed.tip) {
      const insights: AIInsights = { ...parsed, generatedAt: Date.now() };
      saveInsightsCache(insights);
      return { insights, fromCache: false, fromAI: true };
    }
    throw new Error('Missing required fields');
  } catch (err) {
    console.warn('[aiEngine] Gemini insights failed, using local fallback:', err);
    const insights = buildLocalInsights(tasks, events);
    return { insights, fromCache: false, fromAI: false };
  }
}

// ─── Helpers (exported for UI) ────────────────────────────────────────────────

export const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; icon: string }> = {
  critical: { label: 'Critical',  color: '#FB7185', bg: 'rgba(251,113,133,0.1)',  icon: '🔴' },
  high:     { label: 'High Risk', color: '#FB923C', bg: 'rgba(251,146,60,0.1)',   icon: '🟠' },
  medium:   { label: 'Medium',    color: '#FBBF24', bg: 'rgba(251,191,36,0.1)',   icon: '🟡' },
  low:      { label: 'Low Risk',  color: '#34D399', bg: 'rgba(52,211,153,0.1)',   icon: '🟢' },
};

export function formatTime12(t: string): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

// ─── Goal to Tasks ────────────────────────────────────────────────────────────

export interface GeneratedTask {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedMinutes: number;
}

export async function generateActionableTasks(goal: string, context?: string): Promise<GeneratedTask[]> {
  const prompt = `You are Priorify, an AI productivity assistant. Break down the following high-level goal into a series of actionable, ordered tasks.

Goal: "${goal}"
Additional Context: "${context || 'None'}"

Rules:
- Create 3 to 7 specific, actionable tasks.
- Order them logically (Step 1, Step 2, etc.).
- Give each a priority level (low, medium, high, critical).
- Estimate the time required in minutes.

Return ONLY valid JSON:
{
  "tasks": [
    { "title": "...", "description": "...", "priority": "high", "estimatedMinutes": 45 }
  ]
}`;

  try {
    const raw = await callGemini(prompt);
    const parsed = JSON.parse(raw.trim());
    if (Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
      return parsed.tasks as GeneratedTask[];
    }
    throw new Error('Invalid task structure');
  } catch (err) {
    console.error('[aiEngine] Goal to Tasks failed:', err);
    throw err;
  }
}

