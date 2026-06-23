import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { calendarSlots, aiPlans, pomodoroHistory } from '../data/dummyData';

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
  const [schedule, setSchedule] = useState<any[]>(calendarSlots);
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
          setSchedule(calendarSlots);
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
  const [plans, setPlans] = useState<any[]>(aiPlans);
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
            setPlans(aiPlans);
          }
        } else {
          setPlans(aiPlans);
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
            .from('mood_history')
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
          .from('mood_history')
          .delete()
          .eq('user_id', user.id)
          .eq('date', todayStr);
        if (newMood) {
          await supabase.from('mood_history').insert({
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
          // default dummy data translated to fit
          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          const dummy = days.map((day, idx) => ({
            day,
            stress: [3.2, 4.5, 2.8, 5.0, 3.5, 1.5, 2.0][idx],
            focus: [7.8, 6.5, 8.2, 6.0, 7.5, 9.0, 8.5][idx],
          }));
          setMoodHistory(dummy);
        }
      } else {
        try {
          const { data, error } = await supabase
            .from('mood_history')
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
  const [history, setHistory] = useState<any[]>(pomodoroHistory);
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
          setHistory(pomodoroHistory);
        }
      } else {
        try {
          const { data, error } = await supabase
            .from('pomodoro_history')
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
          .from('pomodoro_history')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', todayStr)
          .maybeSingle();

        if (data) {
          await supabase
            .from('pomodoro_history')
            .update({
              sessions: data.sessions + 1,
              total_minutes: data.total_minutes + minutes
            })
            .eq('id', data.id);
        } else {
          await supabase.from('pomodoro_history').insert({
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
            name: 'Alex Johnson',
            email: 'alex.johnson@university.edu',
            avatar: 'AJ',
            branch: 'Product Design',
            year: 'Professional',
            university: 'Freelancer',
            totalXP: 1280,
            level: 12,
            streak: 7,
            totalHours: 342,
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
            .from('pomodoro_history')
            .select('total_minutes')
            .eq('user_id', user.id);
          const totalMins = pomoData?.reduce((acc, curr) => acc + (curr.total_minutes || 0), 0) || 0;
          const totalHours = Math.round(totalMins / 60);

          if (data && !error) {
            setProfile({
              name: data.full_name || user.name || 'Student',
              email: user.email || '',
              avatar: (data.full_name || user.name || 'Student').split(' ').map((n: any) => n[0]).join('').toUpperCase().slice(0, 2),
              branch: data.branch || '',
              year: data.year || '',
              university: data.university || '',
              totalXP: data.xp || 0,
              level: data.level || 1,
              streak: data.streak || 1,
              totalHours: totalHours
            });
          } else {
            const newProfile = {
              id: user.id,
              full_name: user.name || 'Student',
              university: '',
              branch: '',
              year: '',
              xp: 0,
              streak: 1,
              level: 1
            };
            await supabase.from('profiles').insert(newProfile);
            setProfile({
              name: newProfile.full_name,
              email: user.email || '',
              avatar: newProfile.full_name.split(' ').map((n: any) => n[0]).join('').toUpperCase().slice(0, 2),
              branch: newProfile.branch,
              year: newProfile.year,
              university: newProfile.university,
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
            university: updated.university,
            branch: updated.branch,
            year: updated.year,
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
          // Seed with a handful of sample tasks so the UI isn't empty on first visit
          const now = new Date().toISOString();
          const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
          const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          const seed: Task[] = [
            {
              id: generateUUID(),
              title: 'Review Q3 project proposal',
              description: 'Go through the deck and leave comments for the team before the Thursday meeting.',
              category: 'Work',
              priority: 'high',
              dueDate: tomorrow,
              status: 'in-progress',
              createdAt: now,
              updatedAt: now,
            },
            {
              id: generateUUID(),
              title: 'Set up weekly goal tracker',
              description: 'Create a simple spreadsheet to log daily outputs.',
              category: 'Personal',
              priority: 'medium',
              dueDate: nextWeek,
              status: 'pending',
              createdAt: now,
              updatedAt: now,
            },
            {
              id: generateUUID(),
              title: 'Submit expense report',
              description: 'Upload April receipts to the HR portal.',
              category: 'Admin',
              priority: 'critical',
              dueDate: yesterday,
              status: 'pending',
              createdAt: now,
              updatedAt: now,
            },
            {
              id: generateUUID(),
              title: 'Read "Deep Work" – Chapter 3',
              description: '',
              category: 'Learning',
              priority: 'low',
              dueDate: nextWeek,
              status: 'completed',
              createdAt: now,
              updatedAt: now,
            },
          ];
          setTasks(seed);
          localStorage.setItem(TASKS_KEY, JSON.stringify(seed));
        }
      } else {
        // Future: fetch from supabase 'priorify_tasks' table
        // For now fall back to localStorage even for authenticated users
        // (Supabase table will be added in a future schema migration)
        const saved = localStorage.getItem(`${TASKS_KEY}_${user.id}`);
        if (saved) {
          try {
            setTasks(JSON.parse(saved));
          } catch {
            setTasks([]);
          }
        } else {
          setTasks([]);
        }
      }
      setLoading(false);
    }
    load();
  }, [user, isDemo]);

  const persist = (updated: Task[]) => {
    if (isDemo) {
      localStorage.setItem(TASKS_KEY, JSON.stringify(updated));
    } else {
      localStorage.setItem(`${TASKS_KEY}_${user!.id}`, JSON.stringify(updated));
    }
  };

  const createTask = (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task => {
    const now = new Date().toISOString();
    const task: Task = { ...data, id: generateUUID(), createdAt: now, updatedAt: now };
    const updated = [task, ...tasks];
    setTasks(updated);
    persist(updated);
    return task;
  };

  const updateTask = (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>): void => {
    const updated = tasks.map(t =>
      t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t
    );
    setTasks(updated);
    persist(updated);
  };

  const deleteTask = (id: string): void => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    persist(updated);
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

function buildSeedEvents(): CalendarEvent[] {
  const now = new Date().toISOString();
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const d = (offset: number) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + offset);
    return fmt(dt);
  };

  return [
    {
      id: generateUUID(), title: 'Team Standup', description: 'Daily sync with the team',
      category: 'work', color: CATEGORY_COLORS.work,
      startDate: d(0), startTime: '09:00', endDate: d(0), endTime: '09:30',
      location: 'Zoom', allDay: false, source: 'local', createdAt: now, updatedAt: now,
    },
    {
      id: generateUUID(), title: 'Deep Work Block', description: 'No meetings, focused coding',
      category: 'work', color: CATEGORY_COLORS.work,
      startDate: d(0), startTime: '10:00', endDate: d(0), endTime: '12:00',
      location: 'Home', allDay: false, source: 'local', createdAt: now, updatedAt: now,
    },
    {
      id: generateUUID(), title: 'Gym Session', description: '',
      category: 'health', color: CATEGORY_COLORS.health,
      startDate: d(0), startTime: '17:30', endDate: d(0), endTime: '18:30',
      location: 'Fitness Club', allDay: false, source: 'local', createdAt: now, updatedAt: now,
    },
    {
      id: generateUUID(), title: 'Client Review', description: 'Present Q3 proposal',
      category: 'work', color: CATEGORY_COLORS.work,
      startDate: d(1), startTime: '11:00', endDate: d(1), endTime: '12:00',
      location: 'Conference Room A', allDay: false, source: 'local', createdAt: now, updatedAt: now,
    },
    {
      id: generateUUID(), title: 'Read: Atomic Habits', description: 'Chapter 5–7',
      category: 'personal', color: CATEGORY_COLORS.personal,
      startDate: d(1), startTime: '20:00', endDate: d(1), endTime: '21:00',
      location: '', allDay: false, source: 'local', createdAt: now, updatedAt: now,
    },
    {
      id: generateUUID(), title: 'Sprint Planning', description: 'Plan next two-week sprint',
      category: 'work', color: CATEGORY_COLORS.work,
      startDate: d(2), startTime: '09:00', endDate: d(2), endTime: '10:30',
      location: 'Conference Room B', allDay: false, source: 'local', createdAt: now, updatedAt: now,
    },
    {
      id: generateUUID(), title: 'Online Course: React Advanced', description: '',
      category: 'study', color: CATEGORY_COLORS.study,
      startDate: d(2), startTime: '14:00', endDate: d(2), endTime: '16:00',
      location: '', allDay: false, source: 'local', createdAt: now, updatedAt: now,
    },
    {
      id: generateUUID(), title: "Doctor's Appointment", description: 'Annual checkup',
      category: 'health', color: CATEGORY_COLORS.health,
      startDate: d(3), startTime: '10:30', endDate: d(3), endTime: '11:30',
      location: 'City Medical Center', allDay: false, source: 'local', createdAt: now, updatedAt: now,
    },
    {
      id: generateUUID(), title: 'Weekend Trip', description: 'Mountain hiking',
      category: 'personal', color: CATEGORY_COLORS.personal,
      startDate: d(5), startTime: '', endDate: d(6), endTime: '',
      location: 'Blue Ridge Mountains', allDay: true, source: 'local', createdAt: now, updatedAt: now,
    },
  ];
}

export function useCalendarEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const isDemo = !user || user.isDemo;

  const storageKey = isDemo ? CAL_KEY : `${CAL_KEY}_${user?.id}`;

  useEffect(() => {
    setLoading(true);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try { setEvents(JSON.parse(saved)); } catch { setEvents([]); }
    } else if (isDemo) {
      const seed = buildSeedEvents();
      setEvents(seed);
      localStorage.setItem(storageKey, JSON.stringify(seed));
    } else {
      setEvents([]);
    }
    setLoading(false);
  }, [storageKey, isDemo]);

  const persist = (updated: CalendarEvent[]) => {
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const createEvent = (data: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): CalendarEvent => {
    const now = new Date().toISOString();
    const ev: CalendarEvent = { ...data, id: generateUUID(), source: 'local', createdAt: now, updatedAt: now };
    const updated = [...events, ev];
    setEvents(updated);
    persist(updated);
    return ev;
  };

  const updateEvent = (id: string, patch: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>): void => {
    const updated = events.map(e =>
      e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e
    );
    setEvents(updated);
    persist(updated);
  };

  const deleteEvent = (id: string): void => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    persist(updated);
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
      const storageKey = user && !user.isDemo ? `priorify_daily_plans_${user.id}` : 'priorify_daily_plans';
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setPlans(JSON.parse(stored));
      } else {
        setPlans([]);
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
