import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Truck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Search, 
  Mail, 
  MapPin, 
  Package, 
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Info
} from 'lucide-react';
import { Supplier, NavigationPage, MedicalResource } from '../types';
import { evaluateSupplierRisk, isShipmentDisrupted } from '../services/resilienceEngine';

interface SuppliersViewProps {
  suppliers: Supplier[];
  resources?: MedicalResource[];
  onNavigate: (page: NavigationPage) => void;
  onFilterInventoryBySupplier: (supplierName: string) => void;
  onSelectResourceForAnalysis?: (resourceId: string) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  resources = [],
  onNavigate,
  onFilterInventoryBySupplier,
  onSelectResourceForAnalysis
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(null);

  // Alternative supplier mapping
  const alternativeSuppliers: Record<string, string> = {
    'sup-biopharma': 'Apex Medical Distribution (Pre-qualified cold-chain secondary, 3-day lead time)',
    'sup-pharmanexus': 'Apex Medical Distribution & MediSource Direct (Secondary beta-lactam source, 4-day lead time)',
    'sup-biosense': 'LabCorp Regional Diagnostics (Secondary vacuum tube supply contract, 3-day lead time)',
    'sup-apex': 'MedSupply Direct Corp (Cross-network sterile consumables partner, 3-day lead time)',
    'sup-medsupply': 'Apex Medical Distribution (Regional backup bulk fluids depot, 4-day lead time)'
  };

  // Dynamically evaluate supplier risk with current resources state
  const evaluatedSuppliers = useMemo(() => {
    return suppliers.map((sup) => {
      const evalData = evaluateSupplierRisk(sup, resources);
      return {
        ...sup,
        supplyRisk: evalData.supplyRisk,
        criticalResourceCount: evalData.criticalCount,
        highResourceCount: evalData.highCount,
        impactedResources: evalData.impactedResources
      };
    });
  }, [suppliers, resources]);

  const networkAvgReliability = useMemo(() => {
    if (suppliers.length === 0) return 0;
    const sum = suppliers.reduce((acc, s) => acc + s.reliability, 0);
    return (sum / suppliers.length).toFixed(1);
  }, [suppliers]);

