'use client';

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MessageSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function MessageSearch({
  onSearch,
  placeholder = 'Search messages...',
  className,
}: MessageSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
    setIsSearching(false);
  };

  const handleFocus = () => {
    setIsSearching(true);
  };

  const handleBlur = () => {
    if (!query) {
      setIsSearching(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search suggestions or results preview */}
      {isSearching && query.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-2 z-50">
          <div className="text-sm text-gray-500 dark:text-gray-400 p-2">
            Searching for "{query}"...
          </div>
          {/* TODO: Add search results preview here */}
        </div>
      )}
    </div>
  );
}