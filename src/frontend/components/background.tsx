import React from 'react';

interface BackgroundProps {
  children: React.ReactNode;
}

export default function Background({ children }: BackgroundProps) {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="-top-40 -right-32 absolute bg-purple-500 opacity-70 blur-xl rounded-full w-80 h-80 animate-blob mix-blend-multiply filter"></div>
        <div className="-bottom-40 -left-32 absolute bg-yellow-500 opacity-70 blur-xl rounded-full w-80 h-80 animate-blob animation-delay-2000 mix-blend-multiply filter"></div>
        <div className="top-40 left-40 absolute bg-pink-500 opacity-70 blur-xl rounded-full w-80 h-80 animate-blob animation-delay-4000 mix-blend-multiply filter"></div>
      </div>
      
      {/* Content */}
      <div className="z-10 relative">
        {children}
      </div>
    </div>
  );
} 