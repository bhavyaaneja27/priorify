import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';


const groupSlotsByDay = (flatSlots: any[]) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days.map(day => ({
    day,
    slots: flatSlots
      .filter(s => s.day === day)
      .map(s => ({
        time: s.time,
        subject: s.subject,
        room: s.room,
        color: s.color,
        duration: s.duration
      }))
  }));
};

export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// 1. Timetable Hook
export function useTimetable() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isDemo = !user || user.isDemo;

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (isDemo) {
        const saved = localStorage.getItem('timetable_slots');
        if (saved) {
          try {
            setSchedule(JSON.parse(saved));
          } catch {}
        } else {
          setSchedule([]);
        }
      } else {
        try {
          const { data, error } = await supabase
            .from('timetable')
            .select('*')
            .eq('user_id', user.id);
          if (data && !error) {
            setSchedule(groupSlotsByDay(data));
          }
        } catch {}
      }
      setLoading(false);
    }
    load();
  }, [user, isDemo]);

  const saveSchedule = async (updater: any[] | ((prev: any[]) => any[])) => {
    const resolvedSchedule = typeof updater === 'function' ? updater(schedule) : updater;
    setSchedule(resolvedSchedule);

    if (isDemo) {
      localStorage.setItem('timetable_slots', JSON.stringify(resolvedSchedule));
    } else {
      try {
        console.log(`[Supabase timetable] Saving schedule for user ${user.id}...`);
        const { error: delError } = await supabase.from('timetable').delete().eq('user_id', user.id);
        if (delError) {
          console.error('[Supabase timetable] Error deleting existing slots:', delError);
        }

        const flat = [];
        for (const dayGroup of resolvedSchedule) {
          for (const slot of dayGroup.slots) {
            flat.push({
              user_id: user.id,
              day: dayGroup.day,
              time: slot.time,
              subject: slot.subject,
              room: slot.room,
              color: slot.color,
              duration: slot.duration || 90
            });
          }
        }
        if (flat.length > 0) {
          const { error: insError } = await supabase.from('timetable').insert(flat);
          if (insError) {
            console.error('[Supabase timetable] Error inserting slots:', insError);
          } else {
            console.log(`[Supabase timetable] Successfully saved ${flat.length} slots.`);
          }
        }
      } catch (err) {
        console.error('[Supabase timetable] Catch error in saveSchedule:', err);
      }
    }
  };

  return { schedule, saveSchedule, loading };
}

// 2. AI Plans Hook
export function useAIPlans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDemo = !user || user.isDemo;

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      if (isDemo) {
        const saved = localStorage.getItem('ai_plans');
        if (saved) {
          try {
            setPlans(JSON.parse(saved));
          } catch {
            setPlans([]);
          }
        } else {
          setPlans([]);
        }
      } else {
        try {
          const { data, error: fetchError } = await supabase
            .from('ai_plans')
            .select('*')
            .eq('user_id', user.id);
          if (fetchError) {
            console.error('[Supabase ai_plans] Fetch error:', fetchError);
            setError('Failed to load your study plans. Please refresh.');
          } else if (data) {
            setPlans(data.map(p => ({
              id: p.id,
              subject: p.subject,
              topic: p.topic,
              difficulty: p.difficulty,
              examDate: p.exam_date,
              daysLeft: p.days_left,
              schedule: p.schedule
            })));
          }
        } catch (err: any) {
          console.error('[Supabase ai_plans] Unexpected error:', err);
          setError('An unexpected error occurred while loading plans.');
        }
      }
      setLoading(false);
    }
    load();
  }, [user, isDemo]);

  const savePlans = async (updater: any[] | ((prev: any[]) => any[])): Promise<{ error?: string }> => {
    setError(null);
    return new Promise((resolve) => {
      setPlans(prevPlans => {
        const resolvedPlans = typeof updater === 'function' ? updater(prevPlans) : updater;

        const plansWithUuids = resolvedPlans.map(p => {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.id);
          if (!isUuid) {
            return { ...p, id: generateUUID() };
          }
          return p;
        });

        if (isDemo) {
          localStorage.setItem('ai_plans', JSON.stringify(plansWithUuids));
          resolve({});
        } else {
          (async () => {
            try {
              console.log(`[Supabase ai_plans] Saving plans for user ${user.id}...`);
              const { error: delError } = await supabase.from('ai_plans').delete().eq('user_id', user.id);
              if (delError) {
                console.error('[Supabase ai_plans] Error deleting existing plans:', delError);
              }

              const mapped = plansWithUuids.map(p => ({
                id: p.id,
                user_id: user.id,
                subject: p.subject,
                topic: p.topic,
                difficulty: p.difficulty,
                exam_date: p.examDate,
                days_left: p.daysLeft,
                schedule: p.schedule
              }));

              if (mapped.length > 0) {
                const { error: insError } = await supabase.from('ai_plans').insert(mapped);
                if (insError) {
                  console.error('[Supabase ai_plans] Error inserting plans:', insError);
                  const msg = 'Failed to save your study plan. Please try again.';
                  setError(msg);
                  resolve({ error: msg });
                } else {
                  console.log(`[Supabase ai_plans] Successfully saved ${mapped.length} plans.`);
                  resolve({});
                }
              } else {
                resolve({});
              }
            } catch (err: any) {
              console.error('[Supabase ai_plans] Catch error in savePlans:', err);
              const msg = 'An unexpected error occurred while saving the plan.';
              setError(msg);
              resolve({ error: msg });
            }
          })();
        }

        return plansWithUuids;
      });
    });
  };

  return { plans, savePlans, loading, error };
}

