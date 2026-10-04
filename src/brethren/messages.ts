import { cloud, result } from "./client";
export type MessageType =
  "pray_for_me" | "praying" | "checking_in" | "reply" | "encouragement";
export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_type: MessageType;
  body: string | null;
  parent_message_id: string | null;
  read: boolean;
  created_at: string;
  answered_at: string | null;
  client_id: string;
  battle_id: string | null;
};
export function plainMessage(text: string) {
  return text
    .replace(/(?:https?:\/\/\S+|www\.\S+|[a-z0-9-]+\.[a-z]{2,}\S*)/gi, "")
    .trim();
}
export async function sendMessage(
  receiver: string,
  type: MessageType,
  body?: string,
  parent?: string,
  battle?: string,
  clientId = crypto.randomUUID(),
) {
  if (body && body.length > 500)
    throw new Error("Keep your message to 500 characters.");
  return result(
    cloud().rpc("send_message", {
      p_receiver: receiver,
      p_type: type,
      p_body: body ? plainMessage(body) : null,
      p_parent: parent ?? null,
      p_battle: battle ?? null,
      p_client: clientId,
    }),
  );
}
export function messageText(message: Message) {
  return message.message_type === "pray_for_me"
    ? "Please pray for me."
    : message.message_type === "praying"
      ? "I'm praying for you."
      : message.message_type === "checking_in"
        ? "How is your soul today?"
        : (message.body ?? "");
}
