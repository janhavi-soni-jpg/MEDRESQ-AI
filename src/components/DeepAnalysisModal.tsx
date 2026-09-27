import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Truck, 
  TrendingUp, 
  Package, 
  Clock, 
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Activity,
  Sparkles,
  Download,
  RotateCw,
  Info,
  Layers,
  Bot
} from 'lucide-react';
import { 
  MedicalResource, 
  Supplier, 
  AlertItem, 
  DeepAnalysisResult, 
  NavigationPage, 
  RiskLevel,
  GeminiDeepAnalysisResponse 
} from '../types';
import { runDeepAnalysis } from '../services/resilienceEngine';
import { requestDeepAnalysis, DeepAnalysisResultWrapper } from '../services/geminiClient';

interface DeepAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  resources: MedicalResource[];
  suppliers: Supplier[];
  alerts?: AlertItem[];
  isSimulationActive?: boolean;
  onSelectResourceForAnalysis: (resourceId: string) => void;
  onNavigate: (page: NavigationPage) => void;
}

export const DeepAnalysisModal: React.FC<DeepAnalysisModalProps> = ({
  isOpen,
  onClose,
  resources,
  suppliers,
  alerts = [],
  isSimulationActive = false,
  onSelectResourceForAnalysis,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'gemini' | 'matrix'>('gemini');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<GeminiDeepAnalysisResponse | null>(null);
  const [isAiGenerated, setIsAiGenerated] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExported, setIsExported] = useState<boolean>(false);

  const handleExportBrief = () => {
    const headers = ['Resource', 'Category', 'Current Stock', 'Daily Burn', 'Days Remaining', 'Risk Level', 'Supplier', 'Shipment Status'];
    const rows = resources.map(r => [
      `"${r.name}"`,
      `"${r.category}"`,
      r.currentStock,
      r.dailyConsumption,
      r.daysRemaining.toFixed(1),
      r.riskLevel,
      `"${r.supplier}"`,
      `"${r.currentShipmentStatus}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `medresq-supply-brief-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExported(true);
    setTimeout(() => setIsExported(false), 3500);
  };

  // Deterministic engine calculation
  const deterministicAnalysis: DeepAnalysisResult = useMemo(() => {
    return runDeepAnalysis(resources, suppliers);
  }, [resources, suppliers]);

  const loadGeminiAnalysis = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result: DeepAnalysisResultWrapper = await requestDeepAnalysis({
        resources,
        suppliers,
        alerts,
        isSimulationActive
      });
      setAiAnalysis(result.data);
      setIsAiGenerated(result.isAiGenerated);
      if (result.errorMessage) {
        setErrorMessage(result.errorMessage);
      }
    } catch (err: any) {
      console.error('Failed to run Gemini deep analysis:', err);
      setErrorMessage('AI analysis is temporarily unavailable. The rule-based resilience engine is still available.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadGeminiAnalysis();
    }
  }, [isOpen, isSimulationActive]);

  if (!isOpen) return null;

  const getRiskBadge = (level: string) => {
    const l = level.toUpperCase();
    if (l === 'CRITICAL') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
          <span>CRITICAL RISK</span>
        </span>
      );
    }
    if (l === 'HIGH') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
          <span>HIGH RISK</span>
        </span>
      );
    }
    if (l === 'MEDIUM') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>MEDIUM RISK</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
        <span>STABLE</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full my-auto flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Formulary Resilience Deep Analysis
                </h2>
                {isAiGenerated ? (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                    <Sparkles className="w-3 h-3 text-cyan-600" />
                    <span>Gemini AI Analysis</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    <Activity className="w-3 h-3 text-amber-600" />
                    <span>Deterministic Resilience Engine</span>
                  </span>
                )}
                {isSimulationActive && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200 uppercase">
                    Surge Simulation Active (+35%)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-factor cross-analysis: burn rates, Tier-1 distributor transit bottlenecks, and buffer horizons
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadGeminiAnalysis}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
              title="Re-run analysis with latest state"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-600' : ''}`} />
              <span>{isLoading ? 'Analyzing...' : 'Re-Run Analysis'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('gemini')}
              className={`py-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-colors ${
                activeTab === 'gemini'
                  ? 'border-cyan-600 text-cyan-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>AI Resilience Assessment</span>
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`py-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-colors ${
                activeTab === 'matrix'
                  ? 'border-cyan-600 text-cyan-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Formulary Inventory Matrix ({resources.length} SKUs)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 hidden sm:block">
            Decision Support &bull; Updated: {aiAnalysis?.timestamp || 'Real-time'}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Friendly Notification Banner if AI is in fallback mode */}
          {errorMessage && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2 text-xs text-amber-800">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Notice: </span>
                {errorMessage}
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="p-12 text-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center mx-auto animate-bounce">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Gemini AI is analyzing current hospital supply-chain state...
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Evaluating {resources.length} formulary resources, supplier lead time vulnerability gaps, and transit bottleneck telemetry.
              </p>
            </div>
          )}

          {/* TAB 1: AI RESILIENCE ASSESSMENT */}
          {!isLoading && activeTab === 'gemini' && aiAnalysis && (
            <div className="space-y-6">
              {/* Executive Summary & Overall Risk Card */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      AI Resilience Assessment
                    </span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="text-xs font-semibold text-slate-600">
                      Overall Risk:
                    </span>
                  </div>
                  <div>
                    {getRiskBadge(aiAnalysis.overallRisk)}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Executive Summary
                  </h4>
                  <p className="text-sm text-slate-800 leading-relaxed font-medium">
                    {aiAnalysis.summary}
                  </p>
                </div>
              </div>

              {/* Priority Resources Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Priority High-Risk Resources</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {aiAnalysis.priorityResources.length} items flagged
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {aiAnalysis.priorityResources.map((item, idx) => {
                    const matchedRes = resources.find(r => r.name.toLowerCase().includes(item.resourceName.toLowerCase()));
                    return (
                      <div 
                        key={idx} 
                        className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5 hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm">
                              {item.resourceName}
                            </h4>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              Estimated Buffer: <strong className="text-rose-600">{item.daysOfStock} Days</strong>
                            </div>
                          </div>
                          {getRiskBadge(item.riskLevel)}
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          {item.reason}
                        </p>

                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Recommended Actions:
                          </span>
                          <ul className="space-y-1">
                            {item.recommendedActions.map((action, aIdx) => (
                              <li key={aIdx} className="text-xs text-slate-800 flex items-start space-x-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {matchedRes && (
                          <div className="pt-2 border-t border-slate-100 flex justify-end">
                            <button
                              onClick={() => {
                                onClose();
                                onSelectResourceForAnalysis(matchedRes.id);
                              }}
                              className="text-xs text-cyan-700 hover:text-cyan-900 font-bold flex items-center space-x-1"
                            >
                              <span>Deep Dive in Risk Console</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Two Column: Supplier Risks & Demand Risks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Supplier Risks */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                    <Truck className="w-4 h-4 text-orange-600" />
                    <span>Identified Supplier Risks</span>
                  </h3>

                  <div className="space-y-2">
                    {aiAnalysis.supplierRisks.map((s, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{s.supplierName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-bold">
                            {s.riskLevel}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {s.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Demand & Consumption Surge Risks */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                    <TrendingUp className="w-4 h-4 text-cyan-600" />
                    <span>Demand & Consumption Surge Risks</span>
                  </h3>

                  <div className="space-y-2">
                    {aiAnalysis.demandRisks.map((d, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                        <span className="font-bold text-slate-900 block">{d.resourceName}</span>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {d.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Potential Shortage Windows */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-rose-600" />
                  <span>Potential Shortage Windows & Forecast Horizons</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {aiAnalysis.shortageWindows.map((win, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900">{win.resourceName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                          {win.estimatedWindow}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                        {win.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* General Operational Recommendations */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-900 to-slate-900 text-white shadow-sm space-y-3">
                <div className="flex items-center space-x-2 text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                  <h4 className="font-bold text-sm tracking-tight">
                    Recommended Operational Actions
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {aiAnalysis.generalRecommendations.map((rec, idx) => (
                    <div key={idx} className="p-3 bg-white/10 rounded-xl border border-white/10 text-xs space-y-1">
                      <span className="text-cyan-300 font-bold block text-[11px]">
                        Priority {idx + 1}
                      </span>
                      <p className="text-slate-200 leading-relaxed text-[11px]">
                        {rec}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DETAILED FORMULARY INVENTORY MATRIX */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Complete Formulary Item Risk Matrix
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {deterministicAnalysis.items.length} Tracked Resources
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3.5">Risk Level</th>
                        <th className="py-3 px-3.5">Medical Resource</th>
                        <th className="py-3 px-3.5">Current Stock</th>
                        <th className="py-3 px-3.5">Days of Stock</th>
                        <th className="py-3 px-3.5">Primary Risk Factors</th>
                        <th className="py-3 px-3.5">Recommended Action</th>
                        <th className="py-3 px-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {deterministicAnalysis.items.map((item) => {
                        const isCrit = item.riskLevel === 'CRITICAL';
                        const isHigh = item.riskLevel === 'HIGH';

                        return (
                          <tr 
                            key={item.resourceId}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isCrit ? 'bg-rose-50/30' : isHigh ? 'bg-orange-50/20' : ''
                            }`}
                          >
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              {getRiskBadge(item.riskLevel)}
                            </td>
                            <td className="py-3 px-3.5">
                              <div className="font-bold text-slate-900">
                                {item.resourceName}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {item.category} &bull; Supplier: {item.supplierName}
                              </div>
                            </td>
                            <td className="py-3 px-3.5 whitespace-nowrap font-mono">
                              <div className="font-bold text-slate-900">
                                {item.currentStock.toLocaleString()} {item.unit}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Min Floor: {item.safetyStock.toLocaleString()}
                                {item.safetyDeficit > 0 && (
                                  <span className="text-rose-600 font-bold ml-1">
                                    (-{item.safetyDeficit.toLocaleString()})
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <div className={`font-mono font-extrabold text-sm ${
                                item.daysRemaining <= 3 ? 'text-rose-600' :
                                item.daysRemaining <= 7 ? 'text-orange-600' :
                                item.daysRemaining <= 14 ? 'text-amber-600' : 'text-emerald-600'
                              }`}>
                                {item.daysRemaining.toFixed(1)} Days
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {item.dailyConsumption} / day
                              </div>
                            </td>
                            <td className="py-3 px-3.5 max-w-xs">
                              <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                                {item.primaryRiskFactors.slice(0, 2).map((factor, idx) => (
                                  <li key={idx} className="truncate" title={factor}>
                                    {factor}
                                  </li>
                                ))}
                              </ul>
                            </td>
                            <td className="py-3 px-3.5 max-w-xs">
                              <div className="text-[11px] font-semibold text-slate-800 leading-snug">
                                {item.recommendedAction}
                              </div>
                            </td>
                            <td className="py-3 px-3.5 text-right whitespace-nowrap">
                              <button
                                onClick={() => {
                                  onClose();
                                  onSelectResourceForAnalysis(item.resourceId);
                                }}
                                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-cyan-50 hover:text-cyan-800 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
                              >
                                Deep Dive
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Regulatory & Healthcare Supply-Chain Safety Disclaimer */}
          <div className="text-[11px] text-slate-400 bg-slate-100 p-3 rounded-xl border border-slate-200 leading-relaxed flex items-start space-x-2">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <strong>Supply-Chain Decision-Support System:</strong> MEDRESQ AI analyzes simulated hospital inventory burn rates, supplier lead times, and transit bottlenecks to anticipate logistics shortages. It is strictly a supply-chain planning system and does NOT provide medical diagnoses, treatment instructions, or clinical care recommendations.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Export or dispatch operational procurement briefs to hospital materials management.
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleExportBrief}
              className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExported ? 'Brief Downloaded!' : 'Export Brief (CSV)'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Close Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