// 4. Mood Check-In Hook
export function useMood() {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [stressLevel, setStressLevel] = useState(5.0);
  const [focusLevel, setFocusLevel] = useState(5.0);
  const [loading, setLoading] = useState(true);

  const isDemo = !user || user.isDemo;

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (isDemo) {
        const saved = localStorage.getItem('today_mood');
        const savedStress = localStorage.getItem('today_stress');
        const savedFocus = localStorage.getItem('today_focus');
        if (saved) {
          setSelectedMood(saved);
        } else {
          setSelectedMood('okay');
        }
        if (savedStress) setStressLevel(parseFloat(savedStress));
        if (savedFocus) setFocusLevel(parseFloat(savedFocus));
      } else {
        try {
          const todayStr = new Date().toISOString().split('T')[0];
          const { data, error } = await supabase
            .from('productivity_checks')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', todayStr)
            .maybeSingle();
          if (data && !error) {
            setSelectedMood(data.mood_value);
            setStressLevel(data.stress_level ?? 5.0);
            setFocusLevel(data.focus_level ?? 5.0);
          } else {
            setSelectedMood(null);
          }
        } catch {
          setSelectedMood(null);
        }
      }
      setLoading(false);
    }
    load();
  }, [user, isDemo]);

  const saveMood = async (newMood: string | null, stress?: number, focus?: number) => {
    setSelectedMood(newMood);
    const finalStress = stress !== undefined ? stress : stressLevel;
    const finalFocus = focus !== undefined ? focus : focusLevel;
    setStressLevel(finalStress);
    setFocusLevel(finalFocus);

    if (isDemo) {
      if (newMood) {
        localStorage.setItem('today_mood', newMood);
      } else {
        localStorage.removeItem('today_mood');
      }
      localStorage.setItem('today_stress', finalStress.toString());
      localStorage.setItem('today_focus', finalFocus.toString());
    } else {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        await supabase
          .from('productivity_checks')
          .delete()
          .eq('user_id', user.id)
          .eq('date', todayStr);
        if (newMood) {
          await supabase.from('productivity_checks').insert({
            user_id: user.id,
            date: todayStr,
            mood_value: newMood,
            stress_level: finalStress,
            focus_level: finalFocus
          });
        }
      } catch {}
    }
  };

  return { selectedMood, stressLevel, focusLevel, saveMood, loading };
}

