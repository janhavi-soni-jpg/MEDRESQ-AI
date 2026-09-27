import { 
  MedicalResource, 
  Supplier, 
  AlertItem, 
  RiskLevel, 
  StockStatus, 
  DeepAnalysisResult,
  DeepAnalysisItem 
} from '../types';

/**
 * MEDRESQ Resilience Engine
 * Deterministic supply-chain risk calculation and shortage anticipation.
 * 
 * NOTE: This is a simulation engine using demo operational supply-chain parameters.
 * It is not a medically validated clinical diagnostic or treatment system.
 */

/**
 * 1. Safe Days of Stock Calculation
 * daysOfStock = currentStock / dailyConsumption
 * Handles zero and negative consumption safely.
 */
export function calculateDaysOfStock(currentStock: number, dailyConsumption: number): number {
  if (dailyConsumption <= 0) {
    return currentStock > 0 ? 999 : 0;
  }
  const days = currentStock / dailyConsumption;
  return Math.max(0, parseFloat(days.toFixed(1)));
}

/**
 * Helper to test if a shipment status represents an active delay or hold
 */
export function isShipmentDisrupted(status: string): boolean {
  const s = status.toLowerCase();
  return (
    s.includes('delayed') || 
    s.includes('hold') || 
    s.includes('bottleneck') || 
    s.includes('backorder') ||
    s.includes('customs')
  );
}

export interface ResourceRiskEvaluation {
  riskLevel: RiskLevel;
  status: StockStatus;
  daysOfStock: number;
  shortageProbability: number;
  riskReason: string;
  recommendedAction: string;
  recommendedActions: string[];
  contributingFactors: string[];
  expectedCriticalDate: string;
}

/**
 * 2. Deterministic Risk Engine
 * Computes transparent, deterministic risk level based on:
 * - Days of stock: < 3.0 (CRITICAL), 3-5 (HIGH), 6-14 (MEDIUM), > 14 (STABLE)
 * - Increased by supplier delays, lead time deficits, high consumption, safety buffer breaches
 */
