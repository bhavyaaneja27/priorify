// Input validation utilities — pure functions, no side effects, no UI.

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/** Email — basic RFC shape + length guard */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  if (!trimmed) return { valid: false, error: 'Email is required.' };
  if (trimmed.length > 254) return { valid: false, error: 'Email is too long.' };
  // RFC 5322 simplified pattern — allows unicode localparts via @ structure
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRe.test(trimmed)) return { valid: false, error: 'Please enter a valid email address.' };
  return { valid: true };
}

/** Password — min 8, max 128 chars */
export function validatePassword(password: string): ValidationResult {
  if (!password) return { valid: false, error: 'Password is required.' };
  if (password.length < 8) return { valid: false, error: 'Password must be at least 8 characters.' };
  if (password.length > 128) return { valid: false, error: 'Password must not exceed 128 characters.' };
  return { valid: true };
}

/** Full name — 1–100 printable chars */
export function validateName(name: string): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) return { valid: false, error: 'Name is required.' };
  if (trimmed.length > 100) return { valid: false, error: 'Name must not exceed 100 characters.' };
  return { valid: true };
}

/** Subject name — 1–80 chars */
export function validateSubjectName(name: string): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) return { valid: false, error: 'Subject name is required.' };
  if (trimmed.length > 80) return { valid: false, error: 'Subject name must not exceed 80 characters.' };
  return { valid: true };
}

/** Subject code — optional, max 20 chars, alphanumeric/hyphen/underscore only */
export function validateSubjectCode(code: string): ValidationResult {
  if (!code) return { valid: true }; // optional
  const trimmed = code.trim();
  if (trimmed.length > 20) return { valid: false, error: 'Subject code must not exceed 20 characters.' };
  if (!/^[A-Za-z0-9\-_]+$/.test(trimmed)) {
    return { valid: false, error: 'Subject code may only contain letters, numbers, hyphens, and underscores.' };
  }
  return { valid: true };
}

/** Attendance — present ≤ total, both non-negative integers, total ≥ 1 */
export function validateAttendanceCounts(present: number, total: number): ValidationResult {
  if (!Number.isInteger(present) || present < 0) {
    return { valid: false, error: 'Classes attended must be a non-negative whole number.' };
  }
  if (!Number.isInteger(total) || total < 1) {
    return { valid: false, error: 'Total classes must be at least 1.' };
  }
  if (present > total) {
    return { valid: false, error: 'Classes attended cannot exceed total classes.' };
  }
  return { valid: true };
}

/** AI Planner form — subject, topic non-empty with max lengths; examDate must be today or future */
export function validateAIPlannerForm(
  subject: string,
  topic: string,
  examDate: string
): ValidationResult {
  const subj = subject.trim();
  if (!subj) return { valid: false, error: 'Subject is required.' };
  if (subj.length > 80) return { valid: false, error: 'Subject must not exceed 80 characters.' };

  const top = topic.trim();
  if (!top) return { valid: false, error: 'Topic is required.' };
  if (top.length > 120) return { valid: false, error: 'Topic must not exceed 120 characters.' };

  if (!examDate) return { valid: false, error: 'Exam date is required.' };
  const examMs = new Date(examDate).getTime();
  if (isNaN(examMs)) return { valid: false, error: 'Exam date is not valid.' };
  // Allow today as well — only reject strictly past dates
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  if (examMs < todayStart.getTime()) {
    return { valid: false, error: 'Exam date must be today or in the future.' };
  }
  return { valid: true };
}

/** Timetable slot — subject and room non-empty, max 80 chars each */
export function validateTimetableSlot(subject: string, room: string): ValidationResult {
  const subj = subject.trim();
  if (!subj) return { valid: false, error: 'Subject name is required.' };
  if (subj.length > 80) return { valid: false, error: 'Subject name must not exceed 80 characters.' };

  const rm = room.trim();
  if (!rm) return { valid: false, error: 'Room / location is required.' };
  if (rm.length > 80) return { valid: false, error: 'Room must not exceed 80 characters.' };

  return { valid: true };
}

/** Profile name / text field — used in Settings */
export function validateProfileName(name: string): ValidationResult {
  return validateName(name);
}

/** Generic free-text field with a configurable max length */
export function validateTextField(value: string, fieldName: string, maxLength = 100): ValidationResult {
  if (value.length > maxLength) {
    return { valid: false, error: `${fieldName} must not exceed ${maxLength} characters.` };
  }
  return { valid: true };
}