// 5. Mood History Hook
export function useMoodHistory() {
  const { user } = useAuth();
  const [moodHistory, setMoodHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isDemo = !user || user.isDemo;

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (isDemo) {
        const saved = localStorage.getItem('mood_history_list');
        if (saved) {
          try {
            setMoodHistory(JSON.parse(saved));
          } catch {
            setMoodHistory([]);
          }
        } else {
          setMoodHistory([]);
        }
      } else {
        try {
          const { data, error } = await supabase
            .from('productivity_checks')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: true })
            .limit(7);
          if (data && !error) {
            const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            setMoodHistory(data.map(row => {
              const d = new Date(row.date);
              return {
                day: weekdayNames[d.getDay()],
                stress: row.stress_level,
                focus: row.focus_level,
                mood: row.mood_value,
                date: row.date
              };
            }));
          }
        } catch {}
      }
      setLoading(false);
    }
    load();
  }, [user, isDemo]);

  return { moodHistory, loading };
}

// 6. Pomodoro History Hook
export function usePomodoroHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isDemo = !user || user.isDemo;

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (isDemo) {
        const saved = localStorage.getItem('pomodoro_history');
        if (saved) {
          try {
            setHistory(JSON.parse(saved));
          } catch {}
        } else {
          setHistory([]);
        }
      } else {
        try {
          const { data, error } = await supabase
            .from('focus_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: true });
          if (data && !error) {
            setHistory(data.map(h => ({
              date: h.date,
              sessions: h.sessions,
              totalMinutes: h.total_minutes,
              focusScore: h.focus_score
            })));
          }
        } catch {}
      }
      setLoading(false);
    }
    load();
  }, [user, isDemo]);

  const addPomodoroSession = async (minutes: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayIndex = history.findIndex(h => h.date === todayStr);
    let updatedHistory = [...history];

    if (todayIndex >= 0) {
      updatedHistory[todayIndex] = {
        ...updatedHistory[todayIndex],
        sessions: updatedHistory[todayIndex].sessions + 1,
        totalMinutes: updatedHistory[todayIndex].totalMinutes + minutes
      };
    } else {
      updatedHistory.push({
        date: todayStr,
        sessions: 1,
        totalMinutes: minutes,
        focusScore: 85
      });
    }

    setHistory(updatedHistory);

    if (isDemo) {
      localStorage.setItem('pomodoro_history', JSON.stringify(updatedHistory));
    } else {
      try {
        const { data } = await supabase
          .from('focus_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', todayStr)
          .maybeSingle();

        if (data) {
          await supabase
            .from('focus_sessions')
            .update({
              sessions: data.sessions + 1,
              total_minutes: data.total_minutes + minutes
            })
            .eq('id', data.id);
        } else {
          await supabase.from('focus_sessions').insert({
            user_id: user.id,
            date: todayStr,
            sessions: 1,
            total_minutes: minutes,
            focus_score: 85
          });
        }
      } catch {}
    }
  };

  return { history, addPomodoroSession, loading };
}

// 7. User Profile Hook
export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isDemo = !user || user.isDemo;

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (isDemo) {
        const saved = localStorage.getItem('user_profile');
        if (saved) {
          try {
            setProfile(JSON.parse(saved));
          } catch {
            setProfile(null);
          }
        } else {
          setProfile({
            name: 'Guest',
            email: '',
            avatar: 'G',
            profession: '',
            organization: '',
            totalXP: 0,
            level: 1,
            streak: 0,
            totalHours: 0,
          });
        }
      } else {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          const { data: pomoData } = await supabase
            .from('focus_sessions')
            .select('total_minutes')
            .eq('user_id', user.id);
          const totalMins = pomoData?.reduce((acc, curr) => acc + (curr.total_minutes || 0), 0) || 0;
          const totalHours = Math.round(totalMins / 60);

          if (data && !error) {
            setProfile({
              name: data.full_name || user.name || 'Professional',
              email: user.email || '',
              avatar: (data.full_name || user.name || 'Professional').split(' ').map((n: any) => n[0]).join('').toUpperCase().slice(0, 2),
              profession: data.profession || '',
              organization: data.organization || '',
              totalXP: data.xp || 0,
              level: data.level || 1,
              streak: data.streak || 1,
              totalHours: totalHours
            });
          } else {
            const newProfile = {
              id: user.id,
              full_name: user.name || 'Professional',
              organization: '',
              profession: '',
              xp: 0,
              streak: 1,
              level: 1
            };
            await supabase.from('profiles').insert(newProfile);
            setProfile({
              name: newProfile.full_name,
              email: user.email || '',
              avatar: newProfile.full_name.split(' ').map((n: any) => n[0]).join('').toUpperCase().slice(0, 2),
              profession: newProfile.profession,
              organization: newProfile.organization,
              totalXP: newProfile.xp,
              level: newProfile.level,
              streak: newProfile.streak,
              totalHours: 0
            });
          }
        } catch {
          setProfile(null);
        }
      }
      setLoading(false);
    }
    load();
  }, [user, isDemo]);

  const saveProfile = async (updated: any) => {
    setProfile(updated);
    if (isDemo) {
      localStorage.setItem('user_profile', JSON.stringify(updated));
    } else {
      try {
        await supabase
          .from('profiles')
          .update({
            full_name: updated.name,
            organization: updated.organization,
            profession: updated.profession,
            xp: updated.totalXP,
            level: updated.level,
            streak: updated.streak
          })
          .eq('id', user.id);
      } catch {}
    }
  };

  return { profile, saveProfile, loading };
}

