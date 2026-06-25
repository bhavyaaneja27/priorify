import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTour } from '../contexts/TourContext';
import {
  Sparkles,
  Brain,
  CalendarDays,
  Bell,
  Timer,
  BarChart3,
  Zap,
  Rocket,
  ArrowRight,
  ArrowLeft,
  X
} from 'lucide-react';

const tourSteps = [
  {
    title: 'Welcome to Priorify',
    description: 'Priorify helps students and professionals avoid missed deadlines through AI-powered planning, prioritization, reminders, and productivity insights.',
    icon: Sparkles,
    color: 'text-accent-blue',
    bgColor: 'bg-accent-blue/10',
    borderColor: 'border-accent-blue/20'
  },
  {
    title: 'AI Priority Engine',
    description: 'Powered by Google Gemini AI, Priorify analyzes urgency, deadlines, and workload to help users focus on what matters most.',
    icon: Brain,
    color: 'text-accent-purple',
    bgColor: 'bg-accent-purple/10',
    borderColor: 'border-accent-purple/20'
  },
  {
    title: 'Smart Calendar',
    description: 'Manage tasks, deadlines, classes, meetings, and personal commitments in one unified calendar.',
    icon: CalendarDays,
    color: 'text-accent-teal',
    bgColor: 'bg-accent-teal/10',
    borderColor: 'border-accent-teal/20'
  },
  {
    title: 'Smart Reminders',
    description: 'Never miss an important deadline with browser-based notifications and scheduled reminders.',
    icon: Bell,
    color: 'text-accent-amber',
    bgColor: 'bg-accent-amber/10',
    borderColor: 'border-accent-amber/20'
  },
  {
    title: 'Focus Sessions',
    description: 'Boost productivity with distraction-free focus sessions that help you stay consistent and complete tasks faster.',
    icon: Timer,
    color: 'text-accent-coral',
    bgColor: 'bg-accent-coral/10',
    borderColor: 'border-accent-coral/20'
  },
  {
    title: 'Productivity Insights',
    description: 'Visualize your progress, completion trends, focus patterns, and productivity habits with powerful insights.',
    icon: BarChart3,
    color: 'text-accent-green',
    bgColor: 'bg-accent-green/10',
    borderColor: 'border-accent-green/20'
  },
  {
    title: 'AI Planning & Recommendations',
    description: 'Google Gemini AI powers intelligent plans and recommendations, while Priorify\'s hybrid intelligence engine keeps insights fast and reliable.',
    icon: Zap,
    color: 'text-accent-blue',
    bgColor: 'bg-accent-blue/10',
    borderColor: 'border-accent-blue/20'
  },
  {
    title: 'Why Priorify?',
    description: 'Priorify brings AI planning, smart reminders, analytics, calendars, and focus tools together in one intelligent productivity platform.',
    icon: Brain,
    color: 'text-accent-purple',
    bgColor: 'bg-accent-purple/10',
    borderColor: 'border-accent-purple/20'
  },
  {
    title: 'Get Started',
    description: 'Create your first task, set a deadline, and let Priorify help you stay ahead of your commitments.',
    icon: Rocket,
    color: 'text-accent-amber',
    bgColor: 'bg-accent-amber/10',
    borderColor: 'border-accent-amber/20'
  }
];

export default function OnboardingTour() {
  const { closeTour } = useTour();
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      closeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const step = tourSteps[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card-strong rounded-2xl w-full max-w-lg overflow-hidden border border-dark-600 bg-dark-900 shadow-2xl relative"
      >
        <button
          onClick={closeTour}
          className="absolute top-4 right-4 text-dark-400 hover:text-dark-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 pb-6 flex flex-col items-center text-center min-h-[320px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center w-full"
            >
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border ${step.bgColor} ${step.borderColor}`}>
                <Icon className={`w-10 h-10 ${step.color}`} />
              </div>

              <h2 className="text-2xl font-bold text-dark-100 mb-4">{step.title}</h2>
              <p className="text-sm text-dark-300 leading-relaxed max-w-md">
                {step.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-8 pb-8 flex flex-col gap-6">
          <div className="flex justify-center gap-2">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentStep ? 'w-6 bg-accent-blue' : 'w-2 bg-dark-600'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between mt-2">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                currentStep === 0 
                  ? 'text-dark-500 cursor-not-allowed opacity-0' 
                  : 'text-dark-300 hover:text-dark-100 hover:bg-dark-800'
              }`}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            
            <div className="flex items-center gap-3">
              {currentStep < tourSteps.length - 1 && (
                <button
                  onClick={closeTour}
                  className="px-4 py-2 text-sm font-medium text-dark-400 hover:text-dark-200 transition-colors"
                >
                  Skip
                </button>
              )}
              
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue/90 transition-all shadow-lg shadow-accent-blue/20"
              >
                {currentStep === tourSteps.length - 1 ? 'Get Started' : 'Next'}
                {currentStep < tourSteps.length - 1 && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
