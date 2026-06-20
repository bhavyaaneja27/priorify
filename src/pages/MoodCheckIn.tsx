import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Sun, Coffee, Wind, Heart, Brain, Clock, Check, ArrowRight } from 'lucide-react';
import { moodOptions } from '../data/dummyData';
import { useAuth } from '../contexts/AuthContext';

const moodStudyAdjustments: Record<string, {
  title: string;
  desc: string;
  plan: { time: string; subject: string; topic: string; duration: number; intensity: string }[];
  tips: string[];
}> = {
  great: {
    title: "Full Speed Ahead",
    desc: "You're in top form. Tackle your hardest subjects and longest sessions today.",
    plan: [
      { time: "09:00", subject: "Data Structures", topic: "Advanced BST Operations", duration: 120, intensity: "High" },
      { time: "11:30", subject: "Operating Systems", topic: "Deadlock Prevention", duration: 90, intensity: "High" },
      { time: "14:00", subject: "Computer Networks", topic: "TCP/IP Protocol Stack", duration: 90, intensity: "Medium" },
      { time: "16:00", subject: "Digital Logic", topic: "Sequential Circuit Design", duration: 60, intensity: "Medium" },
    ],
    tips: [
      "Take on your most challenging topics today",
      "Aim for 2+ hour focused sessions",
      "Great day to start something new",
      "Reward yourself with a fun project after studying"
    ]
  },
  okay: {
    title: "Steady Pace",
    desc: "Decent energy. Balance challenging work with lighter review sessions.",
    plan: [
      { time: "09:00", subject: "Data Structures", topic: "Tree Review", duration: 90, intensity: "Medium" },
      { time: "11:00", subject: "Discrete Math", topic: "Graph Theory Basics", duration: 60, intensity: "Medium" },
      { time: "14:00", subject: "Database Systems", topic: "SQL Practice", duration: 90, intensity: "Low" },
      { time: "16:00", subject: "Computer Networks", topic: "OSI Model Review", duration: 45, intensity: "Low" },
    ],
    tips: [
      "Mix medium and low intensity sessions",
      "Take a 15-minute walk between subjects",
      "Focus on understanding rather than speed",
      "End early if you feel energy dropping"
    ]
  },
  tired: {
    title: "Gentle & Restorative",
    desc: "Low energy detected. Prioritize light review, rest, and self-care.",
    plan: [
      { time: "10:00", subject: "Data Structures", topic: "Flashcard Review", duration: 45, intensity: "Low" },
      { time: "11:00", subject: "Digital Logic", topic: "Video Lecture", duration: 60, intensity: "Low" },
      { time: "14:00", subject: "Any Subject", topic: "Light Reading", duration: 30, intensity: "Low" },
      { time: "15:00", subject: "Rest", topic: "Power Nap / Walk", duration: 30, intensity: "Rest" },
    ],
    tips: [
      "Watch video lectures instead of reading",
      "Use flashcards for quick review",
      "Take a 20-minute power nap",
      "Hydrate and have a healthy snack",
      "Consider rescheduling hard topics"
    ]
  },
  stressed: {
    title: "Decompress & Refocus",
    desc: "High stress detected. Reduce workload and incorporate breathing exercises.",
    plan: [
      { time: "09:00", subject: "Wellness", topic: "10-min Breathing Exercise", duration: 10, intensity: "Rest" },
      { time: "09:30", subject: "Data Structures", topic: "Easy Practice Problems", duration: 45, intensity: "Low" },
      { time: "11:00", subject: "Rest", topic: "Walk / Stretch", duration: 30, intensity: "Rest" },
      { time: "14:00", subject: "Any Subject", topic: "Review Notes", duration: 30, intensity: "Low" },
      { time: "15:00", subject: "Wellness", topic: "Meditation", duration: 15, intensity: "Rest" },
    ],
    tips: [
      "Do 4-7-8 breathing exercises before studying",
      "Focus on review, not new material",
      "Take longer breaks between sessions",
      "Talk to a friend or mentor",
      "Lower your expectations for today"
    ]
  },
  overwhelmed: {
    title: "Simplify & Breathe",
    desc: "You're overwhelmed. Do ONE thing, then rest. That's enough for today.",
    plan: [
      { time: "10:00", subject: "Pick ONE", topic: "Single 30-min Review", duration: 30, intensity: "Low" },
      { time: "11:00", subject: "Rest", topic: "Break / Self-care", duration: 60, intensity: "Rest" },
      { time: "14:00", subject: "Optional", topic: "Light review if energy returns", duration: 15, intensity: "Low" },
    ],
    tips: [
      "Do just ONE thing today. That's a win.",
      "Break tasks into the smallest possible pieces",
      "Write down what's overwhelming you",
      "Talk to someone about your feelings",
      "Remember: one bad day doesn't define you"
    ]
  },
};

