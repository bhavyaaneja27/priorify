import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Brain, Eye, EyeOff, Mail, Lock, ArrowRight, Chrome } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message || 'Invalid credentials');
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#5b8def]/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#4ecdc4]/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#5b8def] to-[#4ecdc4] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#5b8def]/20">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-sm text-[#8a8aa3]">Sign in to continue your study journey</p>
        </div>

        <div className="glass-card rounded-3xl p-8">
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border border-[#2d2d42] bg-[#12121a] text-white font-medium text-sm hover:bg-[#1e1e2e] transition-all duration-200 mb-6"
          >
            <Chrome className="w-5 h-5 text-[#5b8def]" />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#2d2d42]" />
            <span className="text-xs text-[#5a5a7a] uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-[#2d2d42]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#d0d0e0] mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a7a]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#12121a] border border-[#2d2d42] text-white text-sm focus:border-[#5b8def] focus:ring-1 focus:ring-[#5b8def]/30 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#d0d0e0] mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a7a]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-[#12121a] border border-[#2d2d42] text-white text-sm focus:border-[#5b8def] focus:ring-1 focus:ring-[#5b8def]/30 outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5a5a7a] hover:text-[#8a8aa3]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#2d2d42] bg-[#12121a] text-[#5b8def] focus:ring-[#5b8def]/30"
                />
                <span className="text-sm text-[#8a8aa3]">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-[#5b8def] hover:text-[#4ecdc4] transition-colors">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 text-sm text-[#ff6b6b]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-[#5b8def] to-[#4ecdc4] text-white font-semibold text-sm hover:shadow-lg hover:shadow-[#5b8def]/25 transition-all duration-300 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#8a8aa3] mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#5b8def] hover:text-[#4ecdc4] transition-colors font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