// ─────────────────────────────────────────────
// 8. Tasks Hook  (Phase 1 – Priorify specific)
// ─────────────────────────────────────────────
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus   = 'pending' | 'in-progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  dueDate: string;          // ISO date string, e.g. "2025-07-01"
  status: TaskStatus;
  createdAt: string;        // ISO datetime
  updatedAt: string;        // ISO datetime
}

const TASKS_KEY = 'priorify_tasks';

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDemo = !user || user.isDemo;

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      if (isDemo) {
        const saved = localStorage.getItem(TASKS_KEY);
        if (saved) {
          try {
            setTasks(JSON.parse(saved));
          } catch {
            setTasks([]);
          }
        } else {
          setTasks([]);
        }
      } else {
        try {
          const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          if (data && !error && data.length > 0) {
            setTasks(data.map(d => ({
              id: d.id,
              title: d.title,
              description: d.description || '',
              category: d.category || 'Work',
              priority: d.priority,
              dueDate: d.due_date,
              status: d.status,
              createdAt: d.created_at,
              updatedAt: d.updated_at
            })));
          } else {
            // Local fallback for smooth migration test
            const saved = localStorage.getItem(`${TASKS_KEY}_${user.id}`);
            if (saved) {
              try { setTasks(JSON.parse(saved)); } catch { setTasks([]); }
            } else { setTasks([]); }
          }
        } catch {
          setTasks([]);
        }
      }
      setLoading(false);
    }
    load();
  }, [user, isDemo]);

  const persist = async (updated: Task[], changedTask?: Task, operation?: 'insert' | 'update' | 'delete') => {
    if (isDemo) {
      localStorage.setItem(TASKS_KEY, JSON.stringify(updated));
    } else {
      localStorage.setItem(`${TASKS_KEY}_${user!.id}`, JSON.stringify(updated));
      if (changedTask && operation) {
        try {
          if (operation === 'insert') {
            await supabase.from('tasks').insert({
              id: changedTask.id,
              user_id: user!.id,
              title: changedTask.title,
              description: changedTask.description,
              category: changedTask.category,
              priority: changedTask.priority,
              due_date: changedTask.dueDate,
              status: changedTask.status,
              created_at: changedTask.createdAt,
              updated_at: changedTask.updatedAt
            });
          } else if (operation === 'update') {
            await supabase.from('tasks').update({
              title: changedTask.title,
              description: changedTask.description,
              category: changedTask.category,
              priority: changedTask.priority,
              due_date: changedTask.dueDate,
              status: changedTask.status,
              updated_at: changedTask.updatedAt
            }).eq('id', changedTask.id);
          } else if (operation === 'delete') {
            await supabase.from('tasks').delete().eq('id', changedTask.id);
          }
        } catch (e) { console.error('Supabase tasks error', e); }
      }
    }
  };

  const createTask = (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task => {
    const now = new Date().toISOString();
    const task: Task = { ...data, id: generateUUID(), createdAt: now, updatedAt: now };
    const updated = [task, ...tasks];
    setTasks(updated);
    persist(updated, task, 'insert');
    return task;
  };

  const updateTask = (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>): void => {
    let updatedTask: Task | undefined;
    const updated = tasks.map(t => {
      if (t.id === id) {
        updatedTask = { ...t, ...patch, updatedAt: new Date().toISOString() };
        return updatedTask;
      }
      return t;
    });
    setTasks(updated);
    if (updatedTask) persist(updated, updatedTask, 'update');
  };

  const deleteTask = (id: string): void => {
    const taskToDelete = tasks.find(t => t.id === id);
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    if (taskToDelete) persist(updated, taskToDelete, 'delete');
  };

  return { tasks, loading, error, createTask, updateTask, deleteTask };
}

