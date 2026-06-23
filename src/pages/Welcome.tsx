import { Link } from 'react-router-dom';
import { Zap, ArrowRight, Sparkles, Target, BarChart3 } from 'lucide-react';

export default function Welcome() {
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent-blue/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-teal/5 rounded-full blur-[90px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-purple/3 rounded-full blur-[100px]" />
      </div>

      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-accent-blue/20 animate-float"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${5 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center animate-float">
            <Zap className="w-8 h-8 text-accent-blue" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-dark-100 mb-3 tracking-tight">
          Prior<span className="text-accent-blue">ify</span>
        </h1>
        <p className="text-base md:text-lg text-dark-300 mb-3">
          Your AI-powered productivity companion
        </p>
        <p className="text-xs md:text-sm text-dark-400 mb-10 max-w-md mx-auto leading-relaxed">
          Prioritize tasks, plan your day, avoid missed deadlines, and stay productive — whether you&apos;re a student, professional, or founder.
        </p>

        <div className="flex flex-wrap justify-center gap-2.5 mb-10">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-dark-900 border border-dark-600 text-xs text-dark-300">
            <Sparkles className="w-3.5 h-3.5 text-accent-blue" />
            AI Action Plans
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-dark-900 border border-dark-600 text-xs text-dark-300">
            <Target className="w-3.5 h-3.5 text-accent-teal" />
            Focus Sessions
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-dark-900 border border-dark-600 text-xs text-dark-300">
            <BarChart3 className="w-3.5 h-3.5 text-accent-amber" />
            Smart Insights
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent-blue text-white font-semibold text-base hover:bg-accent-blue/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-dark-900 border border-dark-600 text-dark-100 font-semibold text-base hover:bg-dark-800 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm"
          >
            Sign In
          </Link>
        </div>

        <p className="mt-8 text-[11px] text-dark-400">
          Built for students, professionals, freelancers, and founders
        </p>
      </div>
    </div>
  );
}
