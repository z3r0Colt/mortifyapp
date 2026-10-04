import { admin } from "../_shared/push.ts";
Deno.serve(async (request) => {
  const origin = request.headers.get("origin") ?? "";
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((s) => s.trim());
  const headers = {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : "",
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  if (origin && !allowed.includes(origin))
    return new Response("Origin not allowed", { status: 403, headers });
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers });
  if (request.method !== "POST")
    return new Response("Method not allowed", { status: 405, headers });
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return new Response("Unauthorized", { status: 401, headers });
  const db = admin();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user)
    return new Response("Unauthorized", { status: 401, headers });
  const removed = await db.auth.admin.deleteUser(data.user.id);
  if (removed.error)
    return new Response("Could not delete account", { status: 500, headers });
  return Response.json({ deleted: true }, { headers });
});