// ─────────────────────────────────────────────────────────────────
// 9. Calendar Events Hook  (Phase 2 — Priorify general-purpose calendar)
// ─────────────────────────────────────────────────────────────────
export type EventCategory = 'personal' | 'work' | 'study' | 'health' | 'other';

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  personal: '#A78BFA', // accent-purple
  work:     '#60A5FA', // accent-blue
  study:    '#34D399', // accent-teal
  health:   '#FB7185', // accent-pink/rose
  other:    '#FCD34D', // accent-amber
};

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  personal: 'Personal',
  work:     'Work',
  study:    'Study',
  health:   'Health',
  other:    'Other',
};

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  color: string;           // hex — defaults to CATEGORY_COLORS[category]
  startDate: string;       // 'YYYY-MM-DD'
  startTime: string;       // 'HH:MM' (24-h), empty when allDay
  endDate: string;         // 'YYYY-MM-DD'
  endTime: string;         // 'HH:MM' (24-h), empty when allDay
  location: string;
  allDay: boolean;
  // Google Calendar integration placeholders (Phase 3)
  googleEventId?: string;
  source?: 'local' | 'google';
  createdAt: string;
  updatedAt: string;
}

const CAL_KEY = 'priorify_calendar_events';



export function useCalendarEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const isDemo = !user || user.isDemo;

  const storageKey = isDemo ? CAL_KEY : `${CAL_KEY}_${user?.id}`;

  useEffect(() => {
    setLoading(true);
    const loadEvents = async () => {
      if (isDemo) {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          try { setEvents(JSON.parse(saved)); } catch { setEvents([]); }
        } else {
          setEvents([]);
        }
      } else {
        try {
          const { data, error } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('user_id', user.id);
          
          if (data && !error && data.length > 0) {
            setEvents(data.map((d: any) => ({
              id: d.id,
              title: d.title,
              description: d.description || '',
              category: d.category as EventCategory,
              color: d.color || CATEGORY_COLORS[d.category as EventCategory] || CATEGORY_COLORS.other,
              startDate: d.start_date,
              startTime: d.start_time || '',
              endDate: d.end_date,
              endTime: d.end_time || '',
              location: d.location || '',
              allDay: d.all_day,
              source: 'local',
              createdAt: d.created_at,
              updatedAt: d.updated_at
            })));
          } else {
            // Local fallback check
            const saved = localStorage.getItem(storageKey);
            if (saved) {
              try { setEvents(JSON.parse(saved)); } catch { setEvents([]); }
            } else { setEvents([]); }
          }
        } catch {
          setEvents([]);
        }
      }
      setLoading(false);
    };
    loadEvents();
  }, [storageKey, isDemo, user]);

  const persist = async (updated: CalendarEvent[], changedEvent?: CalendarEvent, operation?: 'insert' | 'update' | 'delete') => {
    localStorage.setItem(storageKey, JSON.stringify(updated));
    if (!isDemo && changedEvent && operation) {
      try {
        if (operation === 'insert') {
          await supabase.from('calendar_events').insert({
            id: changedEvent.id,
            user_id: user!.id,
            title: changedEvent.title,
            description: changedEvent.description,
            category: changedEvent.category,
            color: changedEvent.color,
            start_date: changedEvent.startDate,
            start_time: changedEvent.startTime || null,
            end_date: changedEvent.endDate,
            end_time: changedEvent.endTime || null,
            all_day: changedEvent.allDay,
            location: changedEvent.location,
            created_at: changedEvent.createdAt,
            updated_at: changedEvent.updatedAt
          });
        } else if (operation === 'update') {
          await supabase.from('calendar_events').update({
            title: changedEvent.title,
            description: changedEvent.description,
            category: changedEvent.category,
            color: changedEvent.color,
            start_date: changedEvent.startDate,
            start_time: changedEvent.startTime || null,
            end_date: changedEvent.endDate,
            end_time: changedEvent.endTime || null,
            all_day: changedEvent.allDay,
            location: changedEvent.location,
            updated_at: changedEvent.updatedAt
          }).eq('id', changedEvent.id);
        } else if (operation === 'delete') {
          await supabase.from('calendar_events').delete().eq('id', changedEvent.id);
        }
      } catch (e) { console.error('Supabase event error', e); }
    }
  };

  const createEvent = (data: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): CalendarEvent => {
    const now = new Date().toISOString();
    const ev: CalendarEvent = { ...data, id: generateUUID(), source: 'local', createdAt: now, updatedAt: now };
    const updated = [...events, ev];
    setEvents(updated);
    persist(updated, ev, 'insert');
    return ev;
  };

  const updateEvent = (id: string, patch: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>): void => {
    let updatedEvent: CalendarEvent | undefined;
    const updated = events.map(e => {
      if (e.id === id) {
        updatedEvent = { ...e, ...patch, updatedAt: new Date().toISOString() };
        return updatedEvent;
      }
      return e;
    });
    setEvents(updated);
    if (updatedEvent) persist(updated, updatedEvent, 'update');
  };

  const deleteEvent = (id: string): void => {
    const eventToDelete = events.find(e => e.id === id);
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    if (eventToDelete) persist(updated, eventToDelete, 'delete');
  };

  /** Get all events that overlap a given date ('YYYY-MM-DD') */
  const getEventsForDate = (date: string): CalendarEvent[] =>
    events.filter(e => e.startDate <= date && e.endDate >= date)
      .sort((a, b) => (a.allDay ? -1 : b.allDay ? 1 : a.startTime.localeCompare(b.startTime)));

  /** Get all events that overlap any day in [startDate, endDate] inclusive */
  const getEventsForRange = (startDate: string, endDate: string): CalendarEvent[] =>
    events.filter(e => e.startDate <= endDate && e.endDate >= startDate);

  return { events, loading, createEvent, updateEvent, deleteEvent, getEventsForDate, getEventsForRange };
}

