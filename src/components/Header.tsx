import React from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  RefreshCw, 
  PlusCircle, 
  AlertCircle, 
  ShieldAlert,
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import { NavigationPage, CrisisScenarioConfig } from '../types';

interface HeaderProps {
  currentPage: NavigationPage;
  onOpenMobileSidebar: () => void;
  onNavigate: (page: NavigationPage) => void;
  criticalCount: number;
  onTriggerSimulation: () => void;
  onResetSimulation?: () => void;
  onResetDemoData?: () => void;
  isSimulationActive?: boolean;
  activeCrisisConfig?: CrisisScenarioConfig | null;
  currentSurgePercentage?: number;
  lastSyncTime: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onOpenMobileSidebar,
  onNavigate,
  criticalCount,
  onTriggerSimulation,
  onResetSimulation,
  onResetDemoData,
  isSimulationActive = false,
  activeCrisisConfig,
  currentSurgePercentage = 40,
  lastSyncTime
}) => {
  const pageTitles: Record<NavigationPage, { title: string; subtitle: string }> = {
    'dashboard': {
      title: 'Supply-Chain Resilience Dashboard',
      subtitle: 'Real-time inventory levels, vulnerability forecasts, and stockout prevention'
    },
    'inventory': {
      title: 'Medical Resource Inventory',
      subtitle: 'Dynamic tracking of essential pharmaceuticals, critical consumables, and PPE'
    },
    'risk-analysis': {
      title: 'AI Supply-Chain Risk Analysis',
      subtitle: 'Anticipate shortages, delivery lead times, and algorithmic replenishment actions'
    },
    'suppliers': {
      title: 'Supplier Reliability & Transit',
      subtitle: 'Monitoring tier-1 medical vendors, transit bottlenecks, and delivery track records'
    },
    'alerts': {
      title: 'Alert & Disruption Center',
      subtitle: 'Prioritized supply warnings, customs holds, and inventory depletion alarms'
    },
    'ai-assistant': {
      title: 'MEDRESQ Intelligence Assistant',
      subtitle: 'Interactive supply-chain decision-support queries grounded in live inventory data'
    }
  };

  const currentInfo = pageTitles[currentPage] || {
    title: 'MEDRESQ AI',
    subtitle: 'Healthcare Supply Resilience'
  };

  // Derive human-readable simulation badge
  const getSimulationLabel = () => {
    if (!activeCrisisConfig) return `Simulated Surge (+${currentSurgePercentage}%)`;
    switch (activeCrisisConfig.type) {
      case 'demand_surge':
        return `Demand Surge (+${activeCrisisConfig.demandSurgePercent}%)`;
      case 'supplier_delay':
        return `Supplier Delay (+${activeCrisisConfig.supplierDelayDays}d)`;
      case 'shipment_failure':
        return 'Shipment Failure';
      case 'combined_crisis':
        return `Combined Crisis (+${activeCrisisConfig.demandSurgePercent}% / +${activeCrisisConfig.supplierDelayDays}d)`;
      default:
        return 'Simulated Crisis';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu & Page Title */}
        <div className="flex items-center space-x-3 min-w-0">
          <button
            id="mobile-menu-toggle"
            onClick={onOpenMobileSidebar}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
              {currentInfo.title}
            </h1>
            <p className="text-xs text-slate-500 truncate hidden sm:block">
              {currentInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right Side: Quick Actions & Status */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
          {/* Critical Warning Pill */}
          {criticalCount > 0 && (
            <button
              onClick={() => onNavigate('alerts')}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition-colors shadow-xs cursor-pointer"
              title="Identify Critical Risk"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              <span className="hidden md:inline">{criticalCount} Critical Threats</span>
              <span className="md:hidden">{criticalCount} Crit</span>
            </button>
          )}

          {/* Simulation Trigger & Active State */}
          {isSimulationActive ? (
            <div className="flex items-center space-x-1.5">
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider">
                SIMULATED SCENARIO
              </span>
              <button
                onClick={onTriggerSimulation}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="View active simulation parameters"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>{getSimulationLabel()}</span>
              </button>
              {(onResetSimulation || onResetDemoData) && (
                <button
                  onClick={onResetDemoData || onResetSimulation}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
                  title="Reset scenario to baseline parameters"
                >
                  <RefreshCw className="w-3 h-3 text-slate-500" />
                  <span className="hidden sm:inline">Reset Scenario</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={onTriggerSimulation}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-300 text-amber-900 text-xs font-semibold hover:bg-amber-500/20 transition-colors cursor-pointer"
                title="Open Crisis Simulation & Resilience Response Engine"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">Simulate Surge</span>
                <span className="sm:hidden">Simulate</span>
              </button>
              {onResetDemoData && (
                <button
                  onClick={onResetDemoData}
                  className="hidden md:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-xs hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Reset demo data to initial state"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Demo Data</span>
                </button>
              )}
            </div>
          )}

          {/* Fast Navigation to AI Assistant */}
          {currentPage !== 'ai-assistant' && (
            <button
              onClick={() => onNavigate('ai-assistant')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-700 transition-colors shadow-xs cursor-pointer"
            >
              <span>Ask AI</span>
            </button>
          )}

          {/* Sync indicator */}
          <div className="hidden xl:flex items-center space-x-1.5 text-xs text-slate-400 pl-2 border-l border-slate-200">
            <RefreshCw className="w-3 h-3 text-slate-400" />
            <span className="font-mono text-[11px]">Sync: {lastSyncTime}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
