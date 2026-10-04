import type { Reading } from "../content/loader";
import { Scripture } from "./Scripture";
export function ContentReading({
  reading,
  prominent = false,
}: {
  reading: Reading;
  prominent?: boolean;
}) {
  return "ref" in reading ? (
    <Scripture reference={reading.ref} />
  ) : (
    <>
      <p className={prominent ? "verse" : undefined}>{reading.text}</p>
      <small className="attribution">
        <strong>{reading.author}</strong> · {reading.source}
      </small>
    </>
  );
}
