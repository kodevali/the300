
"use client"

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

export function Logo({ forceTheme }: { forceTheme?: 'light' | 'dark' }) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = forceTheme || (theme === "system" ? resolvedTheme : theme);

  const logoSrc = currentTheme === 'dark' 
    ? "https://www.jsbl.com/wp-content/uploads/2024/07/JS-logo-dark.webp"
    : "https://www.jsbl.com/wp-content/uploads/2024/07/JS-logo-blue.webp";
  
  if (!mounted) {
    // Render a placeholder or nothing on the server to avoid hydration mismatch
    return <div style={{width: '102px', height: '32px'}} />; // Placeholder with similar size
  }

  return (
    <div className="flex items-center gap-2">
      <Image
        data-ai-hint="logo"
        src={logoSrc}
        alt="JS Bank Logo"
        width={102}
        height={32}
        className="h-8 w-auto"
        priority
        unoptimized
      />
    </div>
  );
}
