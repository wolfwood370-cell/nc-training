## Problema

Dopo il login (200 OK su `/auth/v1/token`), l'app atleta resta bloccata perché ogni `SELECT` su `public.profiles` ritorna **HTTP 500**:

```
code: 42P17
message: infinite recursion detected in policy for relation "chat_participants"
```

Senza il profilo dell'utente, il router non può decidere il redirect e l'app non parte.

## Causa

Due policy RLS si auto-referenziano:

1. **`chat_participants` — SELECT "Users can view participants in their rooms"**
   ```sql
   USING (
     user_id = auth.uid()
     OR EXISTS (
       SELECT 1 FROM chat_participants cp  -- <-- stessa tabella, riapplica la policy
       WHERE cp.room_id = chat_participants.room_id AND cp.user_id = auth.uid()
     )
   )
   ```

2. **`profiles` — SELECT "Read profiles of shared chat rooms"** fa JOIN su `chat_participants`, quindi eredita la stessa ricorsione anche per query banali tipo `select * from profiles where id = auth.uid()`.

Stesso pattern ricorsivo presente anche nelle policy di `chat_rooms`.

## Fix

Sostituire le subquery dirette con **SECURITY DEFINER functions** (pattern già usato per `is_coach_of_athlete`), che bypassano RLS internamente ed evitano la ricorsione.

### Migrazione SQL

1. Creare due helper:
   - `public.is_room_member(_room_id uuid, _user_id uuid) returns boolean` — controlla membership leggendo `chat_participants` con `SECURITY DEFINER`, `STABLE`, `set search_path = public`.
   - `public.shares_room_with(_other_user_id uuid, _user_id uuid) returns boolean` — true se l'utente corrente condivide almeno una room con `_other_user_id`.

2. Droppare e ricreare le policy ricorsive usando le funzioni:
   - `chat_participants` SELECT → `USING (user_id = auth.uid() OR public.is_room_member(room_id, auth.uid()))`
   - `chat_rooms` SELECT → `USING (public.is_room_member(id, auth.uid()))`
   - `chat_rooms` UPDATE → idem
   - `profiles` SELECT "Read profiles of shared chat rooms" → `USING (public.shares_room_with(profiles.id, auth.uid()))`

3. Lasciare invariate le altre policy di `profiles` (own profile, coach/athlete) e di `chat_participants` (INSERT/UPDATE/DELETE).

## Verifica

Dopo la migrazione:
- `select * from profiles where id = auth.uid()` deve tornare **200** con la riga.
- Login atleta → dashboard si carica regolarmente.
- La chat continua a mostrare solo room/partecipanti dell'utente.

## Note

Nessuna modifica al frontend è necessaria. Il fix è interamente lato database.
