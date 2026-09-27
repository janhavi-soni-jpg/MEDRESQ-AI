import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Search, 
  Check, 
  RotateCcw, 
  ExternalLink,
  ChevronRight,
  Info,
  Building2
} from 'lucide-react';
import { AlertItem, NavigationPage } from '../types';

interface AlertsViewProps {
  alerts: AlertItem[];
  onResolveAlert: (id: string) => void;
  onMarkRead: (id: string) => void;
  onSelectResourceForAnalysis: (resourceId: string) => void;
  onNavigate: (page: NavigationPage) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onResolveAlert,
  onMarkRead,
  onSelectResourceForAnalysis,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFORMATIONAL'>('ALL');
  const [showResolved, setShowResolved] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const matchTab = activeTab === 'ALL' || a.severity === activeTab;
      const matchResolved = showResolved ? true : !a.isResolved;
      const matchSearch =
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.resourceName && a.resourceName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchTab && matchResolved && matchSearch;
    });
  }, [alerts, activeTab, showResolved, searchQuery]);

  const counts = {
    ALL: alerts.filter((a) => !a.isResolved).length,
    CRITICAL: alerts.filter((a) => a.severity === 'CRITICAL' && !a.isResolved).length,
    HIGH: alerts.filter((a) => a.severity === 'HIGH' && !a.isResolved).length,
    MEDIUM: alerts.filter((a) => a.severity === 'MEDIUM' && !a.isResolved).length,
    INFORMATIONAL: alerts.filter((a) => a.severity === 'INFORMATIONAL' && !a.isResolved).length,
    RESOLVED: alerts.filter((a) => a.isResolved).length
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Alert Center Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Supply-Chain Disruption & Alert Center
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
              {counts.CRITICAL + counts.HIGH} Action-Required
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time notifications flagged by consumption threshold breaches, courier tracking delays, and supplier disruptions.
          </p>
        </div>

        {/* Toggle Resolved */}
        <div className="flex items-center space-x-3 text-xs self-start sm:self-auto">
          <label className="flex items-center space-x-2 cursor-pointer select-none bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500"
            />
            <span>Include Resolved ({counts.RESOLVED})</span>
          </label>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        {/* Category Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto text-xs pb-1 md:pb-0">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'INFORMATIONAL'] as const).map((tab) => {
            const count = counts[tab];
            const isActive = activeTab === tab;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab === 'ALL' ? 'All Alerts' : tab}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : tab === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800'
                        : tab === 'HIGH'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts or resources..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-slate-800">No active alerts in this category</p>
            <p className="text-xs text-slate-400 mt-1">
              All flagged items are either resolved or within baseline resilience parameters.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isHigh = alert.severity === 'HIGH';
            const isMedium = alert.severity === 'MEDIUM';

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition-all bg-white shadow-xs ${
                  alert.isResolved
                    ? 'opacity-60 bg-slate-50/80 border-slate-200'
                    : isCritical
                    ? 'border-rose-300 hover:border-rose-400 bg-rose-50/15'
                    : isHigh
                    ? 'border-orange-300 hover:border-orange-400 bg-orange-50/10'
                    : isMedium
                    ? 'border-amber-200 hover:border-amber-300'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  {/* Left Side: Icon & Details */}
                  <div className="flex items-start space-x-3">
                    <div
                      className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isCritical
                          ? 'bg-rose-100 text-rose-700'
                          : isHigh
                          ? 'bg-orange-100 text-orange-700'
                          : isMedium
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-cyan-100 text-cyan-700'
                      }`}
                    >
                      {isCritical ? (
                        <ShieldAlert className="w-4 h-4 animate-pulse" />
                      ) : isHigh || isMedium ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Info className="w-4 h-4" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                            isCritical
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isHigh
                              ? 'bg-orange-100 text-orange-800 border border-orange-200'
                              : isMedium
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {alert.severity}
                        </span>

                        <span className="text-[11px] text-slate-600 font-mono">
                          {alert.timestamp}
                        </span>

                        {alert.isResolved && (
                          <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>Resolved</span>
                          </span>
                        )}

                        {alert.resourceName && (
                          <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {alert.resourceName}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-1">
                        {alert.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                        {alert.message}
                      </p>

                      <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-600">
                        {alert.supplierImpacted && (
                          <div className="flex items-center space-x-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              Vendor: <strong className="text-slate-800">{alert.supplierImpacted}</strong>
                            </span>
                          </div>
                        )}
                        <div>
                          Factor: <span className="text-slate-800 font-medium">{alert.contributingFactor}</span>
                        </div>
                      </div>

                      <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-center space-x-2">
                        <span className="font-bold text-cyan-800 shrink-0">Action Protocol:</span>
                        <span>{alert.actionRequired}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Interactive Buttons */}
                  <div className="flex flex-row md:flex-col items-end justify-end space-y-0 md:space-y-2 space-x-2 md:space-x-0 shrink-0 pt-2 md:pt-0">
                    {alert.resourceId && (
                      <button
                        onClick={() => {
                          onSelectResourceForAnalysis(alert.resourceId!);
                          onNavigate('risk-analysis');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs transition-colors flex items-center space-x-1 shadow-xs"
                      >
                        <span>Deep Analysis</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}

                    <button
                      onClick={() => onResolveAlert(alert.id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center space-x-1 ${
                        alert.isResolved
                          ? 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                          : 'bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {alert.isResolved ? (
                        <>
                          <RotateCcw className="w-3 h-3" />
                          <span>Reopen</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Mark Resolved</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
