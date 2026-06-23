import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Brain, Mail, ArrowLeft, Check, Send } from 'lucide-react';
import { validateEmail } from '../lib/validation';


export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailResult = validateEmail(email);
    if (!emailResult.valid) { setError(emailResult.error!); return; }

    setLoading(true);
    const { error } = await resetPassword(email);
    if (error) {
      setError(error.message || 'Failed to send reset email');
    } else {
      setSent(true);
    }
    setLoading(false);
  };


  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-accent-blue/5 rounded-full blur-[80px]" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-teal/5 rounded-full blur-[90px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-6 h-6 text-accent-blue" />
          </div>
          <h1 className="text-2xl font-bold text-dark-100 mb-1 tracking-tight">Reset password</h1>
          <p className="text-sm text-dark-300">We'll send you a link to reset your password</p>
        </div>

        <div className="glass-card p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-accent-green/10 border border-accent-green/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-accent-green" />
              </div>
              <h2 className="text-lg font-semibold text-dark-100 mb-2">Email sent!</h2>
              <p className="text-sm text-dark-300 mb-6">
                Check your inbox for a password reset link. If you don't see it, check your spam folder.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-blue text-white font-medium text-sm hover:bg-accent-blue/95 transition-all shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                      <Send className="w-4 h-4" />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-dark-300 mt-6">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-accent-blue hover:underline transition-colors font-medium">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
