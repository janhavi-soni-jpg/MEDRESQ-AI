import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Package, 
  Truck, 
  RotateCcw, 
  CornerDownLeft, 
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Info,
  Activity
} from 'lucide-react';
import { 
  MedicalResource, 
  Supplier, 
  AlertItem, 
  ChatMessage, 
  NavigationPage, 
  RiskLevel,
  CrisisScenarioConfig,
  CrisisSimulationComparison
} from '../types';
import { requestAssistantChat } from '../services/geminiClient';

interface AIAssistantViewProps {
  resources: MedicalResource[];
  suppliers: Supplier[];
  alerts: AlertItem[];
  isSimulationActive?: boolean;
  activeScenarioConfig?: CrisisScenarioConfig | null;
  activeComparison?: CrisisSimulationComparison | null;
  onNavigate: (page: NavigationPage) => void;
  onSelectResourceForAnalysis: (resourceId: string) => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  resources,
  suppliers,
  alerts,
  isSimulationActive = false,
  activeScenarioConfig,
  activeComparison,
  onNavigate,
  onSelectResourceForAnalysis
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome message
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: "Welcome to MEDRESQ Intelligence. I analyze hospital inventory burn rates, supplier lead times, and cold-chain bottlenecks to anticipate supply disruptions before stockouts occur. How can I assist your logistics decision-making today?",
      timestamp: 'Just now',
      dataPoints: [
        { label: 'Critical Items', value: `${resources.filter(r => r.riskLevel === 'CRITICAL').length} SKUs` },
        { label: 'Shortage Window', value: '48–96 hrs' },
        { label: 'Monitored Vendors', value: `${suppliers.length} Tier-1 Suppliers` }
      ]
    }
  ]);

  const quickPrompts = isSimulationActive ? [
    'What is the biggest problem in this scenario?',
    'What should we respond to first?',
    'Which medicines are at highest risk?',
    'Why is insulin critical?',
    'What should we do about the current critical shortages?'
  ] : [
    'Which medicines are at highest risk?',
    'Which supplies may run out within 72 hours?',
    'Why is insulin critical?',
    'Which supplier disruptions are affecting critical inventory?',
    'What should we do about the current critical shortages?',
    'Which facility has the highest supply risk?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Deterministic Rule-Based Fallback Engine
  const generateFallbackResponse = (query: string): ChatMessage => {
    const q = query.toLowerCase();
    const criticalList = resources.filter(r => r.riskLevel === 'CRITICAL');
    const highRiskList = resources.filter(r => r.riskLevel === 'HIGH');
    const under72h = resources.filter(r => r.daysRemaining <= 3.0);
    const delayedSuppliers = suppliers.filter(s => s.supplyRisk === 'SEVERE' || s.supplyRisk === 'ELEVATED' || s.currentShipmentStatus !== 'On Schedule');

    // S1. Simulation Scenario Question: "What is the biggest problem in this scenario?"
    if (q.includes('biggest problem') || q.includes('largest problem') || q.includes('largest risk in this scenario') || (isSimulationActive && q.includes('problem'))) {
      const topProblem = criticalList[0] || resources[0];
      const scenarioName = activeComparison?.crisisSummary.trigger || 'Clinical Demand Surge (+40%)';
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `### Largest Operational Risk in Active Scenario:
In the active crisis scenario (**${scenarioName}**), the largest simulated risk is **${topProblem.name}** (${topProblem.sku}).

**Core Impact Analysis:**
- **Available Days of Stock:** **${topProblem.daysRemaining.toFixed(1)} Days** (Current stock: ${topProblem.currentStock.toLocaleString()} ${topProblem.unit} vs daily draw of ${topProblem.dailyConsumption} ${topProblem.unit}/day).
- **Driver:** Available stock falls below the critical threshold because demand increased while the supplier shipment (${topProblem.supplier}) remains delayed (+${topProblem.shipmentDelayDays || 3} days).
- **Lead-Time Deficit:** Delivery lead time is ${topProblem.supplierLeadTimeDays} days, creating a ${(topProblem.supplierLeadTimeDays - topProblem.daysRemaining).toFixed(1)}-day vulnerability window.
- **Affected Facility:** ${topProblem.facility}.

${criticalList.length > 1 ? `Secondary critical threats include: ${criticalList.slice(1, 3).map(r => `**${r.name}** (${r.daysRemaining.toFixed(1)}d)`).join(', ')}.` : ''}`,
        timestamp: 'Just now',
        riskBadge: 'CRITICAL',
        resourceTag: topProblem.id,
        dataPoints: [
          { label: 'Top Risk SKU', value: `${topProblem.name} (${topProblem.daysRemaining.toFixed(1)}d)` },
          { label: 'Scenario Trigger', value: scenarioName },
          { label: 'Critical Items', value: `${criticalList.length} SKUs` }
        ],
        suggestedAction: `Activate alternate supplier (Apex Medical Distribution) or expedite priority air delivery for ${topProblem.name}.`
      };
    }

    // S2. Simulation Scenario Question: "What should we respond to first?"
    if (q.includes('respond to first') || q.includes('first priority') || q.includes('what should we do first') || q.includes('priority response')) {
      const highestThreat = [...criticalList].sort((a, b) => a.daysRemaining - b.daysRemaining)[0] || resources[0];
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `### Highest Operational Priority Response:
Based on the application's defined risk rules (<3.0 days stock + supplier delay + safety floor breach), your **immediate first response** must address:

1. **First Priority SKU: ${highestThreat.name}** (${highestThreat.sku})
   - **Remaining Runway:** Only **${highestThreat.daysRemaining.toFixed(1)} Days** (~${Math.round(highestThreat.daysRemaining * 24)} hours) before total formulary depletion.
   - **Recommended Action:** Authorize an **emergency alternate supplier purchase order** from Apex Medical Distribution or execute **priority courier air-freight** (48h transit).
   - **Internal Protocol:** Restrict non-emergency ward floor requisitions and balance safety stock from Metro Regional Reserve.

2. **Secondary Priority: Rapid Formulary Allocation**
   - Reserve remaining inventory of Tier-1 life-support medications exclusively for emergency departments and intensive care.`,
        timestamp: 'Just now',
        riskBadge: 'CRITICAL',
        resourceTag: highestThreat.id,
        dataPoints: [
          { label: 'First SKU to Address', value: highestThreat.name },
          { label: 'Remaining Runway', value: `${highestThreat.daysRemaining.toFixed(1)} Days` },
          { label: 'Supplier Status', value: highestThreat.shipmentStatus }
        ],
        suggestedAction: `Initiate Alternate Supplier Activation from the Resilience Response Engine.`
      };
    }

    // 1. Highest risk resources / medicines
    if (q.includes('highest risk') || q.includes('most critical') || q.includes('which medicines')) {
      const topItems = [...criticalList, ...highRiskList].slice(0, 5);
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `Based on current burn rates and active lead-time tracking in the central dataset, the following **${topItems.length} medical resources** are at highest supply risk:

${topItems.map((r, i) => `${i + 1}. **${r.name}** (${r.sku}): **${r.daysRemaining.toFixed(1)} days of stock** (${r.riskLevel}) — Draw: ${r.dailyConsumption} ${r.unit}/d | Stock: ${r.currentStock.toLocaleString()} | Facility: ${r.facility}`).join('\n')}

**Operational Risk Summary:**
These items face immediate lead-time deficits where remaining on-hand runway is shorter than standard supplier fulfillment cycles.`,
        timestamp: 'Just now',
        riskBadge: 'CRITICAL',
        dataPoints: topItems.map(item => ({
          label: item.name,
          value: `${item.daysRemaining.toFixed(1)}d buffer (${item.riskLevel})`
        })),
        suggestedAction: "Initiate emergency PO drafts or secondary distributor transfers from Apex for Ceftriaxone and Insulin."
      };
    }

    // 2. Supplies that may run out within 72 hours (<= 3.0 days)
    if (q.includes('72 hours') || q.includes('72h') || q.includes('run out')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `### Immediate Shortage Horizon (\u2264 72 Hours)
According to live telemetry in the active formulary dataset, **${under72h.length} critical supplies** have 3.0 days or less of on-hand buffer remaining:

${under72h.map((r, i) => `* **${r.name}** (${r.sku}):
  - **Days of Stock Remaining:** **${r.daysRemaining.toFixed(1)} Days** (~${Math.round(r.daysRemaining * 24)} hours)
  - **On-Hand Stock:** ${r.currentStock.toLocaleString()} ${r.unit} (Min safety floor: ${r.minimumSafetyStock.toLocaleString()})
  - **Daily Draw Rate:** ${r.dailyConsumption.toLocaleString()} ${r.unit}/day
  - **Supplier:** ${r.supplier} (Lead time: ${r.supplierLeadTimeDays}d; Status: ${r.shipmentStatus})
  - **Affected Facility:** ${r.facility}`).join('\n\n')}

Without expedited intervention (air-freight PO or inter-facility transfer), these items will cross the zero-inventory threshold before standard standing replenishment arrives.`,
        timestamp: 'Just now',
        riskBadge: 'CRITICAL',
        dataPoints: under72h.map(r => ({
          label: r.name,
          value: `${r.daysRemaining.toFixed(1)}d remaining (${Math.round(r.daysRemaining * 24)}h)`
        })),
        suggestedAction: "Dispatch emergency air-freight PO and alert pharmacy department heads."
      };
    }

    // 3. Why is insulin considered critical
    if (q.includes('insulin')) {
      const insulin = resources.find(r => r.id === 'res-insulin') || resources[0];
      const delayDays = insulin.shipmentDelayDays || 4;
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `### Why Insulin is at CRITICAL Risk:
**Insulin (Regular & Glargine)** (${insulin.sku}) is currently classified as **CRITICAL** based on calculated supply-chain parameters:

1. **Days of Demand Covered:** Current stock covers **${insulin.daysRemaining.toFixed(1)} days of demand** (${insulin.currentStock.toLocaleString()} ${insulin.unit} on hand ÷ ${insulin.dailyConsumption} ${insulin.unit}/day burn rate), which is below the 3-day critical threshold.
2. **Supplier Logistics Delay:** The primary supplier (${insulin.supplier}) is delayed by ${delayDays} days (${insulin.shipmentStatus || '+4 days customs hold'}).
3. **Delivery Lead-Time Deficit:** Delivery lead time is ${insulin.supplierLeadTimeDays} days, exceeding the available on-hand duration by ${(insulin.supplierLeadTimeDays - insulin.daysRemaining).toFixed(1)} days.
4. **Safety Floor Deficit:** Current on-hand inventory (${insulin.currentStock.toLocaleString()} units) is below the required safety threshold of ${insulin.minimumSafetyStock.toLocaleString()} units at ${insulin.facility}.
${isSimulationActive ? `\n> *Note: This calculation reflects the active **DEMO SIMULATION** (${activeComparison?.crisisSummary.trigger || 'Crisis Scenario'}).*` : ''}`,
        timestamp: 'Just now',
        resourceTag: 'res-insulin',
        riskBadge: 'CRITICAL',
        dataPoints: [
          { label: 'Stock Covers', value: `${insulin.daysRemaining.toFixed(1)} Days` },
          { label: 'Current / Safety', value: `${insulin.currentStock} / ${insulin.minimumSafetyStock} units` },
          { label: 'Supplier Delay', value: `${delayDays} days delay` },
          { label: 'Lead Time Deficit', value: `${(insulin.supplierLeadTimeDays - insulin.daysRemaining).toFixed(1)} days` }
        ],
        suggestedAction: "Authorize emergency courier air-freight or request secondary stock transfer from Metro Regional Central Reserve."
      };
    }

    // 4. Supplier disruptions affecting critical inventory
    if (q.includes('supplier disruption') || q.includes('supplier disruptions') || q.includes('vendor disruption') || q.includes('supplier delays')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `### Active Supplier Disruptions Impacting Formulary:
The following upstream supplier disruptions are directly threatening critical healthcare inventory:

1. **Global BioPharma Logistics** (Risk: **SEVERE**, Reliability: **68%**):
   - **Active Bottleneck:** Customs Cold-Chain Hold (+4 days delay at Port Elizabeth Seaport)
   - **Affected Critical Inventory:** **Insulin (${resources.find(r => r.id === 'res-insulin')?.daysRemaining.toFixed(1) || '2.9'}d buffer)** and **Propofol Emulsion (${resources.find(r => r.id === 'res-propofol')?.daysRemaining.toFixed(1) || '3.5'}d buffer)**.

2. **PharmaNexus International** (Risk: **ELEVATED**, Reliability: **74%**):
   - **Active Bottleneck:** API precursor packaging bottleneck (+3 to +5 days delay)
   - **Affected Critical Inventory:** **Ceftriaxone Sodium IV (${resources.find(r => r.id === 'res-ceftriaxone')?.daysRemaining.toFixed(1) || '2.1'}d buffer)** and **Amoxicillin Trihydrate (${resources.find(r => r.id === 'res-amoxicillin')?.daysRemaining.toFixed(1) || '4.2'}d buffer)**.

3. **Biosense Diagnostics Inc** (Risk: **ELEVATED**, Reliability: **70%**):
   - **Active Bottleneck:** Polymer resin raw material quota delay (+5 days)
   - **Affected Supplies:** **Blood Collection Tubes (${resources.find(r => r.id === 'res-tubes')?.daysRemaining.toFixed(1) || '4.0'}d buffer)**.`,
        timestamp: 'Just now',
        riskBadge: 'HIGH',
        suggestedAction: "Request alternate supplier quote from Apex Medical Distribution for emergency antibiotic and analgesic volumes."
      };
    }

    // 5. What should we do about the current critical shortages
    if (q.includes('what should we do') || q.includes('current critical shortages') || q.includes('mitigation') || q.includes('action')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `### Operational Supply-Chain Action Plan for Critical Shortages:

1. **For Ceftriaxone Sodium IV (${resources.find(r => r.id === 'res-ceftriaxone')?.daysRemaining.toFixed(1) || '2.1'}d stock remaining):**
   - **Immediate Action:** Activate secondary regional distributor **Apex Medical Distribution** for an emergency air-freight purchase order of 1,000 vials (2-3 day transit).
   - **Internal Action:** Prioritize ICU and emergency surgical allocations; audit ward floor stock carts.

2. **For Insulin Glargine & Regular (${resources.find(r => r.id === 'res-insulin')?.daysRemaining.toFixed(1) || '2.9'}d stock remaining):**
   - **Immediate Action:** Escalate customs clearance with port logistics expediter and request temperature logger waiver.
   - **Contingency:** Initiate inter-hospital mutual aid transfer of 350 cartridges from Metro Regional Central Reserve.

3. **For High-Risk Antibiotics & Analgesics (Paracetamol, Amoxicillin, Glucose):**
   - **Immediate Action:** Double upcoming weekly standing order batch size to reconstruct minimum safety floors.
   - **Monitoring:** Track daily clinical draw rates every 12 hours via automated dispensing telemetry.`,
        timestamp: 'Just now',
        riskBadge: 'CRITICAL',
        suggestedAction: "Generate Emergency PO Draft directly from the Risk Analysis view."
      };
    }

    // 6. Which facility has the highest supply risk
    if (q.includes('facility') || q.includes('which hospital') || q.includes('depot')) {
      // Group critical and high risk items by facility
      const facilityRiskMap: Record<string, { critical: string[]; high: string[]; totalThreats: number }> = {};
      resources.forEach(r => {
        const fac = r.facility || 'Central Regional Health - Trauma Depot 04';
        if (!facilityRiskMap[fac]) {
          facilityRiskMap[fac] = { critical: [], high: [], totalThreats: 0 };
        }
        if (r.riskLevel === 'CRITICAL') {
          facilityRiskMap[fac].critical.push(r.name);
          facilityRiskMap[fac].totalThreats += 2;
        } else if (r.riskLevel === 'HIGH') {
          facilityRiskMap[fac].high.push(r.name);
          facilityRiskMap[fac].totalThreats += 1;
        }
      });

      const sortedFacilities = Object.entries(facilityRiskMap).sort((a, b) => b[1].totalThreats - a[1].totalThreats);
      const topFacility = sortedFacilities[0];

      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `### Facility Supply Vulnerability Ranking:
Based on live stock levels, delivery lead-time deficits, and safety stock floor status across facilities:

**Highest Risk Facility: ${topFacility[0]}**
- **Critical SKUs at Risk:** ${topFacility[1].critical.length > 0 ? topFacility[1].critical.join(', ') : 'None'}
- **High-Risk Items:** ${topFacility[1].high.length > 0 ? topFacility[1].high.join(', ') : 'None'}

**All Monitored Regional Facilities:**
${sortedFacilities.map(([fac, data], i) => `* **${fac}**: ${data.critical.length} Critical threats | ${data.high.length} High-risk SKUs`).join('\n')}

**Operational Recommendation:**
Prioritize inter-hospital stock balancing and direct incoming expedited shipments to ${topFacility[0]}.`,
        timestamp: 'Just now',
        riskBadge: 'HIGH',
        suggestedAction: "Initiate inter-facility stock transfer to rebalance critical reserves."
      };
    }

    // Default grounded answer
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `Regarding "${query}":
I have analyzed the current simulated healthcare dataset for Central Regional Health.

- **Total SKUs Monitored:** ${resources.length} healthcare supplies
- **Critical Shortages (<3 days buffer):** ${criticalList.length} items (${criticalList.map(r => r.name).join(', ')})
- **High-Risk Items (3–5 days buffer):** ${highRiskList.length} items (${highRiskList.map(r => r.name).join(', ')})
- **Active Supplier Disruptions:** ${delayedSuppliers.length} vendors with transit delays or holds.
${isSimulationActive ? `- **Simulation State:** Active DEMO SIMULATION (${activeComparison?.crisisSummary.trigger || 'Crisis Scenario'}).` : ''}

Operational recommendation: Focus replenishment orders on **Ceftriaxone** and **Insulin** to prevent stockouts within the next 48–72 hours.`,
      timestamp: 'Just now',
      suggestedAction: "Navigate to the Risk Analysis page to review root-cause drivers and mitigation workflows."
    };
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    setAiNotice(null);

    // User message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: 'Just now'
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    try {
      const chatRes = await requestAssistantChat({
        query: query.trim(),
        history: messages.slice(-6),
        resources,
        suppliers,
        alerts,
        isSimulationActive,
        simulationContext: isSimulationActive
          ? (activeComparison?.crisisSummary.trigger || 'Active crisis simulation scenario')
          : undefined
      });

      if (chatRes.isAiGenerated && chatRes.reply) {
        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: chatRes.reply,
          timestamp: 'Just now',
          riskBadge: chatRes.riskBadge,
          resourceTag: chatRes.resourceTag,
          dataPoints: chatRes.dataPoints,
          suggestedAction: chatRes.suggestedAction
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        // Fallback to deterministic model
        if (chatRes.errorMessage) {
          setAiNotice(chatRes.errorMessage);
        }
        const fallbackMsg = generateFallbackResponse(query.trim());
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch (err) {
      console.error('Failed to communicate with AI chat endpoint:', err);
      setAiNotice('AI analysis is temporarily unavailable. The rule-based resilience engine is still available.');
      const fallbackMsg = generateFallbackResponse(query.trim());
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    setAiNotice(null);
    setMessages([
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: "Conversation refreshed. MEDRESQ Intelligence is actively monitoring Central Regional Health inventory. Select a quick query or ask any supply question.",
        timestamp: 'Just now'
      }
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[550px] bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-cyan-900/40 ring-1 ring-white/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-sm sm:text-base text-white">
                MEDRESQ Intelligence Assistant
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-cyan-300" />
                <span>Gemini Decision Support</span>
              </span>
              {isSimulationActive && (
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  DEMO SIMULATION: {activeScenarioConfig?.type === 'demand_surge' 
                    ? `+${activeScenarioConfig.demandSurgePercent}% Surge` 
                    : activeScenarioConfig?.type === 'supplier_delay'
                    ? `+${activeScenarioConfig.supplierDelayDays}d Delay`
                    : activeScenarioConfig?.type === 'shipment_failure'
                    ? 'Shipment Failure'
                    : activeScenarioConfig ? 'Combined Crisis' : 'Active'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Contextually connected to live hospital stock, burn trajectories, and supplier logs
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleClearHistory}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Chat</span>
          </button>
        </div>
      </div>

      {/* Notice Banner if Fallback */}
      {aiNotice && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-800 flex items-center space-x-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{aiNotice}</span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-slate-900 text-white rounded-br-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-1.5 text-cyan-700 font-bold text-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>MEDRESQ Intelligence</span>
                    </div>
                    {msg.riskBadge && (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          msg.riskBadge === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : msg.riskBadge === 'HIGH'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {msg.riskBadge}
                      </span>
                    )}
                  </div>
                )}

                <div className="whitespace-pre-line">{msg.text}</div>

                {/* Key Data Points Pill Row */}
                {msg.dataPoints && msg.dataPoints.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {msg.dataPoints.map((dp, i) => (
                      <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {dp.label}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {dp.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Action Callout */}
                {msg.suggestedAction && (
                  <div className="mt-3 p-2.5 rounded-lg bg-cyan-50 border border-cyan-200 text-xs text-cyan-900 flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold block text-[11px] text-cyan-950 uppercase tracking-wider">
                        Suggested Supply-Chain Action:
                      </strong>
                      <span className="text-slate-800 font-medium">{msg.suggestedAction}</span>
                    </div>
                  </div>
                )}

                {/* Deep Link to Resource Analysis if Tagged */}
                {msg.resourceTag && (
                  <div className="mt-2.5 flex justify-end">
                    <button
                      onClick={() => onSelectResourceForAnalysis(msg.resourceTag!)}
                      className="text-xs text-cyan-700 hover:text-cyan-900 font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Examine in Risk Console</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div
                  className={`mt-2 text-[10px] text-right ${
                    isUser ? 'text-slate-400' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs p-3.5 text-xs text-slate-500 flex items-center space-x-2 shadow-xs">
              <Sparkles className="w-4 h-4 text-cyan-600 animate-spin" />
              <span>Analyzing formulary data with Gemini...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Shelf */}
      <div className="p-3 bg-white border-t border-slate-200 overflow-x-auto scrollbar-none shrink-0">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap pl-1">
            Suggested Prompts:
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              disabled={isTyping}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-cyan-50 hover:border-cyan-200 hover:text-cyan-900 text-slate-700 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about high-risk medicines, stockout windows, or supplier delays..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isTyping}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Inquire</span>
          </button>
        </form>
        <div className="mt-2 text-[10px] text-slate-400 text-center">
          <strong>Decision Support Only:</strong> Strictly provides healthcare supply-chain logistics support. Does not diagnose patients or prescribe medical treatments.
        </div>
      </div>
    </div>
  );
};
