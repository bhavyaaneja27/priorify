import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, Trash2, Pencil, X, CheckCircle2,
  Circle, Clock, AlertTriangle, ChevronDown, Tag,
  Calendar, ListTodo, ArrowUpRight, Loader2, Info
} from 'lucide-react';
import { useTasks, Task, TaskPriority, TaskStatus, useUserProfile } from '../hooks/usePersistence';
import { useReminders, requestNotificationPermission } from '../hooks/useReminders';

// ─── Design helpers ───────────────────────────────────────────────────────────

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

// ─── Priority config ──────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string; border: string }> = {
  low:      { label: 'Low',      color: 'text-accent-teal',   bg: 'bg-accent-teal/10',   border: 'border-accent-teal/20' },
  medium:   { label: 'Medium',   color: 'text-accent-amber',  bg: 'bg-accent-amber/10',  border: 'border-accent-amber/20' },
  high:     { label: 'High',     color: 'text-accent-coral',  bg: 'bg-accent-coral/10',  border: 'border-accent-coral/20' },
  critical: { label: 'Critical', color: 'text-accent-pink',   bg: 'bg-accent-pink/10',   border: 'border-accent-pink/20' },
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string; border: string }> = {
  pending:     { label: 'Pending',     color: 'text-dark-300',      bg: 'bg-dark-800',         border: 'border-dark-600' },
  'in-progress': { label: 'In Progress', color: 'text-accent-blue',   bg: 'bg-accent-blue/10',   border: 'border-accent-blue/20' },
  completed:   { label: 'Completed',   color: 'text-accent-green',  bg: 'bg-accent-green/10',  border: 'border-accent-green/20' },
};

const CATEGORIES = ['Work', 'Personal', 'Learning', 'Admin', 'Health', 'Finance', 'Other'];

// ─── Utility functions ────────────────────────────────────────────────────────

function isOverdue(task: Task): boolean {
  if (task.status === 'completed') return false;
  return new Date(task.dueDate) < new Date(new Date().toDateString());
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(iso: string): number {
  const today = new Date(new Date().toDateString());
  const due = new Date(iso);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

// ─── Priority badge ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${cfg?.color ?? 'text-dark-300'} ${cfg?.bg ?? 'bg-dark-800'} ${cfg?.border ?? 'border-dark-600'}`}>
      {cfg?.label ?? priority ?? 'Task'}
    </span>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TaskStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg?.color ?? 'text-dark-300'} ${cfg?.bg ?? 'bg-dark-800'} ${cfg?.border ?? 'border-dark-600'}`}>
      {status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
      {status === 'in-progress' && <Clock className="w-3 h-3" />}
      {status === 'pending' && <Circle className="w-3 h-3" />}
      {cfg?.label ?? status ?? 'Pending'}
    </span>
  );
}

// ─── Due-date chip ────────────────────────────────────────────────────────────

function DueDateChip({ task }: { task: Task }) {
  const overdue = isOverdue(task);
  const days = daysUntil(task.dueDate);
  let label = formatDate(task.dueDate);
  if (task.status !== 'completed') {
    if (overdue) label = `${Math.abs(days)}d overdue`;
    else if (days === 0) label = 'Due today';
    else if (days === 1) label = 'Due tomorrow';
    else if (days <= 7) label = `Due in ${days}d`;
  }
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${overdue ? 'text-accent-coral' : 'text-dark-400'}`}>
      {overdue ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
      {label}
    </span>
  );
}

// ─── Task Form (Create / Edit) ────────────────────────────────────────────────

interface TaskFormData {
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
  dueTime?: string;
  reminder15Min?: boolean;
  reminderAtDeadline?: boolean;
}

const DEFAULT_FORM: TaskFormData = {
  title: '',
  description: '',
  category: 'Work',
  priority: 'medium',
  dueDate: '',
  status: 'pending',
  dueTime: '',
  reminder15Min: false,
  reminderAtDeadline: false,
};

