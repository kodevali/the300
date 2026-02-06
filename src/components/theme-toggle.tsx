
"use client"

import * as React from "react"
import { Moon, Sun, Laptop } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const THEMES = ["light", "dark", "system"];

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    const currentThemeIndex = THEMES.indexOf(theme || 'system');
    const nextThemeIndex = (currentThemeIndex + 1) % THEMES.length;
    setTheme(THEMES[nextThemeIndex]);
  }

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    )
  }
  
  const currentIconTheme = theme === 'system' ? resolvedTheme : theme;

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme} className="relative overflow-hidden w-10 h-10">
       <Sun
        className={cn(
          "absolute h-[1.2rem] w-[1.2rem] transition-all duration-500",
          theme === 'light' ? "rotate-0 scale-100" : "-rotate-90 scale-0"
        )}
      />
      <Moon
        className={cn(
          "absolute h-[1.2rem] w-[1.2rem] transition-all duration-500",
          theme === 'dark' ? "rotate-0 scale-100" : "-rotate-90 scale-0"
        )}
      />
      <Laptop
        className={cn(
          "absolute h-[1.2rem] w-[1.2rem] transition-all duration-500",
          theme === 'system' ? "rotate-0 scale-100" : "-rotate-90 scale-0"
        )}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
