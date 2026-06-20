-- ============================================================
-- Supabase RLS Policies — StudyAI Application
-- Run this entire script in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- profiles  (PK = id = auth.uid())
-- ────────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ────────────────────────────────────────────────────────────
-- timetable  (has user_id column)
-- ────────────────────────────────────────────────────────────
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "timetable_select_own"  ON timetable;
DROP POLICY IF EXISTS "timetable_insert_own"  ON timetable;
DROP POLICY IF EXISTS "timetable_delete_own"  ON timetable;

CREATE POLICY "timetable_select_own"
  ON timetable FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "timetable_insert_own"
  ON timetable FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "timetable_delete_own"
  ON timetable FOR DELETE
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- attendance  (has user_id column)
-- ────────────────────────────────────────────────────────────
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_select_own"  ON attendance;
DROP POLICY IF EXISTS "attendance_insert_own"  ON attendance;
DROP POLICY IF EXISTS "attendance_delete_own"  ON attendance;

CREATE POLICY "attendance_select_own"
  ON attendance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "attendance_insert_own"
  ON attendance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "attendance_delete_own"
  ON attendance FOR DELETE
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- subjects  (has user_id column)
-- ────────────────────────────────────────────────────────────
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subjects_select_own"  ON subjects;
DROP POLICY IF EXISTS "subjects_insert_own"  ON subjects;
DROP POLICY IF EXISTS "subjects_delete_own"  ON subjects;

CREATE POLICY "subjects_select_own"
  ON subjects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "subjects_insert_own"
  ON subjects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subjects_delete_own"
  ON subjects FOR DELETE
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- ai_plans  (has user_id column)
-- ────────────────────────────────────────────────────────────
ALTER TABLE ai_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_plans_select_own"  ON ai_plans;
DROP POLICY IF EXISTS "ai_plans_insert_own"  ON ai_plans;
DROP POLICY IF EXISTS "ai_plans_delete_own"  ON ai_plans;

CREATE POLICY "ai_plans_select_own"
  ON ai_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ai_plans_insert_own"
  ON ai_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_plans_delete_own"
  ON ai_plans FOR DELETE
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- mood_history  (has user_id column)
-- ────────────────────────────────────────────────────────────
ALTER TABLE mood_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mood_history_select_own"  ON mood_history;
DROP POLICY IF EXISTS "mood_history_insert_own"  ON mood_history;
DROP POLICY IF EXISTS "mood_history_delete_own"  ON mood_history;

CREATE POLICY "mood_history_select_own"
  ON mood_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "mood_history_insert_own"
  ON mood_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mood_history_delete_own"
  ON mood_history FOR DELETE
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- pomodoro_history  (has user_id column)
-- ────────────────────────────────────────────────────────────
ALTER TABLE pomodoro_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pomodoro_history_select_own"  ON pomodoro_history;
DROP POLICY IF EXISTS "pomodoro_history_insert_own"  ON pomodoro_history;
DROP POLICY IF EXISTS "pomodoro_history_update_own"  ON pomodoro_history;
DROP POLICY IF EXISTS "pomodoro_history_delete_own"  ON pomodoro_history;

CREATE POLICY "pomodoro_history_select_own"
  ON pomodoro_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "pomodoro_history_insert_own"
  ON pomodoro_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pomodoro_history_update_own"
  ON pomodoro_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pomodoro_history_delete_own"
  ON pomodoro_history FOR DELETE
  USING (auth.uid() = user_id);