export function evaluateResourceRisk(
  resource: Pick<
    MedicalResource,
    | 'name'
    | 'currentStock'
    | 'dailyConsumption'
    | 'minimumSafetyStock'
    | 'supplier'
    | 'supplierLeadTimeDays'
    | 'supplierReliability'
    | 'demandTrend'
    | 'shipmentStatus'
  > & {
    shipmentDelayDays?: number;
    facility?: string;
  }
): ResourceRiskEvaluation {
  const daysOfStock = calculateDaysOfStock(resource.currentStock, resource.dailyConsumption);
  const minSafety = resource.minimumSafetyStock;
  const leadTime = resource.supplierLeadTimeDays;
  const reliability = resource.supplierReliability;
  const demandSurge = resource.demandTrend;
  const hasShipmentDisruption = isShipmentDisrupted(resource.shipmentStatus);
  const delayDays = resource.shipmentDelayDays ?? (hasShipmentDisruption ? 3 : 0);

  const contributingFactors: string[] = [];

  // Factor 1: Lead-time deficit (stock runs out before new delivery can arrive)
  const leadTimeDeficit = leadTime - daysOfStock;
  const leadTimeExceeds = leadTime > daysOfStock;
  if (leadTimeExceeds) {
    contributingFactors.push(
      `Delivery lead time (${leadTime} days) exceeds available on-hand stock duration (${daysOfStock} days), projecting a stockout window without expedited intervention.`
    );
  } else if (daysOfStock <= leadTime + 2) {
    contributingFactors.push(
      `Tight replenishment margin: Only ${daysOfStock} days on-hand versus a standard ${leadTime}-day lead time.`
    );
  }

  // Factor 2: Safety stock floor status
  const belowSafety = resource.currentStock < minSafety;
  if (resource.currentStock < minSafety * 0.5) {
    contributingFactors.push(
      `Severe safety reserve deficit: Current stock (${resource.currentStock.toLocaleString()} units) is under 50% of the required minimum safety threshold (${minSafety.toLocaleString()} units).`
    );
  } else if (belowSafety) {
    contributingFactors.push(
      `Safety threshold breach: Current stock (${resource.currentStock.toLocaleString()} units) has fallen below the designated minimum safety reserve (${minSafety.toLocaleString()} units).`
    );
  }

  // Factor 3: Demand surge
  const isHighDemand = demandSurge >= 20;
  if (demandSurge >= 30) {
    contributingFactors.push(
      `Accelerated clinical demand surge (+${demandSurge}% above baseline) is aggressively draining daily safety stock.`
    );
  } else if (demandSurge >= 15) {
    contributingFactors.push(
      `Elevated clinical draw rate (+${demandSurge}% above baseline) outpacing regular replenishment cadence.`
    );
  }

  // Factor 4: Shipment disruption
  if (hasShipmentDisruption || delayDays > 0) {
    contributingFactors.push(
      `Active shipment disruption: Inbound delivery flagged as "${resource.shipmentStatus}" from ${resource.supplier} (+${delayDays}d delay).`
    );
  }

  // Factor 5: Supplier reliability
  if (reliability < 75) {
    contributingFactors.push(
      `Low supplier fulfillment reliability (${reliability}% on-time track record) introduces high replenishment volatility.`
    );
  }

  // Deterministic Classification Rules
  // CRITICAL: < 3.0 days of stock (or 3-5 days with severe aggravating factors)
  // HIGH RISK: 3–5 days of stock (or 6-14 days with supplier delay/deficit)
  // MEDIUM RISK: 6–14 days of stock (or >14 days with delivery delay/safety floor deficit)
  // STABLE: > 14 days of stock with healthy buffers
  let riskLevel: RiskLevel = 'STABLE';
  let status: StockStatus = 'IN_STOCK';
  let shortageProbability = 15;

  if (
    daysOfStock < 3.0 ||
    (daysOfStock <= 5.0 && (leadTimeExceeds || delayDays >= 3 || resource.currentStock < minSafety * 0.5))
  ) {
    riskLevel = 'CRITICAL';
    status = 'CRITICAL';
    shortageProbability = Math.min(96, Math.max(82, Math.round(98 - daysOfStock * 5)));
  } else if (
    daysOfStock <= 5.0 ||
    (daysOfStock <= 8.0 && (hasShipmentDisruption || leadTimeExceeds || belowSafety)) ||
    (daysOfStock <= 14.0 && hasShipmentDisruption && belowSafety)
  ) {
    riskLevel = 'HIGH';
    status = hasShipmentDisruption ? 'DELAYED_INBOUND' : 'LOW_STOCK';
    shortageProbability = Math.min(84, Math.max(65, Math.round(86 - daysOfStock * 4)));
  } else if (
    daysOfStock <= 14.0 ||
    belowSafety ||
    hasShipmentDisruption ||
    isHighDemand
  ) {
    riskLevel = 'MEDIUM';
    status = 'LOW_STOCK';
    shortageProbability = Math.min(60, Math.max(35, Math.round(62 - daysOfStock * 2)));
  } else {
    riskLevel = 'STABLE';
    status = 'IN_STOCK';
    shortageProbability = Math.max(5, Math.min(25, Math.round(28 - daysOfStock)));
    if (contributingFactors.length === 0) {
      contributingFactors.push('Inventory levels exceed safety thresholds with stable supplier fulfillment.');
    }
  }

  // Dynamic explanation strictly generated from actual calculated values
  let riskReason = '';
  if (riskLevel === 'CRITICAL') {
    const delaySnippet = hasShipmentDisruption || delayDays > 0 
      ? ` The primary supplier (${resource.supplier}) is delayed by ${delayDays} days.` 
      : '';
    const leadSnippet = leadTimeExceeds
      ? ` Delivery lead time (${leadTime} days) exceeds available stock duration (${daysOfStock} days).`
      : '';
    const safetySnippet = belowSafety
      ? ` Current stock is below the minimum safety threshold (${resource.currentStock.toLocaleString()} of ${minSafety.toLocaleString()} units).`
      : '';
    riskReason = `Current stock covers ${daysOfStock} days of demand, below the 3-day critical threshold.${delaySnippet}${leadSnippet}${safetySnippet}`;
  } else if (riskLevel === 'HIGH') {
    const delaySnippet = hasShipmentDisruption || delayDays > 0 
      ? ` The primary supplier (${resource.supplier}) is delayed by ${delayDays} days.` 
      : '';
    const leadSnippet = leadTimeExceeds
      ? ` Supplier lead time (${leadTime} days) exceeds available stock buffer (${daysOfStock} days).`
      : '';
    const safetySnippet = belowSafety 
      ? ` Current stock is below the safety threshold (${resource.currentStock.toLocaleString()} of ${minSafety.toLocaleString()} units).`
      : '';
    riskReason = `Current stock covers ${daysOfStock} days of demand, within the 3–5 day high-risk buffer tier.${delaySnippet}${leadSnippet}${safetySnippet}`;
  } else if (riskLevel === 'MEDIUM') {
    const delaySnippet = hasShipmentDisruption || delayDays > 0 
      ? ` Primary supplier reports ${delayDays}-day transit delay.` 
      : '';
    riskReason = `Current stock covers ${daysOfStock} days of demand (6–14 day monitoring tier).${delaySnippet}${belowSafety ? ` Current stock is below the minimum safety floor of ${minSafety.toLocaleString()} units.` : ''}`;
  } else {
    riskReason = `Current stock covers ${daysOfStock} days of demand, exceeding the 14-day threshold with adequate safety reserve and stable replenishment.`;
  }

  // Generate 2-4 Actionable Operational Recommendations based on actual data
  const recommendedActions: string[] = [];
  if (hasShipmentDisruption || reliability < 75 || delayDays > 0) {
    recommendedActions.push(
      `Activate alternate supplier: Request secondary distributor quote from Apex Medical Distribution to circumvent ${resource.supplier} delay.`
    );
  }
  if (leadTimeExceeds || daysOfStock < 3.0) {
    recommendedActions.push(
      `Expedite shipment: Authorize priority courier or emergency air-freight dispatch to arrive within 24–48 hours.`
    );
  }
  if (belowSafety) {
    recommendedActions.push(
      `Transfer inventory from another facility: Initiate inter-hospital loan from Metro Regional Central Reserve.`
    );
  }
  if (isHighDemand) {
    recommendedActions.push(
      `Prioritize allocation: Restrict non-emergency ward draw and monitor daily consumption closely.`
    );
  }
  if (recommendedActions.length < 2) {
    recommendedActions.push(
      `Increase procurement quantity: Double standard standing reorder lot to reinforce safety reserve.`
    );
    recommendedActions.push(
      `Monitor consumption closely: Perform daily ward reconciliation and check automated dispensing cart logs.`
    );
  }

  const recommendedAction = recommendedActions[0];

  // Projected critical date
  const now = new Date(2026, 8, 20); // Demo reference date: Sept 20, 2026
  const targetDate = new Date(now.getTime() + daysOfStock * 24 * 60 * 60 * 1000);
  const dateStr = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const expectedCriticalDate = `In ${daysOfStock} Days (${dateStr})`;

  return {
    riskLevel,
    status,
    daysOfStock,
    shortageProbability,
    riskReason,
    recommendedAction,
    recommendedActions: recommendedActions.slice(0, 4),
    contributingFactors,
    expectedCriticalDate
  };
}

/**
 * Re-evaluates a full MedicalResource record with synchronized fields
 */
