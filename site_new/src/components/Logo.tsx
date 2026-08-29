import React from 'react';
interface LogoProps {
  className?: string;
}
export function Logo({ className = 'w-16 h-16' }: LogoProps) {
  return (
    <img
      src="/ftc-logo.png"
      alt="Fade the Chalk"
      className={`${className} object-contain`} />);


}