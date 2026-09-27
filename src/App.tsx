import React, { useState } from 'react';
import { 
  BASELINE_RESOURCES, 
  BASELINE_SUPPLIERS, 
  INITIAL_RESOURCES, 
  INITIAL_SUPPLIERS, 
  INITIAL_ALERTS, 
  INITIAL_SUPPLY_ACTIVITY 
} from './data/mockData';
import { 
  NavigationPage, 
  MedicalResource, 
  Supplier, 
  AlertItem, 
  SupplyActivity, 
  RiskLevel,
  CrisisScenarioConfig,
  CrisisSimulationComparison,
  ResilienceRecommendation
} from './types';
import { 
  synchronizeResource, 
  evaluateSupplierRisk, 
  generateDynamicAlerts,
  executeCrisisScenario,
  applyWhatIfResponse
} from './services/resilienceEngine';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { RiskAnalysisView } from './components/RiskAnalysisView';
import { SuppliersView } from './components/SuppliersView';
import { AlertsView } from './components/AlertsView';
import { AIAssistantView } from './components/AIAssistantView';
import { ResourceDetailModal } from './components/ResourceDetailModal';
import { DeepAnalysisModal } from './components/DeepAnalysisModal';
import { SimulateSurgeModal } from './components/SimulateSurgeModal';
import { 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  X, 
  SlidersHorizontal,
  Flame
} from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('dashboard');
  const [resources, setResources] = useState<MedicalResource[]>(INITIAL_RESOURCES);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [activities, setActivities] = useState<SupplyActivity[]>(INITIAL_SUPPLY_ACTIVITY);
  const [selectedResourceId, setSelectedResourceId] = useState<string>('res-insulin');
  const [detailModalResource, setDetailModalResource] = useState<MedicalResource | null>(null);
  const [isDeepAnalysisModalOpen, setIsDeepAnalysisModalOpen] = useState<boolean>(false);
  const [isSurgeModalOpen, setIsSurgeModalOpen] = useState<boolean>(false);
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('10:14 AM EST');

  // Simulation State
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(false);
  const [surgePercentage, setSurgePercentage] = useState<number>(0);
  const [activeCrisisConfig, setActiveCrisisConfig] = useState<CrisisScenarioConfig | null>(null);
  const [activeComparison, setActiveComparison] = useState<CrisisSimulationComparison | null>(null);
  const [simulationToast, setSimulationToast] = useState<{
    type: 'surge' | 'reset' | 'action';
    message: string;
    details?: string;
  } | null>(null);

  // Derived Counts
  const unreadAlertsCount = alerts.filter((a) => !a.isResolved && !a.isRead).length;
  const criticalRiskCount = resources.filter((r) => r.riskLevel === 'CRITICAL').length;

  // Handlers
  const handleSelectResourceForAnalysis = (resourceId: string) => {
    setSelectedResourceId(resourceId);
    setCurrentPage('risk-analysis');
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isResolved: !a.isResolved, isRead: true } : a))
    );
  };

  const handleMarkRead = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
    );
  };

  // Full Crisis Scenario Simulator Handler (Supports Demand Surge, Supplier Delay, Shipment Failure, Combined Crisis)
  const handleApplyCrisisScenario = (
    scenario: CrisisScenarioConfig,
    simulatedResources: MedicalResource[],
    simulatedSuppliers: Supplier[],
    comparison: CrisisSimulationComparison
  ) => {
    const dynamicAlerts = generateDynamicAlerts(simulatedResources, simulatedSuppliers);

    const newActivity: SupplyActivity = {
      id: `act-${Date.now()}`,
      type: 'DELAY_ALERT',
      title: `${comparison.crisisSummary.title} (${comparison.crisisSummary.trigger})`,
      description: `${comparison.crisisSummary.primaryImpact} Main driver: ${comparison.crisisSummary.mainDriver}.`,
      timestamp: 'Just now',
      status: 'warning',
      relatedResource: comparison.crisisSummary.mostAffected[0] || 'Emergency Formulary'
    };

    setResources(simulatedResources);
    setSuppliers(simulatedSuppliers);
    setAlerts(dynamicAlerts);
    setActivities((prev) => [newActivity, ...prev]);
    setIsSimulationActive(true);
    setActiveCrisisConfig(scenario);
    setActiveComparison(comparison);
    setSurgePercentage(scenario.demandSurgePercent || 40);
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setSimulationToast({
      type: 'surge',
      message: 'Simulation applied successfully.',
      details: `${comparison.crisisSummary.trigger} activated. ${comparison.simulated.criticalItems} critical & ${comparison.simulated.highRiskItems} high-risk SKUs identified.`
    });
  };

  // What-If Response Action Handler
  const handleApplyWhatIfAction = (
    actionId: string,
    postResources: MedicalResource[],
    postSuppliers: Supplier[],
    updatedRecommendations: ResilienceRecommendation[],
    postStats: any
  ) => {
    const dynamicAlerts = generateDynamicAlerts(postResources, postSuppliers);

    const newActivity: SupplyActivity = {
      id: `act-${Date.now()}`,
      type: 'EXPEDITED_ORDER',
      title: `Simulated What-If Response Applied: ${postStats.actionApplied}`,
      description: `Operational mitigation recalculation: Critical items reduced to ${postStats.criticalItems} (Resilience score elevated to ${postStats.resilienceScore}/100).`,
      timestamp: 'Just now',
      status: 'completed',
      relatedResource: 'Resilience Response Engine'
    };

    setResources(postResources);
    setSuppliers(postSuppliers);
    setAlerts(dynamicAlerts);
    setActivities((prev) => [newActivity, ...prev]);
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    if (activeComparison) {
      setActiveComparison({
        ...activeComparison,
        recommendations: updatedRecommendations,
        postResponse: {
          criticalItems: postStats.criticalItems,
          highRiskItems: postStats.highRiskItems,
          mediumRiskItems: postStats.mediumRiskItems,
          stableItems: postStats.stableItems,
          avgDaysOfStock: postStats.avgDaysOfStock,
          resilienceScore: postStats.resilienceScore,
          shortageWindow: postStats.shortageWindow,
          appliedActions: [postStats.actionApplied]
        }
      });
    }

    const isAlt = actionId.includes('alt') || postStats.actionApplied?.toLowerCase().includes('alternate');
    setSimulationToast({
      type: 'action',
      message: isAlt ? 'Alternate supplier response simulated.' : 'Simulation response applied successfully.',
      details: `${postStats.actionApplied} applied. Projected critical items: ${postStats.criticalItems} (Score: ${postStats.resilienceScore}/100).`
    });
  };

  // Reset Simulation to Original Baseline State (and Demo Reset)
  const handleResetSimulation = () => {
    const baseline = BASELINE_RESOURCES.map((r) => synchronizeResource({ ...r }));
    const resetSuppliers = BASELINE_SUPPLIERS.map((s) => {
      const evalRisk = evaluateSupplierRisk(s, baseline);
      return {
        ...s,
        supplyRisk: evalRisk.supplyRisk
      };
    });
    const resetAlerts = generateDynamicAlerts(baseline, resetSuppliers);

    setResources(baseline);
    setSuppliers(resetSuppliers);
    setAlerts(resetAlerts);
    setIsSimulationActive(false);
    setActiveCrisisConfig(null);
    setActiveComparison(null);
    setSurgePercentage(0);
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setSimulationToast({
      type: 'reset',
      message: 'Scenario reset to baseline.',
      details: 'All simulation parameters reset and baseline formulary restored.'
    });
  };

  // Apply operational simulation action (e.g., expedited courier, alternate vendor, or throttling)
  const handleApplySimulationAction = (
    resourceId: string,
    actionType: 'expedite' | 'alternate' | 'buffer'
  ) => {
    const updatedResources = resources.map((r) => {
      if (r.id === resourceId) {
        let updatedStock = r.currentStock;
        let updatedLeadTime = r.supplierLeadTimeDays;
        let updatedDraw = r.dailyConsumption;
        let updatedShipment = r.currentShipmentStatus;

        if (actionType === 'expedite') {
          // Emergency courier injects 4-day stock reserve and shortens lead time
          updatedStock += Math.round(r.dailyConsumption * 4);
          updatedLeadTime = Math.max(2, r.supplierLeadTimeDays - 2);
          updatedShipment = 'Priority Courier Flight Dispatched (ETA 24h)';
        } else if (actionType === 'alternate') {
          // Secondary regional distributor quota activated
          updatedStock += Math.round(r.dailyConsumption * 7);
          updatedShipment = 'Secondary Distributor Buffer Inbound';
        } else if (actionType === 'buffer') {
          // Ward draw rate conservation (-20% consumption burn)
          updatedDraw = Math.max(10, Math.round(r.dailyConsumption * 0.8));
        }

        return synchronizeResource({
          ...r,
          currentStock: updatedStock,
          dailyConsumption: updatedDraw,
          supplierLeadTimeDays: updatedLeadTime,
          leadTimeDays: updatedLeadTime,
          currentShipmentStatus: updatedShipment,
          shipmentStatus: updatedShipment
        });
      }
      return r;
    });

    const updatedSuppliers = suppliers.map((s) => {
      const evalRisk = evaluateSupplierRisk(s, updatedResources);
      return {
        ...s,
        supplyRisk: evalRisk.supplyRisk
      };
    });

    setResources(updatedResources);
    setSuppliers(updatedSuppliers);
    setAlerts(generateDynamicAlerts(updatedResources, updatedSuppliers));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={(p) => setCurrentPage(p)}
        unreadAlertsCount={unreadAlertsCount}
        criticalRiskCount={criticalRiskCount}
        isOpenMobile={isOpenMobileSidebar}
        onCloseMobile={() => setIsOpenMobileSidebar(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Header Bar */}
        <Header
          currentPage={currentPage}
          onOpenMobileSidebar={() => setIsOpenMobileSidebar(true)}
          onNavigate={(p) => setCurrentPage(p)}
          criticalCount={criticalRiskCount}
          onTriggerSimulation={() => setIsSurgeModalOpen(true)}
          onResetSimulation={handleResetSimulation}
          onResetDemoData={handleResetSimulation}
          isSimulationActive={isSimulationActive}
          activeCrisisConfig={activeCrisisConfig}
          currentSurgePercentage={surgePercentage}
          lastSyncTime={lastSyncTime}
        />

        {/* Simulation Feedback Toast Banner */}
        {simulationToast && (
          <div className="px-4 sm:px-6 lg:px-8 pt-4 max-w-7xl w-full mx-auto">
            <div 
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 shadow-sm text-xs ${
                simulationToast.type === 'surge'
                  ? 'bg-amber-50/90 border-amber-300 text-amber-900'
                  : 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                {simulationToast.type === 'surge' ? (
                  <div className="w-6 h-6 rounded-md bg-amber-500/20 flex items-center justify-center text-amber-700 shrink-0">
                    <Flame className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-700 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <span className="font-bold">{simulationToast.message}</span>
                  {simulationToast.details && (
                    <span className="text-amber-800/80 block sm:inline sm:ml-2 text-[11px]">
                      {simulationToast.details}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {isSimulationActive && (
                  <button
                    onClick={handleResetSimulation}
                    className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 font-bold hover:bg-amber-100/50 transition-colors shadow-2xs flex items-center space-x-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset Simulation</span>
                  </button>
                )}
                <button
                  onClick={() => setSimulationToast(null)}
                  className="p-1 rounded-md text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Page Views */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {currentPage === 'dashboard' && (
            <DashboardView
              resources={resources}
              alerts={alerts}
              activities={activities}
              onNavigate={(p) => setCurrentPage(p)}
              onSelectResourceForAnalysis={handleSelectResourceForAnalysis}
              onResolveAlert={handleResolveAlert}
              onRunDeepAnalysis={() => setIsDeepAnalysisModalOpen(true)}
              isSimulationActive={isSimulationActive}
              activeComparison={activeComparison}
              activeScenarioConfig={activeCrisisConfig}
              onOpenSimulationModal={() => setIsSurgeModalOpen(true)}
            />
          )}

          {currentPage === 'inventory' && (
            <InventoryView
              resources={resources}
              onSelectResourceForAnalysis={handleSelectResourceForAnalysis}
              onNavigate={(p) => setCurrentPage(p)}
              onOpenResourceModal={(res) => setDetailModalResource(res)}
              isSimulationActive={isSimulationActive}
              activeScenarioConfig={activeCrisisConfig}
              onResetSimulation={handleResetSimulation}
            />
          )}

          {currentPage === 'risk-analysis' && (
            <RiskAnalysisView
              resources={resources}
              suppliers={suppliers}
              selectedResourceId={selectedResourceId}
              onSelectResource={(id) => setSelectedResourceId(id)}
              onApplySimulationAction={handleApplySimulationAction}
              onRunDeepAnalysis={() => setIsDeepAnalysisModalOpen(true)}
              isSimulationActive={isSimulationActive}
              activeScenarioConfig={activeCrisisConfig}
              onNavigate={(p) => setCurrentPage(p)}
            />
          )}

          {currentPage === 'suppliers' && (
            <SuppliersView
              suppliers={suppliers}
              resources={resources}
              onNavigate={(p) => setCurrentPage(p)}
              onSelectResourceForAnalysis={handleSelectResourceForAnalysis}
              onFilterInventoryBySupplier={(supplierName) => {
                setCurrentPage('inventory');
              }}
            />
          )}

          {currentPage === 'alerts' && (
            <AlertsView
              alerts={alerts}
              onResolveAlert={handleResolveAlert}
              onMarkRead={handleMarkRead}
              onSelectResourceForAnalysis={handleSelectResourceForAnalysis}
              onNavigate={(p) => setCurrentPage(p)}
            />
          )}

          {currentPage === 'ai-assistant' && (
            <AIAssistantView
              resources={resources}
              suppliers={suppliers}
              alerts={alerts}
              isSimulationActive={isSimulationActive}
              activeScenarioConfig={activeCrisisConfig}
              activeComparison={activeComparison}
              onNavigate={(p) => setCurrentPage(p)}
              onSelectResourceForAnalysis={handleSelectResourceForAnalysis}
            />
          )}
        </main>
      </div>

      {/* Quick Resource Detail Modal */}
      <ResourceDetailModal
        resource={detailModalResource}
        onClose={() => setDetailModalResource(null)}
        onNavigateToRiskAnalysis={handleSelectResourceForAnalysis}
      />

      {/* Crisis Simulation & Resilience Response Engine Modal */}
      <SimulateSurgeModal
        isOpen={isSurgeModalOpen}
        onClose={() => setIsSurgeModalOpen(false)}
        resources={resources}
        suppliers={suppliers}
        baselineResources={BASELINE_RESOURCES}
        baselineSuppliers={BASELINE_SUPPLIERS}
        isSimulationActive={isSimulationActive}
        activeScenarioConfig={activeCrisisConfig}
        activeComparison={activeComparison}
        onApplyCrisisScenario={handleApplyCrisisScenario}
        onApplyWhatIfAction={handleApplyWhatIfAction}
        onResetSimulation={handleResetSimulation}
        onSelectResourceForAnalysis={handleSelectResourceForAnalysis}
      />

      {/* Structured Deep Vulnerability Analysis Modal */}
      <DeepAnalysisModal
        isOpen={isDeepAnalysisModalOpen}
        onClose={() => setIsDeepAnalysisModalOpen(false)}
        resources={resources}
        suppliers={suppliers}
        alerts={alerts}
        isSimulationActive={isSimulationActive}
        onSelectResourceForAnalysis={handleSelectResourceForAnalysis}
        onNavigate={(p) => setCurrentPage(p)}
      />
    </div>
  );
}
