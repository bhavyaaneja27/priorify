import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, MapPin, Plus, X, GripVertical } from 'lucide-react';

const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface Slot {
  time: string;
  subject: string;
  room: string;
  color: string;
  duration?: number;
}

interface PositionedSlot extends Slot {
  top: number;
  height: number;
  left: string;
  width: string;
}

function getTopOffset(timeString: string): number {
  const [hourStr, minStr] = timeString.split(':');
  const hour = parseInt(hourStr) || 8;
  const minutes = parseInt(minStr) || 0;
  return (hour - 8) * 60 + minutes;
}

function getPositionedSlots(slots: Slot[]): PositionedSlot[] {
  if (!slots) return [];
  const sorted = [...slots].sort((a, b) => getTopOffset(a.time) - getTopOffset(b.time));
  
  const positioned: PositionedSlot[] = [];
  const columns: number[][] = []; 
  
  const slotsWithTimes = sorted.map(slot => {
    const top = getTopOffset(slot.time);
    const duration = slot.duration || 90;
    const height = duration - 5;
    return { slot, top, height, end: top + duration };
  });

  const slotCols = new Array(slotsWithTimes.length).fill(0);
  
  for (let i = 0; i < slotsWithTimes.length; i++) {
    const item = slotsWithTimes[i];
    let colAssigned = false;
    for (let c = 0; c < columns.length; c++) {
      const lastSlotInColIndex = columns[c][columns[c].length - 1];
      const lastSlot = slotsWithTimes[lastSlotInColIndex];
      if (item.top >= lastSlot.end) {
        columns[c].push(i);
        slotCols[i] = c;
        colAssigned = true;
        break;
      }
    }
    if (!colAssigned) {
      columns.push([i]);
      slotCols[i] = columns.length - 1;
    }
  }

  const slotWidthGroups = new Array(slotsWithTimes.length).fill(1);
  for (let i = 0; i < slotsWithTimes.length; i++) {
    const a = slotsWithTimes[i];
    const overlaps = slotsWithTimes.map((b, idx) => {
      const isOverlapping = (b.top < a.end && b.end > a.top);
      return { idx, isOverlapping };
    }).filter(x => x.isOverlapping);

    const uniqueCols = new Set(overlaps.map(o => slotCols[o.idx]));
    const colCount = Math.max(overlaps.length, uniqueCols.size);
    slotWidthGroups[i] = colCount;
  }

  for (let i = 0; i < slotsWithTimes.length; i++) {
    const { slot, top, height } = slotsWithTimes[i];
    const col = slotCols[i];
    const totalCols = slotWidthGroups[i];
    const widthPct = 100 / totalCols;
    const leftPct = col * widthPct;
    
    positioned.push({
      ...slot,
      top,
      height,
      left: `${leftPct}%`,
      width: `calc(${widthPct}% - 4px)`,
    });
  }

  return positioned;
}

import { useTimetable } from '../hooks/usePersistence';

