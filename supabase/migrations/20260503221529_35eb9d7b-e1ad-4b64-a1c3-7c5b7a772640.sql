
-- ============================================================
-- SECURITY HARDENING MIGRATION
-- ============================================================

-- ============================================================
-- 1) PROFILES: replace blanket SELECT with scoped policies
-- ============================================================
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.profiles;

-- Helper: is the current user the coach of this profile?
CREATE OR REPLACE FUNCTION public.is_my_athlete(_athlete_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _athlete_id AND coach_id = auth.uid()
  );
$$;

-- Helper: is this profile my coach?
CREATE OR REPLACE FUNCTION public.is_my_coach(_coach_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND coach_id = _coach_id
  );
$$;

-- Own profile: full read
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid());

-- Coach can read profiles of their own athletes
CREATE POLICY "Coaches can read their athletes"
ON public.profiles FOR SELECT TO authenticated
USING (coach_id = auth.uid());

-- Athletes can read their own coach's profile
CREATE POLICY "Athletes can read their coach"
ON public.profiles FOR SELECT TO authenticated
USING (public.is_my_coach(id));

-- Chat-participants discovery: any user can read profiles of users they share a chat room with
CREATE POLICY "Read profiles of shared chat rooms"
ON public.profiles FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1
  FROM public.chat_participants me
  JOIN public.chat_participants other
    ON other.room_id = me.room_id
  WHERE me.user_id = auth.uid()
    AND other.user_id = public.profiles.id
));

-- ============================================================
-- 2) INVITE_TOKENS: hide raw token from client reads
-- ============================================================
REVOKE SELECT ON public.invite_tokens FROM anon, authenticated;
GRANT SELECT (id, email, full_name, coach_id, used, expires_at, created_at)
  ON public.invite_tokens TO authenticated;

-- ============================================================
-- 3) WORKOUTS INSERT: require coach-of-athlete relationship
-- ============================================================
DROP POLICY IF EXISTS "Coaches can insert workouts" ON public.workouts;

CREATE POLICY "Coaches can insert workouts for their athletes"
ON public.workouts FOR INSERT TO authenticated
WITH CHECK (
  coach_id = auth.uid()
  AND (
    athlete_id = auth.uid()
    OR public.is_coach_of_athlete(athlete_id)
  )
);

-- ============================================================
-- 4) NOTIFICATIONS: restrict recipient to known relationships
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;

CREATE POLICY "Users can send notifications to related users"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (
  (sender_id = auth.uid() OR sender_id IS NULL)
  AND (
    user_id = auth.uid()                              -- self-notify (system-style)
    OR public.is_coach_of_athlete(user_id)            -- coach -> own athlete
    OR public.is_my_coach(user_id)                    -- athlete -> own coach
  )
);

-- ============================================================
-- 5) LEADERBOARD: respect leaderboard_anonymous opt-out
-- ============================================================
DROP POLICY IF EXISTS "Athletes can view same-coach leaderboard" ON public.leaderboard_cache;

CREATE POLICY "Athletes can view same-coach leaderboard (respect anonymous)"
ON public.leaderboard_cache FOR SELECT TO authenticated
USING (
  coach_id IN (SELECT p.coach_id FROM public.profiles p WHERE p.id = auth.uid())
  AND (
    user_id = auth.uid()
    OR NOT COALESCE(
        (SELECT pr.leaderboard_anonymous FROM public.profiles pr WHERE pr.id = leaderboard_cache.user_id),
        false
    )
  )
);

-- ============================================================
-- 6) FOOD-PHOTOS bucket: make private + scoped policies
-- ============================================================
UPDATE storage.buckets SET public = false WHERE id = 'food-photos';

DROP POLICY IF EXISTS "Food photos owner read" ON storage.objects;
DROP POLICY IF EXISTS "Food photos coach read" ON storage.objects;
DROP POLICY IF EXISTS "Food photos owner write" ON storage.objects;
DROP POLICY IF EXISTS "Food photos owner update" ON storage.objects;
DROP POLICY IF EXISTS "Food photos owner delete" ON storage.objects;

CREATE POLICY "Food photos owner read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'food-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Food photos coach read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'food-photos'
  AND public.is_coach_of_athlete(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Food photos owner write"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'food-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Food photos owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'food-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Food photos owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'food-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
