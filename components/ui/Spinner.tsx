import React from 'react';

type Props = {
  size?: number;
  className?: string;
};

// Slim, modern spinner with dark accent. In light mode it uses a dark slate;
// in dark mode it switches to a subtle accent color (sky/teal).
export default function Spinner({ size = 20, className = '' }: Props) {
  return (
    <svg
      className={`animate-spin ${className} text-slate-900 dark:text-sky-400`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* faint ring */}
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.12" />
      {/* slim arc */}
      <path
        d="M4 12a8 8 0 018-8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
