import React from 'react';
import { 
  Package, 
  AlertTriangle, 
  ShieldAlert, 
  Truck, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  TrendingUp, 
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Flame
} from 'lucide-react';
import { 
  MedicalResource, 
  AlertItem, 
  SupplyActivity, 
  NavigationPage, 
  RiskLevel,
  CrisisSimulationComparison,
  CrisisScenarioConfig
} from '../types';
import { DemandChart } from './DemandChart';

interface DashboardViewProps {
  resources: MedicalResource[];
  alerts: AlertItem[];
  activities: SupplyActivity[];
  onNavigate: (page: NavigationPage) => void;
  onSelectResourceForAnalysis: (resourceId: string) => void;
  onResolveAlert: (alertId: string) => void;
  onRunDeepAnalysis?: () => void;
  isSimulationActive?: boolean;
  activeComparison?: CrisisSimulationComparison | null;
  activeScenarioConfig?: CrisisScenarioConfig | null;
  onOpenSimulationModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  resources,
  alerts,
  activities,
  onNavigate,
  onSelectResourceForAnalysis,
  onResolveAlert,
  onRunDeepAnalysis,
  isSimulationActive = false,
  activeComparison,
  activeScenarioConfig,
  onOpenSimulationModal
}) => {
  // Aggregate KPIs
  const totalResources = resources.length;
  const lowStockResources = resources.filter(
    (r) => r.status === 'LOW_STOCK' || r.daysRemaining <= 7 || r.currentStock < r.minimumSafetyStock
  ).length;
  const criticalResources = resources.filter((r) => r.riskLevel === 'CRITICAL').length;
  const activeSupplyRisks = resources.filter(
    (r) => r.currentShipmentStatus.toLowerCase().includes('delayed') || 
           r.currentShipmentStatus.toLowerCase().includes('hold') || 
           r.currentShipmentStatus.toLowerCase().includes('backorder') ||
           r.currentShipmentStatus.toLowerCase().includes('bottleneck')
  ).length;

  const criticalItems = resources.filter((r) => r.riskLevel === 'CRITICAL');
  const highRiskItems = resources.filter((r) => r.riskLevel === 'HIGH');
  const criticalNames = criticalItems.map((r) => r.name);

  // Inventory Risk Distribution
  const riskCounts: Record<RiskLevel, number> = {
    STABLE: resources.filter((r) => r.riskLevel === 'STABLE').length,
    MEDIUM: resources.filter((r) => r.riskLevel === 'MEDIUM').length,
    HIGH: resources.filter((r) => r.riskLevel === 'HIGH').length,
    CRITICAL: resources.filter((r) => r.riskLevel === 'CRITICAL').length,
  };

  const priorityAlerts = alerts
    .filter((a) => !a.isResolved)
    .slice(0, 4);

  return (
    <div className="space-y-6 pb-10">
      {/* Top Advisory Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-3xl">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              SUPPLY RESILIENCE RADAR
            </span>
            <span className="text-xs text-slate-300">
              Active Facility: Central Regional Health - Trauma Depot 04
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {criticalItems.length > 0 
              ? `Anticipated Critical Shortage Window: ≤ 72 Hours (${criticalItems.length} Severe Threats)`
              : `Operational Supply Runway: Stabilized (${highRiskItems.length} Watch Items)`
            }
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            {criticalItems.length > 0 ? (
              <>
                Automated resilience modeling identifies immediate stockout risk for{' '}
                {criticalNames.slice(0, 3).map((name, i) => (
                  <span key={name}>
                    {i > 0 && ', '}
                    <strong className="text-cyan-300">{name}</strong>
                  </span>
                ))}{' '}
                driven by lead-time deficits, safety stock floor breaches, and supplier transit holds.
              </>
            ) : (
              'All monitored categories maintain sufficient buffer over safety thresholds. Regular standing replenishment is in effect.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
          {onOpenSimulationModal && (
            <button
              onClick={onOpenSimulationModal}
              className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 font-bold text-xs tracking-wide transition-colors cursor-pointer"
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>{isSimulationActive ? 'Crisis Control' : 'Simulate Crisis'}</span>
            </button>
          )}
          <button
            onClick={onRunDeepAnalysis || (() => onNavigate('risk-analysis'))}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wide transition-colors shadow-sm cursor-pointer"
          >
            <span>Run Deep Analysis</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Crisis Simulation Summary & Resilience Indicator (Requirements 2, 6, 8) */}
      {isSimulationActive && activeComparison && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center text-white shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-400/50">
                    SIMULATED SCENARIO
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-200 text-rose-900 border border-rose-400/50">
                    CRISIS DETECTED
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    Trigger: {activeComparison.crisisSummary.trigger}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Primary impact: <strong>{activeComparison.crisisSummary.primaryImpact}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 self-end sm:self-auto shrink-0 bg-white/80 px-3 py-1.5 rounded-lg border border-amber-200">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Simulated Supply Resilience Indicator
                </span>
                <span className="text-sm sm:text-base font-extrabold font-mono text-amber-700">
                  {activeComparison.simulated.resilienceScore} / 100
                </span>
              </div>
              {onOpenSimulationModal && (
                <button
                  onClick={onOpenSimulationModal}
                  className="px-2.5 py-1 text-xs font-bold bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors cursor-pointer"
                >
                  What-If Engine
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white rounded-lg border border-amber-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Most Affected SKUs</span>
              <span className="font-bold text-slate-900 mt-1 block">
                {activeComparison.crisisSummary.mostAffected.join(', ')}
              </span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-amber-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Main Risk Driver</span>
              <span className="text-slate-700 mt-1 block">
                {activeComparison.crisisSummary.mainDriver}
              </span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-amber-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Recommended Response</span>
              <span className="font-semibold text-cyan-800 mt-1 block">
                {activeComparison.crisisSummary.recommendedResponse}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Medical Resources */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Monitored Resources
            </span>
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {totalResources}
            </span>
            <span className="text-xs text-slate-500 font-medium">SKUs Managed</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active batch & simulated draw tracking</span>
          </div>
        </div>

        {/* Resources at Low Stock */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Approaching Low Stock
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight">
              {lowStockResources}
            </span>
            <span className="text-xs text-amber-700 font-medium">Under 7 Days Buffer</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Requires active replenishment PO
          </div>
        </div>

        {/* Critical Resources */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Critical Shortage Risk
            </span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight">
              {criticalResources}
            </span>
            <span className="text-xs text-rose-700 font-medium">&lt; 3 Days Stock</span>
          </div>
          <div className="mt-2 text-xs text-rose-600 font-semibold flex items-center space-x-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Immediate procurement intervention</span>
          </div>
        </div>

        {/* Active Supply-Chain Risks */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Supplier Risks
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 tracking-tight">
              {activeSupplyRisks}
            </span>
            <span className="text-xs text-slate-600 font-medium">Disrupted Shipments</span>
          </div>
          <div className="mt-2 text-xs text-indigo-600 font-medium">
            Port holds & API precursor bottlenecks
          </div>
        </div>
      </div>

      {/* Inventory Risk Overview Breakdown Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Inventory Vulnerability Tier Classification
            </h3>
            <p className="text-xs text-slate-500">
              Categorization based on consumption trajectory, supplier lead times, and on-hand safety buffer
            </p>
          </div>
          <button
            onClick={() => onNavigate('inventory')}
            className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 flex items-center space-x-1 self-start sm:self-auto"
          >
            <span>View Full Filtered Inventory</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="h-3.5 w-full rounded-full bg-slate-100 flex overflow-hidden p-0.5 border border-slate-200/60">
          <div
            style={{ width: `${(riskCounts.STABLE / totalResources) * 100}%` }}
            className="bg-emerald-500 rounded-l-full transition-all"
            title={`Stable: ${riskCounts.STABLE} resources`}
          />
          <div
            style={{ width: `${(riskCounts.MEDIUM / totalResources) * 100}%` }}
            className="bg-amber-400 transition-all"
            title={`Medium Risk: ${riskCounts.MEDIUM} resources`}
          />
          <div
            style={{ width: `${(riskCounts.HIGH / totalResources) * 100}%` }}
            className="bg-orange-500 transition-all"
            title={`High Risk: ${riskCounts.HIGH} resources`}
          />
          <div
            style={{ width: `${(riskCounts.CRITICAL / totalResources) * 100}%` }}
            className="bg-rose-600 rounded-r-full transition-all"
            title={`Critical: ${riskCounts.CRITICAL} resources`}
          />
        </div>

        {/* 4 Classification Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {/* Stable */}
          <div 
            onClick={() => onNavigate('inventory')}
            className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Stable</span>
              </span>
              <span className="text-lg font-extrabold text-emerald-700 font-mono">
                {riskCounts.STABLE}
              </span>
            </div>
            <p className="text-[11px] text-emerald-700/80 mt-1">
              &gt; 14 Days safe buffer. Regular reorder flow.
            </p>
          </div>

          {/* Medium Risk */}
          <div 
            onClick={() => onNavigate('inventory')}
            className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 hover:bg-amber-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Medium Risk</span>
              </span>
              <span className="text-lg font-extrabold text-amber-700 font-mono">
                {riskCounts.MEDIUM}
              </span>
            </div>
            <p className="text-[11px] text-amber-700/80 mt-1">
              6–14 Days buffer. Pipeline active with minor watch.
            </p>
          </div>

          {/* High Risk */}
          <div 
            onClick={() => onNavigate('inventory')}
            className="p-3 rounded-lg border border-orange-200 bg-orange-50/50 hover:bg-orange-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-800 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span>High Risk</span>
              </span>
              <span className="text-lg font-extrabold text-orange-700 font-mono">
                {riskCounts.HIGH}
              </span>
            </div>
            <p className="text-[11px] text-orange-700/80 mt-1">
              3–5 Days buffer. Surge consumption or delayed transit.
            </p>
          </div>

          {/* Critical */}
          <div 
            onClick={() => onNavigate('inventory')}
            className="p-3 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                <span>Critical</span>
              </span>
              <span className="text-lg font-extrabold text-rose-700 font-mono">
                {riskCounts.CRITICAL}
              </span>
            </div>
            <p className="text-[11px] text-rose-700/80 mt-1">
              &lt; 3 Days stock remaining. Immediate stockout threat.
            </p>
          </div>
        </div>
      </div>

      {/* Demand & Consumption Trend Chart */}
      <DemandChart />

      {/* Bottom Grid: Priority Alerts & Recent Supply Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Priority Alerts Section (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
                  <span>Priority Alerts</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                    {priorityAlerts.length} Action Items
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Critical supply-chain warnings requiring supply administrator sign-off
                </p>
              </div>

              <button
                onClick={() => onNavigate('alerts')}
                className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 flex items-center space-x-1"
              >
                <span>All Alerts</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {priorityAlerts.map((alert) => {
                const isCritical = alert.severity === 'CRITICAL';
                const isHigh = alert.severity === 'HIGH';

                return (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-lg border transition-all ${
                      isCritical
                        ? 'border-rose-200 bg-rose-50/40 hover:bg-rose-50/70'
                        : isHigh
                        ? 'border-amber-200 bg-amber-50/40 hover:bg-amber-50/70'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-2.5">
                        <div
                          className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                            isCritical
                              ? 'bg-rose-100 text-rose-700'
                              : isHigh
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                isCritical
                                  ? 'bg-rose-200 text-rose-800'
                                  : isHigh
                                  ? 'bg-amber-200 text-amber-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {alert.severity}
                            </span>
                            <span className="text-[11px] text-slate-600">
                              {alert.timestamp}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm mt-1">
                            {alert.title}
                          </h4>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                            {alert.message}
                          </p>
                          <div className="mt-2 text-[11px] text-slate-700 font-medium flex items-center space-x-1">
                            <span className="text-slate-500 font-semibold">Recommended:</span>
                            <span className="text-slate-800">{alert.actionRequired}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col items-end space-y-1.5 shrink-0">
                        {alert.resourceId && (
                          <button
                            onClick={() => {
                              onSelectResourceForAnalysis(alert.resourceId!);
                              onNavigate('risk-analysis');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-cyan-50 border border-cyan-200 text-cyan-800 hover:bg-cyan-100 transition-colors"
                          >
                            Analyze
                          </button>
                        )}
                        <button
                          onClick={() => onResolveAlert(alert.id)}
                          className="text-[11px] text-slate-600 hover:text-slate-800 hover:underline"
                        >
                          Acknowledge
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Automated alert scanning interval: 5 minutes</span>
            <span className="font-mono text-emerald-700 font-semibold">Protocols Synced</span>
          </div>
        </div>

        {/* Recent Supply Activity (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Recent Supply Activity
                </h3>
                <p className="text-xs text-slate-500">
                  Logistics events, customs holds, and PO logs
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                Live Feed
              </span>
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {activities.slice(0, 5).map((act) => {
                let dotColor = 'bg-cyan-500';
                if (act.status === 'warning') dotColor = 'bg-rose-500';
                if (act.status === 'completed') dotColor = 'bg-emerald-500';
                if (act.status === 'in-progress') dotColor = 'bg-indigo-500';

                return (
                  <div key={act.id} className="relative text-xs">
                    <span
                      className={`absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full ${dotColor} ring-4 ring-white`}
                    />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs">
                        {act.title}
                      </span>
                      <span className="text-[10px] text-slate-600 shrink-0 font-mono">
                        {act.timestamp}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5 leading-relaxed text-[11px]">
                      {act.description}
                    </p>
                    {act.relatedResource && (
                      <span className="inline-block mt-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        Target: {act.relatedResource}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={() => onNavigate('suppliers')}
              className="text-cyan-700 hover:text-cyan-800 font-semibold flex items-center space-x-1"
            >
              <span>Inspect Supplier Pipelines</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-slate-600 text-[11px]">5 of 18 events</span>
          </div>
        </div>
      </div>

      {/* About & Operational Workflow Section (Requirement 12) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                HOW IT WORKS
              </span>
              <h4 className="font-bold text-slate-900 text-sm">
                About MEDRESQ AI Supply-Chain Resilience Platform
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              MEDRESQ AI monitors healthcare inventory and supplier conditions, calculates supply risk, simulates disruption scenarios, and provides operational decision support.
            </p>
          </div>

          <div className="flex-1 max-w-lg bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Closed-Loop Operational Resilience Workflow:
            </span>
            <div className="grid grid-cols-5 text-center gap-1 text-[10px] sm:text-[11px] font-bold font-mono">
              <div className="p-1.5 rounded bg-white border border-slate-200 text-slate-700">
                MONITOR
              </div>
              <div className="p-1.5 rounded bg-white border border-slate-200 text-slate-700">
                DETECT
              </div>
              <div className="p-1.5 rounded bg-white border border-slate-200 text-slate-700">
                ANALYZE
              </div>
              <div className="p-1.5 rounded bg-amber-50 border border-amber-300 text-amber-900">
                SIMULATE
              </div>
              <div className="p-1.5 rounded bg-cyan-50 border border-cyan-300 text-cyan-900">
                RESPOND
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
