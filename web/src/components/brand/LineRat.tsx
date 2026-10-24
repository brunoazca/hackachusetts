// The Listener: an upright rat whose tail sweeps beneath it into a pipe.
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
  const hero = width >= 96;

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
      strokeWidth={hero ? 1.7 : 2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g className="piper-rat">
        <path
          d="M46 43
             Q35 45 28 40
             C24 36 28 24 38 20
             C35 16 38 12 42 14
             C46 16 45 20 42 22
             C48 18 54 21 61 24
             C55 27 51 28 48 31
             C45 34 45 37 49 37"
        />

        {/* Round-capped points keep the eye and nose visible at small sizes. */}
        <path className="piper-eye" d="M50.5 25 h0" strokeWidth={hero ? 2.6 : 3.4} />
        <path className="piper-nose" d="M61 24 h0" strokeWidth={hero ? 2.8 : 3.6} />
      </g>
      <g stroke={accentTail ? "var(--p-accent)" : "currentColor"}>
        <path
          className="piper-tail"
          d="M28 40 C20 42 19 46 28 48 C37 50 49 50 66 50 H97"
          strokeWidth={hero ? 2.2 : 2.8}
        />
        <circle cx={72} cy={50} r={2.1} strokeWidth={1.5} fill="var(--p-bg)" />
        <circle cx={81} cy={50} r={2.1} strokeWidth={1.5} fill="var(--p-bg)" />
        <circle cx={90} cy={50} r={2.1} strokeWidth={1.5} fill="var(--p-bg)" />
      </g>
    </svg>
  );
}
