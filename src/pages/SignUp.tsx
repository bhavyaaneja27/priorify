import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Zap, Eye, EyeOff, Mail, Lock, User, ArrowRight, Chrome, Check } from 'lucide-react';
import { validateEmail, validatePassword, validateName } from '../lib/validation';


export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation before hitting Supabase
    const nameResult = validateName(name);
    if (!nameResult.valid) { setError(nameResult.error!); return; }
    const emailResult = validateEmail(email);
    if (!emailResult.valid) { setError(emailResult.error!); return; }
    const pwResult = validatePassword(password);
    if (!pwResult.valid) { setError(pwResult.error!); return; }

    setLoading(true);
    const { error } = await signUp(email, password, name);
    if (error) {
      setError(error.message || 'Failed to create account');
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };


  const handleGoogle = async () => {
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2ecc71] to-[#4ecdc4] flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Account created!</h1>
          <p className="text-sm text-[#8a8aa3] mb-6">
            Your account has been created successfully. You can now sign in.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#5b8def] to-[#4ecdc4] text-white font-semibold hover:shadow-lg transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-accent-blue/5 rounded-full blur-[80px]" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-teal/5 rounded-full blur-[90px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-accent-blue" />
          </div>
          <h1 className="text-2xl font-bold text-dark-100 mb-1 tracking-tight">Create account</h1>
          <p className="text-sm text-dark-300">Start prioritizing what matters most</p>
        </div>

        <div className="glass-card p-8">
          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-dark-600 bg-dark-900 text-dark-100 font-medium text-sm hover:bg-dark-800 transition-all duration-200 mb-6 shadow-sm"
          >
            <Chrome className="w-4 h-4 text-accent-blue" />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-dark-600" />
            <span className="text-[10px] text-dark-400 uppercase tracking-wider font-semibold">or</span>
            <div className="flex-1 h-px bg-dark-600" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-dark-200 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Johnson"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-dark-900 border border-dark-600 text-dark-100 text-sm focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark-200 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
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
                  placeholder="Min 8 characters"
                  className="w-full pl-11 pr-12 py-2.5 rounded-xl bg-dark-900 border border-dark-600 text-dark-100 text-sm focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30 outline-none transition-all"
                  required
                  minLength={8}
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
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-dark-300 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-blue hover:underline transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
