import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

const SYSTEM_INSTRUCTION = `You are MEDRESQ AI, a healthcare supply-chain resilience decision-support assistant.

Analyze only the provided fictional/simulated supply-chain data.

Do not diagnose patients.
Do not recommend medical treatment.
Do not make clinical decisions.

Your purpose is to identify inventory and supply-chain risks, explain the factors contributing to those risks, identify potential shortage windows, and suggest operational supply-chain actions.

Base every conclusion on the provided data.

Do not invent suppliers, inventory quantities, shipment information, or external facts.

Clearly distinguish observed data from estimates.

If the available information is insufficient to make a reliable assessment, say so.

Recommendations should focus on operational actions such as:
- replenishment planning
- alternate supplier evaluation
- inventory monitoring
- demand monitoring
- shipment escalation
- safety-stock review

The final response is decision support and must be reviewed by an appropriate healthcare supply-chain professional.`;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  try {
    return new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
    return null;
  }
}

// Helper to invoke Gemini with transient fallback and retry
async function callGemini(
  ai: GoogleGenAI,
  contents: string,
  systemInstruction: string,
  responseMimeType: string = 'application/json'
): Promise<string> {
  const models = ['gemini-3.8-flash', 'gemini-3.6-flash'];
  let lastErr: any = null;
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            responseMimeType,
          }
        });
        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastErr = err;
        if (err?.message?.includes('503') || err?.message?.includes('high demand')) {
          await new Promise(r => setTimeout(r, 600));
        } else {
          break;
        }
      }
    }
  }
  throw lastErr;
}

// ----------------------------------------------------
// Health Check
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
  const isConfigured = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({
    status: 'ok',
    geminiConfigured: isConfigured,
    timestamp: new Date().toISOString()
  });
});

