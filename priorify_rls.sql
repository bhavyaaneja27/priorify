-- Priorify RLS Policies (greenfield — separate Supabase project)
-- Do NOT run against the StudyAI Supabase project.
-- Run after priorify_schema.sql in a new Priorify Supabase project.

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select_own" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "categories_insert_own" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_update_own" ON categories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_delete_own" ON categories FOR DELETE USING (auth.uid() = user_id);

-- tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_select_own" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tasks_insert_own" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update_own" ON tasks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_delete_own" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- action_plans
ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "action_plans_select_own" ON action_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "action_plans_insert_own" ON action_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "action_plans_update_own" ON action_plans FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "action_plans_delete_own" ON action_plans FOR DELETE USING (auth.uid() = user_id);

-- productivity_checks
ALTER TABLE productivity_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "productivity_checks_select_own" ON productivity_checks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "productivity_checks_insert_own" ON productivity_checks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "productivity_checks_update_own" ON productivity_checks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "productivity_checks_delete_own" ON productivity_checks FOR DELETE USING (auth.uid() = user_id);

-- focus_sessions
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "focus_sessions_select_own" ON focus_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "focus_sessions_insert_own" ON focus_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "focus_sessions_update_own" ON focus_sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "focus_sessions_delete_own" ON focus_sessions FOR DELETE USING (auth.uid() = user_id);

-- calendar_events
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "calendar_events_select_own" ON calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "calendar_events_insert_own" ON calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "calendar_events_update_own" ON calendar_events FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "calendar_events_delete_own" ON calendar_events FOR DELETE USING (auth.uid() = user_id);

-- daily_plans
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_plans_select_own" ON daily_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "daily_plans_insert_own" ON daily_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_plans_update_own" ON daily_plans FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_plans_delete_own" ON daily_plans FOR DELETE USING (auth.uid() = user_id);
