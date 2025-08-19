'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Upload,
  Settings,
  Users,
  BarChart3,
  Menu,
  X,
  Home,
  Bell,
  Search,
  Volume2,
  VolumeX
} from 'lucide-react';
import {
  playClickSound,
  playHoverSound,
  playToggleSound,
  enableNotificationSounds,
  isNotificationSoundEnabled
} from '@/utils/notificationSound';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNavigate?: (section: string) => void;
  currentSection?: string;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  onClick?: () => void;
  href?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onToggle, 
  onNavigate, 
  currentSection = 'dashboard' 
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    setSoundEnabled(isNotificationSoundEnabled());
  }, []);

  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    enableNotificationSounds(newState);
    playToggleSound();
  };

  const handleNavigation = (sectionId: string) => {
    playClickSound();
    onNavigate?.(sectionId);
  };

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      href: '/',
    },
    {
      id: 'cvs',
      label: 'CV Records',
      icon: FileText,
      href: '/',
    },
    {
      id: 'upload',
      label: 'Upload CV',
      icon: Upload,
      href: '/',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      badge: 'Soon',
      href: '/',
    },
    {
      id: 'candidates',
      label: 'Candidates',
      icon: Users,
      href: '/',
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      href: '/',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      href: '/',
    },
  ];

  const settingsItems: NavigationItem[] = [
    {
      id: 'sound-toggle',
      label: soundEnabled ? 'Disable Sounds' : 'Enable Sounds',
      icon: soundEnabled ? Volume2 : VolumeX,
      onClick: handleToggleSound
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: '/',
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
          aria-label="Close sidebar"
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-white/95 backdrop-blur-md border-r border-slate-200 shadow-xl z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        w-64
        sm:hidden
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                CV Manager
              </h2>
              <p className="text-xs text-slate-500">Navigation</p>
            </div>
          </div>
          
          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            onMouseEnter={playHoverSound}
            className="lg:hidden hover:bg-slate-100 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex flex-col h-full">
          {/* Main Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Main
              </h3>
              <div className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentSection === item.id;
                  
                  if (item.href) {
                    return (
                      <a
                        key={item.id}
                        href={item.href}
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavigation(item.id);
                        }}
                        onMouseEnter={playHoverSound}
                        className={`
                          w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium
                          transition-all duration-200 group
                          ${isActive 
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 shadow-sm' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }
                        `}
                        aria-label={item.label}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'
                          }`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </a>
                    );
                  }
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => item.onClick ? item.onClick() : handleNavigation(item.id)}
                      onMouseEnter={playHoverSound}
                      className={`
                        w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium
                        transition-all duration-200 group
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 shadow-sm' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }
                      `}
                      aria-label={item.label}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'
                        }`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Settings Section */}
            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Settings
              </h3>
              <div className="space-y-1">
                {settingsItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentSection === item.id;
                  
                  if (item.href) {
                    return (
                      <a
                        key={item.id}
                        href={item.href}
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavigation(item.id);
                        }}
                        onMouseEnter={playHoverSound}
                        className={`
                          w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium
                          transition-all duration-200 group
                          ${isActive 
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 shadow-sm' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }
                        `}
                        aria-label={item.label}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'
                          }`} />
                          <span>{item.label}</span>
                        </div>
                      </a>
                    );
                  }
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => item.onClick ? item.onClick() : handleNavigation(item.id)}
                      onMouseEnter={playHoverSound}
                      className={`
                        w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium
                        transition-all duration-200 group
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 shadow-sm' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }
                        ${item.id === 'sound-toggle' && soundEnabled ? 'text-blue-600' : ''}
                        ${item.id === 'sound-toggle' && !soundEnabled ? 'text-red-600' : ''}
                      `}
                      aria-label={item.label}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 transition-colors ${
                          item.id === 'sound-toggle' && soundEnabled ? 'text-blue-600' :
                          item.id === 'sound-toggle' && !soundEnabled ? 'text-red-600' :
                          isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'
                        }`} />
                        <span>{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>System Online</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              CV Manager v1.0
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;