function Card({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`glass-card rounded-2xl p-5 ${className}`}
      style={style}
    >
      {children}
    </motion.div>
  );
}

import { useMood, useSubjects, useTimetable, useAttendance, useAIPlans } from '../hooks/usePersistence';

function generateRecommendations(
  moodValue: string,
  subjectsList: any[],
  plans: any[],
  schedule: any[],
  attendanceList: any[]
) {
  // Extract user's unique subjects
  const subjectsMap = new Map<string, { progress: number }>();

  // 1. Subjects list
  subjectsList.forEach(s => {
    if (s.name) {
      subjectsMap.set(s.name, { progress: s.progress ?? 0 });
    }
  });

  // 2. Attendance data
  attendanceList.forEach(a => {
    if (a.subject && !subjectsMap.has(a.subject)) {
      const rate = a.total > 0 ? (a.present / a.total) * 100 : 100;
      subjectsMap.set(a.subject, { progress: rate });
    }
  });

  // 3. AI Planner plans
  plans.forEach(p => {
    if (p.subject && !subjectsMap.has(p.subject)) {
      subjectsMap.set(p.subject, { progress: 50 });
    }
  });

  // 4. Timetable slots
  schedule.forEach(day => {
    if (day.slots) {
      day.slots.forEach((slot: any) => {
        if (slot.subject && !subjectsMap.has(slot.subject)) {
          subjectsMap.set(slot.subject, { progress: 60 });
        }
      });
    }
  });

  // Convert to sorted list (lowest progress first)
  const sortedSubjectNames = Array.from(subjectsMap.entries())
    .map(([name, val]) => ({ name, progress: val.progress }))
    .sort((a, b) => a.progress - b.progress)
    .map(s => s.name);

  // Fallback subjects if empty
  const defaultSubjects = ['General Study', 'Skill Practice', 'Revision', 'Reading & Notes'];
  const getSubjectAt = (index: number) => {
    if (sortedSubjectNames.length > 0) {
      return sortedSubjectNames[index % sortedSubjectNames.length];
    }
    return defaultSubjects[index % defaultSubjects.length];
  };

  // Helper to find a topic for a subject name
  const getTopicForSubject = (subjectName: string) => {
    const plan = plans.find(p => p.subject.toLowerCase() === subjectName.toLowerCase());
    if (plan) {
      const activeDay = plan.schedule?.find((d: any) => !d.completed);
      if (activeDay && activeDay.topics && activeDay.topics.length > 0) {
        return activeDay.topics[0];
      }
      return plan.topic || "Core Review";
    }
    // Generic topics based on subject name or default
    if (subjectName === 'General Study') return 'Organizing notes & checklist';
    if (subjectName === 'Skill Practice') return 'Doing practice questions';
    if (subjectName === 'Revision') return 'Active recall & self-test';
    if (subjectName === 'Reading & Notes') return 'Reviewing key book chapters';
    return "Study notes review";
  };

  // Standard study schedule templates corresponding to each mood
  const templates: Record<string, {
    title: string;
    desc: string;
    planSlots: { time: string; duration: number; intensity: string; subjectOverride?: string; topicOverride?: string }[];
    tips: string[];
  }> = {
    great: {
      title: "Full Speed Ahead",
      desc: "You're in top form. Tackle your hardest subjects and longest sessions today.",
      planSlots: [
        { time: "09:00", duration: 120, intensity: "High" },
        { time: "11:30", duration: 90, intensity: "High" },
        { time: "14:00", duration: 90, intensity: "Medium" },
        { time: "16:00", duration: 60, intensity: "Medium" },
      ],
      tips: [
        "Take on your most challenging topics today",
        "Aim for 2+ hour focused sessions",
        "Great day to start something new",
        "Reward yourself with a fun project after studying"
      ]
    },
    okay: {
      title: "Steady Pace",
      desc: "Decent energy. Balance challenging work with lighter review sessions.",
      planSlots: [
        { time: "09:00", duration: 90, intensity: "Medium" },
        { time: "11:00", duration: 60, intensity: "Medium" },
        { time: "14:00", duration: 90, intensity: "Low" },
        { time: "16:00", duration: 45, intensity: "Low" },
      ],
      tips: [
        "Mix medium and low intensity sessions",
        "Take a 15-minute walk between subjects",
        "Focus on understanding rather than speed",
        "End early if you feel energy dropping"
      ]
    },
    tired: {
      title: "Gentle & Restorative",
      desc: "Low energy detected. Prioritize light review, rest, and self-care.",
      planSlots: [
        { time: "10:00", duration: 45, intensity: "Low" },
        { time: "11:00", duration: 60, intensity: "Low" },
        { time: "14:00", duration: 30, intensity: "Low" },
        { time: "15:00", duration: 30, intensity: "Rest", subjectOverride: "Rest", topicOverride: "Power Nap / Walk" },
      ],
      tips: [
        "Watch video lectures instead of reading",
        "Use flashcards for quick review",
        "Take a 20-minute power nap",
        "Hydrate and have a healthy snack",
        "Consider rescheduling hard topics"
      ]
    },
    stressed: {
      title: "Decompress & Refocus",
      desc: "High stress detected. Reduce workload and incorporate breathing exercises.",
      planSlots: [
        { time: "09:00", duration: 10, intensity: "Rest", subjectOverride: "Wellness", topicOverride: "10-min Breathing Exercise" },
        { time: "09:30", duration: 45, intensity: "Low" },
        { time: "11:00", duration: 30, intensity: "Rest", subjectOverride: "Rest", topicOverride: "Walk / Stretch" },
        { time: "14:00", duration: 30, intensity: "Low" },
        { time: "15:00", duration: 15, intensity: "Rest", subjectOverride: "Wellness", topicOverride: "Meditation" },
      ],
      tips: [
        "Do 4-7-8 breathing exercises before studying",
        "Focus on review, not new material",
        "Take longer breaks between sessions",
        "Talk to a friend or mentor",
        "Lower your expectations for today"
      ]
    },
    overwhelmed: {
      title: "Simplify & Breathe",
      desc: "You're overwhelmed. Do ONE thing, then rest. That's enough for today.",
      planSlots: [
        { time: "10:00", duration: 30, intensity: "Low" },
        { time: "11:00", duration: 60, intensity: "Rest", subjectOverride: "Rest", topicOverride: "Break / Self-care" },
        { time: "14:00", duration: 15, intensity: "Low", topicOverride: "Light review if energy returns" },
      ],
      tips: [
        "Do just ONE thing today. That's a win.",
        "Break tasks into the smallest possible pieces",
        "Write down what's overwhelming you",
        "Talk to someone about your feelings",
        "Remember: one bad day doesn't define you"
      ]
    },
  };

  const selectedTemplate = templates[moodValue] || templates['okay'];

  // Fill the template slots using the user's subjects
  let subjectIdx = 0;
  const plan = selectedTemplate.planSlots.map(slot => {
    if (slot.subjectOverride) {
      return {
        time: slot.time,
        subject: slot.subjectOverride,
        topic: slot.topicOverride || "Rest and recover",
        duration: slot.duration,
        intensity: slot.intensity
      };
    }

    const sub = getSubjectAt(subjectIdx);
    subjectIdx++; // Use next subject for next slot
    return {
      time: slot.time,
      subject: sub,
      topic: slot.topicOverride || getTopicForSubject(sub),
      duration: slot.duration,
      intensity: slot.intensity
    };
  });

  return {
    title: selectedTemplate.title,
    desc: selectedTemplate.desc,
    plan,
    tips: selectedTemplate.tips
  };
}

