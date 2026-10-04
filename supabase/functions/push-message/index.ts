import { admin, authorized, sendPush } from "../_shared/push.ts";
Deno.serve(async (request) => {
  if (
    request.method !== "POST" ||
    !authorized(request, "MESSAGE_WEBHOOK_SECRET")
  )
    return new Response("Unauthorized", { status: 401 });
  try {
    const body = await request.json();
    const id = body.record?.id;
    if (typeof id !== "string")
      return new Response("Invalid message", { status: 400 });
    const db = admin();
    const { data: message, error } = await db
      .from("messages")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !message) return new Response("Unavailable", { status: 404 });
    const { data: links } = await db
      .from("brethren_links")
      .select("id")
      .eq("status", "accepted")
      .or(
        `and(requester_id.eq.${message.sender_id},receiver_id.eq.${message.receiver_id}),and(requester_id.eq.${message.receiver_id},receiver_id.eq.${message.sender_id})`,
      );
    if (!links?.length) return new Response("Link removed");
    const [{ data: sender }, { data: receiver }] = await Promise.all([
      db.from("profiles").select("*").eq("id", message.sender_id).single(),
      db.from("profiles").select("*").eq("id", message.receiver_id).single(),
    ]);
    let text = "New message";
    if (!receiver?.discreet_notifications && sender) {
      const name = `${sender.sex === "sister" ? "Sister" : "Brother"} ${sender.display_name}`;
      text =
        message.message_type === "pray_for_me"
          ? `${name} asks you to pray for ${sender.sex === "sister" ? "her" : "him"}.`
          : message.message_type === "praying"
            ? `${name} is praying for you.`
            : `${name} sent you a message.`;
    }
    await sendPush(
      message.receiver_id,
      {
        title: "Mortify",
        body: text,
        url: "/brethren/messages",
        tag: message.id,
      },
      message.message_type === "pray_for_me",
    );
    return new Response("Sent");
  } catch {
    return new Response("Notification delivery failed", { status: 500 });
  }
});
