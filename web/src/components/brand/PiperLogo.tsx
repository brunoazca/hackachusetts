import { Fraunces } from "next/font/google";
import LineRat from "./LineRat";
import "./PiperLogo.css";

const wordmark = Fraunces({
  subsets: ["latin"],
  weight: "600",
  style: "italic",
  display: "swap",
});

type Props = {
  width?: number;
  className?: string;
  accentTail?: boolean;
};

export default function PiperLogo({
  width = 72,
  className,
  accentTail = true,
}: Props) {
  return (
    <span
      role="img"
      aria-label="Piper"
      className={`relative inline-block shrink-0 overflow-hidden align-middle text-fg [--p-accent:var(--p-return)] ${className ?? ""}`}
      style={{ width, height: Math.round(width * 0.44) }}
    >
      <LineRat width={width} className="piper-logo-mark absolute bottom-0 left-0 block" accentTail={accentTail} />
      <span
        aria-hidden="true"
        className={`${wordmark.className} absolute whitespace-nowrap leading-none tracking-[-0.035em]`}
        style={{
          // Match the pipe's endpoint, leaving a little air beside the rat.
          right: `${((100 - 90.1) / 86) * 100}%`,
          bottom: "30%",
          fontSize: width * 0.2,
        }}
      >
        Piper
      </span>
    </span>
  );
}
