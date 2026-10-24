// The Piper mark: a rat in one line whose tail becomes a pipe. Spec: docs/design/foundations/imagery.md

type Props = { width?: number; className?: string; label?: string; accentTail?: boolean };

export default function LineRat({ width = 40, className, label, accentTail = false }: Props) {
  const h = Math.round((width * 46) / 86);
  return (
    <svg
      width={width}
      height={h}
      viewBox="14 10 86 46"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
    >
      <path d="M70 30 C64 22 54 16 42 17 C30 18 22 26 22 34 C22 40 30 42 40 42 L62 42 C66 42 70 38 70 30" />
      <path d="M50 18 C50 11 58 11 58 18" />
      <circle cx="62" cy="27" r="1.7" fill="currentColor" stroke="none" />
      <g stroke={accentTail ? "var(--p-accent)" : "currentColor"}>
        <path d="M22 36 C12 38 9 46 17 50 L97 50" />
        {[72, 81, 90].map((x) => (
          <circle key={x} cx={x} cy={50} r={2.1} fill="var(--p-bg)" strokeWidth={1.5} />
        ))}
      </g>
    </svg>
  );
}