export default function Timetable() {
  const { schedule, saveSchedule: setSchedule, loading } = useTimetable();
  const [showAdd, setShowAdd] = useState(false);
  const [newSlot, setNewSlot] = useState({ day: 'Monday', time: '09:00', subject: '', room: '', color: '#5b8def' });
  const [draggedItem, setDraggedItem] = useState<{ day: string; slot: Slot } | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ day: string; time: string } | null>(null);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-[#5b8def] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[#5a5a7a]">Loading schedule...</p>
      </div>
    );
  }

  const handleAdd = () => {
    if (!newSlot.subject || !newSlot.room) return;
    setSchedule(prev => {
      const exists = prev.find(d => d.day === newSlot.day);
      if (exists) {
        return prev.map(d => d.day === newSlot.day ? { ...d, slots: [...d.slots, { time: newSlot.time, subject: newSlot.subject, room: newSlot.room, color: newSlot.color }] } : d);
      }
      return [...prev, { day: newSlot.day, slots: [{ time: newSlot.time, subject: newSlot.subject, room: newSlot.room, color: newSlot.color }] }];
    });
    setShowAdd(false);
    setNewSlot({ day: 'Monday', time: '09:00', subject: '', room: '', color: '#5b8def' });
  };

  const handleDelete = (day: string, time: string) => {
    setSchedule(prev => prev.map(d => d.day === day ? { ...d, slots: d.slots.filter((s: Slot) => s.time !== time) } : d));
  };

  const handleDragStart = (e: React.DragEvent, day: string, slot: Slot) => {
    e.dataTransfer.setData('text/plain', '');
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem({ day, slot });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent, day: string, time: string) => {
    e.preventDefault();
    setDragOverCell({ day, time });
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, targetDay: string, targetTime: string) => {
    e.preventDefault();
    setDragOverCell(null);
    if (!draggedItem) return;
    const { day: sourceDay, slot: sourceSlot } = draggedItem;
    if (sourceDay === targetDay && sourceSlot.time === targetTime) return;

    setSchedule(prev => {
      let updated = prev.map(d => {
        if (d.day === sourceDay) {
          return { ...d, slots: d.slots.filter((s: Slot) => s.time !== sourceSlot.time) };
        }
        return d;
      });

      updated = updated.map(d => {
        if (d.day === targetDay) {
          const filtered = d.slots.filter((s: Slot) => s.time !== targetTime);
          return { ...d, slots: [...filtered, { ...sourceSlot, time: targetTime }] };
        }
        return d;
      });

      return updated;
    });
    setDraggedItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Weekly Timetable</h1>
          <p className="text-sm text-[#8a8aa3] mt-1">Drag and drop to manage your schedule</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#5b8def] to-[#4ecdc4] text-white font-medium text-sm hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Class
        </button>
      </div>

      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <select value={newSlot.day} onChange={e => setNewSlot({ ...newSlot, day: e.target.value })} className="px-3 py-2.5 rounded-xl bg-[#12121a] border border-[#2d2d42] text-white text-sm">
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={newSlot.time} onChange={e => setNewSlot({ ...newSlot, time: e.target.value })} className="px-3 py-2.5 rounded-xl bg-[#12121a] border border-[#2d2d42] text-white text-sm">
              {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input value={newSlot.subject} onChange={e => setNewSlot({ ...newSlot, subject: e.target.value })} placeholder="Subject" className="px-3 py-2.5 rounded-xl bg-[#12121a] border border-[#2d2d42] text-white text-sm" />
            <input value={newSlot.room} onChange={e => setNewSlot({ ...newSlot, room: e.target.value })} placeholder="Room" className="px-3 py-2.5 rounded-xl bg-[#12121a] border border-[#2d2d42] text-white text-sm" />
            <div className="flex gap-2">
              <button onClick={handleAdd} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#5b8def] to-[#4ecdc4] text-white font-medium text-sm">Add</button>
              <button onClick={() => setShowAdd(false)} className="px-3 py-2.5 rounded-xl bg-[#2d2d42] text-[#8a8aa3] hover:text-white"><X className="w-4 h-4" /></button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Mobile view */}
      <div className="lg:hidden space-y-4">
        {schedule.map((day) => (
          <div key={day.day} className="glass-card rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-[#d0d0e0] mb-3 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#5b8def]" />
              {day.day}
            </h3>
            <div className="space-y-2">
              {day.slots.length === 0 && (
                <p className="text-sm text-[#5a5a7a] py-2">No classes scheduled</p>
              )}
              {day.slots.sort((a: Slot, b: Slot) => a.time.localeCompare(b.time)).map((slot: Slot) => (
                <div key={slot.time} className="flex items-center gap-3 p-3 rounded-xl bg-[#12121a] border-l-4" style={{ borderLeftColor: slot.color }}>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{slot.subject}</p>
                    <div className="flex items-center gap-2 text-xs text-[#5a5a7a]">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{slot.time}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{slot.room}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(day.day, slot.time)} className="text-[#5a5a7a] hover:text-[#ff6b6b]"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop grid view */}
      <div className="hidden lg:block glass-card rounded-2xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-[#2d2d42]">
          <div className="p-3 text-xs font-semibold text-[#5a5a7a] uppercase tracking-wider border-r border-[#2d2d42]">Time</div>
          {days.map(d => (
            <div key={d} className="p-3 text-xs font-semibold text-[#d0d0e0] uppercase tracking-wider text-center border-r border-[#2d2d42] last:border-r-0">{d.slice(0, 3)}</div>
          ))}
        </div>
        <div className="relative" style={{ height: `${timeSlots.length * 60}px` }}>
          {timeSlots.map((time, i) => (
            <div key={time} className="absolute w-full border-b border-[#2d2d42]/50" style={{ top: `${i * 60}px`, height: '60px' }}>
              <div className="absolute left-0 top-0 w-16 -translate-y-1/2 text-[10px] text-[#5a5a7a] text-right pr-2">{time}</div>
            </div>
          ))}
          {days.map((day, dayIdx) => {
            const daySlots = schedule.find(d => d.day === day)?.slots || [];
            const positionedSlots = getPositionedSlots(daySlots);
            return (
              <div key={day} className="absolute border-r border-[#2d2d42]/50" style={{ left: `${(100/7) + dayIdx * (100/7)}%`, width: `${100/7}%`, height: '100%' }}>
                {/* Hourly Drop Targets */}
                {timeSlots.map((time, i) => {
                  const isHovered = dragOverCell?.day === day && dragOverCell?.time === time;
                  return (
                    <div
                      key={time}
                      onDragOver={handleDragOver}
                      onDragEnter={(e) => handleDragEnter(e, day, time)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, day, time)}
                      className={`absolute left-0 right-0 h-[60px] transition-all border-b border-dashed border-[#2d2d42]/10 ${
                        isHovered
                          ? 'bg-[#5b8def]/15 border-2 border-dashed border-[#5b8def]/40 z-10'
                          : 'hover:bg-[#5b8def]/5'
                      }`}
                      style={{ top: `${i * 60}px` }}
                    />
                  );
                })}

                {/* Class cards */}
                {positionedSlots.map((slot) => (
                  <div
                    key={slot.time}
                    draggable
                    onDragStart={(e) => handleDragStart(e, day, slot)}
                    onDragEnd={() => {
                      setDraggedItem(null);
                      setDragOverCell(null);
                    }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day, slot.time)}
                    className="absolute rounded-lg p-2 cursor-move group select-none transition-all duration-200 hover:shadow-lg"
                    style={{
                      top: `${slot.top}px`,
                      height: `${slot.height}px`,
                      left: slot.left,
                      width: slot.width,
                      backgroundColor: slot.color + '20',
                      borderLeft: `3px solid ${slot.color}`
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{slot.subject}</p>
                        <p className="text-[10px] text-[#8a8aa3] flex items-center gap-1 mt-0.5"><MapPin className="w-2.5 h-2.5" />{slot.room}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-3 h-3 text-[#5a5a7a]" />
                        <button onClick={() => handleDelete(day, slot.time)} className="text-[#5a5a7a] hover:text-[#ff6b6b]"><X className="w-3 h-3" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
