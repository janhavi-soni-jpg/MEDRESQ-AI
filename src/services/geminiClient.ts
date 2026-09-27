import { 
  MedicalResource, 
  Supplier, 
  AlertItem, 
  GeminiDeepAnalysisResponse, 
  GeminiResourceAnalysisResponse,
  RiskLevel 
} from '../types';
import { runDeepAnalysis } from './resilienceEngine';

export interface DeepAnalysisResultWrapper {
  data: GeminiDeepAnalysisResponse;
  isAiGenerated: boolean;
  errorMessage?: string;
}

export interface ResourceAnalysisResultWrapper {
  data: GeminiResourceAnalysisResponse;
  isAiGenerated: boolean;
  errorMessage?: string;
}

export interface ChatResultWrapper {
  reply: string;
  suggestedAction?: string;
  riskBadge?: RiskLevel;
  resourceTag?: string;
  dataPoints?: { label: string; value: string }[];
  isAiGenerated: boolean;
  errorMessage?: string;
}

/**
 * 1. Request full-formulary deep analysis from server-side Gemini
 */
export async function requestDeepAnalysis(params: {
  resources: MedicalResource[];
  suppliers: Supplier[];
  alerts: AlertItem[];
  isSimulationActive: boolean;
}): Promise<DeepAnalysisResultWrapper> {
  try {
    const res = await fetch('/api/gemini/deep-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resources: params.resources,
        suppliers: params.suppliers,
        alerts: params.alerts,
        isSimulationActive: params.isSimulationActive,
        simulationContext: params.isSimulationActive
          ? 'Clinical Demand Surge simulation active (+35% emergency burn rate)'
          : 'Standard Baseline formulary operations'
      })
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return {
          data: {
            ...json.data,
            isAiGenerated: true,
            timestamp: json.data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          isAiGenerated: true
        };
      } else {
        return {
          data: generateFallbackDeepAnalysis(params.resources, params.suppliers, params.isSimulationActive),
          isAiGenerated: false,
          errorMessage: json.error || 'AI analysis is temporarily unavailable. The rule-based resilience engine is still available.'
        };
      }
    }
  } catch (err: any) {
    console.warn('Network error during deep-analysis request, reverting to deterministic model:', err);
  }

  return {
    data: generateFallbackDeepAnalysis(params.resources, params.suppliers, params.isSimulationActive),
    isAiGenerated: false,
    errorMessage: 'AI analysis is temporarily unavailable. The rule-based resilience engine is still available.'
  };
}

/**
 * 2. Request single-resource explainable analysis from server-side Gemini
 */
export async function requestResourceAnalysis(params: {
  resource: MedicalResource;
  supplier?: Supplier;
  isSimulationActive: boolean;
}): Promise<ResourceAnalysisResultWrapper> {
  try {
    const res = await fetch('/api/gemini/resource-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resource: params.resource,
        supplier: params.supplier,
        isSimulationActive: params.isSimulationActive
      })
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return {
          data: {
            ...json.data,
            isAiGenerated: true,
            timestamp: json.data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          isAiGenerated: true
        };
      } else {
        return {
          data: generateFallbackResourceAnalysis(params.resource, params.supplier, params.isSimulationActive),
          isAiGenerated: false,
          errorMessage: json.error || 'AI analysis is temporarily unavailable. The rule-based resilience engine is still available.'
        };
      }
    }
  } catch (err: any) {
    console.warn('Network error during resource-analysis request, reverting to deterministic model:', err);
  }

  return {
    data: generateFallbackResourceAnalysis(params.resource, params.supplier, params.isSimulationActive),
    isAiGenerated: false,
    errorMessage: 'AI analysis is temporarily unavailable. The rule-based resilience engine is still available.'
  };
}

/**
 * 3. Request conversational supply-chain answers from server-side Gemini
 */
export async function requestAssistantChat(params: {
  query: string;
  history: any[];
  resources: MedicalResource[];
  suppliers: Supplier[];
  alerts: AlertItem[];
  isSimulationActive: boolean;
  simulationContext?: string;
}): Promise<ChatResultWrapper> {
  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: params.query,
        history: params.history,
        resources: params.resources,
        suppliers: params.suppliers,
        alerts: params.alerts,
        isSimulationActive: params.isSimulationActive,
        simulationContext: params.simulationContext
      })
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data && json.data.reply) {
        return {
          reply: json.data.reply,
          suggestedAction: json.data.suggestedAction,
          riskBadge: json.data.riskBadge,
          resourceTag: json.data.resourceTag,
          dataPoints: json.data.dataPoints,
          isAiGenerated: true
        };
      }
    }
  } catch (err) {
    console.warn('Error during chat request:', err);
  }

  return {
    reply: '',
    isAiGenerated: false,
    errorMessage: 'AI analysis is temporarily unavailable. The rule-based resilience engine is still available.'
  };
}

