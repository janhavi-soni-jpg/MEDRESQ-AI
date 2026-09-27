import React, { useState, useMemo } from 'react';
import { 
  X, 
  Flame, 
  RefreshCw, 
  SlidersHorizontal, 
  ArrowRight, 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Package, 
  Activity,
  Layers,
  Truck,
  ShieldCheck,
  AlertOctagon,
  CornerDownRight,
  Zap,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  MedicalResource, 
  Supplier, 
  RiskLevel, 
  CrisisScenarioType, 
  CrisisScenarioConfig, 
  CrisisSimulationComparison, 
  ResilienceRecommendation 
} from '../types';
import { 
  executeCrisisScenario, 
  applyWhatIfResponse, 
  calculateResilienceScore 
} from '../services/resilienceEngine';

interface SimulateSurgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  resources: MedicalResource[];
  suppliers: Supplier[];
  baselineResources: MedicalResource[];
  baselineSuppliers: Supplier[];
  isSimulationActive: boolean;
  activeScenarioConfig?: CrisisScenarioConfig | null;
  activeComparison?: CrisisSimulationComparison | null;
  onApplyCrisisScenario: (
    scenario: CrisisScenarioConfig,
    simulatedResources: MedicalResource[],
    simulatedSuppliers: Supplier[],
    comparison: CrisisSimulationComparison
  ) => void;
  onApplyWhatIfAction: (
    actionId: string,
    postResources: MedicalResource[],
    postSuppliers: Supplier[],
    updatedRecommendations: ResilienceRecommendation[],
    postStats: any
  ) => void;
  onResetSimulation: () => void;
  onSelectResourceForAnalysis?: (resourceId: string) => void;
}

