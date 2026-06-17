import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Sun, Coffee, Wind, Heart, Brain, Clock, Check, ArrowRight } from 'lucide-react';
import { moodOptions } from '../data/dummyData';

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

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`glass-card rounded-2xl p-5 ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function MoodCheckIn() {
  const [selectedMood, setSelectedMood] = useState('okay');
  const [submitted, setSubmitted] = useState(false);
  const mood = moodOptions.find(m => m.value === selectedMood);
  const adjustment = moodStudyAdjustments[selectedMood];

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mood Check-In</h1>
        <p className="text-sm text-[#8a8aa3] mt-1">How you feel changes how you should study</p>
      </div>

      {/* Mood Selector */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[#5b8def]/10 flex items-center justify-center">
            <Smile className="w-4 h-4 text-[#5b8def]" />
          </div>
          <h3 className="text-sm font-semibold text-[#d0d0e0]">How are you feeling today?</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {moodOptions.map((m) => (
            <button
              key={m.value}
              onClick={() => setSelectedMood(m.value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 ${
                selectedMood === m.value
                  ? 'bg-[#1e1e2e] border-2 scale-105'
                  : 'bg-[#12121a] border border-[#2d2d42] hover:border-[#3a3a55]'
              }`}
              style={selectedMood === m.value ? { borderColor: m.color } : {}}
            >
              <span className="text-3xl">{m.emoji}</span>
              <span className="text-sm font-medium text-[#d0d0e0]">{m.label}</span>
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
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-[#8a8aa3]">
            {mood?.desc}
          </p>
          <button
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5b8def] to-[#4ecdc4] text-white font-medium text-sm hover:shadow-lg transition-all"
          >
            {submitted ? (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                Save Mood
              </>
            )}
          </button>
        </div>
      </Card>

      {/* AI Adjusted Plan */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedMood}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Adjusted Plan Header */}
          <Card className="border-l-4" style={{ borderLeftColor: mood?.color }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: (mood?.color || '#5b8def') + '20' }}>
                <Brain className="w-5 h-5" style={{ color: mood?.color }} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">{adjustment.title}</h3>
                <p className="text-xs text-[#8a8aa3]">{adjustment.desc}</p>
              </div>
            </div>
          </Card>

          {/* Adjusted Schedule */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#4ecdc4]/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-[#4ecdc4]" />
              </div>
              <h3 className="text-sm font-semibold text-[#d0d0e0]">AI-Adjusted Study Plan</h3>
            </div>
            <div className="space-y-3">
              {adjustment.plan.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-4 p-3 rounded-xl ${
                    item.intensity === 'Rest'
                      ? 'bg-[#9b59b6]/5 border border-[#9b59b6]/20'
                      : 'bg-[#12121a]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: item.intensity === 'High' ? '#ff6b6b20' :
                        item.intensity === 'Medium' ? '#f4a26120' :
                        item.intensity === 'Low' ? '#5b8def20' : '#9b59b620'
                    }}
                  >
                    {item.intensity === 'Rest' ? <Coffee className="w-5 h-5 text-[#9b59b6]" /> :
                     item.intensity === 'High' ? <Sun className="w-5 h-5 text-[#ff6b6b]" /> :
                     item.intensity === 'Medium' ? <Wind className="w-5 h-5 text-[#f4a261]" /> :
                     <Heart className="w-5 h-5 text-[#5b8def]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{item.subject}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                        item.intensity === 'High' ? 'bg-[#ff6b6b]/10 text-[#ff6b6b]' :
                        item.intensity === 'Medium' ? 'bg-[#f4a261]/10 text-[#f4a261]' :
                        item.intensity === 'Low' ? 'bg-[#5b8def]/10 text-[#5b8def]' :
                        'bg-[#9b59b6]/10 text-[#9b59b6]'
                      }`}>{item.intensity}</span>
                    </div>
                    <p className="text-xs text-[#8a8aa3] truncate">{item.topic}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#5a5a7a] flex-shrink-0">
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
              <div className="w-8 h-8 rounded-lg bg-[#2ecc71]/10 flex items-center justify-center">
                <Heart className="w-4 h-4 text-[#2ecc71]" />
              </div>
              <h3 className="text-sm font-semibold text-[#d0d0e0]">Personalized Tips</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {adjustment.tips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[#12121a]">
                  <div className="w-6 h-6 rounded-full bg-[#5b8def]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-[#5b8def]" />
                  </div>
                  <p className="text-sm text-[#d0d0e0]">{tip}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