  const activeHoldsCount = useMemo(() => {
    return suppliers.filter((s) => isShipmentDisrupted(s.currentShipmentStatus)).length;
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    return evaluatedSuppliers.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.primaryLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.resourcesSupplied.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchRisk = selectedRisk === 'ALL' || s.supplyRisk === selectedRisk;

      return matchSearch && matchRisk;
    });
  }, [evaluatedSuppliers, searchQuery, selectedRisk]);

  const getRiskBadge = (risk: Supplier['supplyRisk']) => {
    switch (risk) {
      case 'SEVERE':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            <span>Severe Risk</span>
          </span>
        );
      case 'ELEVATED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
            <span>Elevated Risk</span>
          </span>
        );
      case 'MODERATE':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            <span>Moderate Risk</span>
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Low Risk</span>
          </span>
        );
    }
  };

  const getShipmentBadge = (status: Supplier['currentShipmentStatus']) => {
    switch (status) {
      case 'On Schedule':
        return (
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs font-semibold border border-emerald-200">
            On Schedule
          </span>
        );
      case 'Delayed':
        return (
          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-xs font-bold border border-amber-200">
            Delayed Transit
          </span>
        );
      case 'Customs Hold':
        return (
          <span className="text-rose-800 bg-rose-50 px-2 py-0.5 rounded text-xs font-extrabold border border-rose-200 animate-pulse">
            Customs Hold
          </span>
        );
      default:
        return (
          <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Advisory Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Contracted Supplier Reliability & Transit Tracking
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              5 Tier-1 Vendors
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracks historical delivery compliance, customs holdups, cold-chain integrity, and active shipments.
          </p>
        </div>

        {/* Global Supplier Stats */}
        <div className="flex items-center space-x-4 self-stretch md:self-auto text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Network Reliability</span>
            <span className="text-sm font-extrabold text-slate-800 font-mono">{networkAvgReliability}% Avg</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Active Holds</span>
            <span className={`text-sm font-extrabold font-mono ${activeHoldsCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {activeHoldsCount} Inbound
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search supplier, location, or supplies..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500 font-medium">Filter by Risk:</span>
          {(['ALL', 'LOW', 'MODERATE', 'ELEVATED', 'SEVERE'] as const).map((risk) => (
            <button
              key={risk}
              onClick={() => setSelectedRisk(risk)}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                selectedRisk === risk
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {risk}
            </button>
          ))}
        </div>
      </div>

      {/* Supplier Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSuppliers.map((supplier) => {
          const isHighRisk = supplier.supplyRisk === 'SEVERE' || supplier.supplyRisk === 'ELEVATED';

          return (
            <div
              key={supplier.id}
              className={`bg-white rounded-xl border p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between ${
                isHighRisk ? 'border-amber-200/90' : 'border-slate-200'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-cyan-700" />
                      <h3 className="font-extrabold text-slate-900 text-base">
                        {supplier.name}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-1 text-[11px] text-slate-500 mt-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{supplier.primaryLocation}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {getRiskBadge(supplier.supplyRisk)}
                    {(supplier.criticalResourceCount > 0 || supplier.highResourceCount > 0) && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {supplier.criticalResourceCount} Critical &bull; {supplier.highResourceCount} High Risk
                      </span>
                    )}
                  </div>
                </div>

                {/* Primary Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3 border-b border-slate-100 text-center">
                  <div className="p-2 rounded bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Lead Time</span>
                    <span className="text-sm font-extrabold text-slate-800 font-mono">
                      {supplier.averageDeliveryDays} Days
                    </span>
                  </div>

                  <div className="p-2 rounded bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Transit Delay</span>
                    <span className={`text-sm font-extrabold font-mono ${
                      supplier.currentShipmentStatus === 'Customs Hold'
                        ? 'text-rose-600'
                        : supplier.currentShipmentStatus === 'Delayed'
                        ? 'text-amber-600'
                        : 'text-emerald-700'
                    }`}>
                      {supplier.currentShipmentStatus === 'Customs Hold'
                        ? '+4 Days (Hold)'
                        : supplier.currentShipmentStatus === 'Delayed'
                        ? '+3–5 Days'
                        : '0 Days (None)'}
                    </span>
                  </div>

                  <div className="p-2 rounded bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Reliability</span>
                    <span
                      className={`text-sm font-extrabold font-mono ${
                        supplier.reliability >= 90
                          ? 'text-emerald-600'
                          : supplier.reliability >= 75
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {supplier.reliability}%
                    </span>
                  </div>

                  <div className="p-2 rounded bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Shipment Status</span>
                    <div className="mt-0.5">{getShipmentBadge(supplier.currentShipmentStatus)}</div>
                  </div>
                </div>

                {/* Delay History & Active Notes */}
                <div className="py-3 space-y-2 text-xs">
                  <div className="flex items-start space-x-2 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span>
                      <strong className="text-slate-800 font-semibold">Delay Record: </strong>
                      {supplier.delayHistory}
                    </span>
                  </div>

                  {supplier.activeShipmentRef && (
                    <div className="flex items-start space-x-2 text-slate-600">
                      <Truck className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span>
                        <strong className="text-slate-800 font-semibold">Tracked Waybill: </strong>
                        <span className="font-mono text-cyan-800 font-bold">{supplier.activeShipmentRef}</span>
                      </span>
                    </div>
                  )}

                  {/* Alternative Supplier Availability */}
                  <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-950 flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold text-emerald-900 block">Alternative Supplier Availability:</strong>
                      <span>{alternativeSuppliers[supplier.id] || 'Secondary regional distributor network available on standby.'}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 text-[11px] text-slate-600 leading-relaxed">
                    {supplier.notes}
                  </div>
                </div>

                {/* Resources Supplied Tag Cloud & Expand Toggle */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Affected Sourced SKUs ({supplier.resourcesSupplied.length}):
                    </span>
                    <button
                      onClick={() => setExpandedSupplierId(expandedSupplierId === supplier.id ? null : supplier.id)}
                      className="text-[11px] font-bold text-cyan-700 hover:text-cyan-800 underline cursor-pointer"
                    >
                      {expandedSupplierId === supplier.id ? 'Hide Details ▲' : 'Inspect Affected Inventory ▼'}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {supplier.resourcesSupplied.map((item, idx) => {
                      const matchedRes = resources.find((r) => r.name.toLowerCase() === item.toLowerCase() || item.toLowerCase().includes(r.name.toLowerCase()));
                      const isResCrit = matchedRes?.riskLevel === 'CRITICAL';
                      const isResHigh = matchedRes?.riskLevel === 'HIGH';

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            if (matchedRes && onSelectResourceForAnalysis) {
                              onSelectResourceForAnalysis(matchedRes.id);
                              onNavigate('risk-analysis');
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border flex items-center space-x-1 cursor-pointer transition-all hover:shadow-2xs ${
                            isResCrit 
                              ? 'bg-rose-50 text-rose-800 border-rose-300 font-bold hover:bg-rose-100'
                              : isResHigh
                              ? 'bg-orange-50 text-orange-800 border-orange-300 font-semibold hover:bg-orange-100'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          }`}
                          title={matchedRes ? `Click to analyze ${matchedRes.name}` : undefined}
                        >
                          {isResCrit && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse mr-0.5" />}
                          <span>{item}</span>
                          {matchedRes && (
                            <span className="text-[10px] opacity-75 font-mono">
                              ({matchedRes.daysOfStock.toFixed(1)}d)
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Expandable Affected Inventory Panel */}
                  {expandedSupplierId === supplier.id && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 animate-fade-in">
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Live Inventory Sourced from {supplier.name}:
                      </div>
                      <div className="divide-y divide-slate-200/70 border border-slate-200 rounded-lg bg-white overflow-hidden">
                        {supplier.resourcesSupplied.map((resName, rIdx) => {
                          const rItem = resources.find((r) => r.name.toLowerCase() === resName.toLowerCase() || resName.toLowerCase().includes(r.name.toLowerCase()));
                          if (!rItem) return null;

                          return (
                            <div key={rIdx} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                              <div>
                                <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                                  <span>{rItem.name}</span>
                                  <span className="font-mono text-[10px] text-slate-400">({rItem.sku})</span>
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  Stock: <strong className="text-slate-800">{rItem.currentStock.toLocaleString()}</strong> {rItem.unit} &bull; Burn: <strong className="text-slate-800">{rItem.dailyConsumption}</strong>/d
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`font-mono font-extrabold text-[11px] px-2 py-0.5 rounded ${
                                  rItem.daysOfStock < 3 
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                                    : rItem.daysOfStock <= 5 
                                    ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                }`}>
                                  {rItem.daysOfStock.toFixed(1)} Days
                                </span>
                                {onSelectResourceForAnalysis && (
                                  <button
                                    onClick={() => {
                                      onSelectResourceForAnalysis(rItem.id);
                                      onNavigate('risk-analysis');
                                    }}
                                    className="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[10px] transition-colors"
                                  >
                                    Analyze
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Card Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 text-slate-500">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] truncate max-w-[180px]">{supplier.contactEmail}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setExpandedSupplierId(expandedSupplierId === supplier.id ? null : supplier.id)}
                    className="font-semibold text-slate-700 hover:text-slate-900 text-xs px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                  >
                    <span>{expandedSupplierId === supplier.id ? 'Close' : 'View Impacted'}</span>
                  </button>
                  <button
                    onClick={() => {
                      onFilterInventoryBySupplier(supplier.name);
                      onNavigate('inventory');
                    }}
                    className="font-semibold text-cyan-700 hover:text-cyan-800 flex items-center space-x-1 text-xs"
                  >
                    <span>Filter Stock</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
