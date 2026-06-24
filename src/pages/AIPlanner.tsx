import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Target, GraduationCap } from 'lucide-react';

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

function ComingSoonCard({ title, icon: Icon, description, valueProposition, accentColor }: { title: string, icon: any, description: string, valueProposition: string, accentColor: string }) {
  return (
    <Card className="flex flex-col items-center text-center py-16 px-6">
      <div className="w-20 h-20 rounded-2xl bg-dark-800 flex items-center justify-center border border-dark-700 mb-6 relative">
        <Icon className="w-10 h-10" style={{ color: accentColor }} />
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center animate-pulse" style={{ backgroundColor: `${accentColor}30` }}>
          <Sparkles className="w-4 h-4" style={{ color: accentColor }} />
        </div>
      </div>
      
      <span className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full mb-6 border" style={{ color: accentColor, backgroundColor: `${accentColor}10`, borderColor: `${accentColor}30` }}>
        Planned for Future Release
      </span>
      
      <h2 className="text-2xl font-bold text-dark-100 mb-3">{title}</h2>
      
      <p className="text-sm text-dark-300 max-w-lg mx-auto mb-8 leading-relaxed">
        {description}
      </p>

      <div className="bg-dark-900 border border-dark-600 rounded-xl p-5 max-w-lg w-full text-left">
        <h4 className="text-xs font-bold text-dark-200 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-dark-400" />
          Why it is valuable
        </h4>
        <p className="text-sm text-dark-400 leading-relaxed">
          {valueProposition}
        </p>
      </div>
    </Card>
  );
}

export default function AIPlanner() {
  const [mode, setMode] = useState<'study-plan' | 'goal-tasks'>('study-plan');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent-amber" /> AI Action Planner
          </h1>
          <p className="text-sm text-dark-300 mt-1">Generate actionable plans and break goals into steps</p>
        </div>
        
        <div className="flex bg-dark-950 p-1 rounded-xl border border-dark-600">
          <button onClick={() => setMode('study-plan')} className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${mode === 'study-plan' ? 'bg-accent-blue text-white shadow-md' : 'text-dark-400 hover:text-dark-200'}`}>Study Plans</button>
          <button onClick={() => setMode('goal-tasks')} className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${mode === 'goal-tasks' ? 'bg-accent-amber text-white shadow-md' : 'text-dark-400 hover:text-dark-200'}`}>Goal to Tasks</button>
        </div>
      </div>

      {mode === 'goal-tasks' && (
        <ComingSoonCard
          title="Goal-to-Tasks Breakdown"
          icon={Target}
          accentColor="#FBBF24"
          description="We are building an intelligent engine that will automatically break down your high-level goals and projects into bite-sized, actionable tasks."
          valueProposition="Stop feeling overwhelmed by big projects. Our AI will automatically define step-by-step actions and estimate time for you, making any goal achievable and easy to track."
        />
      )}

      {mode === 'study-plan' && (
        <ComingSoonCard
          title="Advanced Study & Action Plans"
          icon={GraduationCap}
          accentColor="#60A5FA"
          description="A powerful AI generation tool that builds comprehensive multi-day study schedules and project plans tailored to your specific deadlines."
          valueProposition="Never cram again. The AI will distribute your workload intelligently over the days leading up to your deadline, ensuring steady progress and better retention."
        />
      )}
    </div>
  );
}
