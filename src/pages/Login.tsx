import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Brain, Eye, EyeOff, Mail, Lock, ArrowRight, Chrome, Sparkles } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle, signInAsDemo } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message || 'Invalid credentials. Try Demo Login below.');
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError('');
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
  };

  const handleDemo = () => {
    signInAsDemo();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-accent-blue/5 rounded-full blur-[80px]" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-teal/5 rounded-full blur-[90px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-6 h-6 text-accent-blue" />
          </div>
          <h1 className="text-2xl font-bold text-dark-100 mb-1 tracking-tight">Welcome back</h1>
          <p className="text-sm text-dark-300">Sign in to continue your study journey</p>
        </div>

        <div className="glass-card p-8 space-y-4">
          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-dark-600 bg-dark-900 text-dark-100 font-medium text-sm hover:bg-dark-800 transition-all duration-200 shadow-sm"
          >
            <Chrome className="w-4 h-4 text-accent-blue" />
            Continue with Google
          </button>

          {/* Demo login */}
          <button
            onClick={handleDemo}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-accent-teal/20 bg-accent-teal/10 text-accent-teal font-medium text-sm hover:bg-accent-teal/20 transition-all duration-200 shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Continue as Guest (Demo)
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-dark-600" />
            <span className="text-[10px] text-dark-400 uppercase tracking-wider font-semibold">or sign in</span>
            <div className="flex-1 h-px bg-dark-600" />
          </div>

          {/* Email / password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-dark-200 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-dark-900 border border-dark-600 text-dark-100 text-sm focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark-200 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-12 py-2.5 rounded-xl bg-dark-900 border border-dark-600 text-dark-100 text-sm focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30 outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-xs text-accent-blue hover:underline transition-colors">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="px-4 py-2.5 rounded-xl bg-accent-coral/10 border border-accent-coral/20 text-xs text-accent-coral">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent-blue text-white font-semibold text-sm hover:bg-accent-blue/90 transition-all duration-200 disabled:opacity-60 shadow-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-dark-300">
            Don't have an account?{' '}
            <Link to="/signup" className="text-accent-blue hover:underline transition-colors font-medium">
              Sign up
            </Link>
          </p>
        </div>

        <p className="text-center text-[10px] text-dark-400 mt-6">
          Demo mode uses sample data. No account required.
        </p>
      </div>
    </div>
  );
}
