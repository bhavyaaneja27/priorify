export const weeklyHeatmap = [
  { day: 'Mon', hours: 5.5 },
  { day: 'Tue', hours: 7.2 },
  { day: 'Wed', hours: 4.8 },
  { day: 'Thu', hours: 6.5 },
  { day: 'Fri', hours: 8.0 },
  { day: 'Sat', hours: 3.2 },
  { day: 'Sun', hours: 2.0 },
];

export const stressData = [
  { day: 'Mon', stress: 3.2, focus: 7.8 },
  { day: 'Tue', stress: 4.5, focus: 6.5 },
  { day: 'Wed', stress: 2.8, focus: 8.2 },
  { day: 'Thu', stress: 5.0, focus: 6.0 },
  { day: 'Fri', stress: 3.5, focus: 7.5 },
  { day: 'Sat', stress: 1.5, focus: 9.0 },
  { day: 'Sun', stress: 2.0, focus: 8.5 },
];

export const calendarSlots = [
  { day: 'Monday', slots: [
    { time: '09:00', subject: 'Team Standup', room: 'Zoom', color: '#5b8def' },
    { time: '11:00', subject: 'Client Review', room: 'Conference A', color: '#4ecdc4' },
    { time: '14:00', subject: 'Project Planning', room: 'Office', color: '#ff6b6b' },
  ]},
  { day: 'Tuesday', slots: [
    { time: '09:00', subject: 'Deep Work Block', room: 'Home', color: '#f4a261' },
    { time: '11:00', subject: '1:1 Meeting', room: 'Zoom', color: '#2ecc71' },
    { time: '15:00', subject: 'Content Draft', room: 'Café', color: '#e84393' },
  ]},
  { day: 'Wednesday', slots: [
    { time: '09:00', subject: 'Sprint Planning', room: 'Conference B', color: '#5b8def' },
    { time: '14:00', subject: 'Focus Session', room: 'Home', color: '#4ecdc4' },
  ]},
  { day: 'Thursday', slots: [
    { time: '09:00', subject: 'Proposal Deadline', room: 'Office', color: '#ff6b6b' },
    { time: '11:00', subject: 'Team Sync', room: 'Zoom', color: '#f4a261' },
    { time: '14:00', subject: 'Portfolio Update', room: 'Home', color: '#e84393' },
  ]},
  { day: 'Friday', slots: [
    { time: '09:00', subject: 'Weekly Review', room: 'Office', color: '#2ecc71' },
    { time: '11:00', subject: 'Inbox Zero', room: 'Home', color: '#5b8def' },
    { time: '14:00', subject: 'Side Project', room: 'Home', color: '#9b59b6' },
  ]},
  { day: 'Saturday', slots: [
    { time: '10:00', subject: 'Personal Goals', room: 'Home', color: '#f4a261' },
  ]},
];

/** @deprecated Use calendarSlots — kept for persistence hook compatibility */
export const timetableSlots = calendarSlots;

export const aiPlans = [
  {
    id: '11111111-1111-4111-a111-111111111111',
    subject: 'Product Launch',
    topic: 'Marketing Campaign',
    difficulty: 'Hard',
    examDate: '2026-03-15',
    daysLeft: 87,
    schedule: [
      { day: 'Day 1', topics: ['Audience research', 'Messaging framework'], hours: 3, completed: true },
      { day: 'Day 2', topics: ['Content calendar', 'Channel strategy'], hours: 3, completed: true },
      { day: 'Day 3', topics: ['Launch assets', 'Email sequence'], hours: 4, completed: false },
      { day: 'Day 4', topics: ['Social rollout', 'Analytics setup'], hours: 3, completed: false },
      { day: 'Day 5', topics: ['Final review', 'Go-live checklist'], hours: 4, completed: false },
    ]
  },
  {
    id: '22222222-2222-4222-b222-222222222222',
    subject: 'Job Search',
    topic: 'Interview Preparation',
    difficulty: 'Medium',
    examDate: '2026-03-20',
    daysLeft: 92,
    schedule: [
      { day: 'Day 1', topics: ['Resume polish', 'Target companies list'], hours: 2, completed: true },
      { day: 'Day 2', topics: ['Behavioral questions', 'STAR stories'], hours: 3, completed: false },
      { day: 'Day 3', topics: ['Technical prep', 'Mock interview'], hours: 3, completed: false },
    ]
  },
];

export const energyOptions = [
  { value: 'exhausted', label: 'Exhausted', emoji: '😴', color: '#9b59b6', desc: 'Running on empty. Keep it light today.' },
  { value: 'low', label: 'Low', emoji: '😐', color: '#f4a261', desc: 'Low energy. Small wins and short blocks.' },
  { value: 'okay', label: 'Okay', emoji: '🙂', color: '#5b8def', desc: 'Steady pace. Balance deep work with admin.' },
  { value: 'good', label: 'Good', emoji: '😄', color: '#2ecc71', desc: 'Solid energy. Tackle important deadlines.' },
  { value: 'peak', label: 'Peak', emoji: '🔥', color: '#ff6b6b', desc: 'Peak performance. Go after your biggest goals.' },
];

/** @deprecated Use energyOptions */
export const moodOptions = energyOptions;

export const pomodoroHistory = [
  { date: '2026-06-10', sessions: 8, totalMinutes: 200, focusScore: 85 },
  { date: '2026-06-11', sessions: 6, totalMinutes: 150, focusScore: 78 },
  { date: '2026-06-12', sessions: 10, totalMinutes: 250, focusScore: 92 },
  { date: '2026-06-13', sessions: 4, totalMinutes: 100, focusScore: 65 },
  { date: '2026-06-14', sessions: 7, totalMinutes: 175, focusScore: 80 },
  { date: '2026-06-15', sessions: 9, totalMinutes: 225, focusScore: 88 },
  { date: '2026-06-16', sessions: 5, totalMinutes: 125, focusScore: 72 },
];

const getInitialProfile = () => {
  const defaultProfile = {
    name: 'Alex Johnson',
    email: 'alex@example.com',
    avatar: 'AJ',
    branch: 'Product Design',
    year: 'Professional',
    university: 'Freelancer',
    totalXP: 1280,
    level: 12,
    streak: 7,
    totalHours: 342,
  };
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('user_profile');
    if (saved) {
      try {
        return { ...defaultProfile, ...JSON.parse(saved) };
      } catch {}
    }
  }
  return defaultProfile;
};

export const userProfile = getInitialProfile();
