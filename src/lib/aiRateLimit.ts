// AI rate limiting — client-side, stored in localStorage, keyed by userId.
// Rules:
//   1. Daily cap: max 5 generations per calendar day per user.
//   2. Cooldown: minimum 30 seconds between consecutive requests.
//   3. Duplicate detection: same (subject + topic + difficulty + examDate) rejected within 24 h.

const DAILY_LIMIT = 5;
const COOLDOWN_SECONDS = 30;
const STORAGE_KEY_PREFIX = 'ai_rate_limit_';

interface RateLimitRecord {
  date: string;           // 'YYYY-MM-DD' — resets on new day
  count: number;          // requests used today
  lastRequestTs: number;  // epoch ms of last request
  usedHashes: string[];   // duplicate hashes used today
}

function getStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function hashRequest(subject: string, topic: string, difficulty: string, examDate: string): string {
  // Simple stable hash — adequate for duplicate detection without crypto
  const raw = `${subject.toLowerCase().trim()}|${topic.toLowerCase().trim()}|${difficulty.toLowerCase()}|${examDate}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

function loadRecord(userId: string): RateLimitRecord {
  try {
    const stored = localStorage.getItem(getStorageKey(userId));
    if (stored) {
      const parsed: RateLimitRecord = JSON.parse(stored);
      // Reset if the stored date is not today
      if (parsed.date !== todayStr()) {
        return { date: todayStr(), count: 0, lastRequestTs: 0, usedHashes: [] };
      }
      return parsed;
    }
  } catch {
    // corrupted storage — start fresh
  }
  return { date: todayStr(), count: 0, lastRequestTs: 0, usedHashes: [] };
}

function saveRecord(userId: string, record: RateLimitRecord): void {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(record));
  } catch {
    // storage full or blocked — fail silently; the check already ran
  }
}

export interface RateLimitCheck {
  allowed: boolean;
  reason?: string;
  cooldownRemaining?: number; // seconds remaining in cooldown, if applicable
}

/**
 * Check whether this user is allowed to make an AI request right now.
 * Call this BEFORE calling the Gemini API.
 */
export function checkAIRateLimit(
  userId: string,
  subject: string,
  topic: string,
  difficulty: string,
  examDate: string
): RateLimitCheck {
  const record = loadRecord(userId);
  const nowMs = Date.now();

  // 1. Daily limit
  if (record.count >= DAILY_LIMIT) {
    return {
      allowed: false,
      reason: `Daily limit reached. You can generate up to ${DAILY_LIMIT} AI plans per day. Try again tomorrow.`
    };
  }

  // 2. Cooldown
  if (record.lastRequestTs > 0) {
    const elapsedSeconds = (nowMs - record.lastRequestTs) / 1000;
    if (elapsedSeconds < COOLDOWN_SECONDS) {
      const remaining = Math.ceil(COOLDOWN_SECONDS - elapsedSeconds);
      return {
        allowed: false,
        reason: `Please wait ${remaining} second${remaining !== 1 ? 's' : ''} before generating another plan.`,
        cooldownRemaining: remaining
      };
    }
  }

  // 3. Duplicate detection
  const hash = hashRequest(subject, topic, difficulty, examDate);
  if (record.usedHashes.includes(hash)) {
    return {
      allowed: false,
      reason: 'An identical plan (same subject, topic, difficulty, and exam date) was already generated today. Edit the fields to create a different plan.'
    };
  }

  return { allowed: true };
}

/**
 * Record that a request was made. Call this AFTER a successful generation.
 */
export function recordAIRequest(
  userId: string,
  subject: string,
  topic: string,
  difficulty: string,
  examDate: string
): void {
  const record = loadRecord(userId);
  const hash = hashRequest(subject, topic, difficulty, examDate);
  record.count += 1;
  record.lastRequestTs = Date.now();
  if (!record.usedHashes.includes(hash)) {
    record.usedHashes.push(hash);
  }
  saveRecord(userId, record);
}

/** How many AI plan generations remain today for this user. */
export function getRemainingGenerations(userId: string): number {
  const record = loadRecord(userId);
  return Math.max(0, DAILY_LIMIT - record.count);
}
