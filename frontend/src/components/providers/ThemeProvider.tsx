"use client";

import { useEffect, type ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, []);

  return <>{children}</>;
}
