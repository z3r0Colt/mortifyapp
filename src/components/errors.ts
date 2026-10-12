// Plain words for failures that would otherwise show technical text: network
// faults, database rules, the browser's own passkey and push messages.
export function plainError(
  e: unknown,
  fallback = "That did not work. Please try again.",
) {
  const message = e instanceof Error ? e.message : "";
  const name = e instanceof Error ? e.name : "";
  if (!message) return fallback;
  if (
    /failed to fetch|networkerror|load failed|network request failed|fetch failed/i.test(
      message,
    )
  )
    return "Mortify could not reach the internet. Please check your connection and try again.";
  if (
    name === "NotAllowedError" ||
    /webauthn|not allowed by the user agent|timed out or was not allowed/i.test(
      message,
    )
  )
    return "The fingerprint or face check did not finish. Please try again.";
  if (/registration failed|push service/i.test(message))
    return "This browser could not turn on notifications. Please try again.";
  if (/non-2xx status code|edge function/i.test(message))
    return "Mortify could not finish that just now. Please try again in a moment.";
  if (
    /violates (check|foreign key|not-null|unique) constraint|duplicate key value|permission denied|invalid input syntax|relation "|column "/i.test(
      message,
    )
  )
    return fallback;
  return message;
}