export function synchronizeResource(resource: MedicalResource): MedicalResource {
  const evalResult = evaluateResourceRisk({
    name: resource.name,
    currentStock: resource.currentStock,
    dailyConsumption: resource.dailyConsumption,
    minimumSafetyStock: resource.minimumSafetyStock ?? resource.minSafetyStock,
    supplier: resource.supplier ?? resource.supplierName,
    supplierLeadTimeDays: resource.supplierLeadTimeDays ?? resource.leadTimeDays,
    supplierReliability: resource.supplierReliability,
    demandTrend: resource.demandTrend ?? resource.demandTrendPercentage,
    shipmentStatus: resource.shipmentStatus ?? resource.currentShipmentStatus,
    shipmentDelayDays: resource.shipmentDelayDays,
    facility: resource.facility
  });

  const minSafety = resource.minimumSafetyStock ?? resource.minSafetyStock;
  const leadTime = resource.supplierLeadTimeDays ?? resource.leadTimeDays;
  const supplier = resource.supplier ?? resource.supplierName;
  const demand = resource.demandTrend ?? resource.demandTrendPercentage;
  const shipment = resource.shipmentStatus ?? resource.currentShipmentStatus;

  return {
    ...resource,
    sku: resource.sku || `SKU-${resource.id.replace('res-', '').toUpperCase().slice(0, 6)}`,
    minimumSafetyStock: minSafety,
    minSafetyStock: minSafety,
    daysRemaining: evalResult.daysOfStock,
    daysOfStock: evalResult.daysOfStock,
    supplier: supplier,
    supplierName: supplier,
    supplierStatus: resource.supplierStatus || shipment,
    supplierLeadTimeDays: leadTime,
    leadTimeDays: leadTime,
    expectedShipmentDate: resource.expectedShipmentDate || 'Sep 28, 2026',
    shipmentDelay: resource.shipmentDelay || (isShipmentDisrupted(shipment) ? '+3 days delay' : 'None'),
    shipmentDelayDays: resource.shipmentDelayDays ?? (isShipmentDisrupted(shipment) ? 3 : 0),
    facility: resource.facility || 'Central Regional Health - Trauma Depot 04',
    criticality: resource.criticality || (evalResult.riskLevel === 'CRITICAL' ? 'Critical (Tier 1)' : 'Essential (Tier 2)'),
    lastUpdated: resource.lastUpdated || 'Just now',
    demandTrend: demand,
    demandTrendPercentage: demand,
    shipmentStatus: shipment,
    currentShipmentStatus: shipment,
    riskLevel: evalResult.riskLevel,
    status: evalResult.status,
    shortageProbability: evalResult.shortageProbability,
    riskReason: evalResult.riskReason,
    recommendedAction: evalResult.recommendedAction,
    recommendedActions: evalResult.recommendedActions,
    contributingFactors: evalResult.contributingFactors,
    expectedCriticalDate: evalResult.expectedCriticalDate
  };
}

/**
 * 3. Dynamic Supplier Risk Engine
 * Calculates supplier risk using:
 * - reliability
 * - lead time
 * - shipment status
 * - number of supplied critical/high resources
 */
export function evaluateSupplierRisk(
  supplier: Supplier,
  resources: MedicalResource[]
): {
  supplyRisk: Supplier['supplyRisk'];
  criticalCount: number;
  highCount: number;
  impactedResources: string[];
} {
  const isDisrupted = isShipmentDisrupted(supplier.currentShipmentStatus);
  
  // Find which resources are supplied by this supplier
  const supplied = resources.filter(
    (r) => 
      r.supplierId === supplier.id || 
      r.supplierName.toLowerCase() === supplier.name.toLowerCase() ||
      r.supplier.toLowerCase() === supplier.name.toLowerCase() ||
      supplier.resourcesSupplied.some((resName) => r.name.toLowerCase().includes(resName.toLowerCase()))
  );

  const criticalItems = supplied.filter((r) => r.riskLevel === 'CRITICAL');
  const highItems = supplied.filter((r) => r.riskLevel === 'HIGH');
  const impacted = supplied.map((r) => r.name);

  let supplyRisk: Supplier['supplyRisk'] = 'LOW';

  if (
    supplier.reliability < 72 || 
    (isDisrupted && criticalItems.length > 0) ||
    supplier.currentShipmentStatus === 'Customs Hold'
  ) {
    supplyRisk = 'SEVERE';
  } else if (
    supplier.reliability < 80 || 
    isDisrupted || 
    criticalItems.length > 0 ||
    highItems.length >= 2
  ) {
    supplyRisk = 'ELEVATED';
  } else if (
    supplier.reliability < 90 || 
    supplier.averageDeliveryDays > 5 ||
    highItems.length > 0
  ) {
    supplyRisk = 'MODERATE';
  } else {
    supplyRisk = 'LOW';
  }

  return {
    supplyRisk,
    criticalCount: criticalItems.length,
    highCount: highItems.length,
    impactedResources: impacted
  };
}

/**
 * 4. Dynamic Alerts Generator
 * Generates prioritized alerts directly from the live risk state of resources and suppliers
 */
