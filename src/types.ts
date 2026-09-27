export type RiskLevel = 'STABLE' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'CRITICAL' | 'DELAYED_INBOUND';

export type ResourceCategory = 
  | 'Pharmaceuticals' 
  | 'Antibiotics' 
  | 'Fluids & Electrolytes' 
  | 'PPE & Consumables' 
  | 'Medical Consumables' 
  | 'Diagnostic Supplies';

export interface MedicalResource {
  id: string;
  sku: string; // SKU code e.g. SKU-INS-100
  name: string;
  genericName?: string;
  category: ResourceCategory;
  currentStock: number;
  unit: string;
  dailyConsumption: number;
  minimumSafetyStock: number;
  minSafetyStock: number; // compatibility alias
  daysRemaining: number; // calculated as currentStock / dailyConsumption
  daysOfStock: number; // calculated as currentStock / dailyConsumption
  expiryDate: string;
  supplier: string;
  supplierName: string; // compatibility alias
  supplierId: string;
  supplierStatus: string;
  supplierLeadTimeDays: number;
  leadTimeDays: number; // compatibility alias
  supplierReliability: number; // percentage e.g. 78%
  expectedShipmentDate: string;
  shipmentDelay: string;
  shipmentDelayDays: number;
  facility: string;
  criticality: string;
  lastUpdated: string;
  demandTrend: number; // percentage e.g. 34%
  demandTrendPercentage: number; // compatibility alias
  shipmentStatus: string;
  currentShipmentStatus: string; // compatibility alias
  riskLevel: RiskLevel;
  status: StockStatus;
  batchNumber: string;
  storageCondition: string;
  departmentLocation: string;
  expectedCriticalDate: string;
  shortageProbability: number; // 0 - 100%
  riskReason: string;
  recommendedAction: string;
  recommendedActions?: string[];
  contributingFactors: string[];
}

export interface DeepAnalysisItem {
  resourceId: string;
  resourceName: string;
  category: ResourceCategory;
  currentStock: number;
  unit: string;
  dailyConsumption: number;
  daysRemaining: number;
  riskLevel: RiskLevel;
  safetyStock: number;
  safetyDeficit: number;
  leadTimeDeficit: number;
  primaryRiskFactors: string[];
  recommendedAction: string;
  supplierName: string;
  shipmentStatus: string;
}

export interface DeepAnalysisResult {
  generatedAt: string;
  summary: {
    totalEvaluated: number;
    criticalCount: number;
    highRiskCount: number;
    mediumRiskCount: number;
    stableCount: number;
    safetyDeficitCount: number;
    supplierDisruptedCount: number;
    shortestBufferDays: number;
    shortestBufferItem: string;
  };
  shortageWindows: {
    immediate: MedicalResource[]; // < 3 days
    shortTerm: MedicalResource[]; // 3-7 days
    mediumTerm: MedicalResource[]; // 8-14 days
    stable: MedicalResource[]; // > 14 days
  };
  items: DeepAnalysisItem[];
  supplierRisks: {
    supplierId: string;
    supplierName: string;
    supplyRisk: 'LOW' | 'MODERATE' | 'ELEVATED' | 'SEVERE';
    reliability: number;
    leadTimeDays: number;
    shipmentStatus: string;
    impactedResources: string[];
  }[];
}

export interface Supplier {
  id: string;
  name: string;
  resourcesSupplied: string[];
  averageDeliveryDays: number;
  reliability: number; // percentage e.g. 92
  currentShipmentStatus: 'On Schedule' | 'Delayed' | 'Customs Hold' | 'Expedited In Transit' | 'Order Processing';
  delayHistory: string;
  supplyRisk: 'LOW' | 'MODERATE' | 'ELEVATED' | 'SEVERE';
  contactPerson: string;
  contactEmail: string;
  primaryLocation: string;
  activeShipmentRef?: string;
  notes: string;
}

export interface GeminiPriorityResource {
  resourceName: string;
  riskLevel: string;
  daysOfStock: number;
  reason: string;
  recommendedActions: string[];
}

export interface GeminiSupplierRisk {
  supplierName: string;
  riskLevel: string;
  reason: string;
}

export interface GeminiDemandRisk {
  resourceName: string;
  reason: string;
}

export interface GeminiShortageWindow {
  resourceName: string;
  estimatedWindow: string;
  explanation: string;
}

