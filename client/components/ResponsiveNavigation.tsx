import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  adminOnly?: boolean;
  apolloExcluded?: boolean;
}

interface ResponsiveNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  navItems: NavItem[];
  userRole: string;
  className?: string;
}

export function ResponsiveNavigation({
  activeTab,
  setActiveTab,
  navItems,
  userRole,
  className = '',
}: ResponsiveNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly && userRole !== 'admin') return false;
    if (item.apolloExcluded && userRole === 'apollo') return false;
    return true;
  });

  // Responsive breakpoints to ensure tabs overflow properly
  const getVisibleTabCount = () => {
    if (typeof window === 'undefined') return 8; // Default for SSR

    const width = window.innerWidth;
    // More conservative limits to ensure proper overflow behavior
    if (width >= 2560) return Math.min(filteredNavItems.length, 12); // 4K screens
    if (width >= 1920) return Math.min(filteredNavItems.length, 10); // Full HD
    if (width >= 1600) return Math.min(filteredNavItems.length, 9);  // Large desktop
    if (width >= 1400) return Math.min(filteredNavItems.length, 8);  // Desktop
    if (width >= 1280) return Math.min(filteredNavItems.length, 7);  // xl
    if (width >= 1024) return Math.min(filteredNavItems.length, 6);  // lg
    if (width >= 768) return Math.min(filteredNavItems.length, 5);   // md
    if (width >= 640) return Math.min(filteredNavItems.length, 4);   // sm
    return 0; // mobile - show none, use hamburger menu
  };

  const [visibleTabCount, setVisibleTabCount] = useState(8); // Conservative default

  useEffect(() => {
    // Initial calculation
    setVisibleTabCount(getVisibleTabCount());

    const handleResize = () => {
      setVisibleTabCount(getVisibleTabCount());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [filteredNavItems.length]);

  // Force recalculation on mount to ensure proper responsiveness
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisibleTabCount(getVisibleTabCount());
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const visibleTabs = filteredNavItems.slice(0, visibleTabCount);
  const hiddenTabs = filteredNavItems.slice(visibleTabCount);

  return (
    <div className={`w-full ${className}`}>
      {/* Desktop Navigation */}
      <div className="hidden sm:flex items-center justify-start w-full overflow-hidden">
        <div className="flex items-center space-x-1 flex-1 min-w-0">
          {/* Visible tabs */}
          {visibleTabs.map((item) => (
            <Button
              key={item.key}
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab(item.key)}
              className={`flex items-center space-x-2 flex-shrink-0 whitespace-nowrap px-3 py-2 transition-all ${
                activeTab === item.key
                  ? 'bg-blue-600 text-white hover:bg-blue-700' // Active: blue background with white text
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400' // Inactive: silver background
              }`}
            >
              {item.icon}
              <span className="hidden md:inline">{item.label}</span>
              <span className="md:hidden">{item.label.slice(0, 8)}</span>
            </Button>
          ))}

          {/* Overflow dropdown for hidden tabs */}
          {hiddenTabs.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1 flex-shrink-0 bg-gray-300 text-gray-700 hover:bg-gray-400 ml-2"
                >
                  <span>More</span>
                  <ChevronDown className="h-4 w-4" />
                  <Badge variant="secondary" className="ml-1 text-xs bg-gray-500 text-white">
                    +{hiddenTabs.length}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 max-h-80 overflow-y-auto">
                {hiddenTabs.map((item) => (
                  <DropdownMenuItem
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`flex items-center space-x-2 ${
                      activeTab === item.key
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-200'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {activeTab === item.key && (
                      <Badge variant="secondary" className="ml-auto text-xs bg-white text-blue-600">
                        Active
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="sm:hidden flex items-center justify-between">
        <h2 className="text-lg font-semibold capitalize">
          {activeTab.replace('-', ' ')}
        </h2>
        
        <div className="flex items-center space-x-2">
          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  Navigation Menu
                  <Badge variant="outline">
                    Navigation Menu
                  </Badge>
                </SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 space-y-2">
                {filteredNavItems.map((item) => (
                  <Button
                    key={item.key}
                    variant="ghost"
                    onClick={() => {
                      setActiveTab(item.key);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full justify-start h-10 transition-all ${
                      activeTab === item.key
                        ? 'bg-blue-600 text-white hover:bg-blue-700' // Active: blue background with white text
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400' // Inactive: silver background
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {activeTab === item.key && (
                      <Badge variant="secondary" className="ml-auto bg-white text-blue-600">
                        Active
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