export function generateDynamicAlerts(
  resources: MedicalResource[],
  suppliers: Supplier[]
): AlertItem[] {
  const alerts: AlertItem[] = [];

  // Generate alerts for critical and high risk resources
  resources.forEach((r) => {
    const isDisrupted = isShipmentDisrupted(r.shipmentStatus) || (r.shipmentDelayDays && r.shipmentDelayDays > 0);
    const belowSafety = r.currentStock < r.minimumSafetyStock;

    if (r.riskLevel === 'CRITICAL') {
      let alertTitle = `${r.name} may fall below safety stock within 72 hours.`;
      if (r.demandTrend >= 30) {
        alertTitle = `Demand surge has pushed ${r.name} into critical risk.`;
      } else if (isDisrupted) {
        alertTitle = `Supplier delay is creating an immediate critical shortage of ${r.name}.`;
      }

      alerts.push({
        id: `alert-crit-${r.id}`,
        severity: 'CRITICAL',
        title: alertTitle,
        message: `${r.name} has only ${r.daysRemaining.toFixed(1)} days of stock remaining (${r.currentStock.toLocaleString()} ${r.unit}) at daily draw ${r.dailyConsumption} ${r.unit}/day. Minimum safety reserve is ${r.minimumSafetyStock.toLocaleString()} units at ${r.facility}.`,
        resourceId: r.id,
        resourceName: r.name,
        timestamp: 'Active Now',
        isResolved: false,
        isRead: false,
        actionRequired: r.recommendedAction,
        contributingFactor: r.contributingFactors[0] || 'Accelerated burn rate below replacement lead time',
        supplierImpacted: r.supplier
      });
    } else if (r.riskLevel === 'HIGH') {
      let alertTitle = isDisrupted 
        ? `Supplier delay is creating a potential shortage of ${r.name}.`
        : `Elevated draw rate has pushed ${r.name} into high risk.`;

      alerts.push({
        id: `alert-high-${r.id}`,
        severity: 'HIGH',
        title: alertTitle,
        message: isDisrupted
          ? `Supplier shipment from ${r.supplier} is flagged as "${r.shipmentStatus}" (${r.shipmentDelay || '+3 days delay'}). Current buffer is ${r.daysRemaining.toFixed(1)} days vs. ${r.supplierLeadTimeDays}-day delivery lead time.`
          : `Demand trend (+${r.demandTrend}%) has reduced ${r.name} stock to ${r.currentStock.toLocaleString()} units (safety floor: ${r.minimumSafetyStock.toLocaleString()}).`,
        resourceId: r.id,
        resourceName: r.name,
        timestamp: 'Recent',
        isResolved: false,
        isRead: false,
        actionRequired: r.recommendedAction,
        contributingFactor: isDisrupted ? `Supplier shipment status: ${r.shipmentStatus}` : `Elevated demand trend (+${r.demandTrend}%)`,
        supplierImpacted: r.supplier
      });
    } else if (r.demandTrend >= 25) {
      alerts.push({
        id: `alert-med-${r.id}`,
        severity: 'MEDIUM',
        title: `Demand surge detected for ${r.name}.`,
        message: `Consumption trajectory is up +${r.demandTrend}% over baseline draw. Available buffer currently at ${r.daysRemaining.toFixed(1)} days at ${r.facility}.`,
        resourceId: r.id,
        resourceName: r.name,
        timestamp: '4h ago',
        isResolved: false,
        isRead: true,
        actionRequired: 'Monitor ward draw rates and schedule secondary replenishment batch.',
        contributingFactor: `Demand trend +${r.demandTrend}% above average`,
        supplierImpacted: r.supplier
      });
    }
  });

  // Generate supplier alerts
  suppliers.forEach((s) => {
    if (isShipmentDisrupted(s.currentShipmentStatus)) {
      alerts.push({
        id: `alert-sup-${s.id}`,
        severity: s.currentShipmentStatus === 'Customs Hold' ? 'CRITICAL' : 'HIGH',
        title: `Vendor transit disruption: ${s.name} (${s.currentShipmentStatus})`,
        message: `${s.name} reported shipment bottleneck "${s.currentShipmentStatus}". Impacted hospital formulary resources: ${s.resourcesSupplied.join(', ')}.`,
        timestamp: '6h ago',
        isResolved: false,
        isRead: false,
        actionRequired: 'Engage logistics coordinator for customs release or route to secondary distributor.',
        contributingFactor: `Vendor transit hold: ${s.currentShipmentStatus}`,
        supplierImpacted: s.name
      });
    }
  });

  // Always include an informational baseline alert
  alerts.push({
    id: 'alert-info-baseline',
    severity: 'INFORMATIONAL',
    title: 'Baseline Logistics Buffer Confirmed',
    message: 'IV Saline, Oral Rehydration Salts (ORS), and Surgical Consumables maintain healthy buffers >14 days with zero delivery delays.',
    timestamp: 'Today',
    isResolved: false,
    isRead: true,
    actionRequired: 'Routine cycle replenishment on schedule.',
    contributingFactor: 'Continuous inventory tracking parameters within standard variance limits'
  });

  // Sort: CRITICAL first, then HIGH, then MEDIUM, then INFORMATIONAL
  const severityWeight: Record<AlertItem['severity'], number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    INFORMATIONAL: 1
  };

  return alerts.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);
}

/**
 * 5. Run Deep Analysis Function
 * Structured comprehensive resilience analysis across entire inventory state
 */
