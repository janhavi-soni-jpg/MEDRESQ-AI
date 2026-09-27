import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  AlertTriangle, 
  Truck, 
  Bell, 
  Bot, 
  ShieldCheck, 
  Activity, 
  X,
  Hospital,
  ChevronRight
} from 'lucide-react';
import { NavigationPage } from '../types';

interface SidebarProps {
  currentPage: NavigationPage;
  onSelectPage: (page: NavigationPage) => void;
  unreadAlertsCount: number;
  criticalRiskCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  unreadAlertsCount,
  criticalRiskCount,
  isOpenMobile,
  onCloseMobile
}) => {
  const navItems = [
    { 
      id: 'dashboard' as NavigationPage, 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      badge: null 
    },
    { 
      id: 'inventory' as NavigationPage, 
      label: 'Inventory', 
      icon: Package,
      badge: null 
    },
    { 
      id: 'risk-analysis' as NavigationPage, 
      label: 'Risk Analysis', 
      icon: AlertTriangle,
      badge: criticalRiskCount > 0 ? `${criticalRiskCount} Critical` : null,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200'
    },
    { 
      id: 'suppliers' as NavigationPage, 
      label: 'Suppliers', 
      icon: Truck,
      badge: null 
    },
    { 
      id: 'alerts' as NavigationPage, 
      label: 'Alerts', 
      icon: Bell,
      badge: unreadAlertsCount > 0 ? `${unreadAlertsCount}` : null,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
    },
    { 
      id: 'ai-assistant' as NavigationPage, 
      label: 'AI Assistant', 
      icon: Bot,
      badge: 'Resilience AI',
      badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200'
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 bg-slate-900 text-white z-50 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-md shadow-cyan-900/30 ring-1 ring-white/20">
              <Activity className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold tracking-tight text-lg text-white">MEDRESQ</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  AI
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Healthcare Supply Resilience</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-6 px-3 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Supply Operations
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => {
                  onSelectPage(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      isActive ? 'bg-white/20 text-white border-white/20' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* About / How It Works Box */}
          <div className="pt-4 px-1 space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs space-y-2">
              <div className="flex items-center space-x-2 text-cyan-300 font-bold">
                <Activity className="w-4 h-4 shrink-0 text-cyan-400" />
                <span className="uppercase text-[11px] tracking-wider">About MEDRESQ AI</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                MEDRESQ AI monitors healthcare inventory and supplier conditions, calculates supply risk, simulates disruption scenarios, and provides operational decision support.
              </p>
              <div className="pt-2 border-t border-slate-700/60">
                <div className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">
                  Operational Workflow:
                </div>
                <div className="flex items-center justify-between text-[9px] font-extrabold text-cyan-300 font-mono tracking-tight bg-slate-900/60 px-2 py-1.5 rounded-lg border border-slate-700/50">
                  <span>MONITOR</span>
                  <span className="text-slate-500">→</span>
                  <span>DETECT</span>
                  <span className="text-slate-500">→</span>
                  <span>ANALYZE</span>
                  <span className="text-slate-500">→</span>
                  <span>SIMULATE</span>
                  <span className="text-slate-500">→</span>
                  <span>RESPOND</span>
                </div>
              </div>
            </div>

            {/* Decision Support Only Disclaimer */}
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs">
              <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[11px]">Decision Support Only</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[10px]">
                Built strictly for supply inventory logistics & replenishment anticipation. Not clinical medical advice.
              </p>
            </div>
          </div>
        </div>

        {/* Facility Info Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 border border-slate-700">
              <Hospital className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">
                Central Regional Health
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                Main Supply Depot (Hub #4)
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/60">
            <span className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Monitoring Engine: Live</span>
            </span>
            <span className="font-mono text-slate-400">v2.4 Prototype</span>
          </div>
        </div>
      </aside>
    </>
  );
};
