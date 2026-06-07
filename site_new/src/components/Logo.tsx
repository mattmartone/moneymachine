import React from 'react';
interface LogoProps {
  className?: string;
}
export function Logo({ className = 'w-16 h-16' }: LogoProps) {
  return (
    <img
      src="/Screenshot_2026-06-06_at_9.45.28_PM.png"
      alt="Fade the Chalk logo — a horse head smoking a cigarette"
      className={`${className} object-contain mix-blend-multiply`}
      style={{
        imageRendering: 'crisp-edges'
      }} />);


}