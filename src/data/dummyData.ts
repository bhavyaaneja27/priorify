export const subjects = [
  { id: '1', name: 'Data Structures', code: 'CS201', color: '#5b8def', progress: 78, totalHours: 120, completedHours: 94 },
  { id: '2', name: 'Operating Systems', code: 'CS203', color: '#4ecdc4', progress: 65, totalHours: 100, completedHours: 65 },
  { id: '3', name: 'Digital Logic', code: 'CS205', color: '#ff6b6b', progress: 92, totalHours: 80, completedHours: 74 },
  { id: '4', name: 'Discrete Math', code: 'MA201', color: '#f4a261', progress: 45, totalHours: 90, completedHours: 41 },
  { id: '5', name: 'Computer Networks', code: 'CS207', color: '#2ecc71', progress: 30, totalHours: 110, completedHours: 33 },
  { id: '6', name: 'Database Systems', code: 'CS209', color: '#e84393', progress: 55, totalHours: 95, completedHours: 52 },
];

export const attendance = [
  { id: '1', subject: 'Data Structures', total: 45, present: 40, color: '#5b8def' },
  { id: '2', subject: 'Operating Systems', total: 40, present: 32, color: '#4ecdc4' },
  { id: '3', subject: 'Digital Logic', total: 38, present: 36, color: '#ff6b6b' },
  { id: '4', subject: 'Discrete Math', total: 42, present: 28, color: '#f4a261' },
  { id: '5', subject: 'Computer Networks', total: 35, present: 30, color: '#2ecc71' },
  { id: '6', subject: 'Database Systems', total: 44, present: 38, color: '#e84393' },
];

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

export const upcomingClasses = [
  { id: '1', subject: 'Data Structures', time: '09:00 AM', room: 'LT-101', duration: 90, color: '#5b8def' },
  { id: '2', subject: 'Operating Systems', time: '11:00 AM', room: 'LT-203', duration: 90, color: '#4ecdc4' },
  { id: '3', subject: 'Digital Logic Lab', time: '02:00 PM', room: 'Lab-4', duration: 120, color: '#ff6b6b' },
  { id: '4', subject: 'Computer Networks', time: '04:30 PM', room: 'LT-105', duration: 90, color: '#2ecc71' },
];

export const achievements = [
  { id: '1', name: 'Study Streak', description: '7 days in a row', icon: 'flame', unlocked: true, xp: 100 },
  { id: '2', name: 'Deep Focus', description: '5 hours without break', icon: 'target', unlocked: true, xp: 150 },
  { id: '3', name: 'Early Bird', description: 'Study before 7 AM', icon: 'sun', unlocked: false, xp: 75 },
  { id: '4', name: 'Perfect Attendance', description: '100% for a week', icon: 'check', unlocked: false, xp: 200 },
  { id: '5', name: 'AI Planner', description: 'Created first plan', icon: 'sparkles', unlocked: true, xp: 50 },
  { id: '6', name: 'Master', description: '1000 XP earned', icon: 'crown', unlocked: false, xp: 500 },
];

export const timetableSlots = [
  { day: 'Monday', slots: [
    { time: '09:00', subject: 'Data Structures', room: 'LT-101', color: '#5b8def' },
    { time: '11:00', subject: 'Operating Systems', room: 'LT-203', color: '#4ecdc4' },
    { time: '14:00', subject: 'Digital Logic', room: 'LT-105', color: '#ff6b6b' },
  ]},
  { day: 'Tuesday', slots: [
    { time: '09:00', subject: 'Discrete Math', room: 'LT-102', color: '#f4a261' },
    { time: '11:00', subject: 'Computer Networks', room: 'LT-204', color: '#2ecc71' },
    { time: '15:00', subject: 'Database Systems', room: 'LT-106', color: '#e84393' },
  ]},
  { day: 'Wednesday', slots: [
    { time: '09:00', subject: 'Data Structures Lab', room: 'Lab-1', color: '#5b8def' },
    { time: '14:00', subject: 'Operating Systems', room: 'LT-203', color: '#4ecdc4' },
  ]},
  { day: 'Thursday', slots: [
    { time: '09:00', subject: 'Digital Logic', room: 'LT-105', color: '#ff6b6b' },
    { time: '11:00', subject: 'Discrete Math', room: 'LT-102', color: '#f4a261' },
    { time: '14:00', subject: 'Database Systems', room: 'LT-106', color: '#e84393' },
  ]},
  { day: 'Friday', slots: [
    { time: '09:00', subject: 'Computer Networks', room: 'LT-204', color: '#2ecc71' },
    { time: '11:00', subject: 'Data Structures', room: 'LT-101', color: '#5b8def' },
    { time: '14:00', subject: 'Project Work', room: 'Lab-5', color: '#9b59b6' },
  ]},
  { day: 'Saturday', slots: [
    { time: '10:00', subject: 'Discrete Math', room: 'LT-102', color: '#f4a261' },
    { time: '12:00', subject: 'Database Systems', room: 'LT-106', color: '#e84393' },
  ]},
];

