import React from 'react';
import { cn } from '@/lib/utils';

interface AILoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AILoadingSpinner({ className, size = 'md' }: AILoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const boxSize = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn('relative', sizeClasses[size])}>
        {/* Four boxes in a square formation */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Top-left box */}
          <div
            className={cn(
              'absolute bg-gradient-to-br from-blue-500 to-purple-600 rounded-sm',
              boxSize[size],
              'animate-pulse'
            )}
            style={{
              top: '20%',
              left: '20%',
              animationDelay: '0s',
              animationDuration: '1.5s'
            }}
          />
          {/* Top-right box */}
          <div
            className={cn(
              'absolute bg-gradient-to-br from-purple-500 to-pink-600 rounded-sm',
              boxSize[size],
              'animate-pulse'
            )}
            style={{
              top: '20%',
              right: '20%',
              animationDelay: '0.3s',
              animationDuration: '1.5s'
            }}
          />
          {/* Bottom-right box */}
          <div
            className={cn(
              'absolute bg-gradient-to-br from-pink-500 to-red-600 rounded-sm',
              boxSize[size],
              'animate-pulse'
            )}
            style={{
              bottom: '20%',
              right: '20%',
              animationDelay: '0.6s',
              animationDuration: '1.5s'
            }}
          />
          {/* Bottom-left box */}
          <div
            className={cn(
              'absolute bg-gradient-to-br from-red-500 to-orange-600 rounded-sm',
              boxSize[size],
              'animate-pulse'
            )}
            style={{
              bottom: '20%',
              left: '20%',
              animationDelay: '0.9s',
              animationDuration: '1.5s'
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default AILoadingSpinner;