// ──────────────────────────────────────────────────────────────────────────────
// 10. DAILY PLANS (Phase 4)
// ──────────────────────────────────────────────────────────────────────────────

export interface DailyPlan {
  id: string;
  date: string;
  schedule: { time: string; endTime: string; type: 'task' | 'event' | 'break'; title: string; notes: string; color?: string; priority?: string }[];
  workloadMinutes: number;
  topPriorities: string[];
}

export function useDailyPlans() {
  const { user, loading: authLoading } = useAuth();
  const [plans, setPlans] = useState<DailyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    loadPlans();
  }, [user, authLoading]);

  const loadPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      if (user && !user.isDemo) {
        const { data, error } = await supabase
          .from('daily_plans')
          .select('*')
          .eq('user_id', user.id);
        
        if (data && !error && data.length > 0) {
          setPlans(data.map(d => ({
            id: d.id,
            date: d.date,
            schedule: d.schedule,
            workloadMinutes: d.workload_minutes,
            topPriorities: d.top_priorities
          })));
        } else {
          // Local fallback check
          const storageKey = `priorify_daily_plans_${user.id}`;
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            setPlans(JSON.parse(stored));
          } else {
            setPlans([]);
          }
        }
      } else {
        const storageKey = 'priorify_daily_plans';
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          setPlans(JSON.parse(stored));
        } else {
          setPlans([]);
        }
      }
    } catch (err) {
      console.error('Failed to load daily plans:', err);
      setError('Failed to load daily plans.');
    } finally {
      setLoading(false);
    }
  };

  const savePlans = async (newPlansOrUpdater: DailyPlan[] | ((prev: DailyPlan[]) => DailyPlan[])) => {
    try {
      const updatedPlans = typeof newPlansOrUpdater === 'function' ? newPlansOrUpdater(plans) : newPlansOrUpdater;
      const storageKey = user && !user.isDemo ? `priorify_daily_plans_${user.id}` : 'priorify_daily_plans';
      localStorage.setItem(storageKey, JSON.stringify(updatedPlans));
      
      if (user && !user.isDemo) {
        try {
          const planData = updatedPlans.map(p => ({
            id: p.id,
            user_id: user.id,
            date: p.date,
            schedule: p.schedule,
            workload_minutes: p.workloadMinutes,
            top_priorities: p.topPriorities,
            created_at: new Date().toISOString()
          }));
          
          if (planData.length > 0) {
            // Use upsert to atomically replace the plan for this user and date
            const { error } = await supabase.from('daily_plans').upsert(planData, { onConflict: 'user_id, date' });
            if (error) console.error('Supabase upsert daily plans error', error);
          }
        } catch (e) {
          console.error('Supabase save daily plans error', e);
        }
      }
      
      setPlans(updatedPlans);
      return { data: updatedPlans, error: null };
    } catch (err: any) {
      console.error('Failed to save daily plans:', err);
      return { data: null, error: err.message };
    }
  };

  const getPlanForDate = (date: string) => {
    return plans.find(p => p.date === date);
  };

  return { plans, getPlanForDate, savePlans, loading, error };
}

