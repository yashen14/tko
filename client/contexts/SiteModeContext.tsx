import React, { createContext, useContext, useState, useEffect } from 'react';

type SiteMode = 'work' | 'easy';

interface SiteModeContextType {
  siteMode: SiteMode;
  setSiteMode: (mode: SiteMode) => void;
  toggleSiteMode: () => void;
}

const SiteModeContext = createContext<SiteModeContextType | undefined>(undefined);

export function SiteModeProvider({ children }: { children: React.ReactNode }) {
  const [siteMode, setSiteMode] = useState<SiteMode>(() => {
    const saved = localStorage.getItem('siteMode');
    return (saved as SiteMode) || 'work';
  });

  useEffect(() => {
    localStorage.setItem('siteMode', siteMode);
    
    // Add CSS class to body for site mode styling
    document.body.classList.remove('work-mode', 'easy-mode');
    document.body.classList.add(`${siteMode}-mode`);
  }, [siteMode]);

  const toggleSiteMode = () => {
    setSiteMode(prev => prev === 'work' ? 'easy' : 'work');
  };

  return (
    <SiteModeContext.Provider value={{ siteMode, setSiteMode, toggleSiteMode }}>
      {children}
    </SiteModeContext.Provider>
  );
}

export function useSiteMode() {
  const context = useContext(SiteModeContext);
  if (context === undefined) {
    throw new Error('useSiteMode must be used within a SiteModeProvider');
  }
  return context;
}
