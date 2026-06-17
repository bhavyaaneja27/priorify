import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, MapPin, Plus, X, GripVertical } from 'lucide-react';
import { timetableSlots } from '../data/dummyData';

const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface Slot {
  time: string;
  subject: string;
  room: string;
  color: string;
}

function getSlotStyle(time: string) {
  const hour = parseInt(time.split(':')[0]);
  const startOffset = (hour - 8) * 60;
  const duration = 90;
  return {
    top: `${startOffset}px`,
    height: `${duration}px`,
  };
}

export default function Timetable() {
  const [schedule, setSchedule] = useState(timetableSlots);
  const [showAdd, setShowAdd] = useState(false);
  const [newSlot, setNewSlot] = useState({ day: 'Monday', time: '09:00', subject: '', room: '', color: '#5b8def' });
  const [draggedItem, setDraggedItem] = useState<{ day: string; slot: Slot } | null>(null);

  const handleAdd = () => {
    if (!newSlot.subject || !newSlot.room) return;
    setSchedule(prev => prev.map(d => d.day === newSlot.day ? { ...d, slots: [...d.slots, { time: newSlot.time, subject: newSlot.subject, room: newSlot.room, color: newSlot.color }] } : d));
    setShowAdd(false);
    setNewSlot({ day: 'Monday', time: '09:00', subject: '', room: '', color: '#5b8def' });
  };

  const handleDelete = (day: string, time: string) => {
    setSchedule(prev => prev.map(d => d.day === day ? { ...d, slots: d.slots.filter(s => s.time !== time) } : d));
  };

  const handleDragStart = (day: string, slot: Slot) => {
    setDraggedItem({ day, slot });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetDay: string, targetTime: string) => {
    e.preventDefault();
    if (!draggedItem) return;
    const { day: sourceDay, slot: sourceSlot } = draggedItem;
    if (sourceDay === targetDay && sourceSlot.time === targetTime) return;

    setSchedule(prev => prev.map(d => {
      if (d.day === sourceDay) {
        return { ...d, slots: d.slots.filter(s => s.time !== sourceSlot.time) };
      }
      if (d.day === targetDay) {
        const filtered = d.slots.filter(s => s.time !== targetTime);
        return { ...d, slots: [...filtered, { ...sourceSlot, time: targetTime }] };
      }
      return d;
    }));
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
              {day.slots.sort((a, b) => a.time.localeCompare(b.time)).map((slot) => (
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
        <div className="grid grid-cols-6 border-b border-[#2d2d42]">
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
          {days.map((day, dayIdx) => (
            <div key={day} className="absolute border-r border-[#2d2d42]/50" style={{ left: `${16.67 + dayIdx * 16.67}%`, width: '16.67%', height: '100%' }}>
              {schedule.find(d => d.day === day)?.slots.map((slot) => {
                const hour = parseInt(slot.time.split(':')[0]);
                const top = (hour - 8) * 60;
                return (
                  <div
                    key={slot.time}
                    draggable
                    onDragStart={() => handleDragStart(day, slot)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day, slot.time)}
                    className="absolute left-1 right-1 rounded-lg p-2 cursor-move group"
                    style={{ top: `${top}px`, height: '85px', backgroundColor: slot.color + '20', borderLeft: `3px solid ${slot.color}` }}
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
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
