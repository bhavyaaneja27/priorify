import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Brain, Mail, ArrowLeft, Check, Send } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#5b8def]/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#4ecdc4]/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#5b8def] to-[#4ecdc4] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#5b8def]/20">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Reset password</h1>
          <p className="text-sm text-[#8a8aa3]">We'll send you a link to reset your password</p>
        </div>

        <div className="glass-card rounded-3xl p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#2ecc71]/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-[#2ecc71]" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Email sent!</h2>
              <p className="text-sm text-[#8a8aa3] mb-6">
                Check your inbox for a password reset link. If you don't see it, check your spam folder.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#5b8def] to-[#4ecdc4] text-white font-medium text-sm hover:shadow-lg transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
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
                      <Send className="w-4 h-4" />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-[#8a8aa3] mt-6">
                <Link to="/login" className="inline-flex items-center gap-1 text-[#5b8def] hover:text-[#4ecdc4] transition-colors font-medium">
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
