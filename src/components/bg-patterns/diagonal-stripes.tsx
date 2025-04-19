import React from "react";

interface DiagonalStripesProps {
  className?: string;
  color?: string;
  stripeColor?: string;
}

export function DiagonalStripes({
  className = "",
  color = "transparent",
  stripeColor = "#ffffff33",
}: DiagonalStripesProps) {
  return (
    <div
      className={`absolute inset-0 bg-[linear-gradient(45deg,${stripeColor}_25%,${color}_25%,${color}_50%,${stripeColor}_50%,${stripeColor}_75%,${color}_75%,${color}_100%)] bg-[size:40px_40px] ${className}`}
    />
  );
}
