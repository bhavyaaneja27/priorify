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
