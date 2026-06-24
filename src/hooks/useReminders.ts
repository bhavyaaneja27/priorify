import { useState, useEffect } from 'react';

export interface ReminderConfig {
  dueTime?: string; // 'HH:mm'
  reminder15Min?: boolean;
  reminderAtDeadline?: boolean;
  notified15Min?: boolean;
  notifiedAtDeadline?: boolean;
  title: string;
  dueDate: string; // 'YYYY-MM-DD'
}

const STORAGE_KEY = 'priorify_reminders';

export function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
}

export function useReminders() {
  const [reminders, setReminders] = useState<Record<string, ReminderConfig>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setReminders(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const saveReminders = (newMap: Record<string, ReminderConfig>) => {
    setReminders(newMap);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newMap));
  };

  const setReminder = (taskId: string, config: ReminderConfig) => {
    const updated = { ...reminders, [taskId]: config };
    saveReminders(updated);
  };

  const removeReminder = (taskId: string) => {
    const updated = { ...reminders };
    delete updated[taskId];
    saveReminders(updated);
  };

  return { reminders, setReminder, removeReminder, saveReminders };
}

export function ReminderEngine() {
  useEffect(() => {
    if (!('Notification' in window)) return;

    const interval = setInterval(() => {
      if (Notification.permission !== 'granted') return;

      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      let map: Record<string, ReminderConfig>;
      try {
        map = JSON.parse(saved);
      } catch {
        return;
      }

      let hasChanges = false;
      const now = new Date();
      const currentMs = now.getTime();

      Object.entries(map).forEach(([taskId, config]) => {
        if (!config.dueDate || !config.dueTime) return;

        // Parse due date and time
        const [year, month, day] = config.dueDate.split('-').map(Number);
        const [hour, minute] = config.dueTime.split(':').map(Number);
        
        const dueTimeDate = new Date(year, month - 1, day, hour, minute, 0);
        const dueMs = dueTimeDate.getTime();

        // 15 Min check
        if (config.reminder15Min && !config.notified15Min) {
          const fifteenMinMs = 15 * 60 * 1000;
          if (currentMs >= dueMs - fifteenMinMs && currentMs < dueMs) {
            new Notification('Upcoming Deadline (15 min)', {
              body: `"${config.title}" is due in 15 minutes!`,
            });
            config.notified15Min = true;
            hasChanges = true;
          }
        }

        // At Deadline check
        if (config.reminderAtDeadline && !config.notifiedAtDeadline) {
          if (currentMs >= dueMs) {
            new Notification('Task Due Now!', {
              body: `"${config.title}" is due now!`,
            });
            config.notifiedAtDeadline = true;
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
        // Dispatch a custom event so other tabs/hooks can update
        window.dispatchEvent(new Event('storage'));
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return null;
}