interface TaskFormProps {
  initial?: TaskFormData;
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
  submitLabel: string;
  loading?: boolean;
}

const parseDueTime = (t: string) => {
  if (!t) return { h: '', m: '', p: 'AM' };
  const [hh, mm] = t.split(':');
  let hNum = parseInt(hh, 10);
  const p = hNum >= 12 ? 'PM' : 'AM';
  hNum = hNum % 12 || 12;
  return { h: hNum.toString().padStart(2, '0'), m: mm, p };
};

const formatDueTime = (h: string, m: string, p: string) => {
  if (!h || !m) return '';
  let hNum = parseInt(h, 10);
  if (p === 'PM' && hNum !== 12) hNum += 12;
  if (p === 'AM' && hNum === 12) hNum = 0;
  return `${hNum.toString().padStart(2, '0')}:${m.padStart(2, '0')}`;
};

function TaskForm({ initial = DEFAULT_FORM, onSubmit, onCancel, submitLabel, loading }: TaskFormProps) {
  const [form, setForm] = useState<TaskFormData>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({});

  const set = <K extends keyof TaskFormData>(k: K, v: TaskFormData[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleTimeChange = (part: 'h' | 'm' | 'p', val: string) => {
    let { h, m, p } = parseDueTime(form.dueTime || '');
    if (part === 'h') h = val;
    if (part === 'm') m = val;
    if (part === 'p') p = val;
    
    if (!h && !m) {
      setForm(prev => ({ ...prev, dueTime: '', reminder15Min: false, reminderAtDeadline: false }));
      return;
    }
    
    if (h && !m) m = '00';
    if (m && !h) h = '12';

    set('dueTime', formatDueTime(h, m, p));
  };

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.title.trim()) e.title = 'Title is required.';
    if (!form.dueDate) e.dueDate = 'Due date is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (validate()) {
      if (form.reminder15Min || form.reminderAtDeadline) {
        requestNotificationPermission();
      }
      onSubmit(form);
    }
  }

  const fieldCls = (k: keyof TaskFormData) =>
    `w-full px-3 py-2.5 rounded-xl text-sm ${errors[k] ? 'border-accent-coral!' : ''}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-dark-300 mb-1.5">Title <span className="text-accent-coral">*</span></label>
        <input
          id="task-title"
          className={fieldCls('title')}
          placeholder="What needs to be done?"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          maxLength={120}
          autoFocus
        />
        {errors.title && <p className="mt-1 text-[11px] text-accent-coral">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-dark-300 mb-1.5">Description</label>
        <textarea
          id="task-description"
          className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
          placeholder="Add more context (optional)…"
          rows={3}
          value={form.description}
          onChange={e => set('description', e.target.value)}
        />
      </div>

      {/* Category + Priority row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-dark-300 mb-1.5">Category</label>
          <div className="relative">
            <select
              id="task-category"
              className="w-full px-3 py-2.5 rounded-xl text-sm appearance-none pr-8"
              value={form.category}
              onChange={e => set('category', e.target.value)}
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-dark-300 mb-1.5">Priority</label>
          <div className="relative">
            <select
              id="task-priority"
              className="w-full px-3 py-2.5 rounded-xl text-sm appearance-none pr-8"
              value={form.priority}
              onChange={e => set('priority', e.target.value as TaskPriority)}
            >
              {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map(p => (
                <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Due date + Due Time row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-dark-300 mb-1.5">Due Date <span className="text-accent-coral">*</span></label>
          <input
            id="task-due-date"
            type="date"
            className={`w-full px-3 py-2.5 rounded-xl text-sm ${errors.dueDate ? 'border-accent-coral' : ''}`}
            value={form.dueDate}
            onChange={e => set('dueDate', e.target.value)}
          />
          {errors.dueDate && <p className="mt-1 text-[11px] text-accent-coral">{errors.dueDate}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-dark-300 mb-1.5">Due Time (Optional)</label>
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <select
                className="w-full px-2 py-2.5 rounded-xl text-sm bg-dark-900 border border-dark-600 focus:border-accent-blue outline-none transition-all appearance-none text-center"
                value={parseDueTime(form.dueTime || '').h}
                onChange={e => handleTimeChange('h', e.target.value)}
              >
                <option value="">--</option>
                {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            <span className="text-dark-400 font-bold">:</span>
            <div className="relative flex-1">
              <select
                className="w-full px-2 py-2.5 rounded-xl text-sm bg-dark-900 border border-dark-600 focus:border-accent-blue outline-none transition-all appearance-none text-center"
                value={parseDueTime(form.dueTime || '').m}
                onChange={e => handleTimeChange('m', e.target.value)}
              >
                <option value="">--</option>
                {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="relative w-20">
              <select
                className="w-full px-2 py-2.5 rounded-xl text-sm bg-dark-900 border border-dark-600 focus:border-accent-blue outline-none transition-all appearance-none text-center"
                value={parseDueTime(form.dueTime || '').p}
                onChange={e => handleTimeChange('p', e.target.value)}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Status + Reminders row */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div>
          <label className="block text-xs font-semibold text-dark-300 mb-1.5">Status</label>
          <div className="relative">
            <select
              id="task-status"
              className="w-full px-3 py-2.5 rounded-xl text-sm appearance-none pr-8 bg-dark-900 border border-dark-600 focus:border-accent-blue outline-none transition-all"
              value={form.status}
              onChange={e => set('status', e.target.value as TaskStatus)}
            >
              {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map(s => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-dark-300 mb-1.5">Reminders</label>
          <div className="flex flex-col gap-2 pt-1">
            <label className={`flex items-center gap-2 text-sm text-dark-100 ${!form.dueTime ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                disabled={!form.dueTime}
                checked={form.reminder15Min || false}
                onChange={e => set('reminder15Min', e.target.checked)}
                className="w-4 h-4 rounded border-dark-600 text-accent-blue focus:ring-accent-blue/30 bg-dark-900"
              />
              15 min before
            </label>
            <label className={`flex items-center gap-2 text-sm text-dark-100 ${!form.dueTime ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                disabled={!form.dueTime}
                checked={form.reminderAtDeadline || false}
                onChange={e => set('reminderAtDeadline', e.target.checked)}
                className="w-4 h-4 rounded border-dark-600 text-accent-blue focus:ring-accent-blue/30 bg-dark-900"
              />
              At deadline
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-sm font-medium text-dark-300 hover:text-dark-100 hover:bg-dark-800 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-accent-blue text-white font-semibold text-sm hover:bg-accent-blue/90 transition-all disabled:opacity-60"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        {/* Panel */}
        <motion.div
          className="relative z-10 w-full max-w-lg glass-card rounded-2xl p-6 shadow-2xl"
          initial={{ scale: 0.96, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-dark-100">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-dark-100 hover:bg-dark-800 transition-all"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Task Detail Modal ────────────────────────────────────────────────────────

function TaskDetailModal({
  task,
  onClose,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  task: Task;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  const overdue = isOverdue(task);

  return (
    <Modal title="Task Details" onClose={onClose}>
      <div className="space-y-4">
        {/* Title + badges */}
        <div>
          <h3 className="text-lg font-bold text-dark-100 leading-snug mb-2">{task.title}</h3>
          <div className="flex flex-wrap gap-2">
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
            {overdue && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-coral/10 text-accent-coral border border-accent-coral/20">
                <AlertTriangle className="w-3 h-3" /> Overdue
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-sm text-dark-300 leading-relaxed">{task.description}</p>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-dark-900 border border-dark-600">
            <p className="text-[10px] font-semibold text-dark-400 uppercase tracking-wide mb-1">Category</p>
            <p className="text-sm font-medium text-dark-100 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-accent-blue" />
              {task.category}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-dark-900 border border-dark-600">
            <p className="text-[10px] font-semibold text-dark-400 uppercase tracking-wide mb-1">Due Date</p>
            <p className={`text-sm font-medium flex items-center gap-1.5 ${overdue ? 'text-accent-coral' : 'text-dark-100'}`}>
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(task.dueDate)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-dark-900 border border-dark-600">
            <p className="text-[10px] font-semibold text-dark-400 uppercase tracking-wide mb-1">Created</p>
            <p className="text-sm font-medium text-dark-100">{formatDate(task.createdAt.split('T')[0])}</p>
          </div>
          <div className="p-3 rounded-xl bg-dark-900 border border-dark-600">
            <p className="text-[10px] font-semibold text-dark-400 uppercase tracking-wide mb-1">Updated</p>
            <p className="text-sm font-medium text-dark-100">{formatDate(task.updatedAt.split('T')[0])}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={onToggleStatus}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              task.status === 'completed'
                ? 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                : 'bg-accent-green/10 text-accent-green border border-accent-green/20 hover:bg-accent-green/20'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {task.status === 'completed' ? 'Mark Pending' : 'Mark Complete'}
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-blue/10 text-accent-blue border border-accent-blue/20 text-sm font-semibold hover:bg-accent-blue/20 transition-all"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-coral/10 text-accent-coral border border-accent-coral/20 text-sm font-semibold hover:bg-accent-coral/20 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({ task, onConfirm, onCancel }: { task: Task; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal title="Delete Task" onClose={onCancel}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-accent-coral/5 border border-accent-coral/20">
          <AlertTriangle className="w-5 h-5 text-accent-coral flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-dark-100 mb-1">Delete "{task.title}"?</p>
            <p className="text-xs text-dark-400">This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium text-dark-300 hover:text-dark-100 hover:bg-dark-800 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl bg-accent-coral text-white font-semibold text-sm hover:bg-accent-coral/90 transition-all"
          >
            Delete Task
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, value, label, color }: {
  icon: React.ComponentType<{ className?: string }>;
  value: number | string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-dark-900 border border-dark-600">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}/10`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <p className="text-lg font-bold text-dark-100 leading-none">{value}</p>
        <p className="text-[11px] text-dark-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({ task, onView, onEdit, onDelete, onToggle }: {
  task: Task;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const overdue = isOverdue(task);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`group flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer hover:bg-dark-800/50 ${
        overdue ? 'border-accent-coral/20 bg-accent-coral/5' : 'border-dark-600 bg-dark-900/60'
      } ${task.status === 'completed' ? 'opacity-60' : ''}`}
    >
      {/* Quick-complete checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110"
        style={{
          borderColor: task.status === 'completed' ? 'var(--accent-green)' : 'var(--border-color)',
          background: task.status === 'completed' ? 'var(--accent-green)' : 'transparent',
        }}
        title={task.status === 'completed' ? 'Mark as pending' : 'Mark as complete'}
      >
        {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
      </button>

      {/* Main content */}
      <div className="flex-1 min-w-0" onClick={onView}>
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className={`text-sm font-semibold text-dark-100 truncate ${task.status === 'completed' ? 'line-through text-dark-400' : ''}`}>
            {task.title}
          </p>
          <PriorityBadge priority={task.priority} />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[11px] text-dark-400">
            <Tag className="w-3 h-3" />
            {task.category}
          </span>
          <DueDateChip task={task} />
          <StatusBadge status={task.status} />
        </div>
      </div>

      {/* Action buttons (visible on hover) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onView(); }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-accent-blue hover:bg-accent-blue/10 transition-all"
          title="View details"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-accent-blue hover:bg-accent-blue/10 transition-all"
          title="Edit task"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-accent-coral hover:bg-accent-coral/10 transition-all"
          title="Delete task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Tasks page ──────────────────────────────────────────────────────────

type ModalType = 'create' | 'edit' | 'detail' | 'delete' | null;

export default function Tasks() {
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks();
  const { profile, saveProfile } = useUserProfile();
  const { reminders, setReminder, removeReminder } = useReminders();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<Task | null>(null);

  const [showNotifBanner, setShowNotifBanner] = useState(() => {
    return localStorage.getItem('priorify_notif_banner_dismissed') !== 'true';
  });

  function handleTestNotification() {
    requestNotificationPermission();
    if (Notification.permission === 'granted') {
      new Notification('Test Notification', {
        body: 'Reminders are working perfectly!',
      });
    } else {
      alert('Please allow notifications in your browser first.');
    }
  }

  function dismissBanner() {
    setShowNotifBanner(false);
    localStorage.setItem('priorify_notif_banner_dismissed', 'true');
  }

  // Derived stats
  const total       = tasks.length;
  const completed   = tasks.filter(t => t.status === 'completed').length;
  const inProgress  = tasks.filter(t => t.status === 'in-progress').length;
  const overdueTasks = tasks.filter(isOverdue);
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Filtered list
  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;
      const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
      const matchCategory = filterCategory === 'all' || t.category === filterCategory;
      return matchSearch && matchStatus && matchPriority && matchCategory;
    });
  }, [tasks, search, filterStatus, filterPriority, filterCategory]);

  // Sort: overdue → in-progress → pending → completed; within each group by priority
  const PRIORITY_ORDER: TaskPriority[] = ['critical', 'high', 'medium', 'low'];
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aOver = isOverdue(a) ? 0 : 1;
      const bOver = isOverdue(b) ? 0 : 1;
      if (aOver !== bOver) return aOver - bOver;

      const statusOrder: Record<TaskStatus, number> = { 'in-progress': 0, pending: 1, completed: 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];

      return PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
    });
  }, [filtered]);

  // Unique categories in data
  const usedCategories = useMemo(() => Array.from(new Set(tasks.map(t => t.category))).sort(), [tasks]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function openCreate() { setSelected(null); setModal('create'); }
  function openEdit(t: Task) { setSelected(t); setModal('edit'); }
  function openDetail(t: Task) { setSelected(t); setModal('detail'); }
  function openDelete(t: Task) { setSelected(t); setModal('delete'); }
  function closeModal() { setModal(null); setSelected(null); }

  function handleCreate(data: TaskFormData) {
    const { dueTime, reminder15Min, reminderAtDeadline, ...taskData } = data;
    const task = createTask(taskData);
    if (dueTime && (reminder15Min || reminderAtDeadline)) {
      setReminder(task.id, {
        title: task.title,
        dueDate: task.dueDate,
        dueTime,
        reminder15Min,
        reminderAtDeadline,
        notified15Min: false,
        notifiedAtDeadline: false,
      });
    }
    closeModal();
  }

  function handleEdit(data: TaskFormData) {
    if (!selected) return;
    const { dueTime, reminder15Min, reminderAtDeadline, ...taskData } = data;
    updateTask(selected.id, taskData);
    if (dueTime && (reminder15Min || reminderAtDeadline)) {
      setReminder(selected.id, {
        title: data.title,
        dueDate: data.dueDate,
        dueTime,
        reminder15Min,
        reminderAtDeadline,
        notified15Min: false,
        notifiedAtDeadline: false,
      });
    } else {
      removeReminder(selected.id);
    }
    closeModal();
  }

  function handleDelete() {
    if (!selected) return;
    deleteTask(selected.id);
    removeReminder(selected.id);
    closeModal();
  }

  function handleToggle(t: Task) {
    const next: TaskStatus = t.status === 'completed' ? 'pending' : 'completed';
    updateTask(t.id, { status: next });
    // Keep detail modal open but refresh selected
    if (selected?.id === t.id) setSelected({ ...t, status: next, updatedAt: new Date().toISOString() });

    // XP, Level & Streak Logic
    if (profile) {
      const xpRewards: Record<TaskPriority, number> = { low: 10, medium: 20, high: 30, critical: 40 };
      const xpAmount = xpRewards[t.priority] || 20;
      
      let newXP = profile.totalXP || 0;
      let newStreak = profile.streak || 1;
      
      if (next === 'completed') {
        newXP += xpAmount;
        
        const today = new Date().toISOString().split('T')[0];
        const lastStreakDate = localStorage.getItem('priorify_last_streak_date');
        
        if (lastStreakDate !== today) {
          if (lastStreakDate) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            if (lastStreakDate === yesterdayStr) {
              newStreak += 1;
            } else {
              newStreak = 1;
            }
          } else {
            newStreak = 1; // First completion ever
          }
          localStorage.setItem('priorify_last_streak_date', today);
        }
      } else {
        newXP = Math.max(0, newXP - xpAmount);
      }
      
      const newLevel = Math.floor(newXP / 100) + 1;
      saveProfile({ ...profile, totalXP: newXP, level: newLevel, streak: newStreak });
    }
  }

  function handleDetailToggle() {
    if (!selected) return;
    handleToggle(selected);
  }

  function handleDetailEdit() {
    setModal('edit');
  }

  function handleDetailDelete() {
    setModal('delete');
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-dark-400">Loading tasks…</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {showNotifBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative p-4 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-accent-blue" />
              </div>
              <div>
                <p className="text-sm font-semibold text-accent-blue">New Feature: Smart Reminders!</p>
                <p className="text-xs text-dark-300 mt-0.5">You can now set exact times and get local browser notifications 15 minutes before or exactly at deadline.</p>
              </div>
            </div>
            <button onClick={dismissBanner} className="text-dark-400 hover:text-dark-100 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dark-100">Tasks</h1>
            <p className="text-sm text-dark-300 mt-1">Manage your priorities, deadlines, and progress</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleTestNotification}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-800 text-dark-100 font-semibold text-sm hover:bg-dark-700 border border-dark-600 transition-all"
            >
              <Circle className="w-4 h-4 text-accent-teal" />
              Test Notification
            </button>
            <button
              id="create-task-btn"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-blue text-white font-semibold text-sm hover:bg-accent-blue/90 transition-all shadow-lg shadow-accent-blue/20"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={ListTodo} value={total} label="Total tasks" color="text-accent-blue" />
          <StatCard icon={CheckCircle2} value={completed} label="Completed" color="text-accent-green" />
          <StatCard icon={Clock} value={inProgress} label="In progress" color="text-accent-amber" />
          <StatCard icon={AlertTriangle} value={overdueTasks.length} label="Overdue" color="text-accent-coral" />
        </div>

        {/* ── Completion progress ── */}
        {total > 0 && (
          <Card className="!py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-dark-300">Overall completion</span>
              <span className="text-xs font-bold text-accent-blue">{completionRate}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-dark-800 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-accent-blue to-accent-teal"
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </Card>
        )}

        {/* ── Filters ── */}
        <Card className="!p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                id="task-search"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm"
                placeholder="Search tasks…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Status filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-400" />
              <select
                id="filter-status"
                className="pl-8 pr-8 py-2.5 rounded-xl text-sm appearance-none"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as TaskStatus | 'all')}
              >
                <option value="all">All Statuses</option>
                {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-400 pointer-events-none" />
            </div>

            {/* Priority filter */}
            <div className="relative">
              <select
                id="filter-priority"
                className="px-3 py-2.5 rounded-xl text-sm appearance-none pr-8"
                value={filterPriority}
                onChange={e => setFilterPriority(e.target.value as TaskPriority | 'all')}
              >
                <option value="all">All Priorities</option>
                {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map(p => (
                  <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-400 pointer-events-none" />
            </div>

            {/* Category filter */}
            {usedCategories.length > 0 && (
              <div className="relative">
                <select
                  id="filter-category"
                  className="px-3 py-2.5 rounded-xl text-sm appearance-none pr-8"
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {usedCategories.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-400 pointer-events-none" />
              </div>
            )}
          </div>
        </Card>

        {/* ── Task list ── */}
        <Card className="!p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-dark-100">
              {sorted.length} {sorted.length === 1 ? 'task' : 'tasks'}
              {(search || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all') && ' matching filters'}
            </h2>
            {sorted.length > 0 && (
              <span className="text-[11px] text-dark-400">Click a task to view details</span>
            )}
          </div>

          {sorted.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center mx-auto mb-4">
                <ListTodo className="w-7 h-7 text-accent-blue" />
              </div>
              {tasks.length === 0 ? (
                <>
                  <p className="text-sm font-semibold text-dark-100">No tasks yet</p>
                  <p className="text-xs text-dark-400 max-w-xs mx-auto">Create your first task to get started with smart task management.</p>
                  <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-xl bg-accent-blue text-white text-sm font-semibold hover:bg-accent-blue/90 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Create Task
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-dark-100">No tasks match your filters</p>
                  <button
                    onClick={() => { setSearch(''); setFilterStatus('all'); setFilterPriority('all'); setFilterCategory('all'); }}
                    className="text-xs text-accent-blue hover:underline"
                  >
                    Clear filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-2">
                {sorted.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onView={() => openDetail(task)}
                    onEdit={() => openEdit(task)}
                    onDelete={() => openDelete(task)}
                    onToggle={() => handleToggle(task)}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </Card>

        {/* ── Overdue section (if any) ── */}
        {overdueTasks.length > 0 && (
          <Card className="border-accent-coral/20 bg-accent-coral/5 !p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-accent-coral" />
              <h2 className="text-sm font-bold text-accent-coral">{overdueTasks.length} Overdue {overdueTasks.length === 1 ? 'Task' : 'Tasks'}</h2>
            </div>
            <div className="space-y-2">
              {overdueTasks.slice(0, 3).map(task => (
                <button
                  key={task.id}
                  onClick={() => openDetail(task)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-dark-900 border border-accent-coral/10 hover:border-accent-coral/30 transition-all text-left"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-coral flex-shrink-0" />
                  <span className="flex-1 text-sm font-medium text-dark-100 truncate">{task.title}</span>
                  <span className="text-[10px] text-accent-coral flex-shrink-0">{Math.abs(daysUntil(task.dueDate))}d overdue</span>
                  <ArrowUpRight className="w-3 h-3 text-dark-400 flex-shrink-0" />
                </button>
              ))}
              {overdueTasks.length > 3 && (
                <p className="text-xs text-dark-400 text-center pt-1">+{overdueTasks.length - 3} more overdue tasks</p>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* ── Modals ── */}
      {modal === 'create' && (
        <Modal title="Create New Task" onClose={closeModal}>
          <TaskForm
            onSubmit={handleCreate}
            onCancel={closeModal}
            submitLabel="Create Task"
          />
        </Modal>
      )}

      {modal === 'edit' && selected && (
        <Modal title="Edit Task" onClose={closeModal}>
          <TaskForm
            initial={{
              title: selected.title,
              description: selected.description,
              category: selected.category,
              priority: selected.priority,
              dueDate: selected.dueDate,
              status: selected.status,
              dueTime: reminders[selected.id]?.dueTime || '',
              reminder15Min: reminders[selected.id]?.reminder15Min || false,
              reminderAtDeadline: reminders[selected.id]?.reminderAtDeadline || false,
            }}
            onSubmit={handleEdit}
            onCancel={closeModal}
            submitLabel="Save Changes"
          />
        </Modal>
      )}

      {modal === 'detail' && selected && (
        <TaskDetailModal
          task={selected}
          onClose={closeModal}
          onEdit={handleDetailEdit}
          onDelete={handleDetailDelete}
          onToggleStatus={handleDetailToggle}
        />
      )}

      {modal === 'delete' && selected && (
        <DeleteConfirmModal
          task={selected}
          onConfirm={handleDelete}
          onCancel={() => setModal(modal === 'delete' && selected ? (selected ? 'detail' : null) : null)}
        />
      )}
    </>
  );
}