// ----------------------------------------------------
// 1. Full-Formulary Deep Vulnerability Analysis
// ----------------------------------------------------
app.post('/api/gemini/deep-analysis', async (req, res) => {
  try {
    const { resources, suppliers, alerts, isSimulationActive, simulationContext } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(200).json({
        success: false,
        error: 'Gemini API key is not configured. AI analysis is temporarily unavailable. The rule-based resilience engine is still available.',
        isConfigured: false
      });
    }

    // Prepare minimal structured payload without redundant metadata
    const inventoryData = (resources || []).map((r: any) => ({
      resourceName: r.name,
      category: r.category,
      currentStock: r.currentStock,
      dailyConsumption: r.dailyConsumption,
      minimumSafetyStock: r.minimumSafetyStock ?? r.minSafetyStock,
      daysOfStockRemaining: Number((r.daysRemaining ?? (r.currentStock / (r.dailyConsumption || 1))).toFixed(1)),
      demandTrend: `${r.demandTrendPercentage ?? r.demandTrend ?? 0}%`,
      expiryDate: r.expiryDate,
      supplier: r.supplier ?? r.supplierName,
      supplierLeadTime: `${r.supplierLeadTimeDays ?? r.leadTimeDays ?? 0} days`,
      supplierReliability: `${r.supplierReliability ?? 0}%`,
      shipmentStatus: r.currentShipmentStatus ?? r.shipmentStatus ?? 'Normal',
      calculatedRiskLevel: r.riskLevel
    }));

    const supplierData = (suppliers || []).map((s: any) => ({
      supplierName: s.name,
      reliability: `${s.reliability}%`,
      leadTime: `${s.averageDeliveryDays} days`,
      shipmentStatus: s.currentShipmentStatus,
      supplyRisk: s.supplyRisk,
      affectedResources: s.resourcesSupplied
    }));

    const alertData = (alerts || [])
      .filter((a: any) => !a.isResolved)
      .slice(0, 10)
      .map((a: any) => ({
        severity: a.severity,
        title: a.title,
        message: a.message,
        resource: a.resourceName,
        actionRequired: a.actionRequired
      }));

    const promptPayload = {
      systemContext: "MEDRESQ AI Healthcare Supply-Chain Resilience Platform",
      simulationState: isSimulationActive 
        ? (simulationContext || "Clinical Demand Surge Simulation active (+35% emergency inpatient draw across key medications)")
        : "Standard Baseline formulary operations",
      inventoryCount: inventoryData.length,
      inventory: inventoryData,
      suppliers: supplierData,
      activeAlerts: alertData
    };

    const prompt = `Analyze the current hospital formulary supply-chain state provided below.

Data:
${JSON.stringify(promptPayload, null, 2)}

Provide an explainable healthcare supply-chain resilience assessment.
You must return valid JSON matching this exact structure:
{
  "overallRisk": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "summary": "Concise executive summary of current formulary resilience and operational exposure",
  "priorityResources": [
    {
      "resourceName": "Name of resource",
      "riskLevel": "CRITICAL" | "HIGH" | "MEDIUM" | "STABLE",
      "daysOfStock": 2.9,
      "reason": "Clear explanation of stock vs burn vs supplier lead time factors",
      "recommendedActions": ["Operational action 1", "Operational action 2"]
    }
  ],
  "supplierRisks": [
    {
      "supplierName": "Supplier Name",
      "riskLevel": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "reason": "Why this supplier represents risk (delays, reliability, customs holds)"
    }
  ],
  "demandRisks": [
    {
      "resourceName": "Resource Name",
      "reason": "Why demand acceleration or surge represents risk"
    }
  ],
  "shortageWindows": [
    {
      "resourceName": "Resource Name",
      "estimatedWindow": "e.g. 48-72 hours or 3-5 days",
      "explanation": "Calculated horizon based on burn rate vs buffer"
    }
  ],
  "generalRecommendations": [
    "High-priority operational recommendation 1",
    "High-priority operational recommendation 2"
  ]
}`;

    const responseText = await callGemini(ai, prompt, SYSTEM_INSTRUCTION, 'application/json');
    let parsed: any;
    try {
      parsed = JSON.parse(responseText.trim());
    } catch (parseErr) {
      console.error('Failed to parse Gemini deep-analysis JSON:', responseText);
      return res.status(200).json({
        success: false,
        error: 'AI returned an unparseable response format. The rule-based resilience engine is still available.',
        isConfigured: true
      });
    }

    // Validate structure
    const validatedResult = {
      overallRisk: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(parsed.overallRisk) 
        ? parsed.overallRisk 
        : 'HIGH',
      summary: typeof parsed.summary === 'string' ? parsed.summary : 'Formulary vulnerability analysis completed.',
      priorityResources: Array.isArray(parsed.priorityResources) ? parsed.priorityResources : [],
      supplierRisks: Array.isArray(parsed.supplierRisks) ? parsed.supplierRisks : [],
      demandRisks: Array.isArray(parsed.demandRisks) ? parsed.demandRisks : [],
      shortageWindows: Array.isArray(parsed.shortageWindows) ? parsed.shortageWindows : [],
      generalRecommendations: Array.isArray(parsed.generalRecommendations) ? parsed.generalRecommendations : [],
      isAiGenerated: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    return res.json({
      success: true,
      data: validatedResult
    });

  } catch (error: any) {
    console.error('Error in /api/gemini/deep-analysis:', error);
    return res.status(200).json({
      success: false,
      error: 'AI analysis is temporarily unavailable. The rule-based resilience engine is still available.',
      details: error?.message,
      isConfigured: true
    });
  }
});

