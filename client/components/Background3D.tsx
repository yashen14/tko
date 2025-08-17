import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { FuturisticOrbBackground } from './FuturisticOrbBackground';

// Global context for 3D background state
interface Background3DContextType {
  isPaused: boolean;
  togglePause: () => void;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const Background3DContext = createContext<Background3DContextType>({
  isPaused: false,
  togglePause: () => {},
  enabled: true,
  setEnabled: () => {}
});

export const useBackground3D = () => useContext(Background3DContext);

interface Background3DProps {
  enabled?: boolean;
  className?: string;
}

export function Background3D({ enabled = true, className = "" }: Background3DProps) {
  const { isPaused } = useBackground3D();
  const [isLoaded, setIsLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const interactionTimeoutRef = useRef<NodeJS.Timeout>();

  if (!enabled) return null;

  return (
    <FuturisticOrbBackground
      enabled={enabled}
      className={className}
      isPaused={isPaused}
    />
  );
}

// Provider component for managing 3D background state
export function Background3DProvider({ children }: { children: React.ReactNode }) {
  const [isPaused, setIsPaused] = useState(false);
  const [enabled, setEnabled] = useState(true);

  const togglePause = () => {
    setIsPaused(!isPaused);
    
    // Add visual feedback
    if (!isPaused) {
      // Pausing - flash the screen briefly
      document.body.style.transition = 'filter 0.2s ease';
      document.body.style.filter = 'brightness(1.1)';
      setTimeout(() => {
        document.body.style.filter = '';
      }, 200);
    }
  };

  return (
    <Background3DContext.Provider value={{ isPaused, togglePause, enabled, setEnabled }}>
      {children}
    </Background3DContext.Provider>
  );
}
