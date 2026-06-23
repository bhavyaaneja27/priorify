import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Smile, Check, ArrowRight, Sparkles } from 'lucide-react';
import { energyOptions } from '../data/dummyData';
import { useMood } from '../hooks/usePersistence';

const energyTips: Record<string, string[]> = {
  exhausted: [
    'Keep today light — one small win is enough.',
    'Batch low-effort tasks and defer heavy work.',
    'Take breaks before you feel you need them.',
  ],
  low: [
    'Start with your easiest task to build momentum.',
    'Work in 25-minute blocks with short breaks.',
    'Avoid multitasking — one thing at a time.',
  ],
  okay: [
    'Balance deep work with lighter admin tasks.',
    'Tackle your top priority before noon.',
    'Schedule a mid-day reset to stay steady.',
  ],
  good: [
    'Great day for challenging work and deadlines.',
    'Block 90 minutes for your hardest task.',
    'Batch similar tasks to stay in flow.',
  ],
  peak: [
    'You\'re at peak capacity — go after big goals.',
    'Schedule creative or strategic work now.',
    'Protect this window from meetings and distractions.',
  ],
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

export default function ProductivityCheck() {
  const { selectedMood, stressLevel, focusLevel, saveMood, loading } = useMood();
  const [localStress, setLocalStress] = useState(5.0);
  const [localFocus, setLocalFocus] = useState(5.0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setLocalStress(stressLevel);
    setLocalFocus(focusLevel);
  }, [stressLevel, focusLevel]);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-dark-400">Loading productivity check...</p>
      </div>
    );
  }

  const energy = energyOptions.find(e => e.value === selectedMood);
  const tips = energyTips[selectedMood || 'okay'] || energyTips.okay;

  const handleSubmit = () => {
    saveMood(selectedMood, localStress, localFocus);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-100">Productivity Check</h1>
        <p className="text-sm text-dark-300 mt-1">How&apos;s your energy today? We&apos;ll tailor your day around it.</p>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center">
            <Smile className="w-4 h-4 text-accent-blue" />
          </div>
          <h3 className="text-sm font-semibold text-dark-100">How&apos;s your energy?</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {energyOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => saveMood(option.value, localStress, localFocus)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 ${selectedMood === option.value
                ? 'bg-dark-800 border-2 scale-105'
                : 'bg-dark-950 border border-dark-600 hover:border-dark-400'
                }`}
              style={selectedMood === option.value ? { borderColor: option.color } : {}}
            >
              <span className="text-3xl">{option.emoji}</span>
              <span className="text-sm font-medium text-dark-100">{option.label}</span>
            </button>
          ))}
        </div>

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
              <label className="text-sm font-medium text-dark-100">Focus Capacity</label>
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
              <span>Scattered</span>
              <span>Locked in</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-dark-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-dark-300">
            {energy?.desc || 'Select your energy level to get personalized tips.'}
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
                Save Check-In
              </>
            )}
          </button>
        </div>
      </Card>

      {selectedMood && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent-purple" />
            </div>
            <h3 className="text-sm font-semibold text-dark-100">Today&apos;s Productivity Tips</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-dark-950 border border-dark-600/30">
                <div className="w-6 h-6 rounded-full bg-accent-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5 border border-accent-blue/20">
                  <Check className="w-3 h-3 text-accent-blue" />
                </div>
                <p className="text-sm text-dark-200">{tip}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
