import { Brand } from "./Page";
// Shows where the user is in a short sequence. Orientation only, not a score.
export function Steps({ step, count }: { step: number; count: number }) {
  return (
    <div
      className="steps"
      role="progressbar"
      aria-label="Progress"
      aria-valuemin={1}
      aria-valuemax={count}
      aria-valuenow={step + 1}
      aria-valuetext={`Step ${step + 1} of ${count}`}
    >
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={i <= step ? "done" : undefined} />
      ))}
    </div>
  );
}
export function OnboardingBar({ step }: { step: number }) {
  return (
    <>
      <Brand />
      <Steps step={step} count={5} />
    </>
  );
}