export default function MoodCheckIn() {
  const { user } = useAuth();
  const { selectedMood, stressLevel, focusLevel, saveMood: setSelectedMood, loading } = useMood();
  const { subjectsList, loading: loadingSubjects } = useSubjects();
  const { schedule, loading: loadingTimetable } = useTimetable();
  const { attendanceList, loading: loadingAttendance } = useAttendance();
  const { plans, loading: loadingPlans } = useAIPlans();

  const [submitted, setSubmitted] = useState(false);
  const [localStress, setLocalStress] = useState(5.0);
  const [localFocus, setLocalFocus] = useState(5.0);

  const isDemo = !user || user.isDemo;

  // Sync state with loaded values
  useEffect(() => {
    setLocalStress(stressLevel);
    setLocalFocus(focusLevel);
  }, [stressLevel, focusLevel]);

  const isLoading = loading || loadingSubjects || loadingTimetable || loadingAttendance || loadingPlans;

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-dark-400">Loading mood check-in...</p>
      </div>
    );
  }

  const mood = moodOptions.find(m => m.value === selectedMood);
  const adjustment = isDemo
    ? (moodStudyAdjustments[selectedMood || 'okay'] || moodStudyAdjustments['okay'])
    : generateRecommendations(selectedMood || 'okay', subjectsList, plans, schedule, attendanceList);

  const handleSubmit = () => {
    setSelectedMood(selectedMood, localStress, localFocus);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark-100">Mood Check-In</h1>
        <p className="text-sm text-dark-300 mt-1">How you feel changes how you should study</p>
      </div>

      {/* Mood Selector & Sliders */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center">
            <Smile className="w-4 h-4 text-accent-blue" />
          </div>
          <h3 className="text-sm font-semibold text-dark-100">How are you feeling today?</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {moodOptions.map((m) => (
            <button
              key={m.value}
              onClick={() => setSelectedMood(m.value, localStress, localFocus)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 ${selectedMood === m.value
                ? 'bg-dark-800 border-2 scale-105'
                : 'bg-dark-950 border border-dark-600 hover:border-dark-400'
                }`}
              style={selectedMood === m.value ? { borderColor: m.color } : {}}
            >
              <span className="text-3xl">{m.emoji}</span>
              <span className="text-sm font-medium text-dark-100">{m.label}</span>
              {selectedMood === m.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: m.color }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Stress & Focus Sliders */}
        <div className="mt-6 pt-6 border-t border-dark-600 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-dark-100">Stress Level</label>
              <span className="text-xs font-bold text-accent-coral">{localStress.toFixed(1)} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={localStress}
              onChange={e => setLocalStress(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-dark-950 rounded-lg appearance-none cursor-pointer accent-accent-coral"
            />
            <div className="flex justify-between text-[10px] text-dark-400 mt-1">
              <span>Calm</span>
              <span>Stressed</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-dark-100">Focus Level</label>
              <span className="text-xs font-bold text-accent-teal">{localFocus.toFixed(1)} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={localFocus}
              onChange={e => setLocalFocus(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-dark-950 rounded-lg appearance-none cursor-pointer accent-accent-teal"
            />
            <div className="flex justify-between text-[10px] text-dark-400 mt-1">
              <span>Distracted</span>
              <span>Focused</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-dark-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-dark-300">
            {mood?.desc || 'Select a mood below to begin your check-in.'}
          </p>
          <button
            onClick={handleSubmit}
            disabled={!selectedMood}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent-blue text-white font-medium text-sm transition-all hover:bg-accent-blue/90 disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitted ? (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                Save Mood Check-In
              </>
            )}
          </button>
        </div>
      </Card>

      {/* AI Adjusted Plan */}
      <AnimatePresence mode="wait">
        {!isDemo && !selectedMood ? (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="flex flex-col items-center justify-center text-center py-12 px-6 border-dashed border-2 border-dark-600 bg-dark-900/20">
              <div className="w-16 h-16 rounded-full bg-accent-blue/10 flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-accent-blue" />
              </div>
              <h3 className="text-lg font-semibold text-dark-100 mb-2">No Mood Check-in Yet</h3>
              <p className="text-sm text-dark-300 max-w-md">
                Please select how you're feeling today, adjust your stress and focus levels above, and save your check-in to record your mood.
              </p>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key={selectedMood || 'none'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Adjusted Plan Header */}
            <Card className="border-l-4" style={{ borderLeftColor: mood?.color }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse-slow" style={{ backgroundColor: (mood?.color || 'var(--accent-blue)') + '20' }}>
                  <Brain className="w-5 h-5" style={{ color: mood?.color }} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-dark-100">{adjustment.title}</h3>
                  <p className="text-xs text-dark-300">{adjustment.desc}</p>
                </div>
              </div>
            </Card>

            {/* Adjusted Schedule */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent-teal/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-accent-teal" />
                </div>
                <h3 className="text-sm font-semibold text-dark-100">AI-Adjusted Study Plan</h3>
              </div>
              <div className="space-y-3">
                {adjustment.plan.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-4 p-3 rounded-xl border ${item.intensity === 'Rest'
                      ? 'bg-accent-purple/5 border-accent-purple/20'
                      : 'bg-dark-950 border-dark-600/30'
                      }`}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: item.intensity === 'High' ? 'var(--accent-coral)20' :
                          item.intensity === 'Medium' ? 'var(--accent-amber)20' :
                            item.intensity === 'Low' ? 'var(--accent-blue)20' : 'var(--accent-purple)20'
                      }}
                    >
                      {item.intensity === 'Rest' ? <Coffee className="w-5 h-5 text-accent-purple" /> :
                        item.intensity === 'High' ? <Sun className="w-5 h-5 text-accent-coral" /> :
                          item.intensity === 'Medium' ? <Wind className="w-5 h-5 text-accent-amber" /> :
                            <Heart className="w-5 h-5 text-accent-blue" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-dark-100">{item.subject}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${item.intensity === 'High' ? 'bg-accent-coral/10 text-accent-coral' :
                          item.intensity === 'Medium' ? 'bg-accent-amber/10 text-accent-amber' :
                            item.intensity === 'Low' ? 'bg-accent-blue/10 text-accent-blue' :
                              'bg-accent-purple/10 text-accent-purple'
                          }`}>{item.intensity}</span>
                      </div>
                      <p className="text-xs text-dark-300 truncate">{item.topic}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-dark-400 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {item.duration}m
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Tips */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent-green/10 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-accent-green" />
                </div>
                <h3 className="text-sm font-semibold text-dark-100">Personalized Tips</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {adjustment.tips.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-dark-950 border border-dark-600/30">
                    <div className="w-6 h-6 rounded-full bg-accent-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5 border border-accent-blue/20">
                      <Check className="w-3 h-3 text-accent-blue" />
                    </div>
                    <p className="text-sm text-dark-200">{tip}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
