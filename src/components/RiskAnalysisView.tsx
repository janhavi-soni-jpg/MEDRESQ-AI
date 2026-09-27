import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Truck, 
  TrendingUp, 
  Activity, 
  Bot, 
  ArrowRight, 
  Sparkles, 
  ChevronDown, 
  Zap, 
  RefreshCw, 
  Building2, 
  FileText,
  Sliders,
  Info,
  X,
  Download,
  Send,
  Check,
  Package
} from 'lucide-react';
import { MedicalResource, Supplier, RiskLevel, GeminiResourceAnalysisResponse, CrisisScenarioConfig, NavigationPage } from '../types';
import { requestResourceAnalysis } from '../services/geminiClient';

interface RiskAnalysisViewProps {
  resources: MedicalResource[];
  suppliers?: Supplier[];
  selectedResourceId: string;
  onSelectResource: (id: string) => void;
  onApplySimulationAction: (resourceId: string, actionType: 'expedite' | 'alternate' | 'buffer') => void;
  onRunDeepAnalysis?: () => void;
  isSimulationActive?: boolean;
  activeScenarioConfig?: CrisisScenarioConfig | null;
  onNavigate?: (page: NavigationPage) => void;
}

export const RiskAnalysisView: React.FC<RiskAnalysisViewProps> = ({
  resources,
  suppliers = [],
  selectedResourceId,
  onSelectResource,
  onApplySimulationAction,
  onRunDeepAnalysis,
  isSimulationActive = false,
  activeScenarioConfig,
  onNavigate
}) => {
  const [simulationState, setSimulationState] = useState<{
    appliedAction: string | null;
    adjustedDays: number | null;
    message: string | null;
  }>({
    appliedAction: null,
    adjustedDays: null,
    message: null
  });

  const [geminiAnalysis, setGeminiAnalysis] = useState<GeminiResourceAnalysisResponse | null>(null);
  const [isAnalyzingWithGemini, setIsAnalyzingWithGemini] = useState<boolean>(false);
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);

  // In-app interactive workflow states replacing window.alert
  const [activeActionModal, setActiveActionModal] = useState<'po' | 'quote' | null>(null);
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);
  const [poSubmitted, setPoSubmitted] = useState<boolean>(false);
  const [quoteSubmitted, setQuoteSubmitted] = useState<boolean>(false);
  const [selectedAltSupplier, setSelectedAltSupplier] = useState<string>('Apex Medical Distribution');

  const selectedResource = resources.find((r) => r.id === selectedResourceId) || resources[0];
  const matchedSupplier = suppliers.find(
    s => s.name === selectedResource.supplier || (s.resourcesSupplied && s.resourcesSupplied.includes(selectedResource.name))
  );

  // Reset or clear resource analysis when selected resource changes
  useEffect(() => {
    setGeminiAnalysis(null);
    setAiErrorMessage(null);
  }, [selectedResourceId]);

  const handleAnalyzeWithGemini = async () => {
    setIsAnalyzingWithGemini(true);
    setAiErrorMessage(null);
    try {
      const res = await requestResourceAnalysis({
        resource: selectedResource,
        supplier: matchedSupplier,
        isSimulationActive
      });
      setGeminiAnalysis(res.data);
      if (res.errorMessage) {
        setAiErrorMessage(res.errorMessage);
      }
    } catch (err) {
      console.error('Gemini resource analysis error:', err);
      setAiErrorMessage('AI analysis is temporarily unavailable. The rule-based resilience engine is still available.');
    } finally {
      setIsAnalyzingWithGemini(false);
    }
  };

  const handleSimulate = (action: 'expedite' | 'alternate' | 'buffer') => {
    let msg = '';
    let newDays = selectedResource.daysRemaining;

    if (action === 'expedite') {
      newDays = selectedResource.daysRemaining + 5;
      msg = `Simulated 48-hr expedited courier air-freight applied. Estimated stock buffer extended from ${selectedResource.daysRemaining.toFixed(1)}d to ${newDays.toFixed(1)}d.`;
    } else if (action === 'alternate') {
      newDays = selectedResource.daysRemaining + 8;
      msg = `Simulated secondary regional distributor routing applied. +8 days safety margin secured.`;
    } else if (action === 'buffer') {
      newDays = selectedResource.daysRemaining + 3;
      msg = `Simulated non-urgent clinical draw throttling. Burn rate reduced by 25%, extending critical threshold.`;
    }

    setSimulationState({
      appliedAction: action,
      adjustedDays: newDays,
      message: msg
    });

    onApplySimulationAction(selectedResource.id, action);
  };

  const resetSimulation = () => {
    setSimulationState({
      appliedAction: null,
      adjustedDays: null,
      message: null
    });
  };

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-50',
          border: 'border-rose-300',
          text: 'text-rose-800',
          badge: 'bg-rose-600 text-white',
          bar: 'bg-rose-600'
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-300',
          text: 'text-orange-800',
          badge: 'bg-orange-600 text-white',
          bar: 'bg-orange-500'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-300',
          text: 'text-amber-800',
          badge: 'bg-amber-500 text-white',
          bar: 'bg-amber-400'
        };
      case 'STABLE':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-300',
          text: 'text-emerald-800',
          badge: 'bg-emerald-600 text-white',
          bar: 'bg-emerald-500'
        };
    }
  };

  const colors = getRiskColor(selectedResource.riskLevel);
  const activeDays = simulationState.adjustedDays ?? selectedResource.daysRemaining;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Decision-Support Context */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                AI Predictive Shortage & Vulnerability Model
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                Gemini AI Integrated
              </span>
              {isSimulationActive && (
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider">
                  SIMULATED SCENARIO: {activeScenarioConfig?.type === 'demand_surge' 
                    ? `+${activeScenarioConfig.demandSurgePercent}% Demand Surge` 
                    : activeScenarioConfig?.type === 'supplier_delay'
                    ? `+${activeScenarioConfig.supplierDelayDays}d Delay`
                    : activeScenarioConfig?.type === 'shipment_failure'
                    ? 'Shipment Failure'
                    : activeScenarioConfig ? `Combined Crisis` : 'Active'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Evaluates current draw rates, lead times, transit bottlenecks, and safety stock floor
            </p>
          </div>
        </div>

        {/* Resource Selection Dropdown & Actions */}
        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5">
          {onNavigate && (
            <button
              onClick={() => onNavigate('ai-assistant')}
              className="px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
              title="Ask AI about this item"
            >
              <Bot className="w-4 h-4 text-cyan-600" />
              <span>Ask AI</span>
            </button>
          )}

          <button
            onClick={handleAnalyzeWithGemini}
            disabled={isAnalyzingWithGemini}
            className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isAnalyzingWithGemini ? 'animate-spin' : ''}`} />
            <span>{isAnalyzingWithGemini ? 'Analyzing...' : 'Analyze with Gemini'}</span>
          </button>

          {onRunDeepAnalysis && (
            <button
              onClick={onRunDeepAnalysis}
              className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-bold border border-slate-700 flex items-center justify-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Full Formulary Analysis</span>
            </button>
          )}

          <div className="min-w-[240px]">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Selected Medical Resource:
            </label>
            <div className="relative">
              <select
                value={selectedResource.id}
                onChange={(e) => {
                  resetSimulation();
                  onSelectResource(e.target.value);
                }}
                className="w-full appearance-none px-3 py-2 pr-9 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 shadow-xs"
              >
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.riskLevel} - {r.daysRemaining.toFixed(1)}d left)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Select Resource Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap pl-1">
          Formulary Resources:
        </span>
        {resources.map((res) => {
          const isSelected = res.id === selectedResource.id;
          return (
            <button
              key={res.id}
              onClick={() => {
                resetSimulation();
                onSelectResource(res.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 shrink-0 ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  res.riskLevel === 'CRITICAL'
                    ? 'bg-rose-500'
                    : res.riskLevel === 'HIGH'
                    ? 'bg-orange-500'
                    : res.riskLevel === 'MEDIUM'
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
              />
              <span>{res.name.split(' ')[0]}</span>
              <span className="font-mono text-[11px] opacity-75">
                {res.daysRemaining.toFixed(1)}d
              </span>
            </button>
          );
        })}
      </div>

      {/* Primary 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Operational Supply-Chain Data (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[11px] font-bold text-cyan-700 tracking-wider uppercase">
                  Physical Inventory Parameters
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {selectedResource.name}
                </h3>
              </div>
              <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                {selectedResource.batchNumber}
              </span>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Current Stock */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] font-medium text-slate-500 block">Current On-Hand</span>
                <div className="mt-1 flex items-baseline space-x-1">
                  <span className="text-xl font-extrabold text-slate-900 font-mono">
                    {selectedResource.currentStock.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {selectedResource.unit}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Storage: {selectedResource.storageCondition}
                </span>
              </div>

              {/* Average Daily Consumption */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] font-medium text-slate-500 block">Average Daily Draw</span>
                <div className="mt-1 flex items-baseline space-x-1">
                  <span className="text-xl font-extrabold text-slate-900 font-mono">
                    {selectedResource.dailyConsumption.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400">/day</span>
                </div>
                <span className="text-[10px] text-rose-600 font-semibold">
                  Trajectory: +{selectedResource.demandTrendPercentage}%
                </span>
              </div>

              {/* Days Remaining */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] font-medium text-slate-500 block">Buffer Duration</span>
                <div className="mt-1 flex items-baseline space-x-1">
                  <span className="text-xl font-extrabold text-slate-900 font-mono">
                    {activeDays.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-500">Days</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Critical by: {selectedResource.expectedCriticalDate}
                </span>
              </div>

              {/* Safety Stock Baseline */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] font-medium text-slate-500 block">Min Safety Floor</span>
                <div className="mt-1 flex items-baseline space-x-1">
                  <span className="text-xl font-extrabold text-slate-900 font-mono">
                    {selectedResource.minSafetyStock.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400">{selectedResource.unit}</span>
                </div>
                <span className="text-[10px] text-amber-600 font-medium">
                  Buffer deficit: {Math.max(0, selectedResource.minSafetyStock - selectedResource.currentStock).toLocaleString()} units
                </span>
              </div>
            </div>

            {/* Supplier Logistics Details */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Affected Facility:</span>
                </span>
                <span className="font-bold text-slate-900 text-right">{selectedResource.facility || 'Central Regional Health'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center space-x-1.5">
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                  <span>Clinical Criticality:</span>
                </span>
                <span className="font-bold text-slate-800">{selectedResource.criticality || 'Essential (Tier 2)'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Primary Distributor:</span>
                </span>
                <span className="font-bold text-slate-900">{selectedResource.supplier}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Vendor Reorder Lead Time:</span>
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedResource.supplierLeadTimeDays} Days
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Supplier Delay:</span>
                </span>
                <span className={`font-bold font-mono ${selectedResource.shipmentDelayDays > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {selectedResource.shipmentDelay || (selectedResource.shipmentDelayDays > 0 ? `+${selectedResource.shipmentDelayDays} days delay` : 'None (On Schedule)')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                  <span>Fulfillment Reliability:</span>
                </span>
                <span className="font-mono font-bold text-cyan-700">
                  {selectedResource.supplierReliability}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center space-x-1.5">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Active Inbound Status:</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  selectedResource.currentShipmentStatus === 'On Schedule'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedResource.currentShipmentStatus.includes('Hold')
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedResource.currentShipmentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Simulation Sandbox */}
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Sliders className="w-4 h-4" />
              <h4 className="font-bold text-sm tracking-tight">
                Simulate Operational Interventions
              </h4>
            </div>
            <p className="text-xs text-slate-300">
              Model hypothetical procurement actions to forecast resilience impact on critical buffer days.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                onClick={() => handleSimulate('expedite')}
                className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                  simulationState.appliedAction === 'expedite'
                    ? 'bg-cyan-600 border-cyan-400 text-white shadow-xs'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <div className="font-bold flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Air Freight</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Expedite PO (+5d buffer)
                </div>
              </button>

              <button
                onClick={() => handleSimulate('alternate')}
                className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                  simulationState.appliedAction === 'alternate'
                    ? 'bg-cyan-600 border-cyan-400 text-white shadow-xs'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <div className="font-bold flex items-center space-x-1">
                  <Building2 className="w-3 h-3 text-cyan-400" />
                  <span>Alt Supplier</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Split load (+8d buffer)
                </div>
              </button>

              <button
                onClick={() => handleSimulate('buffer')}
                className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                  simulationState.appliedAction === 'buffer'
                    ? 'bg-cyan-600 border-cyan-400 text-white shadow-xs'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <div className="font-bold flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span>Throttle Draw</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Ward ration (+3d buffer)
                </div>
              </button>
            </div>

            {simulationState.appliedAction && (
              <div className="p-3 bg-cyan-950/70 border border-cyan-800 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between text-cyan-300 font-bold">
                  <span>Simulation Active</span>
                  <button
                    onClick={resetSimulation}
                    className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
                <p className="text-slate-200 text-[11px] leading-relaxed">
                  {simulationState.message}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Risk Assessment & Decision-Support (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
            {/* Header with Risk Level Badge & Analyze with Gemini Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    AI Risk Assessment
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                    Confidence: 94.2%
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                  Supply Shortage & Disruption Forecast
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleAnalyzeWithGemini}
                  disabled={isAnalyzingWithGemini}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Generate deep AI explanation for this resource using Gemini"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAnalyzingWithGemini ? 'animate-spin' : ''}`} />
                  <span>{isAnalyzingWithGemini ? 'Analyzing...' : 'Analyze with Gemini'}</span>
                </button>

                <span className={`px-3 py-1.5 rounded-lg text-xs font-extrabold tracking-wide uppercase ${colors.badge} shadow-xs`}>
                  {selectedResource.riskLevel} RISK
                </span>
              </div>
            </div>

            {/* If AI error or key missing, show friendly notice */}
            {aiErrorMessage && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2 text-xs text-amber-800">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Notice: </span>
                  {aiErrorMessage}
                </div>
              </div>
            )}

            {/* Shortage Probability Gauge / Bar */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Shortage Probability within Lead-Time Window:</span>
                </span>
                <span className="font-mono font-extrabold text-rose-600 text-sm">
                  {selectedResource.shortageProbability}% Likelihood
                </span>
              </div>

              <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  style={{ width: `${selectedResource.shortageProbability}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    selectedResource.shortageProbability > 70
                      ? 'bg-rose-600'
                      : selectedResource.shortageProbability > 40
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0% Safe</span>
                <span>50% Threshold</span>
                <span>100% Critical Stockout</span>
              </div>
            </div>

            {/* Expected Time to Critical Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Projected Exhaustion Date
                </span>
                <div className="mt-1 text-base font-extrabold text-slate-900 font-mono">
                  {selectedResource.expectedCriticalDate}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  At continuous inpatient draw of {selectedResource.dailyConsumption} {selectedResource.unit}/day.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Lead Time Vulnerability Deficit
                </span>
                <div className="mt-1 text-base font-extrabold text-rose-600 font-mono">
                  {selectedResource.supplierLeadTimeDays > selectedResource.daysRemaining
                    ? `-${(selectedResource.supplierLeadTimeDays - selectedResource.daysRemaining).toFixed(1)} Days Deficit`
                    : `+${(selectedResource.daysRemaining - selectedResource.supplierLeadTimeDays).toFixed(1)} Days Margin`}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Vendor lead time vs currently available on-hand stock buffer.
                </p>
              </div>
            </div>

            {/* DEDICATED GEMINI AI RESOURCE ANALYSIS PANEL */}
            {geminiAnalysis && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50/80 to-blue-50/50 border-2 border-cyan-300 space-y-3.5 animate-fade-in shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-cyan-200/80">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-cyan-600 text-white flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <h4 className="text-xs font-extrabold text-cyan-950 uppercase tracking-wider">
                        {geminiAnalysis.isAiGenerated ? 'Gemini AI Analysis' : 'AI Decision Support'}
                      </h4>
                      <span className="text-[10px] text-cyan-800">
                        Generated {geminiAnalysis.timestamp || 'Just now'} &bull; Supply-Chain Intelligence
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-white border border-cyan-200 text-cyan-800 font-mono">
                    {geminiAnalysis.daysOfStock}d Safe Stock
                  </span>
                </div>

                {/* AI Risk Explanation */}
                <div>
                  <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                    AI Risk Explanation:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed bg-white/70 p-3 rounded-lg border border-cyan-100">
                    {geminiAnalysis.aiExplanation}
                  </p>
                </div>

                {/* Key Risk Factors */}
                {geminiAnalysis.keyRiskFactors && geminiAnalysis.keyRiskFactors.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                      Key Risk Factors Identified:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {geminiAnalysis.keyRiskFactors.map((factor, fIdx) => (
                        <div key={fIdx} className="p-2 rounded bg-white/80 border border-cyan-100 text-xs text-slate-700 flex items-start space-x-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{factor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Potential Shortage Window */}
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-rose-600 shrink-0" />
                    <div>
                      <span className="font-bold">Potential Shortage Window: </span>
                      <span>{geminiAnalysis.potentialShortageWindow}</span>
                    </div>
                  </div>
                </div>

                {/* Recommended Actions */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                    Recommended Operational Actions:
                  </span>
                  <ul className="space-y-1.5">
                    {geminiAnalysis.recommendedActions.map((action, aIdx) => (
                      <li key={aIdx} className="p-2 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-semibold flex items-start space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Supplier Risk Note */}
                {geminiAnalysis.supplierRiskNote && (
                  <div className="text-[11px] text-slate-600 bg-white/60 p-2 rounded border border-cyan-100 flex items-center space-x-1.5">
                    <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span><strong>Vendor Logistics Assessment:</strong> {geminiAnalysis.supplierRiskNote}</span>
                  </div>
                )}
              </div>
            )}

            {/* Baseline Identified Contributing Factors */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-600" />
                <span>Deterministic Contributing Factors</span>
              </h4>

              <div className="space-y-2">
                {selectedResource.contributingFactors.map((factor, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start space-x-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed">{factor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculated Risk Explanation Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div>
                <div className="flex items-center space-x-1.5 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  <Activity className="w-3.5 h-3.5 text-cyan-600" />
                  <span>WHY IS THIS ITEM AT RISK?</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-900 font-semibold mt-1.5 leading-relaxed bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs">
                  {selectedResource.riskReason}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Actionable Operational Recommendations (2–4 Priority Steps)</span>
                </div>
                <div className="space-y-2 pt-1">
                  {(selectedResource.recommendedActions && selectedResource.recommendedActions.length > 0 
                    ? selectedResource.recommendedActions 
                    : [selectedResource.recommendedAction]
                  ).map((action, aIdx) => (
                    <div 
                      key={aIdx} 
                      className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 font-semibold flex items-start space-x-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setPoSubmitted(false);
                    setActiveActionModal('po');
                  }}
                  className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Generate Emergency PO Draft</span>
                </button>
                <button
                  onClick={() => {
                    setQuoteSubmitted(false);
                    setActiveActionModal('quote');
                  }}
                  className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold text-xs transition-colors cursor-pointer flex items-center space-x-1.5"
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Request Alternate Supplier Quote</span>
                </button>
              </div>

              {/* In-app action notification banner */}
              {actionSuccessToast && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex items-center justify-between animate-fade-in shadow-xs">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">{actionSuccessToast}</span>
                  </div>
                  <button 
                    onClick={() => setActionSuccessToast(null)}
                    className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Regulatory & Safety Disclaimer */}
            <div className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 leading-relaxed">
              <strong>Supply-Chain Decision-Support System:</strong> Algorithmic risk calculations are designed to optimize hospital inventory buffering and vendor replenishment. It does not dictate patient treatments, prescribe drugs, or replace clinical pharmacy judgment.
            </div>
          </div>
        </div>
      </div>

      {/* EMERGENCY PO DRAFT MODAL */}
      {activeActionModal === 'po' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Emergency Purchase Order (PO) Draft
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Ref: #PO-URG-{selectedResource.id.replace('res-', '').toUpperCase()}-8921
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveActionModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {poSubmitted ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Emergency PO Successfully Transmitted!</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    PO <strong>#PO-URG-{selectedResource.id.replace('res-', '').toUpperCase()}-8921</strong> has been dispatched to Central Regional Health Materials Management &amp; Procurement Desk with urgent priority status.
                  </p>
                  <div className="pt-2 text-[11px] text-emerald-700 font-mono">
                    Dispatch Timestamp: {new Date().toLocaleTimeString()} &bull; Priority: Air-Freight Critical (24-48h SLA)
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Requisition Resource:</span>
                      <span className="font-extrabold text-slate-900">{selectedResource.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Current Stock Reserve:</span>
                      <span className="font-mono text-slate-700 font-bold">
                        {selectedResource.currentStock.toLocaleString()} {selectedResource.unit} ({selectedResource.daysRemaining.toFixed(1)} days buffer)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Average Daily Inpatient Burn:</span>
                      <span className="font-mono text-slate-700 font-bold">
                        {selectedResource.dailyConsumption.toLocaleString()} {selectedResource.unit}/day
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                      <span className="text-cyan-800 font-bold">Recommended Replenishment:</span>
                      <span className="font-mono font-extrabold text-cyan-900 text-sm">
                        {Math.max(150, Math.round(selectedResource.dailyConsumption * 14 - selectedResource.currentStock)).toLocaleString()} {selectedResource.unit}
                      </span>
                    </div>
                  </div>

                  {/* Logistics Specs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Supplier</span>
                      <div className="font-bold text-slate-900">{selectedResource.supplier}</div>
                      <div className="text-[11px] text-slate-500">Active status: {selectedResource.currentShipmentStatus}</div>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Expedited Transport Routing</span>
                      <div className="font-bold text-cyan-800">Priority Cold-Chain Air Freight</div>
                      <div className="text-[11px] text-slate-500">24–48hr Direct Courier Bypass</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Urgent Procurement Directive: </span>
                      Authorizing this PO bypasses standard 7-day batch replenishment cycles to prevent projected stockout on {selectedResource.expectedCriticalDate}.
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => {
                  // Direct download of PO slip text file
                  const poNum = `PO-URG-${selectedResource.id.replace('res-', '').toUpperCase()}-8921`;
                  const qty = Math.max(150, Math.round(selectedResource.dailyConsumption * 14 - selectedResource.currentStock));
                  const poText = `CENTRAL REGIONAL HEALTH AUTHORITY
EMERGENCY REPLENISHMENT PURCHASE ORDER
=====================================================
PO Number: ${poNum}
Date: ${new Date().toLocaleDateString()}
Status: DRAFT / AUTHORIZED FOR TRANSMISSION
-----------------------------------------------------
Item: ${selectedResource.name}
Requisition Quantity: ${qty} ${selectedResource.unit}
Current Stock: ${selectedResource.currentStock} ${selectedResource.unit} (${selectedResource.daysRemaining.toFixed(1)} days left)
Daily Consumption: ${selectedResource.dailyConsumption} ${selectedResource.unit}/day
Safety Floor Minimum: ${selectedResource.minSafetyStock} ${selectedResource.unit}

Distributor: ${selectedResource.supplier}
Logistics Method: Air Freight 24-48h Expedited
Delivery Destination: Central Health Medical Depot
Approved under Emergency Resilience Protocol.
=====================================================`;
                  const blob = new Blob([poText], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${poNum}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Download PO Summary</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveActionModal(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  {poSubmitted ? 'Done' : 'Close'}
                </button>

                {!poSubmitted && (
                  <button
                    onClick={() => {
                      setPoSubmitted(true);
                      setActionSuccessToast(`Emergency PO #PO-URG-${selectedResource.id.replace('res-', '').toUpperCase()}-8921 submitted to Central Health Materials Management.`);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Submit to Procurement Desk</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ALTERNATE SUPPLIER RFQ QUOTE MODAL */}
      {activeActionModal === 'quote' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Request Alternate Supplier Quote (RFQ)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Secondary vendor procurement dispatch for {selectedResource.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveActionModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {quoteSubmitted ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Inquiry Dispatched to {selectedAltSupplier}!</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    RFQ inquiry reference <strong>#RFQ-ALT-7729</strong> has been transmitted via EDI. The distributor has an active SLA guarantee to provide availability quotes within 2 hours.
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-xs text-slate-600 leading-relaxed">
                    Primary vendor <strong>{selectedResource.supplier}</strong> currently reports delivery vulnerabilities ({selectedResource.currentShipmentStatus}). Select a pre-qualified secondary distributor to request an expedited inventory allocation:
                  </div>

                  {/* Alternate Vendors Selection */}
                  <div className="space-y-2 text-xs">
                    {[
                      {
                        name: 'Apex Medical Distribution',
                        leadTime: '2 Days',
                        reliability: '96%',
                        inventoryNote: 'Regional stock confirmed in domestic warehouse'
                      },
                      {
                        name: 'MediSource Regional Direct',
                        leadTime: '3 Days',
                        reliability: '91%',
                        inventoryNote: 'Tier-2 verified distributor with standing contract'
                      },
                      {
                        name: 'National Health Supply Consortium',
                        leadTime: '2 Days',
                        reliability: '97%',
                        inventoryNote: 'Inter-hospital cooperative sharing agreement'
                      }
                    ].map((vendor) => (
                      <label
                        key={vendor.name}
                        onClick={() => setSelectedAltSupplier(vendor.name)}
                        className={`p-3 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                          selectedAltSupplier === vendor.name
                            ? 'bg-cyan-50/80 border-cyan-400 ring-1 ring-cyan-400'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="altSupplier"
                              checked={selectedAltSupplier === vendor.name}
                              onChange={() => setSelectedAltSupplier(vendor.name)}
                              className="text-cyan-600 focus:ring-cyan-500"
                            />
                            <span className="font-bold text-slate-900">{vendor.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 pl-5">{vendor.inventoryNote}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-mono font-bold text-cyan-800 block">
                            ETA: {vendor.leadTime}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Rel: {vendor.reliability}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                    <span className="text-slate-500">Target Requisition Volume:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {Math.max(200, Math.round(selectedResource.dailyConsumption * 10)).toLocaleString()} {selectedResource.unit} (10-Day Safe Stock)
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                onClick={() => setActiveActionModal(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                {quoteSubmitted ? 'Done' : 'Cancel'}
              </button>

              {!quoteSubmitted && (
                <button
                  onClick={() => {
                    setQuoteSubmitted(true);
                    setActionSuccessToast(`Inquiry dispatched to ${selectedAltSupplier} for ${selectedResource.name}. Expected quote turnaround: < 2h.`);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch RFQ Transmission</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