export const SimulateSurgeModal: React.FC<SimulateSurgeModalProps> = ({
  isOpen,
  onClose,
  resources,
  suppliers,
  baselineResources,
  baselineSuppliers,
  isSimulationActive,
  activeScenarioConfig,
  activeComparison,
  onApplyCrisisScenario,
  onApplyWhatIfAction,
  onResetSimulation,
  onSelectResourceForAnalysis
}) => {
  // Scenario selection states
  const [selectedScenarioType, setSelectedScenarioType] = useState<CrisisScenarioType>(
    activeScenarioConfig?.type || 'demand_surge'
  );
  const [demandSurgePercent, setDemandSurgePercent] = useState<20 | 40 | 60>(
    activeScenarioConfig?.demandSurgePercent || 40
  );
  const [supplierDelayDays, setSupplierDelayDays] = useState<2 | 5 | 7>(
    activeScenarioConfig?.supplierDelayDays || 5
  );
  const [failedSupplierId, setFailedSupplierId] = useState<string>(
    activeScenarioConfig?.failedSupplierId || 'sup-biopharma'
  );

  // Active view tab inside modal: 'configure' | 'comparison' | 'whatif'
  const [activeTab, setActiveTab] = useState<'configure' | 'comparison' | 'whatif'>(
    isSimulationActive && activeComparison ? 'comparison' : 'configure'
  );

  // Local what-if applied tracking for real-time recalculation preview
  const [appliedWhatIfActionId, setAppliedWhatIfActionId] = useState<string | null>(null);

  // Run execution calculation dynamically for the configured scenario
  const currentScenarioConfig: CrisisScenarioConfig = useMemo(() => ({
    type: selectedScenarioType,
    demandSurgePercent,
    supplierDelayDays,
    failedSupplierId,
    failedShipmentPercent: 100
  }), [selectedScenarioType, demandSurgePercent, supplierDelayDays, failedSupplierId]);

  // Projected scenario preview
  const previewSimulation = useMemo(() => {
    return executeCrisisScenario(baselineResources, baselineSuppliers, currentScenarioConfig);
  }, [baselineResources, baselineSuppliers, currentScenarioConfig]);

  // Use either active comparison from parent or computed preview
  const displayComparison: CrisisSimulationComparison = useMemo(() => {
    if (isSimulationActive && activeComparison && selectedScenarioType === activeScenarioConfig?.type) {
      return activeComparison;
    }
    return previewSimulation.comparison;
  }, [isSimulationActive, activeComparison, selectedScenarioType, activeScenarioConfig, previewSimulation]);

  // Apply What-If response to preview or active state
  const whatIfPreview = useMemo(() => {
    if (!appliedWhatIfActionId) return null;
    return applyWhatIfResponse(
      previewSimulation.simulatedResources,
      previewSimulation.simulatedSuppliers,
      appliedWhatIfActionId,
      displayComparison.recommendations
    );
  }, [appliedWhatIfActionId, previewSimulation, displayComparison]);

  if (!isOpen) return null;

  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-300">
            HIGH RISK
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            MEDIUM
          </span>
        );
      case 'STABLE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            STABLE
          </span>
        );
    }
  };

  const handleRunSimulation = () => {
    onApplyCrisisScenario(
      currentScenarioConfig,
      previewSimulation.simulatedResources,
      previewSimulation.simulatedSuppliers,
      previewSimulation.comparison
    );
    setActiveTab('comparison');
  };

  const handleApplyWhatIf = (actionId: string) => {
    setAppliedWhatIfActionId(actionId);
    if (whatIfPreview) {
      onApplyWhatIfAction(
        actionId,
        whatIfPreview.postResponseResources,
        whatIfPreview.postResponseSuppliers,
        whatIfPreview.updatedRecommendations,
        whatIfPreview.postResponseStats
      );
    } else {
      const outcome = applyWhatIfResponse(
        previewSimulation.simulatedResources,
        previewSimulation.simulatedSuppliers,
        actionId,
        displayComparison.recommendations
      );
      onApplyWhatIfAction(
        actionId,
        outcome.postResponseResources,
        outcome.postResponseSuppliers,
        outcome.updatedRecommendations,
        outcome.postResponseStats
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-start justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                  CRISIS SIMULATION &amp; RESILIENCE RESPONSE ENGINE
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                Healthcare Supply Disruption &amp; Operational Mitigation Simulator
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Stress-test hospital formularies against clinical surges, transit bottlenecks, and evaluate resilience responses
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-5 pt-3 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div className="flex space-x-1 sm:space-x-3 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('configure')}
              className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'configure'
                  ? 'border-cyan-600 text-cyan-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>1. Scenario Selector</span>
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'comparison'
                  ? 'border-cyan-600 text-cyan-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>2. Baseline vs Crisis Impact</span>
              {isSimulationActive && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('whatif')}
              className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'whatif'
                  ? 'border-cyan-600 text-cyan-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>3. What-If Response Engine</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-100 text-cyan-800">
                {displayComparison.recommendations.length} Actions
              </span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 hidden md:flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Operational Decision Support Only</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* TAB 1: CONFIGURE CRISIS SCENARIO */}
          {activeTab === 'configure' && (
            <div className="space-y-6">
              {/* Scenario Type Grid */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                  Select Crisis Scenario Archetype:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Scenario A: Demand Surge */}
                  <div
                    onClick={() => setSelectedScenarioType('demand_surge')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedScenarioType === 'demand_surge'
                        ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-400/50'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-amber-900">Scenario A</span>
                      <Flame className="w-4 h-4 text-amber-600" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">Clinical Demand Surge</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Epidemic or trauma mass casualty accelerates inpatient burn rates across pharmaceuticals &amp; fluids.
                    </p>
                  </div>

                  {/* Scenario B: Supplier Delay */}
                  <div
                    onClick={() => setSelectedScenarioType('supplier_delay')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedScenarioType === 'supplier_delay'
                        ? 'bg-indigo-500/10 border-indigo-500 ring-2 ring-indigo-400/50'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-indigo-900">Scenario B</span>
                      <Truck className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">Supplier Transit Delay</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Customs holds, flight cancellations, or logistics strikes push supplier lead times past on-hand stock.
                    </p>
                  </div>

                  {/* Scenario C: Critical Shipment Failure */}
                  <div
                    onClick={() => setSelectedScenarioType('shipment_failure')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedScenarioType === 'shipment_failure'
                        ? 'bg-rose-500/10 border-rose-500 ring-2 ring-rose-400/50'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-rose-900">Scenario C</span>
                      <AlertOctagon className="w-4 h-4 text-rose-600" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">Critical Shipment Failure</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Inbound shipment fails cold-chain audit or batch quarantine; expected stock volume becomes unavailable.
                    </p>
                  </div>

                  {/* Scenario D: Combined Crisis */}
                  <div
                    onClick={() => setSelectedScenarioType('combined_crisis')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedScenarioType === 'combined_crisis'
                        ? 'bg-purple-500/10 border-purple-500 ring-2 purple-amber-400/50'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-purple-900">Scenario D</span>
                      <ShieldAlert className="w-4 h-4 text-purple-600" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">Combined Crisis</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Double shock: Clinical surge draw combines simultaneously with severe distributor delivery delays.
                    </p>
                  </div>
                </div>
              </div>

              {/* Scenario Specific Parameter Controls */}
              <div className="p-4 sm:p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                {(selectedScenarioType === 'demand_surge' || selectedScenarioType === 'combined_crisis') && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-700">
                        Inpatient Demand Surge Intensity:
                      </label>
                      <span className="text-sm font-extrabold text-amber-600 font-mono">
                        +{demandSurgePercent}% Daily Draw Rate
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {([20, 40, 60] as const).map((pct) => (
                        <button
                          key={pct}
                          onClick={() => setDemandSurgePercent(pct)}
                          className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            demandSurgePercent === pct
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          +{pct}% Surge {pct === 20 ? '(Moderate)' : pct === 40 ? '(Severe)' : '(Extreme)'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedScenarioType === 'supplier_delay' || selectedScenarioType === 'combined_crisis') && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-700">
                        Logistics Lead-Time Delay:
                      </label>
                      <span className="text-sm font-extrabold text-indigo-600 font-mono">
                        +{supplierDelayDays} Days Transit Lag
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {([2, 5, 7] as const).map((days) => (
                        <button
                          key={days}
                          onClick={() => setSupplierDelayDays(days)}
                          className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            supplierDelayDays === days
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          +{days} Days {days === 2 ? '(Short Lag)' : days === 5 ? '(Port Hold)' : '(Major Disruption)'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedScenarioType === 'shipment_failure' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-700">
                        Quarantined / Failed Inbound Shipment Supplier:
                      </label>
                      <span className="text-xs font-extrabold text-rose-600 font-mono">
                        100% Inbound Loss Modeled
                      </span>
                    </div>
                    <select
                      value={failedSupplierId}
                      onChange={(e) => setFailedSupplierId(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 rounded-lg border border-slate-300 bg-white text-slate-800"
                    >
                      <option value="sup-biopharma">Global BioPharma Logistics (Insulin, Propofol, Cold-Chain)</option>
                      <option value="sup-pharmanexus">PharmaNexus International (Ceftriaxone, Amoxicillin)</option>
                      <option value="sup-biosense">Biosense Diagnostics (Blood Collection, Diagnostic Kits)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Quick Launch Action Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-cyan-600" />
                  <span>
                    Deterministic risk modeling will recalculate daily runway across all 15 SKUs.
                  </span>
                </div>
                <button
                  onClick={handleRunSimulation}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Flame className="w-4 h-4 text-amber-300" />
                  <span>Execute Crisis Simulation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: BEFORE VS AFTER COMPARISON */}
          {activeTab === 'comparison' && (
            <div className="space-y-6">
              {/* Crisis Summary Banner (Requirement 8) */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/90 border border-rose-500/40 text-white space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500 text-white uppercase tracking-wider">
                    {displayComparison.crisisSummary.title}
                  </span>
                  <span className="text-xs text-rose-300 font-mono">
                    {displayComparison.crisisSummary.trigger}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Primary Impact</span>
                    <span className="text-white font-semibold">{displayComparison.crisisSummary.primaryImpact}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Most Affected SKUs</span>
                    <span className="text-amber-300 font-semibold">{displayComparison.crisisSummary.mostAffected.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Main Risk Driver</span>
                    <span className="text-slate-200">{displayComparison.crisisSummary.mainDriver}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Recommended Mitigation</span>
                    <span className="text-cyan-300 font-semibold">{displayComparison.crisisSummary.recommendedResponse}</span>
                  </div>
                </div>
              </div>

              {/* BEFORE VS AFTER KPI COMPARISON (Requirement 2 & 6) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-cyan-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Baseline vs Simulated Crisis Metrics
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Simulated Supply Resilience Indicator
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* BASELINE CARD */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">Status Baseline</span>
                        <h5 className="text-sm font-bold text-slate-800">Normal Operations</h5>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase text-slate-500 block">Resilience Score</span>
                        <span className="text-base font-extrabold text-emerald-700 font-mono">
                          {displayComparison.baseline.resilienceScore} / 100
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">Critical SKUs</span>
                        <span className="text-base font-bold text-slate-800 font-mono">
                          {displayComparison.baseline.criticalItems}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">High Risk SKUs</span>
                        <span className="text-base font-bold text-slate-800 font-mono">
                          {displayComparison.baseline.highRiskItems}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">Avg Days of Stock</span>
                        <span className="text-base font-bold text-emerald-700 font-mono">
                          {displayComparison.baseline.avgDaysOfStock} Days
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">Shortage Horizon</span>
                        <span className="text-xs font-bold text-slate-800 font-mono">
                          {displayComparison.baseline.shortageWindow}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SIMULATED CRISIS CARD */}
                  <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-rose-700 block">Simulated Shock</span>
                        <h5 className="text-sm font-bold text-rose-950">Active Crisis State</h5>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase text-rose-700 block">Resilience Score</span>
                        <span className="text-base font-extrabold text-rose-700 font-mono">
                          {displayComparison.simulated.resilienceScore} / 100
                        </span>
                        <span className="text-[10px] text-rose-600 font-semibold block">
                          ({displayComparison.simulated.resilienceScore - displayComparison.baseline.resilienceScore} pts)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-white/90 border border-rose-200">
                        <span className="text-[11px] text-rose-800 block">Critical SKUs</span>
                        <span className="text-base font-bold text-rose-700 font-mono">
                          {displayComparison.simulated.criticalItems} (+{displayComparison.simulated.criticalItems - displayComparison.baseline.criticalItems})
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/90 border border-rose-200">
                        <span className="text-[11px] text-rose-800 block">High Risk SKUs</span>
                        <span className="text-base font-bold text-orange-700 font-mono">
                          {displayComparison.simulated.highRiskItems}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/90 border border-rose-200">
                        <span className="text-[11px] text-rose-800 block">Simulated Avg Stock</span>
                        <span className="text-base font-bold text-rose-700 font-mono">
                          {displayComparison.simulated.avgDaysOfStock} Days
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/90 border border-rose-200">
                        <span className="text-[11px] text-rose-800 block">Depletion Window</span>
                        <span className="text-xs font-bold text-rose-700 font-mono">
                          {displayComparison.simulated.shortageWindow}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TOP AFFECTED INVENTORY TABLE (Requirement 3) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                    <Package className="w-4 h-4 text-cyan-600" />
                    <span>Top Affected Medical Resources &amp; Deterioration Drivers</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Showing {displayComparison.topAffectedSKUs.length} priority items
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                      <tr>
                        <th className="py-2.5 px-3">Item / SKU</th>
                        <th className="py-2.5 px-2 text-center">Baseline Runway</th>
                        <th className="py-2.5 px-2 text-center">Simulated Runway</th>
                        <th className="py-2.5 px-3 text-center">Risk Transition</th>
                        <th className="py-2.5 px-3">Deterioration Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayComparison.topAffectedSKUs.map((sku) => (
                        <tr key={sku.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            <div>{sku.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {sku.sku} &bull; {sku.category}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-600 font-semibold">
                            {sku.baselineDaysOfStock.toFixed(1)}d
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold">
                            <span className={sku.simulatedDaysOfStock < 3 ? 'text-rose-600' : 'text-amber-600'}>
                              {sku.simulatedDaysOfStock.toFixed(1)}d
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              {getRiskBadge(sku.previousRisk)}
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                              {getRiskBadge(sku.newRisk)}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 text-[11px] leading-snug">
                            {sku.reasonForDeterioration}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RESILIENCE RESPONSE ENGINE & WHAT-IF TESTING (Requirement 4 & 5) */}
          {activeTab === 'whatif' && (
            <div className="space-y-6">
              {/* Score Indicator Banner */}
              <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800">
                    RESILIENCE RESPONSE ENGINE
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    Simulate Operational Responses to Mitigate Shortages
                  </h4>
                  <p className="text-xs text-slate-300">
                    Apply actionable interventions (alternate vendors, expedited logistics, quota throttling) and measure projected score recovery.
                  </p>
                </div>

                <div className="flex items-center space-x-3 shrink-0 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700">
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-400 block font-bold">
                      Simulated Resilience Score
                    </span>
                    <div className="flex items-baseline space-x-1.5 justify-end">
                      <span className="text-xl font-extrabold text-amber-400 font-mono">
                        {whatIfPreview 
                          ? whatIfPreview.postResponseStats.resilienceScore 
                          : displayComparison.simulated.resilienceScore}
                      </span>
                      <span className="text-xs text-slate-400">/ 100</span>
                    </div>
                  </div>
                  {whatIfPreview && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-1 rounded">
                      +{whatIfPreview.postResponseStats.resilienceScore - displayComparison.simulated.resilienceScore} Pts
                    </span>
                  )}
                </div>
              </div>

              {/* What-If Applied Card (Requirement 5) */}
              {whatIfPreview && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <h5 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                        Simulated What-If Outcome Applied: {whatIfPreview.postResponseStats.actionApplied}
                      </h5>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      Simulated Result
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Critical SKUs</span>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="line-through text-slate-400 font-mono">{displayComparison.simulated.criticalItems}</span>
                        <ArrowRight className="w-3 h-3 text-emerald-600" />
                        <span className="font-extrabold text-emerald-700 text-sm font-mono">
                          {whatIfPreview.postResponseStats.criticalItems} SKUs
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">High Risk SKUs</span>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="line-through text-slate-400 font-mono">{displayComparison.simulated.highRiskItems}</span>
                        <ArrowRight className="w-3 h-3 text-emerald-600" />
                        <span className="font-extrabold text-amber-700 text-sm font-mono">
                          {whatIfPreview.postResponseStats.highRiskItems} SKUs
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Avg Days Buffer</span>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="line-through text-slate-400 font-mono">{displayComparison.simulated.avgDaysOfStock}d</span>
                        <ArrowRight className="w-3 h-3 text-emerald-600" />
                        <span className="font-extrabold text-emerald-700 text-sm font-mono">
                          {whatIfPreview.postResponseStats.avgDaysOfStock}d
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Shortage Horizon</span>
                      <span className="font-bold text-emerald-800 text-xs font-mono block mt-0.5">
                        {whatIfPreview.postResponseStats.shortageWindow}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actionable Recommendations List (Requirement 4) */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Generated Operational Mitigation Responses:
                </label>

                <div className="space-y-3">
                  {displayComparison.recommendations.map((rec) => {
                    const isApplied = appliedWhatIfActionId === rec.id || rec.applied;

                    return (
                      <div
                        key={rec.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isApplied
                            ? 'bg-emerald-50/60 border-emerald-400 ring-2 ring-emerald-300'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-cyan-100 text-cyan-800">
                                {rec.actionType.replace(/_/g, ' ')}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                Target: <strong>{rec.affectedItem}</strong>
                              </span>
                            </div>
                            <h5 className="text-sm font-bold text-slate-900">{rec.action}</h5>
                          </div>

                          <button
                            onClick={() => handleApplyWhatIf(rec.id)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                              isApplied
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-cyan-600 hover:text-white text-slate-700'
                            }`}
                          >
                            {isApplied ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Applied to Scenario</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                                <span>Test Response Impact</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs mt-3 pt-3 border-t border-slate-100">
                          <div>
                            <span className="text-slate-500 font-semibold block text-[11px]">
                              Why Recommended:
                            </span>
                            <p className="text-slate-700 text-[11px] leading-relaxed">
                              {rec.whyRecommended}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500 font-semibold block text-[11px]">
                              Expected Operational Impact:
                            </span>
                            <p className="text-emerald-700 font-semibold text-[11px] leading-relaxed">
                              {rec.expectedOperationalImpact}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Activity className="w-4 h-4 text-cyan-600" />
            <span>Simulated Supply Resilience Engine &bull; Decision Support Only</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {isSimulationActive && (
              <button
                onClick={() => {
                  onResetSimulation();
                  setAppliedWhatIfActionId(null);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset Scenario</span>
              </button>
            )}

            {activeTab !== 'configure' && (
              <button
                onClick={() => setActiveTab('configure')}
                className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
              >
                Modify Scenario
              </button>
            )}

            <button
              onClick={() => {
                if (activeTab === 'configure') {
                  handleRunSimulation();
                } else {
                  onClose();
                }
              }}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <span>{activeTab === 'configure' ? 'Run Simulation' : 'Close & View Dashboard'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
