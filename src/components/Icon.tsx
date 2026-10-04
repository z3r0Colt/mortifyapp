// Small line icons drawn inline so they work offline without an icon library.
const paths = {
  home: "M3.5 10.5 12 3.5l8.5 7V19a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6h-5v6H5A1.5 1.5 0 0 1 3.5 19z",
  pen: "M4 20l4.2-1L19 8.2a2.1 2.1 0 0 0-3-3L5.2 16zM14.5 6.7l3 3",
  people:
    "M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c0-3.6 2.9-6.2 6.5-6.2s6.5 2.6 6.5 6.2M16.5 11a2.8 2.8 0 1 0-1-5.4M17.5 14c2.4.5 4 2.9 4 5.5",
  sliders:
    "M4 7h9M18 7h2M4 17h3M12 17h8M15.5 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM9.5 19.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4",
  moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z",
  book: "M5 19V5.5A2.5 2.5 0 0 1 7.5 3H19v13.5H7.5A2.5 2.5 0 0 0 5 19zM5 19a2.5 2.5 0 0 0 2.5 2.5H19v-5",
  exit: "M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M9 16l4-4-4-4M13 12H3",
  arrow: "M5 12h14M13 6l6 6-6 6",
  chevron: "m9 6 6 6-6 6",
  back: "m15 6-6 6 6 6",
  close: "M6 6l12 12M18 6 6 18",
  turn: "M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11",
  lock: "M6.5 11h11a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-7A1.5 1.5 0 0 1 6.5 11zM8 11V8a4 4 0 0 1 8 0v3",
  shield: "M12 3l7.5 3v5.5c0 4.6-3.2 8.4-7.5 9.5-4.3-1.1-7.5-4.9-7.5-9.5V6z",
  bell: "M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15zM10 21h4",
  message:
    "M4.5 5h15A1.5 1.5 0 0 1 21 6.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-5 4V6.5A1.5 1.5 0 0 1 4.5 5z",
  plus: "M12 5v14M5 12h14",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  phone:
    "M5 3.5h3.5l2 5L8 10a11 11 0 0 0 6 6l1.5-2.5 5 2V19a2 2 0 0 1-2 2A16.5 16.5 0 0 1 3 5.5a2 2 0 0 1 2-2z",
  share: "M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7",
  flag: "M5 21V4M5 4h12l-2.5 4L17 12H5",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  grid: "M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  refresh: "M20 11a8 8 0 1 0-2.4 5.7M20 4v7h-7",
  more: "M12 6.5h.01M12 12h.01M12 17.5h.01",
  mail: "M4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11A1.5 1.5 0 0 1 4.5 5zM3.5 7l8.5 6 8.5-6",
  download: "M12 4v11M8 11l4 4 4-4M5 20h14",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
} as const;
export type IconName = keyof typeof paths;
export function Icon({
  name,
  size = 22,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === "more" ? 3 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
