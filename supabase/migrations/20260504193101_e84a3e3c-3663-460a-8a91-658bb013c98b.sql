-- 1. Helper: membership in a chat room (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_room_member(_room_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_participants
    WHERE room_id = _room_id
      AND user_id = _user_id
  );
$$;

-- 2. Helper: does _user_id share at least one room with _other_user_id?
CREATE OR REPLACE FUNCTION public.shares_room_with(_other_user_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_participants me
    JOIN public.chat_participants other
      ON other.room_id = me.room_id
    WHERE me.user_id = _user_id
      AND other.user_id = _other_user_id
  );
$$;

-- 3. Replace recursive policy on chat_participants
DROP POLICY IF EXISTS "Users can view participants in their rooms" ON public.chat_participants;
CREATE POLICY "Users can view participants in their rooms"
ON public.chat_participants
FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_room_member(room_id, auth.uid())
);

-- 4. Replace recursive policies on chat_rooms
DROP POLICY IF EXISTS "Users can view rooms they participate in" ON public.chat_rooms;
CREATE POLICY "Users can view rooms they participate in"
ON public.chat_rooms
FOR SELECT
USING (public.is_room_member(id, auth.uid()));

DROP POLICY IF EXISTS "Participants can update room" ON public.chat_rooms;
CREATE POLICY "Participants can update room"
ON public.chat_rooms
FOR UPDATE
USING (public.is_room_member(id, auth.uid()));

-- 5. Replace recursive policy on profiles (the one breaking login)
DROP POLICY IF EXISTS "Read profiles of shared chat rooms" ON public.profiles;
CREATE POLICY "Read profiles of shared chat rooms"
ON public.profiles
FOR SELECT
USING (public.shares_room_with(profiles.id, auth.uid()));