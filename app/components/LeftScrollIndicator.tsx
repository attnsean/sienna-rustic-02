"use client";

import { useState, useEffect } from "react";

export default function LeftScrollIndicator() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleOpen = () => setVisible(true);
    window.addEventListener("sr:open", handleOpen);
    return () => window.removeEventListener("sr:open", handleOpen);
  }, []);

  return (
    <div 
      className={`absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 text-[11px] font-sans tracking-[0.25em] text-[#5C4E43]/70 select-none pointer-events-none z-20 transition-opacity duration-1000 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <span className="[writing-mode:vertical-rl] rotate-180 uppercase text-[10px] font-mono">scroll</span>
      <span className="text-sm animate-bounce">↓</span>
    </div>
  );
}
