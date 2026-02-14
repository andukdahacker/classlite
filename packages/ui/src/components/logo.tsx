import * as React from "react";

interface LogoMarkProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

function LogoMark({ size = 40, className, ...props }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="8" fill="url(#logo-bg)" />
      <path
        d="M28 8C28 8 20 10 15 16C10 22 9 28 10 32L19 22Z"
        fill="white"
        opacity="0.4"
      />
      <path
        d="M28 8C28 8 30 14 28 20C26 26 22 30 19 32L19 22Z"
        fill="white"
        opacity="0.8"
      />
      <line
        x1="28"
        y1="8"
        x2="10"
        y2="34"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.9"
      />
      <line
        x1="24"
        y1="13"
        x2="16"
        y2="19"
        stroke="white"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.35"
      />
      <line
        x1="21"
        y1="18"
        x2="13"
        y2="24"
        stroke="white"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
  showWordmark?: boolean;
}

function Logo({ size = 36, showWordmark = true, className, ...props }: LogoProps) {
  return (
    <div
      className={`flex items-center gap-3 ${className ?? ""}`}
      {...props}
    >
      <LogoMark size={size} />
      {showWordmark && (
        <span
          className="font-heading text-xl font-semibold tracking-tight text-foreground"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          ClassLite
        </span>
      )}
    </div>
  );
}

export { Logo, LogoMark };
