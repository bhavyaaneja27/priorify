import { Link } from 'react-router-dom';
import { Brain, ArrowRight, Sparkles, Target, BarChart3 } from 'lucide-react';

export default function Welcome() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#5b8def]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#4ecdc4]/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#9b59b6]/5 rounded-full blur-[150px]" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-[#5b8def]/30 animate-float"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${4 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#5b8def] to-[#4ecdc4] flex items-center justify-center shadow-2xl shadow-[#5b8def]/20 animate-float">
            <Brain className="w-10 h-10 text-white" />
          </div>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
          Study<span className="text-gradient">AI</span>
        </h1>
        <p className="text-lg text-[#8a8aa3] mb-4">
          The AI-powered study planner for engineering students
        </p>
        <p className="text-sm text-[#5a5a7a] mb-12 max-w-md mx-auto">
          Smart scheduling, attendance tracking, mood-based planning, and AI-generated study plans tailored to your pace.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm text-[#8a8aa3]">
            <Sparkles className="w-4 h-4 text-[#5b8def]" />
            AI Planning
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm text-[#8a8aa3]">
            <Target className="w-4 h-4 text-[#4ecdc4]" />
            Focus Timer
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm text-[#8a8aa3]">
            <BarChart3 className="w-4 h-4 text-[#f4a261]" />
            Analytics
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#5b8def] to-[#4ecdc4] text-white font-semibold text-lg shadow-lg shadow-[#5b8def]/25 hover:shadow-xl hover:shadow-[#5b8def]/30 transition-all duration-300 hover:scale-105"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl glass-card text-[#d0d0e0] font-semibold text-lg hover:bg-[#1e1e2e]/80 transition-all duration-300 hover:scale-105"
          >
            Sign In
          </Link>
        </div>

        <p className="mt-8 text-xs text-[#5a5a7a]">
          Trusted by 10,000+ engineering students worldwide
        </p>
      </div>
    </div>
  );
}
