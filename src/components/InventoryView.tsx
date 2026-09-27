import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  AlertTriangle, 
  ExternalLink, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Download,
  Info,
  Calendar,
  X
} from 'lucide-react';
import { MedicalResource, RiskLevel, ResourceCategory, NavigationPage, CrisisScenarioConfig } from '../types';

interface InventoryViewProps {
  resources: MedicalResource[];
  onSelectResourceForAnalysis: (resourceId: string) => void;
  onNavigate: (page: NavigationPage) => void;
  onOpenResourceModal: (resource: MedicalResource) => void;
  isSimulationActive?: boolean;
  activeScenarioConfig?: CrisisScenarioConfig | null;
  onResetSimulation?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  resources,
  onSelectResourceForAnalysis,
  onNavigate,
  onOpenResourceModal,
  isSimulationActive = false,
  activeScenarioConfig,
  onResetSimulation
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('ALL');
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);
  const [sortField, setSortField] = useState<keyof MedicalResource>('daysRemaining');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Unique lists for filter dropdowns
  const categories = useMemo(() => {
    const set = new Set(resources.map((r) => r.category));
    return Array.from(set);
  }, [resources]);

  const suppliers = useMemo(() => {
    const set = new Set(resources.map((r) => r.supplierName));
    return Array.from(set);
  }, [resources]);

  // Filtering and Sorting
  const filteredResources = useMemo(() => {
    return resources
      .filter((item) => {
        // Search filter
        const matchSearch =
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.genericName && item.genericName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.departmentLocation.toLowerCase().includes(searchQuery.toLowerCase());

        // Risk filter
        const matchRisk = selectedRisk === 'ALL' || item.riskLevel === selectedRisk;

        // Category filter
        const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;

        // Supplier filter
        const matchSupplier = selectedSupplier === 'ALL' || item.supplierName === selectedSupplier;

        // Low stock filter (days remaining <= 7 or status is LOW_STOCK / CRITICAL)
        const matchLowStock = !onlyLowStock || item.daysRemaining <= 7 || item.status === 'LOW_STOCK' || item.status === 'CRITICAL';

        return matchSearch && matchRisk && matchCategory && matchSupplier && matchLowStock;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        // Custom comparator for RiskLevel
        if (sortField === 'riskLevel') {
          const weights: Record<RiskLevel, number> = {
            CRITICAL: 4,
            HIGH: 3,
            MEDIUM: 2,
            STABLE: 1
          };
          valA = weights[a.riskLevel];
          valB = weights[b.riskLevel];
        }

        if (valA === undefined || valB === undefined) return 0;
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [resources, searchQuery, selectedRisk, selectedCategory, selectedSupplier, onlyLowStock, sortField, sortOrder]);

  const handleSort = (field: keyof MedicalResource) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            <span>Critical</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
            <span>High Risk</span>
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Medium Risk</span>
          </span>
        );
      case 'STABLE':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Stable</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return <span className="text-emerald-700 font-medium text-xs">Adequate</span>;
      case 'LOW_STOCK':
        return <span className="text-amber-700 font-bold text-xs">Depleting Buffer</span>;
      case 'CRITICAL':
        return <span className="text-rose-700 font-extrabold text-xs">Imminent Stockout</span>;
      case 'DELAYED_INBOUND':
        return <span className="text-indigo-700 font-semibold text-xs">Transit Delay</span>;
      default:
        return <span className="text-slate-600 text-xs">{status}</span>;
    }
  };

  // Export filtered CSV simulation
  const handleExportCSV = () => {
    const headers = [
      'Resource Name',
      'Category',
      'Current Stock',
      'Daily Consumption',
      'Min Safety Stock',
      'Days Remaining',
      'Expiry Date',
      'Risk Level',
      'Supplier',
      'Status'
    ];
    const rows = filteredResources.map((r) => [
      `"${r.name}"`,
      `"${r.category}"`,
      r.currentStock,
      r.dailyConsumption,
      r.minSafetyStock,
      r.daysRemaining.toFixed(1),
      r.expiryDate,
      r.riskLevel,
      `"${r.supplierName}"`,
      r.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `medresq_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Simulation Notice Banner */}
      {isSimulationActive && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center space-x-2.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-200 text-amber-900 border border-amber-400/50 uppercase tracking-wider shrink-0">
              DEMO SIMULATION ACTIVE
            </span>
            <span className="text-slate-700 font-medium">
              Inventory runway, safety floors, and risk levels reflect the active simulated disruption ({activeScenarioConfig ? activeScenarioConfig.type.replace(/_/g, ' ') : 'scenario'}).
            </span>
          </div>
          {onResetSimulation && (
            <button
              onClick={onResetSimulation}
              className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 font-bold hover:bg-amber-100 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer shrink-0"
            >
              Reset Scenario
            </button>
          )}
        </div>
      )}

      {/* Search & Multi-Filter Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search medical resources, generic names, batch SKU..."
              className="w-full pl-10 pr-9 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Tools: Low Stock Toggle & Export */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 select-none hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={onlyLowStock}
                onChange={(e) => setOnlyLowStock(e.target.checked)}
                className="w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500"
              />
              <span className="text-rose-700 flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5 inline" />
                <span>Show Only Low / Critical Stock</span>
              </span>
            </label>

            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-200"
              title="Download filtered dataset as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-1 text-slate-500 mr-2 font-medium">
            <Filter className="w-3.5 h-3.5 text-cyan-600" />
            <span>Filters:</span>
          </div>

          {/* Risk Level Filter */}
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium text-xs focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="STABLE">Stable Only</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium text-xs focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Supplier Filter */}
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium text-xs focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          >
            <option value="ALL">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          {(searchQuery || selectedRisk !== 'ALL' || selectedCategory !== 'ALL' || selectedSupplier !== 'ALL' || onlyLowStock) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedRisk('ALL');
                setSelectedCategory('ALL');
                setSelectedSupplier('ALL');
                setOnlyLowStock(false);
              }}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-800 font-semibold hover:underline ml-auto"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Inventory Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{filteredResources.length}</strong> of{' '}
            <strong className="text-slate-800">{resources.length}</strong> medical resources
          </div>
          <div className="text-[11px] text-slate-400">
            Click column header to sort • Click any row for AI Risk Analysis
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>SKU / Resource</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('category')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors hidden md:table-cell"
                >
                  <div className="flex items-center space-x-1">
                    <span>Category</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('currentStock')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Current Stock</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('daysRemaining')}
                  className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Days of Stock</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('minSafetyStock')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Safety Stock</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 hidden sm:table-cell">Supplier</th>
                <th
                  onClick={() => handleSort('leadTimeDays')}
                  className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 transition-colors hidden lg:table-cell"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Lead Time</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('riskLevel')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Risk Level</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="font-semibold text-sm">No medical resources matched the selected filters.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try clearing search parameters or adjusting risk thresholds.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredResources.map((item) => {
                  const isCritical = item.riskLevel === 'CRITICAL';
                  const isHigh = item.riskLevel === 'HIGH';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => {
                        onSelectResourceForAnalysis(item.id);
                        onNavigate('risk-analysis');
                      }}
                      className={`hover:bg-cyan-50/50 cursor-pointer transition-colors group ${
                        isCritical ? 'bg-rose-50/20' : isHigh ? 'bg-orange-50/10' : ''
                      }`}
                    >
                      {/* SKU & Name & Generic */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                            {item.sku}
                          </span>
                          <span className="font-bold text-slate-900 group-hover:text-cyan-800 transition-colors">
                            {item.name}
                          </span>
                        </div>
                        {item.genericName && (
                          <div className="text-[11px] text-slate-500 font-mono truncate max-w-[240px] mt-0.5">
                            {item.genericName}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {item.facility || item.departmentLocation}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 hidden md:table-cell">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          {item.category}
                        </span>
                      </td>

                      {/* Current Stock */}
                      <td className="py-3.5 px-3 text-right">
                        <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                          {item.currentStock.toLocaleString()}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {item.unit}
                        </span>
                      </td>

                      {/* Days of Stock Remaining */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`font-mono font-extrabold text-sm px-2.5 py-0.5 rounded ${
                              item.daysOfStock < 3
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : item.daysOfStock <= 5
                                ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                : item.daysOfStock <= 14
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {item.daysOfStock.toFixed(1)} d
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5 font-mono">
                            {item.dailyConsumption} {item.unit}/d
                          </span>
                        </div>
                      </td>

                      {/* Safety Stock */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="font-mono font-bold text-slate-800">
                          {item.minimumSafetyStock.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          floor reserve
                        </span>
                      </td>

                      {/* Supplier */}
                      <td className="py-3.5 px-3 text-slate-700 hidden sm:table-cell">
                        <div className="font-medium truncate max-w-[150px]" title={item.supplier}>
                          {item.supplier}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Rel: {item.supplierReliability}%
                        </div>
                      </td>

                      {/* Lead Time */}
                      <td className="py-3.5 px-3 text-center hidden lg:table-cell">
                        <span className="font-mono font-bold text-slate-800">
                          {item.supplierLeadTimeDays} Days
                        </span>
                        {item.shipmentDelayDays > 0 && (
                          <span className="block text-[10px] text-rose-600 font-semibold">
                            +{item.shipmentDelayDays}d delay
                          </span>
                        )}
                      </td>

                      {/* Risk Level */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {getRiskBadge(item.riskLevel)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Actions */}
                      <td 
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              onSelectResourceForAnalysis(item.id);
                              onNavigate('risk-analysis');
                            }}
                            className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
                            title="Run AI Risk Simulation & View Recommendations"
                          >
                            Analyze
                          </button>
                          <button
                            onClick={() => onOpenResourceModal(item)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                            title="Quick view details"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Formula: <span className="font-mono text-slate-700">Days Remaining = Current Stock ÷ Daily Consumption</span>
          </div>
          <div className="text-[11px]">
            Inventory buffer updated automatically in accordance with WHO essential medical lists.
          </div>
        </div>
      </div>
    </div>
  );
};
