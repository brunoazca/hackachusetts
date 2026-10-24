// The Piper mark: a rat in one continuous line whose tail becomes a pipe.
// Spec: docs/design/foundations/imagery.md — viewBox 14 10 86 46, pipe at y=50,
// three holes at x=72/81/90 (r 2.1, stroke 1.5), tail+holes in accent only in lockups.

type Props = {
  width?: number;
  className?: string;
  label?: string;
  accentTail?: boolean;
};

export default function LineRat({
  width = 40,
  className,
  label,
  accentTail = false,
}: Props) {
  const strokeWidth = width >= 96 ? 1.7 : 2.2;

  return (
    <svg
      width={width}
      height={Math.round((width * 46) / 86)}
      viewBox="14 10 86 46"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* One contour: rear paw, belly, forepaw, muzzle, ear, back, haunch. */}
      <path
        d="M58 42 H50
           Q50.5 40 53 38
           C47 39 43 38.5 39 37.5
           L34 40 H29
           Q30 38 32 36
           C26 36 21 35 18 34
           L29.5 29
           Q32.5 25.5 36.5 24
           C33.5 21.5 34.5 17.5 38 18
           C42 18.5 42 22 39 24.5
           C46 20 54 17.5 62 21
           C70 24.5 74 34 67 40"
      />
      <circle cx={18} cy={34} r={1.3} fill="currentColor" stroke="none" />
      <circle cx={31.5} cy={31.2} r={1.2} fill="currentColor" stroke="none" />

      {/* Same endpoint and tangent as the haunch; horizontal at the pipe. */}
      <g stroke={accentTail ? "var(--p-accent)" : "currentColor"}>
        <path d="M67 40 C63.5 43 57 44.5 57 47 C57 49 61 50 66 50 H97" />
        <circle cx={72} cy={50} r={2.1} strokeWidth={1.5} fill="var(--p-bg)" />
        <circle cx={81} cy={50} r={2.1} strokeWidth={1.5} fill="var(--p-bg)" />
        <circle cx={90} cy={50} r={2.1} strokeWidth={1.5} fill="var(--p-bg)" />
      </g>
    </svg>
  );
}
