-- Disable triggers temporaneamente non necessario: il CASCADE di auth.users propaga via FK,
-- ma molte tabelle non hanno FK formali. Cancelliamo manualmente tutto in ordine.

-- Wipe applicativo (in ordine per evitare violazioni)
TRUNCATE TABLE
  public.messages,
  public.chat_participants,
  public.chat_rooms,
  public.notifications,
  public.coach_alerts,
  public.athlete_ai_insights,
  public.ai_usage_tracking,
  public.coach_knowledge_base,
  public.content_library,
  public.invite_tokens,
  public.invoices,
  public.athlete_subscriptions,
  public.billing_plans,
  public.coach_products,
  public.leaderboard_cache,
  public.habit_logs,
  public.athlete_habits,
  public.habits_library,
  public.daily_cycle_logs,
  public.athlete_cycle_settings,
  public.fms_tests,
  public.injuries,
  public.daily_metrics,
  public.daily_readiness,
  public.meal_logs,
  public.nutrition_logs,
  public.nutrition_plans,
  public.custom_foods
RESTART IDENTITY CASCADE;

-- Workout-related (nomi tabella possono variare; usa IF EXISTS)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'workout_logs','workouts','program_exercises','program_workouts',
    'program_days','program_weeks','program_plans','exercises',
    'user_badges','personal_records','check_ins'
  ]
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('TRUNCATE TABLE public.%I RESTART IDENTITY CASCADE', t);
    END IF;
  END LOOP;
END $$;

-- Profili: TRUNCATE CASCADE per pulire qualunque residuo
TRUNCATE TABLE public.profiles RESTART IDENTITY CASCADE;

-- Cancella TUTTI gli utenti auth (questo cascada anche identità, sessioni, refresh tokens)
DELETE FROM auth.users;