export function runDeepAnalysis(
  resources: MedicalResource[],
  suppliers: Supplier[]
): DeepAnalysisResult {
  const synchronized = resources.map(synchronizeResource);

  // Group into shortage windows
  const immediate = synchronized.filter((r) => r.daysRemaining <= 3.0);
  const shortTerm = synchronized.filter((r) => r.daysRemaining > 3.0 && r.daysRemaining <= 7.0);
  const mediumTerm = synchronized.filter((r) => r.daysRemaining > 7.0 && r.daysRemaining <= 14.0);
  const stable = synchronized.filter((r) => r.daysRemaining > 14.0);

  // Sorted items
  const sorted = [...synchronized].sort((a, b) => a.daysRemaining - b.daysRemaining);

  const items: DeepAnalysisItem[] = sorted.map((r) => {
    const safetyDeficit = Math.max(0, r.minimumSafetyStock - r.currentStock);
    const leadTimeDeficit = Math.max(0, parseFloat((r.supplierLeadTimeDays - r.daysRemaining).toFixed(1)));

    return {
      resourceId: r.id,
      resourceName: r.name,
      category: r.category,
      currentStock: r.currentStock,
      unit: r.unit,
      dailyConsumption: r.dailyConsumption,
      daysRemaining: r.daysRemaining,
      riskLevel: r.riskLevel,
      safetyStock: r.minimumSafetyStock,
      safetyDeficit,
      leadTimeDeficit,
      primaryRiskFactors: r.contributingFactors,
      recommendedAction: r.recommendedAction,
      supplierName: r.supplier,
      shipmentStatus: r.shipmentStatus
    };
  });

  const supplierRisks = suppliers.map((s) => {
    const evalSup = evaluateSupplierRisk(s, synchronized);
    return {
      supplierId: s.id,
      supplierName: s.name,
      supplyRisk: evalSup.supplyRisk,
      reliability: s.reliability,
      leadTimeDays: s.averageDeliveryDays,
      shipmentStatus: s.currentShipmentStatus,
      impactedResources: evalSup.impactedResources
    };
  });

  const shortest = sorted[0];

  return {
    generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    summary: {
      totalEvaluated: synchronized.length,
      criticalCount: synchronized.filter((r) => r.riskLevel === 'CRITICAL').length,
      highRiskCount: synchronized.filter((r) => r.riskLevel === 'HIGH').length,
      mediumRiskCount: synchronized.filter((r) => r.riskLevel === 'MEDIUM').length,
      stableCount: synchronized.filter((r) => r.riskLevel === 'STABLE').length,
      safetyDeficitCount: synchronized.filter((r) => r.currentStock < r.minimumSafetyStock).length,
      supplierDisruptedCount: suppliers.filter((s) => isShipmentDisrupted(s.currentShipmentStatus)).length,
      shortestBufferDays: shortest ? shortest.daysRemaining : 0,
      shortestBufferItem: shortest ? shortest.name : 'None'
    },
    shortageWindows: {
      immediate,
      shortTerm,
      mediumTerm,
      stable
    },
    items,
    supplierRisks
  };
}

// =========================================================================
// 6. Crisis Simulation & Resilience Response Engine
// =========================================================================

import { 
  CrisisScenarioConfig, 
  CrisisSimulationComparison, 
  AffectedSKUComparison, 
  ResilienceRecommendation,
  ResilienceActionType
} from '../types';

/**
 * Calculates a Simulated Supply Resilience Indicator score (0 to 100).
 * Simulation-only metric based on:
 * - Critical items penalty (-12 per critical item)
 * - High-risk items penalty (-6 per high-risk item)
 * - Average days of stock (bonus up to +35)
 * - Disrupted suppliers penalty (-8 per disrupted supplier)
 * 
 * Clearly labeled as a "Simulated Supply Resilience Indicator" (not a clinical score).
 */
export function calculateResilienceScore(
  criticalCount: number,
  highRiskCount: number,
  avgDaysOfStock: number,
  disruptedSuppliersCount: number
): number {
  let score = 100;
  score -= criticalCount * 12;
  score -= highRiskCount * 6;
  score -= disruptedSuppliersCount * 8;
  
  // Buffer factor
  if (avgDaysOfStock < 3) {
    score -= 15;
  } else if (avgDaysOfStock < 6) {
    score -= 5;
  } else if (avgDaysOfStock >= 12) {
    score += 5;
  }

  return Math.max(8, Math.min(98, Math.round(score)));
}

/**
 * Execute Crisis Simulation on baseline resources and suppliers
 */