// ----------------------------------------------------
// 2. Resource-Level AI Analysis
// ----------------------------------------------------
app.post('/api/gemini/resource-analysis', async (req, res) => {
  try {
    const { resource, supplier, isSimulationActive } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(200).json({
        success: false,
        error: 'Gemini API key is not configured. AI analysis is temporarily unavailable. The rule-based resilience engine is still available.',
        isConfigured: false
      });
    }

    if (!resource) {
      return res.status(400).json({ success: false, error: 'Resource data is required' });
    }

    const payload = {
      resource: {
        name: resource.name,
        category: resource.category,
        currentStock: resource.currentStock,
        unit: resource.unit,
        dailyConsumption: resource.dailyConsumption,
        minimumSafetyStock: resource.minimumSafetyStock ?? resource.minSafetyStock,
        daysOfStock: Number((resource.daysRemaining ?? (resource.currentStock / (resource.dailyConsumption || 1))).toFixed(1)),
        demandTrend: `+${resource.demandTrendPercentage ?? resource.demandTrend ?? 0}%`,
        expiryDate: resource.expiryDate,
        currentShipmentStatus: resource.currentShipmentStatus ?? resource.shipmentStatus,
        calculatedRiskLevel: resource.riskLevel,
        leadTimeDays: resource.supplierLeadTimeDays ?? resource.leadTimeDays,
        expectedCriticalDate: resource.expectedCriticalDate
      },
      supplier: supplier ? {
        name: supplier.name,
        reliability: `${supplier.reliability}%`,
        averageDeliveryDays: supplier.averageDeliveryDays,
        currentShipmentStatus: supplier.currentShipmentStatus,
        supplyRisk: supplier.supplyRisk,
        delayHistory: supplier.delayHistory
      } : null,
      isSimulationActive: !!isSimulationActive
    };

    const prompt = `Analyze this specific hospital medical resource and its contracted supplier:
${JSON.stringify(payload, null, 2)}

Provide an explainable supply-chain analysis. Specifically evaluate:
1. Why the resource has its current risk level (${resource.riskLevel})
2. What factors are driving the risk (stock volume, draw rate, lead time gap, safety threshold breach)
3. How many days of stock remain (${payload.resource.daysOfStock} days)
4. Whether supplier lead time (${payload.resource.leadTimeDays} days) creates additional risk
5. Whether demand trend (${payload.resource.demandTrend}) increases risk
6. What operational actions should be considered

Return JSON matching this exact structure:
{
  "resourceName": "${resource.name}",
  "riskLevel": "${resource.riskLevel}",
  "daysOfStock": ${payload.resource.daysOfStock},
  "aiExplanation": "A cohesive 2-3 paragraph explanation of why this resource is at this risk level, addressing lead time deficits, demand spikes, and on-hand safety stock.",
  "keyRiskFactors": [
    "Primary risk factor 1",
    "Primary risk factor 2",
    "Primary risk factor 3"
  ],
  "potentialShortageWindow": "Specific horizon e.g. 'Within 48-72 hours if shipment hold is not cleared'",
  "recommendedActions": [
    "Operational action 1",
    "Operational action 2",
    "Operational action 3"
  ],
  "supplierRiskNote": "Assessment of the supplier's reliability and transit status impact"
}`;

    const responseText = await callGemini(ai, prompt, SYSTEM_INSTRUCTION, 'application/json');
    let parsed: any;
    try {
      parsed = JSON.parse(responseText.trim());
    } catch (parseErr) {
      console.error('Failed to parse Gemini resource-analysis JSON:', responseText);
      return res.status(200).json({
        success: false,
        error: 'AI returned an unparseable response format. The rule-based resilience engine is still available.',
        isConfigured: true
      });
    }

    const validatedResult = {
      resourceName: parsed.resourceName || resource.name,
      riskLevel: parsed.riskLevel || resource.riskLevel,
      daysOfStock: typeof parsed.daysOfStock === 'number' ? parsed.daysOfStock : payload.resource.daysOfStock,
      aiExplanation: parsed.aiExplanation || resource.riskReason,
      keyRiskFactors: Array.isArray(parsed.keyRiskFactors) ? parsed.keyRiskFactors : resource.contributingFactors,
      potentialShortageWindow: parsed.potentialShortageWindow || `Exhaustion projected by ${resource.expectedCriticalDate}`,
      recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [resource.recommendedAction],
      supplierRiskNote: parsed.supplierRiskNote || `${resource.supplier}: Lead time ${payload.resource.leadTimeDays}d`,
      isAiGenerated: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    return res.json({
      success: true,
      data: validatedResult
    });

  } catch (error: any) {
    console.error('Error in /api/gemini/resource-analysis:', error);
    return res.status(200).json({
      success: false,
      error: 'AI analysis is temporarily unavailable. The rule-based resilience engine is still available.',
      details: error?.message,
      isConfigured: true
    });
  }
});

