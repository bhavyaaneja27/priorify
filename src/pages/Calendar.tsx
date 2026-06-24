import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, X, Pencil, Trash2,
  Clock, MapPin, Tag, Calendar as CalendarIcon, Info,
  AlignLeft, ToggleLeft, ToggleRight, ChevronDown, AlertTriangle
} from 'lucide-react';
import {
  useCalendarEvents,
  CalendarEvent,
  EventCategory,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
} from '../hooks/usePersistence';

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'month' | 'week' | 'day';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(d: Date): string {
  return getLocalYMD(d);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function startOfWeek(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay(); // 0=Sun
  r.setDate(r.getDate() - day);
  return r;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function minutesSinceMidnight(time: string): number {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatTime12(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatDateDisplay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getLocalYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isEventPast(event: CalendarEvent): boolean {
  const now = new Date();
  const todayStr = getLocalYMD(now);
  
  if (event.allDay) {
    return event.endDate < todayStr;
  } else {
    if (event.endDate < todayStr) return true;
    if (event.endDate === todayStr) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const eventEndMinutes = event.endTime ? minutesSinceMidnight(event.endTime) : 1440;
      return eventEndMinutes < currentMinutes;
    }
    return false;
  }
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_FULL  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Grid hours: 7 AM → 10 PM (16 hours × 60 min)
const GRID_START = 7;   // first hour shown
const GRID_HOURS = 15;  // 7:00 → 21:00
const PX_PER_MIN = 1.2; // pixels per minute

// ─── Category badge ───────────────────────────────────────────────────────────

function CategoryDot({ category, size = 8 }: { category: EventCategory; size?: number }) {
  return (
    <span
      className="inline-block rounded-full flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: CATEGORY_COLORS[category] }}
    />
  );
}

// ─── Event chip (tiny, for month cells) ──────────────────────────────────────

function EventChip({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="w-full text-left text-[10px] font-medium px-1.5 py-0.5 rounded truncate flex items-center gap-1 hover:opacity-80 transition-opacity"
      style={{ backgroundColor: event.color + '25', color: event.color, border: `1px solid ${event.color}30` }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: event.color }} />
      {event.allDay ? event.title : `${formatTime12(event.startTime)} ${event.title}`}
    </button>
  );
}

// ─── Event block (for week / day time grid) ───────────────────────────────────

function EventBlock({
  event,
  top,
  height,
  left,
  width,
  onClick,
}: {
  event: CalendarEvent;
  top: number;
  height: number;
  left: string;
  width: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={event.title}
      className="absolute rounded-lg px-2 py-1 overflow-hidden text-left group hover:brightness-110 transition-all shadow-sm hover:shadow-md"
      style={{
        top,
        height: Math.max(height, 24),
        left,
        width,
        backgroundColor: event.color + '22',
        borderLeft: `3px solid ${event.color}`,
        color: event.color,
      }}
    >
      <p className="text-[11px] font-bold truncate leading-tight">{event.title}</p>
      {height > 30 && (
        <p className="text-[10px] opacity-70 truncate">
          {formatTime12(event.startTime)} – {formatTime12(event.endTime)}
        </p>
      )}
    </button>
  );
}

// ─── Time grid (shared by Week and Day) ──────────────────────────────────────

function TimeGrid({
  columns,    // array of { label, date, events[] }
  onDayClick,
}: {
  columns: { label: string; date: Date; events: CalendarEvent[] }[];
  onDayClick?: (date: Date) => void;
  onEventClick: (ev: CalendarEvent) => void;
}) {
  const totalHeight = GRID_HOURS * 60 * PX_PER_MIN;

  // Position events within a column avoiding simple overlaps
  const positionEvents = (evs: CalendarEvent[]) => {
    const timed = evs
      .filter(e => !e.allDay)
      .map(e => {
        const startMin = minutesSinceMidnight(e.startTime) - GRID_START * 60;
        const endMin = minutesSinceMidnight(e.endTime) - GRID_START * 60;
        return {
          ev: e,
          top: Math.max(0, startMin * PX_PER_MIN),
          height: Math.max(24, (endMin - startMin) * PX_PER_MIN - 2),
          startMin,
          endMin,
        };
      })
      .sort((a, b) => a.startMin - b.startMin);

    // Simple column layout
    const cols: typeof timed[] = [];
    const assigned: (number)[] = new Array(timed.length).fill(0);

    for (let i = 0; i < timed.length; i++) {
      let placed = false;
      for (let c = 0; c < cols.length; c++) {
        const last = cols[c][cols[c].length - 1];
        if (timed[i].startMin >= last.endMin) {
          cols[c].push(timed[i]);
          assigned[i] = c;
          placed = true;
          break;
        }
      }
      if (!placed) { cols.push([timed[i]]); assigned[i] = cols.length - 1; }
    }

    // Compute how many columns overlap each event
    const totalCols = timed.map((item, i) => {
      const s = item.startMin; const e2 = item.endMin;
      const overlapping = timed.filter(o => o.startMin < e2 && o.endMin > s);
      const uniqueCols = new Set(overlapping.map((_, j) => {
        const idx = timed.indexOf(overlapping[j < overlapping.length ? j : 0]);
        return assigned[idx];
      }));
      return Math.max(uniqueCols.size, 1);
    });

    return timed.map((item, i) => ({
      ...item,
      left: `${(assigned[i] / totalCols[i]) * 100}%`,
      width: `calc(${(1 / totalCols[i]) * 100}% - 3px)`,
    }));
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Column headers */}
      <div className="grid border-b border-dark-600 flex-shrink-0" style={{ gridTemplateColumns: `56px repeat(${columns.length}, 1fr)` }}>
        <div className="p-2" />
        {columns.map((col, ci) => {
          const isToday = isSameDay(col.date, new Date());
          const allDayEvs = col.events.filter(e => e.allDay);
          return (
            <div key={ci} className="border-l border-dark-600">
              <button
                className={`w-full py-2 text-center text-xs font-semibold transition-colors ${isToday ? 'text-accent-blue' : 'text-dark-200'} ${onDayClick ? 'hover:text-accent-blue cursor-pointer' : 'cursor-default'}`}
                onClick={() => onDayClick?.(col.date)}
              >
                <span className="block text-[10px] font-normal text-dark-400 uppercase">{col.label.slice(0, 3)}</span>
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold mt-0.5 ${isToday ? 'bg-accent-blue text-white' : ''}`}>
                  {col.date.getDate()}
                </span>
              </button>
              {/* All-day strip */}
              {allDayEvs.length > 0 && (
                <div className="px-1 pb-1 space-y-0.5 min-h-[20px]">
                  {allDayEvs.map(ev => (
                    <div key={ev.id}
                      className="text-[9px] px-1 py-0.5 rounded truncate font-medium"
                      style={{ backgroundColor: ev.color + '25', color: ev.color }}
                    >{ev.title}</div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scrollable time area */}
      <div className="overflow-y-auto flex-1" style={{ minHeight: 0 }}>
        <div className="relative" style={{ display: 'grid', gridTemplateColumns: `56px repeat(${columns.length}, 1fr)`, height: totalHeight }}>
          {/* Hour labels */}
          <div className="relative">
            {Array.from({ length: GRID_HOURS }, (_, i) => (
              <div key={i} className="absolute w-full" style={{ top: i * 60 * PX_PER_MIN }}>
                <span className="text-[10px] text-dark-400 absolute right-2 -translate-y-1/2 tabular-nums">
                  {String((GRID_START + i) % 12 || 12).padStart(2, ' ')}{GRID_START + i < 12 ? 'am' : 'pm'}
                </span>
              </div>
            ))}
          </div>

          {/* Columns */}
          {columns.map((col, ci) => {
            const positioned = positionEvents(col.events);
            return (
              <div key={ci} className="relative border-l border-dark-600">
                {/* Hour lines */}
                {Array.from({ length: GRID_HOURS }, (_, i) => (
                  <div key={i} className="absolute w-full border-t border-dark-600/40" style={{ top: i * 60 * PX_PER_MIN }} />
                ))}
                {/* Half-hour lines */}
                {Array.from({ length: GRID_HOURS }, (_, i) => (
                  <div key={`h${i}`} className="absolute w-full border-t border-dark-600/20 border-dashed" style={{ top: (i * 60 + 30) * PX_PER_MIN }} />
                ))}
                {/* Event blocks */}
                {positioned.map(({ ev, top, height, left, width }) => (
                  <EventBlock
                    key={ev.id}
                    event={ev}
                    top={top}
                    height={height}
                    left={left}
                    width={width}
                    onClick={() => { /* will be passed down */ }}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Event Form ───────────────────────────────────────────────────────────────

interface EventFormData {
  title: string;
  description: string;
  category: EventCategory;
  color: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  allDay: boolean;
}

function makeDefaultForm(date?: string): EventFormData {
  const today = date || fmt(new Date());
  return {
    title: '', description: '', category: 'work', color: CATEGORY_COLORS.work,
    startDate: today, startTime: '09:00', endDate: today, endTime: '10:00',
    location: '', allDay: false,
  };
}

function EventForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial: EventFormData;
  onSubmit: (d: EventFormData) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<EventFormData>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({});

  const set = <K extends keyof EventFormData>(k: K, v: EventFormData[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.title.trim()) e.title = 'Title is required.';
    if (!form.startDate)    e.startDate = 'Start date is required.';
    if (!form.endDate)      e.endDate = 'End date is required.';
    if (form.endDate < form.startDate) e.endDate = 'End date must be ≥ start date.';
    if (!form.allDay && form.startDate === form.endDate && form.endTime <= form.startTime)
      e.endTime = 'End time must be after start time.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (validate()) onSubmit(form);
  }

  function handleCategoryChange(cat: EventCategory) {
    set('category', cat);
    set('color', CATEGORY_COLORS[cat]);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-dark-300 mb-1.5">
          Title <span className="text-accent-coral">*</span>
        </label>
        <input
          id="event-title"
          className="w-full px-3 py-2.5 rounded-xl text-sm"
          placeholder="Event title"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          autoFocus
          maxLength={120}
        />
        {errors.title && <p className="mt-1 text-[11px] text-accent-coral">{errors.title}</p>}
      </div>

      {/* Category + Color */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-dark-300 mb-1.5">Category</label>
          <div className="relative">
            <select
              id="event-category"
              className="w-full px-3 py-2.5 rounded-xl text-sm appearance-none pr-8"
              value={form.category}
              onChange={e => handleCategoryChange(e.target.value as EventCategory)}
            >
              {(Object.keys(CATEGORY_LABELS) as EventCategory[]).map(c => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-dark-300 mb-1.5">Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.color}
              onChange={e => set('color', e.target.value)}
              className="w-10 h-10 rounded-lg border border-dark-600 cursor-pointer bg-transparent p-0.5"
            />
            <span className="text-xs text-dark-400 font-mono">{form.color}</span>
          </div>
        </div>
      </div>

      {/* All day toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => set('allDay', !form.allDay)}
          className="flex items-center gap-2 text-sm font-medium text-dark-200 hover:text-dark-100 transition-colors"
        >
          {form.allDay
            ? <ToggleRight className="w-5 h-5 text-accent-blue" />
            : <ToggleLeft className="w-5 h-5 text-dark-400" />}
          All day
        </button>
      </div>

      {/* Start / End */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-dark-300 mb-1.5">
            Start Date <span className="text-accent-coral">*</span>
          </label>
          <input
            id="event-start-date"
            type="date"
            className="w-full px-3 py-2.5 rounded-xl text-sm"
            value={form.startDate}
            onChange={e => { set('startDate', e.target.value); if (form.endDate < e.target.value) set('endDate', e.target.value); }}
          />
          {errors.startDate && <p className="mt-1 text-[11px] text-accent-coral">{errors.startDate}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-dark-300 mb-1.5">
            End Date <span className="text-accent-coral">*</span>
          </label>
          <input
            id="event-end-date"
            type="date"
            className="w-full px-3 py-2.5 rounded-xl text-sm"
            value={form.endDate}
            onChange={e => set('endDate', e.target.value)}
          />
          {errors.endDate && <p className="mt-1 text-[11px] text-accent-coral">{errors.endDate}</p>}
        </div>
      </div>

      {/* Start / End time (hidden when all day) */}
      {!form.allDay && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-dark-300 mb-1.5">Start Time</label>
            <input
              id="event-start-time"
              type="time"
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              value={form.startTime}
              onChange={e => set('startTime', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark-300 mb-1.5">End Time</label>
            <input
              id="event-end-time"
              type="time"
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              value={form.endTime}
              onChange={e => set('endTime', e.target.value)}
            />
            {errors.endTime && <p className="mt-1 text-[11px] text-accent-coral">{errors.endTime}</p>}
          </div>
        </div>
      )}

      {/* Location */}
      <div>
        <label className="block text-xs font-semibold text-dark-300 mb-1.5">
          <MapPin className="w-3 h-3 inline mr-1" />Location
        </label>
        <input
          id="event-location"
          className="w-full px-3 py-2.5 rounded-xl text-sm"
          placeholder="Add location (optional)"
          value={form.location}
          onChange={e => set('location', e.target.value)}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-dark-300 mb-1.5">
          <AlignLeft className="w-3 h-3 inline mr-1" />Description
        </label>
        <textarea
          id="event-description"
          className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
          placeholder="Add description (optional)"
          rows={2}
          value={form.description}
          onChange={e => set('description', e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-xl text-sm font-medium text-dark-300 hover:text-dark-100 hover:bg-dark-800 transition-all">
          Cancel
        </button>
        <button type="submit"
          className="px-5 py-2 rounded-xl bg-accent-blue text-white font-semibold text-sm hover:bg-accent-blue/90 transition-all">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className={`relative z-10 w-full ${wide ? 'max-w-xl' : 'max-w-lg'} glass-card rounded-2xl p-6 shadow-2xl my-4`}
          initial={{ scale: 0.96, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-dark-100">{title}</h2>
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-dark-100 hover:bg-dark-800 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Event Detail Modal ───────────────────────────────────────────────────────

function EventDetailModal({ event, onClose, onEdit, onDelete }: {
  event: CalendarEvent;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal title="Event Details" onClose={onClose}>
      <div className="space-y-4">
        {/* Title + category */}
        <div className="flex items-start gap-3">
          <span className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: event.color }} />
          <div>
            <h3 className="text-base font-bold text-dark-100 leading-snug">{event.title}</h3>
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold mt-1 px-2 py-0.5 rounded-full"
              style={{ backgroundColor: event.color + '20', color: event.color }}
            >
              <Tag className="w-2.5 h-2.5" />
              {CATEGORY_LABELS[event.category]}
            </span>
          </div>
        </div>

        {/* Date / time */}
        <div className="p-3 rounded-xl bg-dark-900 border border-dark-600 space-y-1">
          <div className="flex items-center gap-2 text-xs text-dark-200">
            <CalendarIcon className="w-3.5 h-3.5 text-accent-blue flex-shrink-0" />
            {event.allDay
              ? `${formatDateDisplay(event.startDate)}${event.endDate !== event.startDate ? ` – ${formatDateDisplay(event.endDate)}` : ''} · All day`
              : `${formatDateDisplay(event.startDate)} ${formatTime12(event.startTime)} – ${event.endDate !== event.startDate ? `${formatDateDisplay(event.endDate)} ` : ''}${formatTime12(event.endTime)}`
            }
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-xs text-dark-300">
              <MapPin className="w-3.5 h-3.5 text-accent-teal flex-shrink-0" />
              {event.location}
            </div>
          )}
        </div>

        {event.description && (
          <div className="flex items-start gap-2 text-xs text-dark-300 leading-relaxed">
            <AlignLeft className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-dark-400" />
            <p>{event.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-accent-blue/10 text-accent-blue border border-accent-blue/20 text-sm font-semibold hover:bg-accent-blue/20 transition-all">
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button onClick={onDelete}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-accent-coral/10 text-accent-coral border border-accent-coral/20 text-sm font-semibold hover:bg-accent-coral/20 transition-all">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ event, onConfirm, onCancel }: { event: CalendarEvent; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal title="Delete Event" onClose={onCancel}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-accent-coral/5 border border-accent-coral/20">
          <AlertTriangle className="w-5 h-5 text-accent-coral flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-dark-100 mb-1">Delete "{event.title}"?</p>
            <p className="text-xs text-dark-400">This cannot be undone.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium text-dark-300 hover:text-dark-100 hover:bg-dark-800 transition-all">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="px-5 py-2 rounded-xl bg-accent-coral text-white font-semibold text-sm hover:bg-accent-coral/90 transition-all">
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({
  cursor,
  getEventsForDate,
  onDayClick,
  onEventClick,
}: {
  cursor: Date;
  getEventsForDate: (date: string) => CalendarEvent[];
  onDayClick: (d: Date) => void;
  onEventClick: (ev: CalendarEvent) => void;
}) {
  const today = fmt(new Date());
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);

  // Grid starts on the Sunday of the week containing monthStart
  const gridStart = startOfWeek(monthStart);

  // Build 6 weeks of cells
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) cells.push(addDays(gridStart, i));

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Day labels */}
      <div className="grid grid-cols-7 border-b border-dark-600 flex-shrink-0">
        {WEEKDAYS_SHORT.map(d => (
          <div key={d} className="py-2 text-center text-[10px] font-semibold text-dark-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 flex-1 overflow-y-auto" style={{ gridTemplateRows: 'repeat(6, minmax(80px, 1fr))' }}>
        {cells.map((cell, i) => {
          const cellStr = fmt(cell);
          const inMonth = cell >= monthStart && cell <= monthEnd;
          const isToday = cellStr === today;
          const dayEvents = getEventsForDate(cellStr);
          const shown = dayEvents.slice(0, 3);
          const extra = dayEvents.length - shown.length;

          return (
            <div
              key={i}
              onClick={() => onDayClick(cell)}
              className={`border-r border-b border-dark-600/50 p-1 cursor-pointer transition-colors hover:bg-dark-800/30 ${i % 7 === 0 ? '' : ''} ${!inMonth ? 'opacity-40' : ''}`}
            >
              <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold mb-1 ${isToday ? 'bg-accent-blue text-white' : 'text-dark-200 hover:bg-dark-700'}`}>
                {cell.getDate()}
              </div>
              <div className="space-y-0.5">
                {shown.map(ev => (
                  <EventChip key={ev.id} event={ev} onClick={() => onEventClick(ev)} />
                ))}
                {extra > 0 && (
                  <p className="text-[10px] text-dark-400 pl-1">+{extra} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({
  cursor,
  getEventsForDate,
  onDayClick,
  onEventClick,
}: {
  cursor: Date;
  getEventsForDate: (date: string) => CalendarEvent[];
  onDayClick: (d: Date) => void;
  onEventClick: (ev: CalendarEvent) => void;
}) {
  const weekStart = startOfWeek(cursor);
  const days7 = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const columns = days7.map(d => ({
    label: WEEKDAYS_FULL[d.getDay()],
    date: d,
    events: getEventsForDate(fmt(d)),
  }));

  return (
    <WeekDayGrid
      columns={columns}
      onDayClick={onDayClick}
      onEventClick={onEventClick}
    />
  );
}

// ─── Day View ─────────────────────────────────────────────────────────────────

function DayView({
  cursor,
  getEventsForDate,
  onEventClick,
}: {
  cursor: Date;
  getEventsForDate: (date: string) => CalendarEvent[];
  onEventClick: (ev: CalendarEvent) => void;
}) {
  const columns = [{
    label: WEEKDAYS_FULL[cursor.getDay()],
    date: cursor,
    events: getEventsForDate(fmt(cursor)),
  }];

  return (
    <WeekDayGrid
      columns={columns}
      onEventClick={onEventClick}
    />
  );
}

// ─── Shared time grid (Week + Day) ────────────────────────────────────────────

function WeekDayGrid({
  columns,
  onDayClick,
  onEventClick,
}: {
  columns: { label: string; date: Date; events: CalendarEvent[] }[];
  onDayClick?: (d: Date) => void;
  onEventClick: (ev: CalendarEvent) => void;
}) {
  const totalHeight = GRID_HOURS * 60 * PX_PER_MIN;

  const positionEvents = (evs: CalendarEvent[]) => {
    const timed = evs
      .filter(e => !e.allDay && e.startTime && e.endTime)
      .map(e => {
        const startMin = minutesSinceMidnight(e.startTime) - GRID_START * 60;
        const endMin   = minutesSinceMidnight(e.endTime)   - GRID_START * 60;
        return { ev: e, top: Math.max(0, startMin * PX_PER_MIN), height: Math.max(24, (endMin - startMin) * PX_PER_MIN - 2), startMin, endMin };
      })
      .sort((a, b) => a.startMin - b.startMin);

    const colAssign: number[] = new Array(timed.length).fill(0);
    const cols: number[][] = [];

    timed.forEach((item, i) => {
      let placed = false;
      for (let c = 0; c < cols.length; c++) {
        const lastIdx = cols[c][cols[c].length - 1];
        if (item.startMin >= timed[lastIdx].endMin) {
          cols[c].push(i); colAssign[i] = c; placed = true; break;
        }
      }
      if (!placed) { cols.push([i]); colAssign[i] = cols.length - 1; }
    });

    const spanCols = timed.map((item, i) => {
      const overlapping = timed.filter(o => o.startMin < item.endMin && o.endMin > item.startMin);
      return Math.max(new Set(overlapping.map(o => colAssign[timed.indexOf(o)])).size, 1);
    });

    return timed.map((item, i) => ({
      ...item,
      left: `${(colAssign[i] / spanCols[i]) * 100}%`,
      width: `calc(${(1 / spanCols[i]) * 100}% - 3px)`,
    }));
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Headers */}
      <div className="flex-shrink-0 border-b border-dark-600"
        style={{ display: 'grid', gridTemplateColumns: `52px repeat(${columns.length}, 1fr)` }}>
        <div className="p-2" />
        {columns.map((col, ci) => {
          const isToday = isSameDay(col.date, new Date());
          const allDayEvs = col.events.filter(e => e.allDay);
          return (
            <div key={ci} className="border-l border-dark-600">
              <button
                className={`w-full py-2.5 text-center transition-colors ${onDayClick ? 'hover:text-accent-blue cursor-pointer' : 'cursor-default'} ${isToday ? 'text-accent-blue' : 'text-dark-200'}`}
                onClick={() => onDayClick?.(col.date)}
              >
                <span className="block text-[10px] font-medium text-dark-400 uppercase tracking-wider">{col.label.slice(0, 3)}</span>
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold mt-0.5 ${isToday ? 'bg-accent-blue text-white' : ''}`}>
                  {col.date.getDate()}
                </span>
              </button>
              {allDayEvs.map(ev => (
                <div key={ev.id}
                  className="mx-1 mb-1 text-[10px] px-1.5 py-0.5 rounded truncate font-medium cursor-pointer hover:opacity-80"
                  style={{ backgroundColor: ev.color + '25', color: ev.color }}
                  onClick={() => onEventClick(ev)}
                >{ev.title}</div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Scroll area */}
      <div className="overflow-y-auto flex-1">
        <div style={{ display: 'grid', gridTemplateColumns: `52px repeat(${columns.length}, 1fr)`, height: totalHeight, position: 'relative' }}>
          {/* Hour labels */}
          <div className="relative">
            {Array.from({ length: GRID_HOURS }, (_, i) => (
              <div key={i} className="absolute right-2 text-[10px] text-dark-400 tabular-nums -translate-y-1/2"
                style={{ top: i * 60 * PX_PER_MIN }}>
                {String((GRID_START + i) % 12 || 12)}{GRID_START + i < 12 ? 'am' : 'pm'}
              </div>
            ))}
          </div>

          {columns.map((col, ci) => {
            const positioned = positionEvents(col.events);
            return (
              <div key={ci} className="relative border-l border-dark-600">
                {Array.from({ length: GRID_HOURS }, (_, i) => (
                  <div key={i} className="absolute w-full border-t border-dark-600/40" style={{ top: i * 60 * PX_PER_MIN }} />
                ))}
                {Array.from({ length: GRID_HOURS }, (_, i) => (
                  <div key={`h${i}`} className="absolute w-full border-t border-dark-600/15 border-dashed" style={{ top: (i * 60 + 30) * PX_PER_MIN }} />
                ))}
                {positioned.map(({ ev, top, height, left, width }) => (
                  <EventBlock
                    key={ev.id}
                    event={ev}
                    top={top}
                    height={height}
                    left={left}
                    width={width}
                    onClick={() => onEventClick(ev)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Calendar page ───────────────────────────────────────────────────────

type ModalMode = 'create' | 'edit' | 'detail' | 'delete' | null;

export default function Calendar() {
  const { events, loading, createEvent, updateEvent, deleteEvent, getEventsForDate } = useCalendarEvents();

  const [view, setView]     = useState<ViewMode>('week');
  const [cursor, setCursor] = useState(new Date());
  const [modal, setModal]   = useState<ModalMode>(null);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [createDate, setCreateDate] = useState<string | undefined>();
  const [showPast, setShowPast] = useState(false);

  const wrappedGetEventsForDate = (dateStr: string) => {
    const rawEvents = getEventsForDate(dateStr);
    if (showPast) return rawEvents;
    return rawEvents.filter(ev => !isEventPast(ev));
  };

  const hasVisibleEvents = useMemo(() => {
    if (showPast) return events.length > 0;
    return events.some(e => !isEventPast(e));
  }, [events, showPast]);

  // ── Navigation label ──────────────────────────────────────────────────────

  const navLabel = useMemo(() => {
    if (view === 'month') {
      return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
    }
    if (view === 'week') {
      const ws = startOfWeek(cursor);
      const we = addDays(ws, 6);
      if (ws.getMonth() === we.getMonth())
        return `${MONTHS[ws.getMonth()]} ${ws.getDate()}–${we.getDate()}, ${ws.getFullYear()}`;
      return `${MONTHS[ws.getMonth()]} ${ws.getDate()} – ${MONTHS[we.getMonth()]} ${we.getDate()}, ${ws.getFullYear()}`;
    }
    return cursor.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }, [view, cursor]);

  // ── Navigate ──────────────────────────────────────────────────────────────

  function navigate(dir: 1 | -1) {
    setCursor(prev => {
      const d = new Date(prev);
      if (view === 'month') d.setMonth(d.getMonth() + dir);
      else if (view === 'week') d.setDate(d.getDate() + dir * 7);
      else d.setDate(d.getDate() + dir);
      return d;
    });
  }

  function goToday() { setCursor(new Date()); }

  // ── Modal helpers ─────────────────────────────────────────────────────────

  function openCreate(date?: Date) {
    setCreateDate(date ? fmt(date) : undefined);
    setSelected(null);
    setModal('create');
  }

  function openDetail(ev: CalendarEvent) { setSelected(ev); setModal('detail'); }
  function openEdit()   { setModal('edit'); }
  function openDelete() { setModal('delete'); }
  function closeModal() { setModal(null); setSelected(null); }

  function handleDayClick(d: Date) {
    setCursor(d);
    if (view === 'month') setView('day');
  }

  function handleCreate(data: EventFormData) {
    createEvent({ ...data, googleEventId: undefined });
    closeModal();
  }

  function handleEdit(data: EventFormData) {
    if (!selected) return;
    updateEvent(selected.id, data);
    closeModal();
  }

  function handleDelete() {
    if (!selected) return;
    deleteEvent(selected.id);
    closeModal();
  }

  // Today's count for header
  const todayEvents = getEventsForDate(fmt(new Date()));

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-dark-400">Loading calendar…</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Page shell ── */}
      <div className="flex flex-col space-y-4" style={{ height: 'calc(100vh - 48px)' }}>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-dark-100">Calendar</h1>
            <p className="text-sm text-dark-300 mt-0.5">
              {todayEvents.length} event{todayEvents.length !== 1 ? 's' : ''} today
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-dark-300 hover:text-dark-100 transition-colors mr-2">
              <input
                type="checkbox"
                className="w-3.5 h-3.5 rounded border-dark-600 bg-dark-900 text-accent-blue focus:ring-accent-blue/30"
                checked={showPast}
                onChange={e => setShowPast(e.target.checked)}
              />
              Show Past Events
            </label>
            {/* View switcher */}
            <div className="flex items-center rounded-xl border border-dark-600 bg-dark-900 p-1">
              {(['month', 'week', 'day'] as ViewMode[]).map(v => (
                <button
                  key={v}
                  id={`view-${v}`}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    view === v ? 'bg-accent-blue text-white shadow-sm' : 'text-dark-300 hover:text-dark-100'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <button onClick={goToday}
              className="px-3 py-2 rounded-xl border border-dark-600 bg-dark-900 text-xs font-semibold text-dark-200 hover:text-dark-100 hover:border-accent-blue/40 transition-all">
              Today
            </button>
            <button id="add-event-btn" onClick={() => openCreate()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-blue text-white font-semibold text-sm hover:bg-accent-blue/90 transition-all shadow-lg shadow-accent-blue/20">
              <Plus className="w-4 h-4" /> New Event
            </button>
          </div>
        </div>

        {/* Nav bar */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-lg border border-dark-600 flex items-center justify-center text-dark-300 hover:text-dark-100 hover:border-dark-400 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-dark-100 flex-1 text-center sm:text-left">{navLabel}</span>
          <button onClick={() => navigate(1)}
            className="w-8 h-8 rounded-lg border border-dark-600 flex items-center justify-center text-dark-300 hover:text-dark-100 hover:border-dark-400 transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Category legend */}
          <div className="hidden sm:flex items-center gap-3 ml-auto">
            {(Object.keys(CATEGORY_LABELS) as EventCategory[]).map(cat => (
              <span key={cat} className="flex items-center gap-1.5 text-[11px] text-dark-400">
                <CategoryDot category={cat} />
                {CATEGORY_LABELS[cat]}
              </span>
            ))}
          </div>
        </div>

        {/* Calendar body */}
        <motion.div
          key={view}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="glass-card flex-1 overflow-hidden flex flex-col min-h-0 relative"
        >
          {!hasVisibleEvents && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-dark-900/40 backdrop-blur-sm pointer-events-none">
              <div className="text-center p-6 rounded-2xl bg-dark-900 border border-dark-600 shadow-2xl pointer-events-auto">
                <CalendarIcon className="w-10 h-10 mx-auto text-accent-blue/50 mb-3" />
                <p className="text-sm font-bold text-dark-100">No upcoming events scheduled</p>
                <p className="text-xs text-dark-400 mt-1">Your calendar is currently clear.</p>
                <button onClick={() => openCreate()} className="mt-4 px-5 py-2.5 bg-accent-blue text-white rounded-xl text-sm font-semibold hover:bg-accent-blue/90 transition-all shadow-lg shadow-accent-blue/20">
                  New Event
                </button>
              </div>
            </div>
          )}

          {view === 'month' && (
            <MonthView
              cursor={cursor}
              getEventsForDate={wrappedGetEventsForDate}
              onDayClick={handleDayClick}
              onEventClick={openDetail}
            />
          )}
          {view === 'week' && (
            <WeekView
              cursor={cursor}
              getEventsForDate={wrappedGetEventsForDate}
              onDayClick={(d) => { setCursor(d); setView('day'); }}
              onEventClick={openDetail}
            />
          )}
          {view === 'day' && (
            <DayView
              cursor={cursor}
              getEventsForDate={wrappedGetEventsForDate}
              onEventClick={openDetail}
            />
          )}
        </motion.div>
      </div>

      {/* ── Modals ── */}
      {modal === 'create' && (
        <Modal title="New Event" onClose={closeModal} wide>
          <EventForm
            initial={makeDefaultForm(createDate)}
            onSubmit={handleCreate}
            onCancel={closeModal}
            submitLabel="Create Event"
          />
        </Modal>
      )}

      {modal === 'edit' && selected && (
        <Modal title="Edit Event" onClose={closeModal} wide>
          <EventForm
            initial={{
              title: selected.title,
              description: selected.description,
              category: selected.category,
              color: selected.color,
              startDate: selected.startDate,
              startTime: selected.startTime,
              endDate: selected.endDate,
              endTime: selected.endTime,
              location: selected.location,
              allDay: selected.allDay,
            }}
            onSubmit={handleEdit}
            onCancel={closeModal}
            submitLabel="Save Changes"
          />
        </Modal>
      )}

      {modal === 'detail' && selected && (
        <EventDetailModal
          event={selected}
          onClose={closeModal}
          onEdit={openEdit}
          onDelete={openDelete}
        />
      )}

      {modal === 'delete' && selected && (
        <DeleteConfirm
          event={selected}
          onConfirm={handleDelete}
          onCancel={() => setModal('detail')}
        />
      )}
    </>
  );
}
