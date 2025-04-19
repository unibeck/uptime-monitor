import React from "react";

interface WavesProps {
  size?: string;
  className?: string;
  color?: string;
}

export function Waves({
  size = "40px_40px",
  className = "",
  color = "#55555533",
}: WavesProps) {
  return (
    <div
      className={`absolute inset-0 bg-[linear-gradient(45deg,#ffffff33_50%,transparent_50%),linear-gradient(-45deg,${color}_50%,transparent_50%)] bg-[size:20px_20px] ${className}`}
    />
  );
}
