export function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\s*\n/).map((paragraph, i) => (
        <p key={i}>{paragraph.trim()}</p>
      ))}
    </>
  );
}
