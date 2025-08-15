import * as React from 'react'
import { cn } from '@/lib/utils'

interface WeddingPageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  action?: React.ReactNode
  centered?: boolean
}

export function WeddingPageHeader({ 
  className,
  title,
  subtitle,
  action,
  centered = false,
  ...props 
}: WeddingPageHeaderProps) {
  return (
    <div 
      className={cn(
        'mb-8 sm:mb-12 lg:mb-16',
        centered && 'text-center',
        className
      )} 
      {...props}
    >
      <div className={cn(
        'flex items-start justify-between',
        centered && 'flex-col items-center'
      )}>
        <div className={cn(centered && 'text-center')}>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide text-gray-900 uppercase mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base lg:text-lg font-light text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
        {action && !centered && (
          <div className="ml-auto">
            {action}
          </div>
        )}
      </div>
      {action && centered && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  )
}

interface WeddingHeroHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  topLine?: string
  mainLine: string
  bottomLine?: string
  subtitle?: string
}

export function WeddingHeroHeader({ 
  className,
  topLine,
  mainLine,
  bottomLine,
  subtitle,
  ...props 
}: WeddingHeroHeaderProps) {
  return (
    <div 
      className={cn(
        'text-center mb-8 sm:mb-12 lg:mb-16',
        className
      )} 
      {...props}
    >
      {topLine && (
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-wide text-gray-900 mb-2 sm:mb-4 uppercase">
          {topLine}
        </h1>
      )}
      <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-wide text-gray-900 mb-4 sm:mb-8 uppercase">
        {mainLine}
      </h2>
      {bottomLine && (
        <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light tracking-wide text-gray-900 mb-4 sm:mb-8 uppercase">
          {bottomLine}
        </h3>
      )}
      {subtitle && (
        <p className="text-sm sm:text-base lg:text-lg font-light text-gray-600 tracking-wide px-4">
          {subtitle}
        </p>
      )}
    </div>
  )
}

interface WeddingSectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function WeddingSectionHeader({ 
  className,
  title,
  subtitle,
  action,
  ...props 
}: WeddingSectionHeaderProps) {
  return (
    <div 
      className={cn(
        'mb-6',
        className
      )} 
      {...props}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-2">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm font-light text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <div>
            {action}
          </div>
        )}
      </div>
    </div>
  )
}