export const aiPlans = [
  {
    id: '1',
    subject: 'Data Structures',
    topic: 'Binary Trees & BST',
    difficulty: 'Hard',
    examDate: '2026-03-15',
    daysLeft: 87,
    schedule: [
      { day: 'Day 1', topics: ['Tree terminology', 'Binary tree properties'], hours: 3, completed: true },
      { day: 'Day 2', topics: ['Tree traversals', 'In-order, pre-order, post-order'], hours: 3, completed: true },
      { day: 'Day 3', topics: ['BST insertion', 'BST deletion'], hours: 4, completed: false },
      { day: 'Day 4', topics: ['BST search', 'AVL trees intro'], hours: 3, completed: false },
      { day: 'Day 5', topics: ['AVL rotations', 'Balancing factor'], hours: 4, completed: false },
    ]
  },
  {
    id: '2',
    subject: 'Operating Systems',
    topic: 'Process Scheduling',
    difficulty: 'Medium',
    examDate: '2026-03-20',
    daysLeft: 92,
    schedule: [
      { day: 'Day 1', topics: ['Process concepts', 'PCB structure'], hours: 2, completed: true },
      { day: 'Day 2', topics: ['FCFS scheduling', 'SJF scheduling'], hours: 3, completed: false },
      { day: 'Day 3', topics: ['Round Robin', 'Priority scheduling'], hours: 3, completed: false },
    ]
  },
];

export const moodOptions = [
  { value: 'great', label: 'Great', emoji: '😊', color: '#2ecc71', desc: 'Feeling amazing! Full speed ahead.' },
  { value: 'okay', label: 'Okay', emoji: '🙂', color: '#5b8def', desc: 'Decent energy. Steady pace recommended.' },
  { value: 'tired', label: 'Tired', emoji: '😴', color: '#f4a261', desc: 'Low energy. Take short breaks and hydrate.' },
  { value: 'stressed', label: 'Stressed', emoji: '😓', color: '#ff6b6b', desc: 'High stress. Try deep breathing exercises.' },
  { value: 'overwhelmed', label: 'Overwhelmed', emoji: '😭', color: '#e84393', desc: 'Overwhelmed. Reduce tasks, focus on one thing.' },
];

export const pomodoroHistory = [
  { date: '2026-06-10', sessions: 8, totalMinutes: 200, focusScore: 85 },
  { date: '2026-06-11', sessions: 6, totalMinutes: 150, focusScore: 78 },
  { date: '2026-06-12', sessions: 10, totalMinutes: 250, focusScore: 92 },
  { date: '2026-06-13', sessions: 4, totalMinutes: 100, focusScore: 65 },
  { date: '2026-06-14', sessions: 7, totalMinutes: 175, focusScore: 80 },
  { date: '2026-06-15', sessions: 9, totalMinutes: 225, focusScore: 88 },
  { date: '2026-06-16', sessions: 5, totalMinutes: 125, focusScore: 72 },
];

export const userProfile = {
  name: 'Alex Johnson',
  email: 'alex.johnson@university.edu',
  avatar: 'AJ',
  branch: 'Computer Science',
  year: '3rd Year',
  university: 'MIT Engineering',
  totalXP: 1280,
  level: 12,
  streak: 7,
  totalHours: 342,
};

export const todayAIPlan = {
  greeting: 'Good morning, Alex!',
  mood: 'focused',
  plan: [
    { time: '09:00', subject: 'Data Structures', topic: 'Binary Search Trees', priority: 'high', duration: 90 },
    { time: '11:00', subject: 'Operating Systems', topic: 'Process Scheduling', priority: 'medium', duration: 60 },
    { time: '14:00', subject: 'Digital Logic', topic: 'K-Map Simplification', priority: 'high', duration: 120 },
    { time: '16:30', subject: 'Computer Networks', topic: 'OSI Model Review', priority: 'low', duration: 45 },
  ],
  totalDuration: 315,
  breaks: 3,
};
