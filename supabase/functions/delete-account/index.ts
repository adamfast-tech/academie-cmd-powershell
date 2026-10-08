// Suppression de son propre compte (profil, progression et historique suivent en cascade).
// L'authentification est faite ici : le jeton de session est vérifié auprès de Supabase Auth.
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED = ["https://adamfast-tech.github.io"];

function cors(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED.includes(origin) ? origin : ALLOWED[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

Deno.serve(async (req: Request) => {
  const h = cors(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...h, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") return new Response("ok", { headers: h });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Non connecté" }, 401);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin.auth.getUser(jwt);
  if (error || !data?.user) return json({ error: "Session invalide ou expirée" }, 401);

  const del = await admin.auth.admin.deleteUser(data.user.id);
  if (del.error) return json({ error: del.error.message }, 500);

  return json({ ok: true });
});
