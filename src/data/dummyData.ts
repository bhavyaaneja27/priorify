export const energyOptions = [
  { value: 'exhausted', label: 'Exhausted', emoji: '😴', color: '#9b59b6', desc: 'Running on empty. Keep it light today.' },
  { value: 'low', label: 'Low', emoji: '😐', color: '#f4a261', desc: 'Low energy. Small wins and short blocks.' },
  { value: 'okay', label: 'Okay', emoji: '🙂', color: '#5b8def', desc: 'Steady pace. Balance deep work with admin.' },
  { value: 'good', label: 'Good', emoji: '😄', color: '#2ecc71', desc: 'Solid energy. Tackle important deadlines.' },
  { value: 'peak', label: 'Peak', emoji: '🔥', color: '#ff6b6b', desc: 'Peak performance. Go after your biggest goals.' },
];

/** @deprecated Use energyOptions */
export const moodOptions = energyOptions;

const getInitialProfile = () => {
  const defaultProfile = {
    name: 'Guest',
    email: '',
    avatar: 'G',
    profession: '',
    organization: '',
    totalXP: 0,
    level: 1,
    streak: 0,
    totalHours: 0,
  };
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('user_profile');
    if (saved) {
      try {
        return { ...defaultProfile, ...JSON.parse(saved) };
      } catch {}
    }
  }
  return defaultProfile;
};

export const userProfile = getInitialProfile();
