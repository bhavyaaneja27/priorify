import { motion } from 'framer-motion';
import { ListTodo, Plus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

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

export default function Tasks() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Tasks</h1>
          <p className="text-sm text-dark-300 mt-1">Manage deadlines, priorities, and categories</p>
        </div>
        <button
          disabled
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-blue/50 text-white font-medium text-sm cursor-not-allowed opacity-70"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      <Card className="flex flex-col items-center justify-center text-center py-16 px-6 border-dashed border-2 border-dark-600">
        <div className="w-16 h-16 rounded-2xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center mb-4">
          <ListTodo className="w-8 h-8 text-accent-blue" />
        </div>
        <h3 className="text-lg font-semibold text-dark-100 mb-2">Smart task management coming in Phase 1</h3>
        <p className="text-sm text-dark-300 max-w-md mb-6">
          Create tasks with deadlines, priorities, and categories. Priorify will help you decide what to tackle first.
        </p>
        <Link
          to="/action-planner"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-blue text-white font-medium text-sm hover:bg-accent-blue/90 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          Try AI Action Planner
        </Link>
      </Card>
    </div>
  );
}
