import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userData.user.id;

    const { athlete_id } = await req.json();
    if (!athlete_id) {
      return new Response(JSON.stringify({ error: "Missing athlete_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Verify caller is the athlete's coach
    const { data: profile, error: pErr } = await admin
      .from("profiles")
      .select("id, coach_id, role")
      .eq("id", athlete_id)
      .maybeSingle();

    if (pErr || !profile) {
      return new Response(JSON.stringify({ error: "Athlete not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("delete-athlete auth check", { callerId, athlete_id, profileCoachId: profile.coach_id });
    if (profile.coach_id !== callerId) {
      return new Response(JSON.stringify({ error: "Not authorized", debug: { callerId, profileCoachId: profile.coach_id } }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete profile (cascades to all athlete data)
    const { error: delProfileErr } = await admin
      .from("profiles")
      .delete()
      .eq("id", athlete_id);
    if (delProfileErr) throw delProfileErr;

    // Delete auth user
    const { error: delAuthErr } = await admin.auth.admin.deleteUser(athlete_id);
    if (delAuthErr) {
      console.error("Auth user deletion failed:", delAuthErr);
      // Profile already gone — not fatal
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("delete-athlete error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
