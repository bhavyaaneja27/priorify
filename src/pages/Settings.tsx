import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User, Bell, Palette, Shield, LogOut, ChevronRight, Moon,
  Sun, Laptop, Mail, Smartphone, Check, Camera, Edit3, Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../hooks/usePersistence';

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

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'theme' | 'account'>('profile');
  const [notifications, setNotifications] = useState({
    classReminders: true,
    studyReminders: true,
    attendanceAlerts: true,
    achievements: true,
    email: false,
    push: true,
  });
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'dark' | 'light' | 'system') || 'dark';
    }
    return 'dark';
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { profile, saveProfile, loading: loadingProfile } = useUserProfile();
  const [profileName, setProfileName] = useState('');
  const [profileUniversity, setProfileUniversity] = useState('');
  const [profileYear, setProfileYear] = useState('');
  const [profileBranch, setProfileBranch] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  // Initial load
  useEffect(() => {
    if (profile) {
      setProfileName(profile.name || '');
      setProfileUniversity(profile.university || '');
      setProfileYear(profile.year || '');
      setProfileBranch(profile.branch || '');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    const updated = {
      ...profile,
      name: profileName,
      university: profileUniversity,
      year: profileYear,
      branch: profileBranch,
      avatar: profileName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    };
    await saveProfile(updated);
    setSaveMessage('Profile changes saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const applyTheme = (newTheme: 'dark' | 'light' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    let resolvedTheme = newTheme;
    if (newTheme === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (resolvedTheme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'theme' as const, label: 'Appearance', icon: Palette },
    { id: 'account' as const, label: 'Account', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-[#8a8aa3] mt-1">Manage your preferences and account</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#5b8def]/15 to-[#4ecdc4]/10 text-[#5b8def] border border-[#5b8def]/20'
                  : 'text-[#8a8aa3] hover:text-[#d0d0e0] hover:bg-[#1e1e2e]/60'
              }`}
            >
              <tab.icon className="w-[18px] h-[18px]" strokeWidth={2} />
              {tab.label}
              <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${activeTab === tab.id ? 'rotate-90' : ''}`} />
            </button>
          ))}

          <div className="pt-4 border-t border-[#2d2d42]">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#ff6b6b] hover:bg-[#ff6b6b]/10 transition-all"
            >
              <LogOut className="w-[18px] h-[18px]" strokeWidth={2} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            loadingProfile || !profile ? (
              <Card className="h-64 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-[#5b8def] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-[#5a5a7a]">Loading profile...</p>
              </Card>
            ) : (
              <Card>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-[#5b8def]/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-[#5b8def]" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#d0d0e0]">Profile Information</h3>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#5b8def] to-[#4ecdc4] flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                      {profile.avatar}
                    </div>
                    <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#1e1e2e] border border-[#2d2d42] flex items-center justify-center text-[#8a8aa3] hover:text-white transition-colors">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold text-white">{profile.name}</h2>
                    <p className="text-sm text-[#8a8aa3]">{user?.email || profile.email}</p>
                    <div className="flex items-center gap-3 mt-2 justify-center sm:justify-start">
                      {profile.branch && <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#5b8def]/10 text-[#5b8def]">{profile.branch}</span>}
                      {profile.year && <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#4ecdc4]/10 text-[#4ecdc4]">{profile.year}</span>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#8a8aa3] mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a7a]" />
                      <input value={profileName} onChange={e => setProfileName(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#12121a] border border-[#2d2d42] text-white text-sm focus:border-[#5b8def] outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-[#8a8aa3] mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a7a]" />
                      <input disabled value={user?.email || profile.email} className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#12121a] border border-[#2d2d42] text-white/50 text-sm focus:border-[#5b8def] outline-none transition-all cursor-not-allowed" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-[#8a8aa3] mb-2">University</label>
                    <div className="relative">
                      <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a7a]" />
                      <input value={profileUniversity} onChange={e => setProfileUniversity(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#12121a] border border-[#2d2d42] text-white text-sm focus:border-[#5b8def] outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-[#8a8aa3] mb-2">Year</label>
                    <div className="relative">
                      <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a7a]" />
                      <input value={profileYear} onChange={e => setProfileYear(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#12121a] border border-[#2d2d42] text-white text-sm focus:border-[#5b8def] outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-[#8a8aa3] mb-2">Branch</label>
                    <div className="relative">
                      <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a7a]" />
                      <input value={profileBranch} onChange={e => setProfileBranch(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#12121a] border border-[#2d2d42] text-white text-sm focus:border-[#5b8def] outline-none transition-all" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm text-[#2ecc71] font-medium">{saveMessage}</span>
                  <button onClick={handleSaveProfile} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5b8def] to-[#4ecdc4] text-white font-medium text-sm hover:shadow-lg transition-all">
                    Save Changes
                  </button>
                </div>
              </Card>
            )
          )}

          {activeTab === 'notifications' && (
            <Card>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#f4a261]/10 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-[#f4a261]" />
                </div>
                <h3 className="text-sm font-semibold text-[#d0d0e0]">Notification Preferences</h3>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'classReminders' as const, label: 'Class Reminders', desc: 'Get notified before classes start', icon: Bell },
                  { key: 'studyReminders' as const, label: 'Study Reminders', desc: 'Daily study plan notifications', icon: Clock },
                  { key: 'attendanceAlerts' as const, label: 'Attendance Alerts', desc: 'Warn when attendance drops below 75%', icon: Shield },
                  { key: 'achievements' as const, label: 'Achievement Notifications', desc: 'Celebrate when you unlock badges', icon: Check },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-[#12121a]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#5b8def]/10 flex items-center justify-center">
                        <item.icon className="w-4 h-4 text-[#5b8def]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#d0d0e0]">{item.label}</p>
                        <p className="text-xs text-[#5a5a7a]">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className={`w-12 h-7 rounded-full transition-all ${
                        notifications[item.key] ? 'bg-[#5b8def]' : 'bg-[#2d2d42]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-[#2d2d42]">
                <h4 className="text-sm font-semibold text-[#d0d0e0] mb-4">Delivery Method</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#12121a]">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-[#8a8aa3]" />
                      <span className="text-sm text-[#d0d0e0]">Email Notifications</span>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, email: !prev.email }))}
                      className={`w-12 h-7 rounded-full transition-all ${notifications.email ? 'bg-[#5b8def]' : 'bg-[#2d2d42]'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${notifications.email ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#12121a]">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-4 h-4 text-[#8a8aa3]" />
                      <span className="text-sm text-[#d0d0e0]">Push Notifications</span>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, push: !prev.push }))}
                      className={`w-12 h-7 rounded-full transition-all ${notifications.push ? 'bg-[#5b8def]' : 'bg-[#2d2d42]'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${notifications.push ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'theme' && (
            <Card>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#9b59b6]/10 flex items-center justify-center">
                  <Palette className="w-4 h-4 text-[#9b59b6]" />
                </div>
                <h3 className="text-sm font-semibold text-[#d0d0e0]">Appearance</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => applyTheme('dark')}
                  className={`flex flex-col items-center gap-3 p-6 rounded-xl transition-all border-2 ${
                    theme === 'dark' ? 'border-[#5b8def] bg-[#1e1e2e]' : 'border-[#2d2d42] bg-[#12121a] hover:border-[#3a3a55]'
                  }`}
                >
                  <div className="w-16 h-16 rounded-xl bg-[#0a0a0f] border border-[#2d2d42] flex items-center justify-center">
                    <Moon className="w-8 h-8 text-[#8a8aa3]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">Dark</p>
                    <p className="text-xs text-[#5a5a7a] mt-1">Easy on the eyes</p>
                  </div>
                </button>
                <button
                  onClick={() => applyTheme('light')}
                  className={`flex flex-col items-center gap-3 p-6 rounded-xl transition-all border-2 ${
                    theme === 'light' ? 'border-[#5b8def] bg-[#1e1e2e]' : 'border-[#2d2d42] bg-[#12121a] hover:border-[#3a3a55]'
                  }`}
                >
                  <div className="w-16 h-16 rounded-xl bg-[#f8f8fb] border border-[#e0e0e8] flex items-center justify-center">
                    <Sun className="w-8 h-8 text-[#f4a261]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">Light</p>
                    <p className="text-xs text-[#5a5a7a] mt-1">Bright & clean</p>
                  </div>
                </button>
                <button
                  onClick={() => applyTheme('system')}
                  className={`flex flex-col items-center gap-3 p-6 rounded-xl transition-all border-2 ${
                    theme === 'system' ? 'border-[#5b8def] bg-[#1e1e2e]' : 'border-[#2d2d42] bg-[#12121a] hover:border-[#3a3a55]'
                  }`}
                >
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#0a0a0f] to-[#f8f8fb] border border-[#2d2d42] flex items-center justify-center">
                    <Laptop className="w-8 h-8 text-[#5b8def]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">System</p>
                    <p className="text-xs text-[#5a5a7a] mt-1">Match your device</p>
                  </div>
                </button>
              </div>
            </Card>
          )}

          {activeTab === 'account' && (
            <Card>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#ff6b6b]/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-[#ff6b6b]" />
                </div>
                <h3 className="text-sm font-semibold text-[#d0d0e0]">Account Settings</h3>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#12121a]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#d0d0e0]">Change Password</span>
                    <ChevronRight className="w-4 h-4 text-[#5a5a7a]" />
                  </div>
                  <p className="text-xs text-[#5a5a7a]">Update your password for better security</p>
                </div>

                <div className="p-4 rounded-xl bg-[#12121a]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#d0d0e0]">Two-Factor Authentication</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#ff6b6b]/10 text-[#ff6b6b]">Off</span>
                  </div>
                  <p className="text-xs text-[#5a5a7a]">Add an extra layer of security to your account</p>
                </div>

                <div className="p-4 rounded-xl bg-[#12121a]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#d0d0e0]">Data Export</span>
                    <ChevronRight className="w-4 h-4 text-[#5a5a7a]" />
                  </div>
                  <p className="text-xs text-[#5a5a7a]">Download all your study data and progress</p>
                </div>

                <div className="p-4 rounded-xl bg-[#ff6b6b]/5 border border-[#ff6b6b]/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#ff6b6b]">Delete Account</span>
                    <ChevronRight className="w-4 h-4 text-[#ff6b6b]" />
                  </div>
                  <p className="text-xs text-[#ff6b6b]/70">This will permanently delete all your data</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card-strong rounded-2xl p-6 max-w-sm w-full mx-4"
          >
            <div className="w-12 h-12 rounded-xl bg-[#ff6b6b]/10 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-6 h-6 text-[#ff6b6b]" />
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">Sign Out?</h3>
            <p className="text-sm text-[#8a8aa3] text-center mb-6">
              Are you sure you want to sign out? You'll need to sign in again to access your study data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-[#2d2d42] text-[#8a8aa3] font-medium text-sm hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 rounded-xl bg-[#ff6b6b] text-white font-medium text-sm hover:bg-[#ff6b6b]/90 transition-all"
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
