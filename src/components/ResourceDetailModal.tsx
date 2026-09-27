import React from 'react';
import { 
  X, 
  Package, 
  Clock, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Activity, 
  Flame,
  ShieldAlert,
  Thermometer,
  MapPin,
  Calendar
} from 'lucide-react';
import { MedicalResource, NavigationPage } from '../types';

interface ResourceDetailModalProps {
  resource: MedicalResource | null;
  onClose: () => void;
  onNavigateToRiskAnalysis: (resourceId: string) => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resource,
  onClose,
  onNavigateToRiskAnalysis
}) => {
  if (!resource) return null;

  const isCritical = resource.riskLevel === 'CRITICAL';
  const isHigh = resource.riskLevel === 'HIGH';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-cyan-100 text-cyan-800 border border-cyan-200">
                {resource.category}
              </span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                  isCritical
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : isHigh
                    ? 'bg-orange-100 text-orange-800 border border-orange-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {resource.riskLevel} RISK
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
              {resource.name}
            </h3>

            {resource.genericName && (
              <p className="text-xs font-mono text-slate-500">
                {resource.genericName}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Stock</span>
              <span className="text-base font-mono font-extrabold text-slate-900 mt-1 block">
                {resource.currentStock.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500">{resource.unit}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Daily Draw</span>
              <span className="text-base font-mono font-extrabold text-slate-900 mt-1 block">
                {resource.dailyConsumption.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500">units/day</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Buffer Duration</span>
              <span className={`text-base font-mono font-extrabold mt-1 block ${
                resource.daysRemaining <= 3 ? 'text-rose-600' : resource.daysRemaining <= 7 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {resource.daysRemaining.toFixed(1)} Days
              </span>
              <span className="text-[10px] text-slate-500">Till stockout</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Min Safety Floor</span>
              <span className="text-base font-mono font-extrabold text-slate-900 mt-1 block">
                {resource.minSafetyStock.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500">units floor</span>
            </div>
          </div>

          {/* Logistics & Location Specifications */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-slate-700">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Logistics & Facility Telemetry
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <Building2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <span>
                  <strong>Facility: </strong>{resource.facility || 'Central Regional Health'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  <strong>Supplier Delay: </strong>
                  <span className={resource.shipmentDelayDays > 0 ? 'text-rose-600 font-bold' : 'text-emerald-700'}>
                    {resource.shipmentDelay || (resource.shipmentDelayDays > 0 ? `+${resource.shipmentDelayDays}d delay` : 'None (On Schedule)')}
                  </span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <span>
                  <strong>Expected Depletion: </strong>{resource.expectedCriticalDate}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Building2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <span>
                  <strong>Primary Supplier: </strong>{resource.supplier} (Lead: {resource.supplierLeadTimeDays}d)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Thermometer className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <span>
                  <strong>Storage: </strong>{resource.storageCondition}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <span>
                  <strong>Batch Expiry: </strong>{resource.expiryDate} (#{resource.batchNumber})
                </span>
              </div>
            </div>
          </div>

          {/* Contributing Risk Factors */}
          {resource.contributingFactors && resource.contributingFactors.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Primary Risk Drivers:
              </span>
              <div className="space-y-1">
                {resource.contributingFactors.map((f, i) => (
                  <div key={i} className="p-2 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start space-x-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Assessment Snapshot */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5" />
                <span>Deterministic Risk Rationale</span>
              </span>
              <span className="text-xs font-mono font-bold text-rose-400">
                {resource.shortageProbability}% Shortage Likelihood
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {resource.riskReason}
            </p>

            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-200 space-y-1.5">
              <strong className="text-cyan-300 block mb-0.5">Actionable Operational Recommendations:</strong>
              {(resource.recommendedActions && resource.recommendedActions.length > 0
                ? resource.recommendedActions
                : [resource.recommendedAction]
              ).map((act, idx) => (
                <div key={idx} className="flex items-start space-x-1.5 text-[11px] text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{act}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors"
          >
            Close Details
          </button>

          <button
            onClick={() => {
              onClose();
              onNavigateToRiskAnalysis(resource.id);
            }}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs transition-colors flex items-center space-x-1.5 shadow-xs"
          >
            <span>Run Deep Risk Analysis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