export function executeCrisisScenario(
  baselineResources: MedicalResource[],
  baselineSuppliers: Supplier[],
  scenario: CrisisScenarioConfig
): {
  simulatedResources: MedicalResource[];
  simulatedSuppliers: Supplier[];
  comparison: CrisisSimulationComparison;
} {
  const { type, demandSurgePercent, supplierDelayDays, failedSupplierId } = scenario;

  // 1. Transform resources based on scenario type
  const simulatedResources = baselineResources.map((base) => {
    let newDailyDraw = base.dailyConsumption;
    let newStock = base.currentStock;
    let newLeadTime = base.supplierLeadTimeDays;
    let newShipmentStatus = base.shipmentStatus;
    let newDelayDays = base.shipmentDelayDays || 0;
    let newDemandTrend = base.demandTrend;

    // A. Demand Surge Scenario (+20%, +40%, +60%)
    if (type === 'demand_surge' || type === 'combined_crisis') {
      const surgeMultiplier = 1 + demandSurgePercent / 100;
      // High clinical draw affects pharmaceuticals, antibiotics, fluids, consumables
      newDailyDraw = Math.round(base.dailyConsumption * surgeMultiplier);
      newDemandTrend = base.demandTrend + demandSurgePercent;
    }

    // B. Supplier Delay Scenario (+2, +5, +7 days)
    if (type === 'supplier_delay' || type === 'combined_crisis') {
      newLeadTime = base.supplierLeadTimeDays + supplierDelayDays;
      newDelayDays = (base.shipmentDelayDays || 0) + supplierDelayDays;
      newShipmentStatus = `Transit Delayed (+${newDelayDays}d bottleneck)`;
    }

    // C. Critical Shipment Failure Scenario
    if (type === 'shipment_failure') {
      const isAffectedByVendor = 
        base.supplierId === failedSupplierId || 
        base.supplier.toLowerCase().includes('biopharma') || 
        base.id === 'res-insulin' || 
        base.id === 'res-ceftriaxone';

      if (isAffectedByVendor) {
        // Stock loss or expected inbound completely wiped out; buffer drops immediately by 40%
        newStock = Math.max(Math.round(base.currentStock * 0.55), Math.round(base.dailyConsumption * 1.5));
        newShipmentStatus = 'Shipment Failed / Batch Quarantine (0 units delivered)';
        newDelayDays = (base.shipmentDelayDays || 0) + 10;
        newLeadTime = base.supplierLeadTimeDays + 10;
      }
    }

    return synchronizeResource({
      ...base,
      dailyConsumption: newDailyDraw,
      currentStock: newStock,
      supplierLeadTimeDays: newLeadTime,
      leadTimeDays: newLeadTime,
      shipmentStatus: newShipmentStatus,
      currentShipmentStatus: newShipmentStatus,
      shipmentDelayDays: newDelayDays,
      shipmentDelay: newDelayDays > 0 ? `+${newDelayDays} days delay` : 'On Schedule',
      demandTrend: newDemandTrend,
      demandTrendPercentage: newDemandTrend
    });
  });

  // 2. Transform suppliers
  const simulatedSuppliers = baselineSuppliers.map((s) => {
    let status = s.currentShipmentStatus;
    let deliveryDays = s.averageDeliveryDays;
    let reliability = s.reliability;

    if (type === 'supplier_delay' || type === 'combined_crisis') {
      status = 'Delayed';
      deliveryDays = s.averageDeliveryDays + supplierDelayDays;
      reliability = Math.max(50, s.reliability - 12);
    } else if (type === 'shipment_failure' && (s.id === failedSupplierId || s.name.toLowerCase().includes('biopharma'))) {
      status = 'Customs Hold';
      deliveryDays = s.averageDeliveryDays + 12;
      reliability = 45;
    }

    const evalSup = evaluateSupplierRisk(
      {
        ...s,
        currentShipmentStatus: status,
        averageDeliveryDays: deliveryDays,
        reliability
      },
      simulatedResources
    );

    return {
      ...s,
      currentShipmentStatus: status,
      averageDeliveryDays: deliveryDays,
      reliability,
      supplyRisk: evalSup.supplyRisk
    };
  });

  // 3. Compute baseline metrics
  const bCrit = baselineResources.filter((r) => r.riskLevel === 'CRITICAL').length;
  const bHigh = baselineResources.filter((r) => r.riskLevel === 'HIGH').length;
  const bMed = baselineResources.filter((r) => r.riskLevel === 'MEDIUM').length;
  const bStable = baselineResources.filter((r) => r.riskLevel === 'STABLE').length;
  const bAvgDays = parseFloat(
    (baselineResources.reduce((acc, r) => acc + r.daysRemaining, 0) / baselineResources.length).toFixed(1)
  );
  const bDisruptedSuppliers = baselineSuppliers.filter((s) => isShipmentDisrupted(s.currentShipmentStatus)).length;
  const bResilienceScore = calculateResilienceScore(bCrit, bHigh, bAvgDays, bDisruptedSuppliers);

  // 4. Compute simulated metrics
  const sCrit = simulatedResources.filter((r) => r.riskLevel === 'CRITICAL').length;
  const sHigh = simulatedResources.filter((r) => r.riskLevel === 'HIGH').length;
  const sMed = simulatedResources.filter((r) => r.riskLevel === 'MEDIUM').length;
  const sStable = simulatedResources.filter((r) => r.riskLevel === 'STABLE').length;
  const sAvgDays = parseFloat(
    (simulatedResources.reduce((acc, r) => acc + r.daysRemaining, 0) / simulatedResources.length).toFixed(1)
  );
  const sDisruptedSuppliers = simulatedSuppliers.filter((s) => isShipmentDisrupted(s.currentShipmentStatus)).length;
  const sResilienceScore = calculateResilienceScore(sCrit, sHigh, sAvgDays, sDisruptedSuppliers);

  // 5. Compare baseline vs simulated SKUs to identify deterioration
  const topAffectedSKUs: AffectedSKUComparison[] = simulatedResources.map((sim) => {
    const base = baselineResources.find((b) => b.id === sim.id) || sim;
    const isDeteriorated = 
      sim.riskLevel !== base.riskLevel || 
      sim.daysRemaining < base.daysRemaining - 0.5;

    let reason = '';
    if (type === 'demand_surge') {
      reason = `Daily clinical demand surged by +${demandSurgePercent}% while on-hand reserve depleted to ${sim.daysRemaining.toFixed(1)} days.`;
    } else if (type === 'supplier_delay') {
      reason = `Inbound supplier shipment delayed by +${supplierDelayDays} days, pushing lead time (${sim.supplierLeadTimeDays}d) past available buffer (${sim.daysRemaining.toFixed(1)}d).`;
    } else if (type === 'shipment_failure') {
      reason = `Primary supplier inbound batch failed/quarantined, cutting safety stock to ${sim.daysRemaining.toFixed(1)} days.`;
    } else {
      reason = `Combined impact: Demand increased by +${demandSurgePercent}% while supplier fulfillment is delayed by +${supplierDelayDays} days.`;
    }

    return {
      id: sim.id,
      sku: sim.sku,
      name: sim.name,
      baselineDaysOfStock: parseFloat(base.daysRemaining.toFixed(1)),
      simulatedDaysOfStock: parseFloat(sim.daysRemaining.toFixed(1)),
      previousRisk: base.riskLevel,
      newRisk: sim.riskLevel,
      reasonForDeterioration: reason,
      category: sim.category,
      facility: sim.facility,
      isDeteriorated
    };
  }).sort((a, b) => {
    // Sort by most severe new risk, then lowest simulated days of stock
    const riskWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, STABLE: 1 };
    const diff = riskWeight[b.newRisk] - riskWeight[a.newRisk];
    if (diff !== 0) return diff;
    return a.simulatedDaysOfStock - b.simulatedDaysOfStock;
  });

  // Filter top affected (at least 3-6 items)
  const deterioratedList = topAffectedSKUs.filter((s) => s.isDeteriorated || s.newRisk === 'CRITICAL');
  const displayAffected = deterioratedList.length >= 3 ? deterioratedList.slice(0, 6) : topAffectedSKUs.slice(0, 6);

  // 6. Generate Resilience Engine Operational Responses based on simulated data
  const recommendations: ResilienceRecommendation[] = [];

  // Rec 1: Alternate Supplier
  const critVendorItems = simulatedResources.filter(
    (r) => r.riskLevel === 'CRITICAL' && (r.supplierId.includes('biopharma') || r.supplierId.includes('pharmanexus'))
  );
  if (critVendorItems.length > 0) {
    const target = critVendorItems[0];
    recommendations.push({
      id: 'rec-alt-supplier',
      actionType: 'activate_alternate_supplier',
      action: 'Activate Alternate Supplier (Apex Medical Distribution)',
      whyRecommended: `${target.name} primary shipment is severely constrained. Apex has secondary regional warehouse stock with confirmed 48-hr dispatch capability.`,
      affectedItem: target.name,
      affectedItemId: target.id,
      affectedFacility: target.facility,
      expectedOperationalImpact: `Injects +6.0 days of safety stock into ${target.name}, reducing critical formulary exposure.`,
      simulatedScoreGain: 12
    });
  }

  // Rec 2: Expedited Shipment
  const shortestItem = [...simulatedResources].sort((a, b) => a.daysRemaining - b.daysRemaining)[0];
  if (shortestItem) {
    recommendations.push({
      id: 'rec-expedite',
      actionType: 'expedite_shipment',
      action: `Expedite Shipment via Priority Air Courier (${shortestItem.name})`,
      whyRecommended: `On-hand runway for ${shortestItem.name} has contracted to ${shortestItem.daysRemaining.toFixed(1)} days (~${Math.round(shortestItem.daysRemaining * 24)}h), requiring emergency air logistics.`,
      affectedItem: shortestItem.name,
      affectedItemId: shortestItem.id,
      affectedFacility: shortestItem.facility,
      expectedOperationalImpact: `Cuts reorder lead time from ${shortestItem.supplierLeadTimeDays}d down to 2d and replenishes +4.0 days of stock.`,
      simulatedScoreGain: 14
    });
  }

  // Rec 3: Transfer Inventory between facilities
  const transferCandidate = simulatedResources.find(
    (r) => r.id === 'res-ceftriaxone' || r.id === 'res-paracetamol' || r.riskLevel === 'CRITICAL'
  );
  if (transferCandidate) {
    recommendations.push({
      id: 'rec-transfer',
      actionType: 'transfer_inventory',
      action: `Transfer Inventory from Metro Regional Central Reserve`,
      whyRecommended: `Trauma Depot 04 safety buffer is below minimum threshold while Metro Central Reserve maintains surplus stock of ${transferCandidate.name}.`,
      affectedItem: transferCandidate.name,
      affectedItemId: transferCandidate.id,
      affectedFacility: transferCandidate.facility,
      expectedOperationalImpact: `Rebalances regional formulary by transferring 350 units (+3.5 days buffer) within 12 hours.`,
      simulatedScoreGain: 10
    });
  }

  // Rec 4: Prioritize Allocation of limited stock
  recommendations.push({
    id: 'rec-prioritize',
    actionType: 'prioritize_allocation',
    action: 'Prioritize Allocation of Limited Emergency Stock',
    whyRecommended: 'Inpatient consumption surge requires reserving Tier-1 injectable medications strictly for ICU and acute trauma bays.',
    affectedItem: 'Emergency Formulary (Insulin, Ceftriaxone, IV Saline)',
    affectedItemId: 'res-insulin',
    affectedFacility: 'All Monitored Facilities',
    expectedOperationalImpact: 'Reduces non-essential burn rate by ~20%, extending current runway by 1.8 days.',
    simulatedScoreGain: 8
  });

  // Rec 5: Increase Procurement Quantity
  recommendations.push({
    id: 'rec-procure',
    actionType: 'increase_procurement',
    action: 'Increase Procurement Standing Order Quantities (+50%)',
    whyRecommended: 'Rebuilding safety buffer floors prevents recurring stockout warnings over the next 14-day replenishment cycle.',
    affectedItem: 'Formulary-Wide High-Risk SKUs',
    affectedItemId: 'res-amoxicillin',
    affectedFacility: 'Central Warehouse Supply Hub',
    expectedOperationalImpact: 'Elevates minimum safety floor across all 15 SKUs by 500–1,200 units.',
    simulatedScoreGain: 9
  });

  // 7. Crisis Summary Content
  let triggerText = '';
  if (type === 'demand_surge') triggerText = `Clinical Demand Surge (+${demandSurgePercent}% draw rate)`;
  else if (type === 'supplier_delay') triggerText = `Upstream Logistics Transit Delay (+${supplierDelayDays} days)`;
  else if (type === 'shipment_failure') triggerText = `Critical Vendor Shipment Quarantine / Failure (0 units received)`;
  else triggerText = `Combined Crisis: +${demandSurgePercent}% Demand Surge with +${supplierDelayDays}d Logistics Delay`;

  const deterioratedCount = simulatedResources.filter((r) => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH').length;
  const mostAffectedNames = displayAffected.slice(0, 3).map((r) => r.name);

  const comparison: CrisisSimulationComparison = {
    baseline: {
      criticalItems: bCrit,
      highRiskItems: bHigh,
      mediumRiskItems: bMed,
      stableItems: bStable,
      avgDaysOfStock: bAvgDays,
      affectedSKUsCount: baselineResources.filter((r) => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH').length,
      affectedSuppliersCount: bDisruptedSuppliers,
      resilienceScore: bResilienceScore,
      shortageWindow: bCrit > 0 ? '≤ 72 Hours' : '3–7 Days'
    },
    simulated: {
      criticalItems: sCrit,
      highRiskItems: sHigh,
      mediumRiskItems: sMed,
      stableItems: sStable,
      avgDaysOfStock: sAvgDays,
      affectedSKUsCount: sCrit + sHigh,
      affectedSuppliersCount: sDisruptedSuppliers,
      resilienceScore: sResilienceScore,
      shortageWindow: sCrit > 0 ? '≤ 24–48 Hours (Immediate)' : '3–5 Days'
    },
    triggerDescription: triggerText,
    primaryImpactSummary: `${deterioratedCount} SKUs moved into critical/high-risk status. Average inventory runway dropped from ${bAvgDays}d to ${sAvgDays}d.`,
    topAffectedSKUs: displayAffected,
    recommendations,
    crisisSummary: {
      title: 'CRISIS SCENARIO SIMULATED',
      trigger: triggerText,
      primaryImpact: `${sCrit} critical and ${sHigh} high-risk inventory items requiring immediate operational response.`,
      mostAffected: mostAffectedNames,
      mainDriver: type === 'demand_surge' 
        ? 'Accelerated clinical inpatient burn rate outpacing replenishment'
        : type === 'supplier_delay'
        ? 'Lead-time extension exceeding remaining on-hand stock'
        : type === 'shipment_failure'
        ? 'Sudden loss of expected inbound delivery volume'
        : 'Compounding consumption surge and transit delay',
      recommendedResponse: 'Activate alternate supplier and transfer available inventory from Metro Regional Reserve.'
    }
  };

  return {
    simulatedResources,
    simulatedSuppliers,
    comparison
  };
}

/**
 * Apply What-If Response Action to a Simulated Crisis
 * Recalculates inventory parameters and evaluates post-response outcomes.
 */
export function applyWhatIfResponse(
  simulatedResources: MedicalResource[],
  simulatedSuppliers: Supplier[],
  actionId: string,
  recommendations: ResilienceRecommendation[]
): {
  postResponseResources: MedicalResource[];
  postResponseSuppliers: Supplier[];
  updatedRecommendations: ResilienceRecommendation[];
  postResponseStats: {
    criticalItems: number;
    highRiskItems: number;
    mediumRiskItems: number;
    stableItems: number;
    avgDaysOfStock: number;
    resilienceScore: number;
    shortageWindow: string;
    actionApplied: string;
  };
} {
  const targetRec = recommendations.find((r) => r.id === actionId);
  const actionType = targetRec ? targetRec.actionType : 'activate_alternate_supplier';

  const postResponseResources = simulatedResources.map((r) => {
    let newStock = r.currentStock;
    let newLeadTime = r.supplierLeadTimeDays;
    let newDraw = r.dailyConsumption;
    let newShipmentStatus = r.shipmentStatus;
    let newDelayDays = r.shipmentDelayDays;

    if (actionType === 'activate_alternate_supplier') {
      // Secondary supplier delivers emergency stock lot (+6 days coverage)
      if (r.id === targetRec?.affectedItemId || r.riskLevel === 'CRITICAL') {
        newStock += Math.round(r.dailyConsumption * 5.5);
        newLeadTime = Math.min(newLeadTime, 3);
        newDelayDays = 0;
        newShipmentStatus = 'Alternate Supplier Dispatched (ETA 48h)';
      }
    } else if (actionType === 'expedite_shipment') {
      // Emergency priority air freight
      if (r.id === targetRec?.affectedItemId || r.daysRemaining <= 3.0) {
        newStock += Math.round(r.dailyConsumption * 4.5);
        newLeadTime = 2;
        newDelayDays = 0;
        newShipmentStatus = 'Priority Courier Flight Inbound (ETA 24h)';
      }
    } else if (actionType === 'transfer_inventory') {
      // Inter-hospital transfer loan
      if (r.id === targetRec?.affectedItemId || r.facility.includes('Depot 04')) {
        newStock += Math.round(r.dailyConsumption * 4);
        newShipmentStatus = 'Inter-Hospital Transit En Route';
      }
    } else if (actionType === 'prioritize_allocation') {
      // Ward conservation throttles burn rate by 20%
      newDraw = Math.max(10, Math.round(r.dailyConsumption * 0.8));
    } else if (actionType === 'increase_procurement') {
      // Standing PO batch doubled
      newStock += Math.round(r.dailyConsumption * 5);
      newShipmentStatus = 'Supplemental Reorder Confirmed';
    }

    return synchronizeResource({
      ...r,
      currentStock: newStock,
      dailyConsumption: newDraw,
      supplierLeadTimeDays: newLeadTime,
      leadTimeDays: newLeadTime,
      shipmentStatus: newShipmentStatus,
      currentShipmentStatus: newShipmentStatus,
      shipmentDelayDays: newDelayDays
    });
  });

  const postResponseSuppliers = simulatedSuppliers.map((s) => {
    const evalSup = evaluateSupplierRisk(s, postResponseResources);
    return {
      ...s,
      supplyRisk: evalSup.supplyRisk
    };
  });

  const crit = postResponseResources.filter((r) => r.riskLevel === 'CRITICAL').length;
  const high = postResponseResources.filter((r) => r.riskLevel === 'HIGH').length;
  const med = postResponseResources.filter((r) => r.riskLevel === 'MEDIUM').length;
  const stable = postResponseResources.filter((r) => r.riskLevel === 'STABLE').length;
  const avgDays = parseFloat(
    (postResponseResources.reduce((acc, r) => acc + r.daysRemaining, 0) / postResponseResources.length).toFixed(1)
  );
  const disruptedSuppliers = postResponseSuppliers.filter((s) => isShipmentDisrupted(s.currentShipmentStatus)).length;
  const resilienceScore = calculateResilienceScore(crit, high, avgDays, disruptedSuppliers);

  const updatedRecommendations = recommendations.map((rec) =>
    rec.id === actionId ? { ...rec, applied: true } : rec
  );

  return {
    postResponseResources,
    postResponseSuppliers,
    updatedRecommendations,
    postResponseStats: {
      criticalItems: crit,
      highRiskItems: high,
      mediumRiskItems: med,
      stableItems: stable,
      avgDaysOfStock: avgDays,
      resilienceScore,
      shortageWindow: crit > 0 ? '≤ 48–72 Hours' : '5–10 Days (Stabilized)',
      actionApplied: targetRec?.action || 'Applied Operational Mitigation'
    }
  };
}
