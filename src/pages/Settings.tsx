import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User, Bell, Palette, Shield, LogOut, ChevronRight, Moon,
  Sun, Laptop, Mail, Smartphone, Check, Camera, Edit3, Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../hooks/usePersistence';
import { validateProfileName, validateTextField } from '../lib/validation';


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
      return (localStorage.getItem('theme') as 'dark' | 'light' | 'system') || 'light';
    }
    return 'light';
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

    // Validate before saving
    const nameResult = validateProfileName(profileName);
    if (!nameResult.valid) {
      setSaveMessage(nameResult.error!);
      return;
    }
    const uniResult = validateTextField(profileUniversity, 'University', 120);
    if (!uniResult.valid) {
      setSaveMessage(uniResult.error!);
      return;
    }
    const yearResult = validateTextField(profileYear, 'Year', 30);
    if (!yearResult.valid) {
      setSaveMessage(yearResult.error!);
      return;
    }
    const branchResult = validateTextField(profileBranch, 'Branch', 80);
    if (!branchResult.valid) {
      setSaveMessage(branchResult.error!);
      return;
    }

    const updated = {
      ...profile,
      name: profileName.trim(),
      university: profileUniversity.trim(),
      year: profileYear.trim(),
      branch: profileBranch.trim(),
      avatar: profileName.trim().split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
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
        <h1 className="text-2xl font-bold text-dark-100">Settings</h1>
        <p className="text-sm text-dark-300 mt-1">Manage your preferences and account</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20'
                : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/40 border border-transparent'
                }`}
            >
              <tab.icon className="w-[18px] h-[18px]" strokeWidth={2} />
              {tab.label}
              <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${activeTab === tab.id ? 'rotate-90' : ''}`} />
            </button>
          ))}

          <div className="pt-4 border-t border-dark-600">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-accent-coral hover:bg-accent-coral/10 transition-all border border-transparent"
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
                <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-dark-400">Loading profile...</p>
              </Card>
            ) : (
              <Card>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-accent-blue" />
                  </div>
                  <h3 className="text-sm font-semibold text-dark-100">Profile Information</h3>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-accent-blue flex items-center justify-center text-3xl font-bold text-white shadow-sm">
                      {profile.avatar}
                    </div>
                    <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-dark-950 border border-dark-600 flex items-center justify-center text-dark-300 hover:text-dark-100 transition-colors">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold text-dark-100">{profile.name}</h2>
                    <p className="text-sm text-dark-300">{user?.email || profile.email}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-3.5 justify-center sm:justify-start">
                      {profile.branch && <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-accent-blue/10 text-accent-blue border border-accent-blue/20">{profile.branch}</span>}
                      {profile.year && <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-accent-teal/10 text-accent-teal border border-accent-teal/20">{profile.year}</span>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                      <input value={profileName} onChange={e => setProfileName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-950 border border-dark-600 text-dark-100 text-sm focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30 outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                      <input disabled value={user?.email || profile.email} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-950 border border-dark-600 text-dark-400 text-sm outline-none transition-all cursor-not-allowed" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">University</label>
                    <div className="relative">
                      <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                      <input value={profileUniversity} onChange={e => setProfileUniversity(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-950 border border-dark-600 text-dark-100 text-sm focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30 outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Year</label>
                    <div className="relative">
                      <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                      <input value={profileYear} onChange={e => setProfileYear(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-950 border border-dark-600 text-dark-100 text-sm focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30 outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wider">Branch</label>
                    <div className="relative">
                      <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                      <input value={profileBranch} onChange={e => setProfileBranch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-950 border border-dark-600 text-dark-100 text-sm focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between gap-4">
                  <span className="text-sm text-accent-green font-medium">{saveMessage}</span>
                  <button onClick={handleSaveProfile} className="px-6 py-2.5 rounded-xl bg-accent-blue text-white font-medium text-sm transition-all hover:bg-accent-blue/90">
                    Save Changes
                  </button>
                </div>
              </Card>
            )
          )}

          {activeTab === 'notifications' && (
            <Card>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-accent-amber/10 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-accent-amber" />
                </div>
                <h3 className="text-sm font-semibold text-dark-100">Notification Preferences</h3>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'classReminders' as const, label: 'Class Reminders', desc: 'Get notified before classes start', icon: Bell },
                  { key: 'studyReminders' as const, label: 'Study Reminders', desc: 'Daily study plan notifications', icon: Clock },
                  { key: 'attendanceAlerts' as const, label: 'Attendance Alerts', desc: 'Warn when attendance drops below 75%', icon: Shield },
                  { key: 'achievements' as const, label: 'Achievement Notifications', desc: 'Celebrate when you unlock badges', icon: Check },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-dark-950 border border-dark-600/30">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-accent-blue/10 flex items-center justify-center">
                        <item.icon className="w-4 h-4 text-accent-blue" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-dark-100">{item.label}</p>
                        <p className="text-xs text-dark-300">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className={`w-11 h-6 rounded-full transition-all relative ${notifications[item.key] ? 'bg-accent-blue' : 'bg-dark-800 border border-dark-600'
                        }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute top-0.5 left-0.5 ${notifications[item.key] ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-dark-600">
                <h4 className="text-sm font-semibold text-dark-100 mb-4">Delivery Method</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-dark-950 border border-dark-600/30">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-dark-300" />
                      <span className="text-sm text-dark-100">Email Notifications</span>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, email: !prev.email }))}
                      className={`w-11 h-6 rounded-full transition-all relative ${notifications.email ? 'bg-accent-blue' : 'bg-dark-800 border border-dark-600'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute top-0.5 left-0.5 ${notifications.email ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-dark-950 border border-dark-600/30">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-4 h-4 text-dark-300" />
                      <span className="text-sm text-dark-100">Push Notifications</span>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, push: !prev.push }))}
                      className={`w-11 h-6 rounded-full transition-all relative ${notifications.push ? 'bg-accent-blue' : 'bg-dark-800 border border-dark-600'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute top-0.5 left-0.5 ${notifications.push ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'theme' && (
            <Card>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center">
                  <Palette className="w-4 h-4 text-accent-purple" />
                </div>
                <h3 className="text-sm font-semibold text-dark-100">Appearance</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => applyTheme('dark')}
                  className={`flex flex-col items-center gap-3 p-6 rounded-xl transition-all border-2 ${theme === 'dark' ? 'border-accent-blue bg-accent-blue/5' : 'border-dark-600 bg-dark-950 hover:border-dark-400'
                    }`}
                >
                  <div className="w-16 h-16 rounded-xl bg-dark-950 border border-dark-600 flex items-center justify-center">
                    <Moon className="w-8 h-8 text-dark-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-dark-100">Dark</p>
                    <p className="text-xs text-dark-400 mt-1">Easy on the eyes</p>
                  </div>
                </button>
                <button
                  onClick={() => applyTheme('light')}
                  className={`flex flex-col items-center gap-3 p-6 rounded-xl transition-all border-2 ${theme === 'light' ? 'border-accent-blue bg-accent-blue/5' : 'border-dark-600 bg-dark-950 hover:border-dark-400'
                    }`}
                >
                  <div className="w-16 h-16 rounded-xl bg-white border border-dark-600 flex items-center justify-center">
                    <Sun className="w-8 h-8 text-accent-amber" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-dark-100">Light</p>
                    <p className="text-xs text-dark-400 mt-1">Bright & clean</p>
                  </div>
                </button>
                <button
                  onClick={() => applyTheme('system')}
                  className={`flex flex-col items-center gap-3 p-6 rounded-xl transition-all border-2 ${theme === 'system' ? 'border-accent-blue bg-accent-blue/5' : 'border-dark-600 bg-dark-950 hover:border-dark-400'
                    }`}
                >
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-dark-950 to-white border border-dark-600 flex items-center justify-center">
                    <Laptop className="w-8 h-8 text-accent-blue" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-dark-100">System</p>
                    <p className="text-xs text-dark-400 mt-1">Match your device</p>
                  </div>
                </button>
              </div>
            </Card>
          )}

          {activeTab === 'account' && (
            <Card>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-accent-blue" />
                </div>
                <h3 className="text-sm font-semibold text-dark-100">Account Settings</h3>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-dark-950 border border-dark-600/30 hover:border-dark-600 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-dark-100">Change Password</span>
                    <ChevronRight className="w-4 h-4 text-dark-400" />
                  </div>
                  <p className="text-xs text-dark-400">Update your password for better security</p>
                </div>

                <div className="p-4 rounded-xl bg-dark-950 border border-dark-600/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-dark-100">Two-Factor Authentication</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent-coral/10 text-accent-coral border border-accent-coral/20">Off</span>
                  </div>
                  <p className="text-xs text-dark-400">Add an extra layer of security to your account</p>
                </div>

                <div className="p-4 rounded-xl bg-dark-950 border border-dark-600/30 hover:border-dark-600 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-dark-100">Data Export</span>
                    <ChevronRight className="w-4 h-4 text-dark-400" />
                  </div>
                  <p className="text-xs text-dark-400">Download all your study data and progress</p>
                </div>

                <div className="p-4 rounded-xl bg-accent-coral/5 border border-accent-coral/25">
                  <div className="flex items-center justify-between mb-2 cursor-pointer">
                    <span className="text-sm font-medium text-accent-coral">Delete Account</span>
                    <ChevronRight className="w-4 h-4 text-accent-coral" />
                  </div>
                  <p className="text-xs text-accent-coral/70">This will permanently delete all your data</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card-strong rounded-2xl p-6 max-w-sm w-full mx-4 border border-dark-600 bg-dark-900"
          >
            <div className="w-12 h-12 rounded-xl bg-accent-coral/10 flex items-center justify-center mx-auto mb-4 border border-accent-coral/20 animate-pulse-slow">
              <LogOut className="w-6 h-6 text-accent-coral" />
            </div>
            <h3 className="text-lg font-semibold text-dark-100 text-center mb-2">Sign Out?</h3>
            <p className="text-sm text-dark-300 text-center mb-6">
              Are you sure you want to sign out? You'll need to sign in again to access your study data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-dark-800 border border-dark-600 text-dark-200 font-medium text-sm hover:bg-dark-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-accent-coral text-white font-medium text-sm hover:bg-accent-coral/90 transition-all"
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
