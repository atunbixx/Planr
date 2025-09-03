'use client';

import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Palette,
  Sparkles,
  FileText,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ThemeSwitcher: React.FC = () => {
  const [themeMode, setThemeMode] = useState<'default' | 'premium'>(() => {
    if (typeof window === 'undefined') return 'premium'
    return (localStorage.getItem('appTheme') as 'default' | 'premium') || 'premium'
  });

  // Apply root theme class
  React.useEffect(() => {
    const root = document.documentElement
    root.classList.remove('theme-classic', 'theme-premium')
    if (themeMode === 'default') root.classList.add('theme-classic')
    else root.classList.add('theme-premium')
    localStorage.setItem('appTheme', themeMode)
  }, [themeMode])

  const handleThemeSelect = (mode: 'default' | 'premium') => {
    setThemeMode(mode);
  };

  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "ml-2 h-8 w-8 p-0 transition-all duration-200",
                  themeMode === 'premium'
                    ? "bg-[#722F37] text-white hover:bg-[#5A252A]"
                    : "bg-transparent hover:bg-gray-100"
                )}
              >
                <Palette className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Switch Theme</p>
          </TooltipContent>
        </Tooltip>
        
        <DropdownMenuContent 
          align="end" 
          className={cn(
            "w-72 p-0",
            themeMode === 'premium' ? "rounded-lg" : "rounded-none"
          )}
        >
          <div className="px-3 py-2">
            <DropdownMenuLabel className="text-sm font-medium text-muted-foreground">
              Choose Your Theme
            </DropdownMenuLabel>
          </div>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => handleThemeSelect('default')}
            className={cn(
              "flex items-start gap-3 p-3 cursor-pointer",
              themeMode === 'premium' ? "mx-1 my-1 rounded-md" : "mx-0 my-0 rounded-none",
              themeMode === 'default' && "bg-accent"
            )}
          >
            <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Classic Minimalist</span>
                {themeMode === 'default' && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                New York–style editorial layout, bold typography, minimalist chrome
              </p>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => handleThemeSelect('premium')}
            className={cn(
              "flex items-start gap-3 p-3 cursor-pointer",
              themeMode === 'premium' ? "mx-1 my-1 rounded-md" : "mx-0 my-0 rounded-none",
              themeMode === 'premium' && "bg-accent"
            )}
          >
            <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#722F37]" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Million Dollar UI</span>
                <Badge 
                  variant="secondary" 
                  className="h-4 px-1.5 text-xs font-semibold bg-[#722F37] text-white hover:bg-[#722F37]"
                >
                  Premium
                </Badge>
                {themeMode === 'premium' && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Modern gradients, smooth animations & premium feel
              </p>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="my-2" />
          
          <div className="px-3 py-2">
            <p className="text-xs text-muted-foreground">
              Theme preference is saved automatically
            </p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
};

export default ThemeSwitcher;
