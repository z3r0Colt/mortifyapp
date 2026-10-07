import type { ReactNode } from "react";
// Mortify's buttons are plain buttons (see Action), and a browser submits a
// form on Enter by itself only when it has a single field. This form makes
// Enter, and the Go key on a phone keyboard, press its primary button however
// many fields it has, so the button's own errors still show.
export function ActionForm({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <form
      className={className}
      onSubmit={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (
          e.key !== "Enter" ||
          e.nativeEvent.isComposing ||
          !(e.target instanceof HTMLInputElement)
        )
          return;
        e.preventDefault();
        (
          e.currentTarget.querySelector(
            "button.primary",
          ) as HTMLButtonElement | null
        )?.click();
      }}
    >
      {children}
    </form>
  );
}