// ----------------------------------------------------
// Deterministic Fallback Synthesis Generators
// ----------------------------------------------------
function generateFallbackDeepAnalysis(
  resources: MedicalResource[],
  suppliers: Supplier[],
  isSimulationActive: boolean
): GeminiDeepAnalysisResponse {
  const engineResult = runDeepAnalysis(resources, suppliers);
  const criticalItems = resources.filter(r => r.riskLevel === 'CRITICAL');
  const highItems = resources.filter(r => r.riskLevel === 'HIGH');

  const overallRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 
    criticalItems.length > 0 ? 'CRITICAL' : highItems.length > 0 ? 'HIGH' : 'MEDIUM';

  const priorityResources = [...criticalItems, ...highItems].slice(0, 5).map(r => ({
    resourceName: r.name,
    riskLevel: r.riskLevel,
    daysOfStock: Number(r.daysRemaining.toFixed(1)),
    reason: `${r.name} has ${r.daysRemaining.toFixed(1)} days of stock remaining at current burn rate of ${r.dailyConsumption} ${r.unit}/day against ${r.supplierLeadTimeDays}d lead time.`,
    recommendedActions: [
      r.recommendedAction,
      `Monitor supplier ${r.supplier} (${r.currentShipmentStatus})`
    ]
  }));

  const supplierRisks = suppliers
    .filter(s => s.supplyRisk === 'SEVERE' || s.supplyRisk === 'ELEVATED')
    .map(s => ({
      supplierName: s.name,
      riskLevel: s.supplyRisk,
      reason: `${s.currentShipmentStatus} holding shipments for ${s.resourcesSupplied.join(', ')}. Reliability score: ${s.reliability}%.`
    }));

  const demandRisks = resources
    .filter(r => r.demandTrendPercentage >= 25)
    .map(r => ({
      resourceName: r.name,
      reason: `Surge acceleration (+${r.demandTrendPercentage}% consumption trajectory) burning safety stock buffer.`
    }));

  const shortageWindows = [
    ...engineResult.shortageWindows.immediate.map(r => ({
      resourceName: r.name,
      estimatedWindow: 'Under 72 Hours (Immediate)',
      explanation: `Only ${r.daysRemaining.toFixed(1)} days of on-hand inventory remaining before complete formulary stockout.`
    })),
    ...engineResult.shortageWindows.shortTerm.map(r => ({
      resourceName: r.name,
      estimatedWindow: '3–7 Days (Short-Term)',
      explanation: `Buffer exhaustion expected in ${r.daysRemaining.toFixed(1)} days if inbound replenishment PO is delayed.`
    }))
  ];

  return {
    overallRisk,
    summary: `Formulary resilience assessment indicates ${criticalItems.length} critical items and ${highItems.length} high-risk items requiring prompt intervention. ${isSimulationActive ? 'Clinical Demand Surge simulation is active (+35% draw).' : 'Standard operating baseline.'}`,
    priorityResources,
    supplierRisks,
    demandRisks,
    shortageWindows,
    generalRecommendations: [
      "Prioritize emergency release or alternate sourcing for sub-3-day runway resources.",
      "Engage Tier-1 distributors with port holds to verify temperature logging audits.",
      "Review clinical safety stock baselines across high-trajectory inpatient medications."
    ],
    isAiGenerated: false,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

function generateFallbackResourceAnalysis(
  resource: MedicalResource,
  supplier: Supplier | undefined,
  isSimulationActive: boolean
): GeminiResourceAnalysisResponse {
  const leadDeficit = (resource.supplierLeadTimeDays ?? resource.leadTimeDays) - resource.daysRemaining;
  return {
    resourceName: resource.name,
    riskLevel: resource.riskLevel,
    daysOfStock: Number(resource.daysRemaining.toFixed(1)),
    aiExplanation: `${resource.name} is assessed at ${resource.riskLevel} risk based on on-hand stock (${resource.currentStock.toLocaleString()} ${resource.unit}) supporting ${resource.daysRemaining.toFixed(1)} days of coverage. ${leadDeficit > 0 ? `Supplier reorder lead time (${resource.supplierLeadTimeDays} days) exceeds available stock by ${leadDeficit.toFixed(1)} days.` : `Lead time is currently aligned with stock buffer.`} ${isSimulationActive ? 'Burn rate reflects active clinical surge simulation.' : ''}`,
    keyRiskFactors: resource.contributingFactors,
    potentialShortageWindow: `Exhaustion projected by ${resource.expectedCriticalDate} (under ${Math.max(1, Math.round(resource.daysRemaining))} days remaining)`,
    recommendedActions: [
      resource.recommendedAction,
      `Contact vendor ${resource.supplier} to verify tracking for status: ${resource.currentShipmentStatus}`,
      "Review buffer reallocation from outpatient clinics if hospital inpatient draw surges further."
    ],
    supplierRiskNote: supplier 
      ? `Contracted supplier ${supplier.name} has a reliability score of ${supplier.reliability}% and active status: ${supplier.currentShipmentStatus}.`
      : `Supplier ${resource.supplier}: status ${resource.currentShipmentStatus}.`,
    isAiGenerated: false,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}
