import React from "react";

interface PolkaDotsProps {
  className?: string;
  color?: string;
  dotColor?: string;
}

export function PolkaDots({
  className = "",
  color = "transparent",
  dotColor = "#ffffff33",
}: PolkaDotsProps) {
  return (
    <div
      className={`absolute inset-0 bg-[radial-gradient(${dotColor}_1px,${color}_2px)] bg-[size:16px_16px] ${className}`}
    />
  );
}