// ──────────────────────────────────────────────────────────────────────────────
// 11. Rescheduling Suggestions (Phase 5)
// ──────────────────────────────────────────────────────────────────────────────

export interface RescheduleBlockChange {
  type: 'add' | 'remove' | 'modify';
  time: string;
  title: string;
  reason: string;
  block?: any;
}

export interface RescheduleSuggestion {
  id: string;
  date: string;
  reason: string;
  suggestedPlan: DailyPlan;
  changes: RescheduleBlockChange[];
  status: 'pending' | 'accepted' | 'rejected' | 'partially_applied';
  createdAt: number;
}

export function useRescheduling() {
  const { user, loading: authLoading } = useAuth();
  const [suggestions, setSuggestions] = useState<RescheduleSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    const storageKey = user && !user.isDemo ? `priorify_reschedules_${user.id}` : 'priorify_reschedules';
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setSuggestions(JSON.parse(stored));
      } else {
        setSuggestions([]);
      }
    } catch {
      setSuggestions([]);
    }
    setLoading(false);
  }, [user, authLoading]);

  const saveSuggestions = (newSuggestions: RescheduleSuggestion[]) => {
    const storageKey = user && !user.isDemo ? `priorify_reschedules_${user.id}` : 'priorify_reschedules';
    localStorage.setItem(storageKey, JSON.stringify(newSuggestions));
    setSuggestions(newSuggestions);
  };

  const addSuggestion = (suggestion: Omit<RescheduleSuggestion, 'id' | 'status' | 'createdAt'>) => {
    const newSug: RescheduleSuggestion = {
      ...suggestion,
      id: generateUUID(),
      status: 'pending',
      createdAt: Date.now()
    };
    // Keep only the latest pending suggestion for a given date, reject older ones
    const updated = suggestions.map(s => 
      (s.date === suggestion.date && s.status === 'pending') ? { ...s, status: 'rejected' as const } : s
    );
    saveSuggestions([...updated, newSug]);
    return newSug;
  };

  const updateSuggestionStatus = (id: string, status: RescheduleSuggestion['status']) => {
    const updated = suggestions.map(s => s.id === id ? { ...s, status } : s);
    saveSuggestions(updated);
  };

  const getPendingSuggestionForDate = (date: string) => {
    // Return newest pending suggestion for date
    return suggestions
      .filter(s => s.date === date && s.status === 'pending')
      .sort((a, b) => b.createdAt - a.createdAt)[0];
  };

  return { suggestions, loading, addSuggestion, updateSuggestionStatus, getPendingSuggestionForDate };
}