// ----------------------------------------------------
// 3. Conversational AI Assistant
// ----------------------------------------------------
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { query, history, resources, suppliers, alerts, isSimulationActive, simulationContext } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(200).json({
        success: false,
        error: 'Gemini API key is not configured. AI analysis is temporarily unavailable. The rule-based resilience engine is still available.',
        isConfigured: false
      });
    }

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }

    // Create current state snapshot for Gemini context
    const criticalList = (resources || []).filter((r: any) => r.riskLevel === 'CRITICAL');
    const highRiskList = (resources || []).filter((r: any) => r.riskLevel === 'HIGH');
    const delayedSuppliers = (suppliers || []).filter((s: any) => 
      s.supplyRisk === 'SEVERE' || s.supplyRisk === 'ELEVATED' || s.currentShipmentStatus !== 'On Schedule'
    );

    const snapshot = {
      isSimulationActive: !!isSimulationActive,
      simulationNote: isSimulationActive 
        ? (simulationContext || 'Active crisis simulation scenario: operational disruption parameters applied to inventory and suppliers')
        : 'Standard baseline formulary operations',
      totalResources: (resources || []).length,
      criticalCount: criticalList.length,
      highRiskCount: highRiskList.length,
      criticalResources: criticalList.map((r: any) => ({
        name: r.name,
        stock: r.currentStock,
        dailyConsumption: r.dailyConsumption,
        daysRemaining: r.daysRemaining,
        supplier: r.supplier,
        leadTime: r.supplierLeadTimeDays ?? r.leadTimeDays,
        shipmentStatus: r.currentShipmentStatus
      })),
      highRiskResources: highRiskList.map((r: any) => ({
        name: r.name,
        stock: r.currentStock,
        dailyConsumption: r.dailyConsumption,
        daysRemaining: r.daysRemaining,
        supplier: r.supplier,
        leadTime: r.supplierLeadTimeDays ?? r.leadTimeDays,
        shipmentStatus: r.currentShipmentStatus
      })),
      delayedSuppliers: delayedSuppliers.map((s: any) => ({
        name: s.name,
        status: s.currentShipmentStatus,
        risk: s.supplyRisk,
        supplies: s.resourcesSupplied
      })),
      unresolvedAlerts: (alerts || []).filter((a: any) => !a.isResolved).slice(0, 6).map((a: any) => ({
        severity: a.severity,
        title: a.title,
        resource: a.resourceName
      }))
    };

    const prompt = `The user is asking a question about the hospital's supply chain:
"${query}"

CURRENT REAL-TIME SUPPLY-CHAIN DATA SNAPSHOT:
${JSON.stringify(snapshot, null, 2)}

INSTRUCTIONS:
- Answer ONLY using the provided supply-chain dataset.
- Never invent suppliers, inventory numbers, or shipment facts.
- Strictly adhere to healthcare supply-chain resilience decision support. Never give medical, drug administration, or clinical treatment advice.
- If the answer cannot be determined from the current application data, explicitly say:
  "I don't have enough information in the current supply-chain dataset to answer that reliably."
- If answering questions about high risk, critical items, or suppliers, quote exact numbers and days of stock remaining from the snapshot.

Return JSON in this format:
{
  "reply": "Clear, professional, and explainable answer formatted in Markdown",
  "suggestedAction": "Optional concrete operational supply-chain next step",
  "riskBadge": "CRITICAL" | "HIGH" | "MEDIUM" | "STABLE" | null,
  "resourceTag": "optional-resource-id-if-specific",
  "dataPoints": [
    { "label": "Short label", "value": "Relevant metric value" }
  ]
}`;

    const responseText = await callGemini(ai, prompt, SYSTEM_INSTRUCTION, 'application/json');
    let parsed: any;
    try {
      parsed = JSON.parse(responseText.trim());
    } catch (parseErr) {
      // Fallback to text
      return res.json({
        success: true,
        data: {
          reply: responseText,
          suggestedAction: undefined,
          dataPoints: []
        }
      });
    }

    return res.json({
      success: true,
      data: parsed
    });

  } catch (error: any) {
    console.error('Error in /api/gemini/chat:', error);
    return res.status(200).json({
      success: false,
      error: 'AI analysis is temporarily unavailable. The rule-based resilience engine is still available.',
      details: error?.message,
      isConfigured: true
    });
  }
});

// ----------------------------------------------------
// Vite Middleware / Static Serving Setup
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MEDRESQ AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