export interface GeminiDeepAnalysisResponse {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
  priorityResources: GeminiPriorityResource[];
  supplierRisks: GeminiSupplierRisk[];
  demandRisks: GeminiDemandRisk[];
  shortageWindows: GeminiShortageWindow[];
  generalRecommendations: string[];
  isAiGenerated?: boolean;
  timestamp?: string;
}

export interface GeminiResourceAnalysisResponse {
  resourceName: string;
  riskLevel: string;
  daysOfStock: number;
  aiExplanation: string;
  keyRiskFactors: string[];
  potentialShortageWindow: string;
  recommendedActions: string[];
  supplierRiskNote: string;
  isAiGenerated?: boolean;
  timestamp?: string;
}

export interface AlertItem {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFORMATIONAL';
  title: string;
  message: string;
  resourceId?: string;
  resourceName?: string;
  timestamp: string;
  isResolved: boolean;
  isRead: boolean;
  actionRequired: string;
  contributingFactor: string;
  supplierImpacted?: string;
}

export interface SupplyActivity {
  id: string;
  type: 'SHIPMENT_RECEIVED' | 'DELAY_ALERT' | 'EXPEDITED_ORDER' | 'STOCK_AUDIT' | 'SUPPLIER_STATUS';
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'warning' | 'in-progress' | 'info';
  relatedResource?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedAction?: string;
  resourceTag?: string;
  riskBadge?: RiskLevel;
  dataPoints?: { label: string; value: string }[];
}

export type NavigationPage = 
  | 'dashboard'
  | 'inventory'
  | 'risk-analysis'
  | 'suppliers'
  | 'alerts'
  | 'ai-assistant';

// ==========================================
// Crisis Simulation & Resilience Engine Types
// ==========================================

export type CrisisScenarioType = 
  | 'demand_surge' 
  | 'supplier_delay' 
  | 'shipment_failure' 
  | 'combined_crisis';

export interface CrisisScenarioConfig {
  type: CrisisScenarioType;
  // Demand surge: 20%, 40%, 60%
  demandSurgePercent: 20 | 40 | 60;
  // Supplier delay: +2, +5, +7 days
  supplierDelayDays: 2 | 5 | 7;
  // Shipment failure: target supplier or resource shipment unavailable
  failedSupplierId: string; // e.g. 'sup-biopharma' or 'sup-pharmanexus'
  failedShipmentPercent: number; // e.g. 50% or 100% loss of inbound stock
}

export type ResilienceActionType = 
  | 'activate_alternate_supplier'
  | 'expedite_shipment'
  | 'transfer_inventory'
  | 'increase_procurement'
  | 'prioritize_allocation'
  | 'reduce_non_critical_allocation'
  | 'increase_monitoring';

export interface ResilienceRecommendation {
  id: string;
  actionType: ResilienceActionType;
  action: string;
  whyRecommended: string;
  affectedItem: string;
  affectedItemId: string;
  affectedFacility: string;
  expectedOperationalImpact: string;
  simulatedScoreGain: number; // e.g. +8 points
  applied?: boolean;
}

export interface AffectedSKUComparison {
  id: string;
  sku: string;
  name: string;
  baselineDaysOfStock: number;
  simulatedDaysOfStock: number;
  previousRisk: RiskLevel;
  newRisk: RiskLevel;
  reasonForDeterioration: string;
  category: ResourceCategory;
  facility: string;
  isDeteriorated: boolean;
}

export interface CrisisSimulationComparison {
  baseline: {
    criticalItems: number;
    highRiskItems: number;
    mediumRiskItems: number;
    stableItems: number;
    avgDaysOfStock: number;
    affectedSKUsCount: number;
    affectedSuppliersCount: number;
    resilienceScore: number;
    shortageWindow: string;
  };
  simulated: {
    criticalItems: number;
    highRiskItems: number;
    mediumRiskItems: number;
    stableItems: number;
    avgDaysOfStock: number;
    affectedSKUsCount: number;
    affectedSuppliersCount: number;
    resilienceScore: number;
    shortageWindow: string;
  };
  postResponse?: {
    criticalItems: number;
    highRiskItems: number;
    mediumRiskItems: number;
    stableItems: number;
    avgDaysOfStock: number;
    resilienceScore: number;
    shortageWindow: string;
    appliedActions: string[];
  };
  triggerDescription: string;
  primaryImpactSummary: string;
  topAffectedSKUs: AffectedSKUComparison[];
  recommendations: ResilienceRecommendation[];
  crisisSummary: {
    title: string;
    trigger: string;
    primaryImpact: string;
    mostAffected: string[];
    mainDriver: string;
    recommendedResponse: string;
  };
}
