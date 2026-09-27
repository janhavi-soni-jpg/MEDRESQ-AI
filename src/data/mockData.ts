import { MedicalResource, Supplier, AlertItem, SupplyActivity, ResourceCategory } from '../types';
import { 
  synchronizeResource, 
  evaluateSupplierRisk, 
  generateDynamicAlerts 
} from '../services/resilienceEngine';

/**
 * Central Data Model & Demo Data Source of Truth
 * 
 * NOTE: Fictional/simulated healthcare supply-chain data for demonstration.
 * No direct hardware, RFID, GPS, or live external hospital database connection is claimed.
 */

function defineResource(data: {
  id: string;
  sku: string;
  name: string;
  genericName?: string;
  category: ResourceCategory;
  currentStock: number;
  unit: string;
  dailyConsumption: number;
  minimumSafetyStock: number;
  expiryDate: string;
  supplier: string;
  supplierId: string;
  supplierStatus: string;
  supplierLeadTimeDays: number;
  supplierReliability: number;
  expectedShipmentDate: string;
  shipmentDelay: string;
  shipmentDelayDays: number;
  facility: string;
  criticality: string;
  lastUpdated: string;
  demandTrend: number;
  shipmentStatus: string;
  batchNumber: string;
  storageCondition: string;
  departmentLocation: string;
}): MedicalResource {
  const base: Partial<MedicalResource> = {
    ...data,
    minSafetyStock: data.minimumSafetyStock,
    supplierName: data.supplier,
    leadTimeDays: data.supplierLeadTimeDays,
    demandTrendPercentage: data.demandTrend,
    currentShipmentStatus: data.shipmentStatus,
    daysRemaining: 0,
    daysOfStock: 0,
    riskLevel: 'STABLE',
    status: 'IN_STOCK',
    shortageProbability: 0,
    riskReason: '',
    recommendedAction: '',
    recommendedActions: [],
    contributingFactors: [],
    expectedCriticalDate: ''
  };

  return synchronizeResource(base as MedicalResource);
}

// 15 Comprehensive Baseline Medical Resources across critical hospital categories
export const BASELINE_RESOURCES: MedicalResource[] = [
  defineResource({
    id: 'res-insulin',
    sku: 'SKU-INS-100',
    name: 'Insulin (Regular & Glargine)',
    genericName: 'Human Recombinant Insulin 100 IU/mL',
    category: 'Pharmaceuticals',
    currentStock: 480,
    unit: 'cartridges',
    dailyConsumption: 165,
    minimumSafetyStock: 900,
    expiryDate: '2026-12-30',
    supplier: 'Global BioPharma Logistics',
    supplierId: 'sup-biopharma',
    supplierStatus: 'Customs Cold-Chain Hold (+4 days)',
    supplierLeadTimeDays: 7,
    supplierReliability: 68,
    expectedShipmentDate: 'Sep 28, 2026',
    shipmentDelay: '+4 days customs hold',
    shipmentDelayDays: 4,
    facility: 'Central Regional Health - Refrigerated Vault 2',
    criticality: 'Critical (Tier 1 - Life Support)',
    lastUpdated: '14 min ago',
    demandTrend: 18,
    shipmentStatus: 'Customs Cold-Chain Hold (+4 days)',
    batchNumber: 'INS-GL-8412',
    storageCondition: 'Cold Chain Refrigerator (2°C - 8°C)',
    departmentLocation: 'Refrigerated Depot - Vault 2'
  }),
  defineResource({
    id: 'res-ceftriaxone',
    sku: 'SKU-CFT-1000',
    name: 'Ceftriaxone Sodium IV',
    genericName: 'Ceftriaxone 1g Powder for Injection',
    category: 'Antibiotics',
    currentStock: 310,
    unit: 'vials',
    dailyConsumption: 145,
    minimumSafetyStock: 800,
    expiryDate: '2027-01-10',
    supplier: 'PharmaNexus International',
    supplierId: 'sup-pharmanexus',
    supplierStatus: 'Active Manufacturer Backorder (+5 days)',
    supplierLeadTimeDays: 8,
    supplierReliability: 72,
    expectedShipmentDate: 'Oct 03, 2026',
    shipmentDelay: '+5 days backorder delay',
    shipmentDelayDays: 5,
    facility: 'Central Regional Health - ICU Satellite Pharmacy',
    criticality: 'Critical (Tier 1 - Life Support)',
    lastUpdated: '8 min ago',
    demandTrend: 22,
    shipmentStatus: 'Active Manufacturer Backorder (+5 days)',
    batchNumber: 'CFT-1G-0021',
    storageCondition: 'Protect from Light, Store below 25°C',
    departmentLocation: 'ICU Satellite Pharmacy - Unit 1'
  }),
  defineResource({
    id: 'res-paracetamol',
    sku: 'SKU-PCM-500',
    name: 'Paracetamol IV / Oral Suspension',
    genericName: 'Acetaminophen 1000mg/100mL & 500mg tab',
    category: 'Pharmaceuticals',
    currentStock: 1420,
    unit: 'vials/packs',
    dailyConsumption: 375,
    minimumSafetyStock: 2500,
    expiryDate: '2027-04-15',
    supplier: 'Apex Medical Distribution',
    supplierId: 'sup-apex',
    supplierStatus: 'Delayed in Transit (+3 days delay)',
    supplierLeadTimeDays: 5,
    supplierReliability: 82,
    expectedShipmentDate: 'Sep 26, 2026',
    shipmentDelay: '+3 days transit delay',
    shipmentDelayDays: 3,
    facility: 'Central Regional Health - Trauma Depot 04',
    criticality: 'Essential (Tier 2)',
    lastUpdated: '22 min ago',
    demandTrend: 34,
    shipmentStatus: 'Delayed in Transit (+3 days delay)',
    batchNumber: 'PCM-2026-9902',
    storageCondition: 'Controlled Room Temp (15°C - 25°C)',
    departmentLocation: 'Central Pharmacy - Aisle 4B'
  }),
  defineResource({
    id: 'res-amoxicillin',
    sku: 'SKU-AMX-500',
    name: 'Amoxicillin Trihydrate',
    genericName: 'Amoxicillin 500mg Capsules',
    category: 'Antibiotics',
    currentStock: 1890,
    unit: 'capsule packs',
    dailyConsumption: 450,
    minimumSafetyStock: 2200,
    expiryDate: '2027-08-20',
    supplier: 'PharmaNexus International',
    supplierId: 'sup-pharmanexus',
    supplierStatus: 'Manufacturer Packaging Bottleneck (+3 days)',
    supplierLeadTimeDays: 6,
    supplierReliability: 76,
    expectedShipmentDate: 'Sep 29, 2026',
    shipmentDelay: '+3 days packaging hold',
    shipmentDelayDays: 3,
    facility: 'Central Regional Health - Central Pharmacy Vault',
    criticality: 'Essential (Tier 2)',
    lastUpdated: '35 min ago',
    demandTrend: 48,
    shipmentStatus: 'Manufacturer Packaging Bottleneck',
    batchNumber: 'AMX-500-1108',
    storageCondition: 'Dry Room Temperature (<25°C)',
    departmentLocation: 'Pharmacy Vault - Shelf C-12'
  }),
  defineResource({
    id: 'res-glucose',
    sku: 'SKU-GLU-1000',
    name: 'Glucose 5% (D5W) IV Infusion',
    genericName: 'Dextrose 5% in Water 1000mL IV Bags',
    category: 'Fluids & Electrolytes',
    currentStock: 1650,
    unit: 'infusion bags',
    dailyConsumption: 380,
    minimumSafetyStock: 2000,
    expiryDate: '2027-10-15',
    supplier: 'MedSupply Direct Corp',
    supplierId: 'sup-medsupply',
    supplierStatus: 'In-Transit Freight Check (+2 days)',
    supplierLeadTimeDays: 5,
    supplierReliability: 88,
    expectedShipmentDate: 'Sep 27, 2026',
    shipmentDelay: '+2 days transit check',
    shipmentDelayDays: 2,
    facility: 'Central Regional Health - Acute Care Depot',
    criticality: 'Critical (Tier 1 - Life Support)',
    lastUpdated: '18 min ago',
    demandTrend: 26,
    shipmentStatus: 'Inbound Freight Check (+2 days)',
    batchNumber: 'GLU-D5W-901',
    storageCondition: 'Store at 20°C - 25°C',
    departmentLocation: 'General Warehouse - Pallet Bay 8'
  }),
  defineResource({
    id: 'res-tubes',
    sku: 'SKU-BCT-EDTA',
    name: 'Blood Collection Tubes (EDTA / Gel)',
    genericName: 'Vacutainer K2 EDTA & Serum Separator Tubes',
    category: 'Diagnostic Supplies',
    currentStock: 1600,
    unit: 'packs (100/pk)',
    dailyConsumption: 400,
    minimumSafetyStock: 2500,
    expiryDate: '2027-03-31',
    supplier: 'Biosense Diagnostics Inc',
    supplierId: 'sup-biosense',
    supplierStatus: 'Polymer Shortage Delay (+5 days)',
    supplierLeadTimeDays: 7,
    supplierReliability: 70,
    expectedShipmentDate: 'Oct 02, 2026',
    shipmentDelay: '+5 days polymer delay',
    shipmentDelayDays: 5,
    facility: 'Central Regional Health - Pathology Lab Receiving',
    criticality: 'Essential (Tier 2)',
    lastUpdated: '40 min ago',
    demandTrend: 27,
    shipmentStatus: 'Polymer Shortage Delay (+5 days)',
    batchNumber: 'BCT-EDTA-402',
    storageCondition: 'Store at 4°C - 25°C',
    departmentLocation: 'Laboratory Central Receiving'
  }),
  defineResource({
    id: 'res-propofol',
    sku: 'SKU-PRF-020',
    name: 'Propofol Injectable Emulsion',
    genericName: 'Propofol 10mg/mL 20mL Vials',
    category: 'Pharmaceuticals',
    currentStock: 350,
    unit: 'vials',
    dailyConsumption: 100,
    minimumSafetyStock: 600,
    expiryDate: '2026-11-20',
    supplier: 'Global BioPharma Logistics',
    supplierId: 'sup-biopharma',
    supplierStatus: 'Cold Chain Delayed at Border (+4 days)',
    supplierLeadTimeDays: 6,
    supplierReliability: 74,
    expectedShipmentDate: 'Sep 29, 2026',
    shipmentDelay: '+4 days border delay',
    shipmentDelayDays: 4,
    facility: 'Central Regional Health - Surgical Anesthesia Vault',
    criticality: 'Critical (Tier 1 - Life Support)',
    lastUpdated: '25 min ago',
    demandTrend: 31,
    shipmentStatus: 'Cold Chain Delayed at Border',
    batchNumber: 'PRF-EM-551',
    storageCondition: 'Do not freeze. Store at 4°C - 22°C',
    departmentLocation: 'Surgical Anesthesia Vault'
  }),
  defineResource({
    id: 'res-gloves',
    sku: 'SKU-GLV-NIT',
    name: 'Surgical Gloves (Powder-Free)',
    genericName: 'Sterile Latex-Free Nitrile Gloves Size 7.5',
    category: 'PPE & Consumables',
    currentStock: 2400,
    unit: 'boxes (100/bx)',
    dailyConsumption: 350,
    minimumSafetyStock: 2000,
    expiryDate: '2029-05-10',
    supplier: 'MedSupply Direct Corp',
    supplierId: 'sup-medsupply',
    supplierStatus: 'Scheduled Dispatch Pending (+1 day)',
    supplierLeadTimeDays: 4,
    supplierReliability: 89,
    expectedShipmentDate: 'Sep 25, 2026',
    shipmentDelay: '+1 day pending dispatch',
    shipmentDelayDays: 1,
    facility: 'Central Regional Health - Surgical Supply Depot',
    criticality: 'Standard (Tier 3)',
    lastUpdated: '50 min ago',
    demandTrend: 19,
    shipmentStatus: 'Scheduled Dispatch Pending',
    batchNumber: 'GLV-NIT-75',
    storageCondition: 'Keep dry, avoid direct sunlight and heat',
    departmentLocation: 'Surgical Supply Depot - Rack 12'
  }),
  defineResource({
    id: 'res-ivsets',
    sku: 'SKU-IVS-FLT',
    name: 'Antibiotic IV Infusion Sets',
    genericName: 'Gravity Infusion Set with 0.2 Micron In-Line Filter',
    category: 'Medical Consumables',
    currentStock: 2150,
    unit: 'sets',
    dailyConsumption: 300,
    minimumSafetyStock: 2000,
    expiryDate: '2028-06-30',
    supplier: 'MedSupply Direct Corp',
    supplierId: 'sup-medsupply',
    supplierStatus: 'In-Transit Freight Check (On Schedule)',
    supplierLeadTimeDays: 5,
    supplierReliability: 88,
    expectedShipmentDate: 'Sep 25, 2026',
    shipmentDelay: 'None (On Schedule)',
    shipmentDelayDays: 0,
    facility: 'Central Regional Health - CSSD Depot',
    criticality: 'Essential (Tier 2)',
    lastUpdated: '1.5 hours ago',
    demandTrend: 14,
    shipmentStatus: 'In-Transit Freight Check',
    batchNumber: 'IVS-FLT-202',
    storageCondition: 'Store dry in ambient temp',
    departmentLocation: 'Central Sterile Supply Dept'
  }),
  defineResource({
    id: 'res-azithromycin',
    sku: 'SKU-AZT-500',
    name: 'Azithromycin IV / Tabs',
    genericName: 'Azithromycin 500mg Vials',
    category: 'Antibiotics',
    currentStock: 1280,
    unit: 'vials',
    dailyConsumption: 150,
    minimumSafetyStock: 1000,
    expiryDate: '2027-11-14',
    supplier: 'Apex Medical Distribution',
    supplierId: 'sup-apex',
    supplierStatus: 'In Transit (ETA: 48 hours)',
    supplierLeadTimeDays: 4,
    supplierReliability: 91,
    expectedShipmentDate: 'Sep 23, 2026',
    shipmentDelay: 'None (On Schedule)',
    shipmentDelayDays: 0,
    facility: 'Central Regional Health - Central Pharmacy',
    criticality: 'Essential (Tier 2)',
    lastUpdated: '45 min ago',
    demandTrend: 12,
    shipmentStatus: 'In Transit (ETA: 48 hours)',
    batchNumber: 'AZT-2026-44',
    storageCondition: 'Room Temperature (20°C - 25°C)',
    departmentLocation: 'Central Pharmacy - Aisle 4A'
  }),
  defineResource({
    id: 'res-syringes',
    sku: 'SKU-SYR-005',
    name: 'Sterile Syringes (3mL / 5mL)',
    genericName: 'Luer-Lock Hypodermic Syringes with Needles',
    category: 'Medical Consumables',
    currentStock: 8700,
    unit: 'units',
    dailyConsumption: 600,
    minimumSafetyStock: 4500,
    expiryDate: '2029-02-28',
    supplier: 'MedSupply Direct Corp',
    supplierId: 'sup-medsupply',
    supplierStatus: 'Dock Delivery Completed (On Schedule)',
    supplierLeadTimeDays: 3,
    supplierReliability: 95,
    expectedShipmentDate: 'Sep 23, 2026',
    shipmentDelay: 'None (On Schedule)',
    shipmentDelayDays: 0,
    facility: 'Central Regional Health - Central Supply Aisle 2',
    criticality: 'Essential (Tier 2)',
    lastUpdated: '1 hour ago',
    demandTrend: 5,
    shipmentStatus: 'Dock Delivery Completed',
    batchNumber: 'SYR-LL-5M',
    storageCondition: 'Standard Medical Storage',
    departmentLocation: 'Central Supply - Aisle 2'
  }),
  defineResource({
    id: 'res-epinephrine',
    sku: 'SKU-EPI-001',
    name: 'Epinephrine Auto-Inject / Vials',
    genericName: 'Epinephrine 1mg/1mL (1:1000) Ampoules',
    category: 'Pharmaceuticals',
    currentStock: 640,
    unit: 'ampoules',
    dailyConsumption: 40,
    minimumSafetyStock: 400,
    expiryDate: '2027-02-15',
    supplier: 'Apex Medical Distribution',
    supplierId: 'sup-apex',
    supplierStatus: 'Full Buffer Confirmed (On Schedule)',
    supplierLeadTimeDays: 3,
    supplierReliability: 98,
    expectedShipmentDate: 'Oct 01, 2026',
    shipmentDelay: 'None (On Schedule)',
    shipmentDelayDays: 0,
    facility: 'Central Regional Health - Crash Cart Depot',
    criticality: 'Critical (Tier 1 - Life Support)',
    lastUpdated: '2 hours ago',
    demandTrend: 4,
    shipmentStatus: 'Full Buffer Confirmed',
    batchNumber: 'EPI-1MG-77',
    storageCondition: 'Protect from light. Store at 20°C - 25°C',
    departmentLocation: 'Emergency Department Crash Cart Vault'
  }),
  defineResource({
    id: 'res-saline',
    sku: 'SKU-SAL-1000',
    name: 'IV Saline Solution 0.9%',
    genericName: 'Sodium Chloride 0.9% 1000mL Infusion Bags',
    category: 'Fluids & Electrolytes',
    currentStock: 9100,
    unit: 'bags',
    dailyConsumption: 500,
    minimumSafetyStock: 4000,
    expiryDate: '2028-03-01',
    supplier: 'MedSupply Direct Corp',
    supplierId: 'sup-medsupply',
    supplierStatus: 'Normal Delivery Cycle (On Schedule)',
    supplierLeadTimeDays: 3,
    supplierReliability: 97,
    expectedShipmentDate: 'Sep 24, 2026',
    shipmentDelay: 'None (On Schedule)',
    shipmentDelayDays: 0,
    facility: 'Central Regional Health - Pallet Bay 7',
    criticality: 'Critical (Tier 1 - Life Support)',
    lastUpdated: '1 hour ago',
    demandTrend: 3,
    shipmentStatus: 'Normal Delivery Cycle',
    batchNumber: 'SAL-09-881',
    storageCondition: 'Store below 30°C, Do not freeze',
    departmentLocation: 'General Warehouse - Pallet Bay 7'
  }),
  defineResource({
    id: 'res-masks',
    sku: 'SKU-MSK-N95',
    name: 'N95 Respirator Masks',
    genericName: 'NIOSH Certified Particulate Respirator 1860',
    category: 'PPE & Consumables',
    currentStock: 7200,
    unit: 'masks',
    dailyConsumption: 300,
    minimumSafetyStock: 3000,
    expiryDate: '2028-12-15',
    supplier: 'Apex Medical Distribution',
    supplierId: 'sup-apex',
    supplierStatus: 'Stock Replenished (On Schedule)',
    supplierLeadTimeDays: 5,
    supplierReliability: 96,
    expectedShipmentDate: 'Oct 05, 2026',
    shipmentDelay: 'None (On Schedule)',
    shipmentDelayDays: 0,
    facility: 'Central Regional Health - Warehouse C-8',
    criticality: 'Standard (Tier 3)',
    lastUpdated: '3 hours ago',
    demandTrend: -1,
    shipmentStatus: 'Stock Replenished',
    batchNumber: 'N95-MSK-91',
    storageCondition: 'Dry Area, Relative Humidity <80%',
    departmentLocation: 'Warehouse Section C-8'
  }),
  defineResource({
    id: 'res-ors',
    sku: 'SKU-ORS-WHO',
    name: 'Oral Rehydration Salts (ORS)',
    genericName: 'WHO Formula ORS Sachets',
    category: 'Fluids & Electrolytes',
    currentStock: 6400,
    unit: 'sachets',
    dailyConsumption: 200,
    minimumSafetyStock: 2000,
    expiryDate: '2028-09-15',
    supplier: 'Apex Medical Distribution',
    supplierId: 'sup-apex',
    supplierStatus: 'Order Complete (On Schedule)',
    supplierLeadTimeDays: 4,
    supplierReliability: 96,
    expectedShipmentDate: 'Oct 10, 2026',
    shipmentDelay: 'None (On Schedule)',
    shipmentDelayDays: 0,
    facility: 'Central Regional Health - General Warehouse E',
    criticality: 'Essential (Tier 2)',
    lastUpdated: '2 hours ago',
    demandTrend: -2,
    shipmentStatus: 'Order Complete',
    batchNumber: 'ORS-WHO-2026',
    storageCondition: 'Store in cool, dry place',
    departmentLocation: 'Warehouse Section E'
  })
];

export const INITIAL_RESOURCES: MedicalResource[] = [...BASELINE_RESOURCES];

// 5 Upstream Contracted Medical Suppliers
export const BASELINE_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-apex',
    name: 'Apex Medical Distribution',
    resourcesSupplied: [
      'Paracetamol IV / Oral Suspension', 
      'Azithromycin IV / Tabs', 
      'Oral Rehydration Salts (ORS)', 
      'N95 Respirator Masks', 
      'Epinephrine Auto-Inject / Vials'
    ],
    averageDeliveryDays: 4.2,
    reliability: 96,
    currentShipmentStatus: 'On Schedule',
    delayHistory: '1 delay in last 90 days (avg +1.2 days)',
    supplyRisk: 'LOW',
    contactPerson: 'Marcus Vance (Senior Logistics VP)',
    contactEmail: 'm.vance@apexmed-distribution.com',
    primaryLocation: 'Midwest Regional Logistics Hub, Chicago IL',
    activeShipmentRef: 'APX-9821-EXP',
    notes: 'Primary regional contractor. Highest reliability score across sterile disposables and generic analgesics.'
  },
  {
    id: 'sup-biopharma',
    name: 'Global BioPharma Logistics',
    resourcesSupplied: [
      'Insulin (Regular & Glargine)', 
      'Propofol Injectable Emulsion'
    ],
    averageDeliveryDays: 6.8,
    reliability: 68,
    currentShipmentStatus: 'Customs Hold',
    delayHistory: '5 delays in last 90 days (avg +4.1 days)',
    supplyRisk: 'SEVERE',
    contactPerson: 'Dr. Evelyn Morales (Cold Chain Director)',
    contactEmail: 'e.morales@biopharmalogistics.global',
    primaryLocation: 'Seaport Cold-Storage Facility, Port Elizabeth NJ',
    activeShipmentRef: 'GBL-CC-4011-HOLD',
    notes: 'Severe cold-chain transit bottlenecks. Active shipments delayed by FDA import audit and temperature data logger verification.'
  },
  {
    id: 'sup-pharmanexus',
    name: 'PharmaNexus International',
    resourcesSupplied: [
      'Amoxicillin Trihydrate', 
      'Ceftriaxone Sodium IV'
    ],
    averageDeliveryDays: 7.1,
    reliability: 74,
    currentShipmentStatus: 'Delayed',
    delayHistory: '4 delays in last 90 days (avg +3.5 days)',
    supplyRisk: 'ELEVATED',
    contactPerson: 'Julian Chen (Global Supply Lead)',
    contactEmail: 'j.chen@pharmanexus-api.com',
    primaryLocation: 'Advanced Manufacturing Campus, Dublin, Ireland',
    activeShipmentRef: 'PNX-AIR-8820',
    notes: 'Experiencing raw active pharmaceutical ingredient packaging bottlenecks for beta-lactam antibiotics.'
  },
  {
    id: 'sup-medsupply',
    name: 'MedSupply Direct Corp',
    resourcesSupplied: [
      'IV Saline Solution 0.9%', 
      'Glucose 5% (D5W) IV Infusion',
      'Surgical Gloves (Powder-Free)', 
      'Sterile Syringes (3mL / 5mL)', 
      'Antibiotic IV Infusion Sets'
    ],
    averageDeliveryDays: 3.5,
    reliability: 94,
    currentShipmentStatus: 'On Schedule',
    delayHistory: '2 delays in last 90 days (avg +1.0 days)',
    supplyRisk: 'LOW',
    contactPerson: 'Sarah Jenkins (Enterprise Account Mgr)',
    contactEmail: 'sjenkins@medsupplydirect.com',
    primaryLocation: 'Domestic Distribution Center, Columbus OH',
    activeShipmentRef: 'MSD-TRK-7740',
    notes: 'Strong performer for high-cube bulk fluids and sterile surgical consumables.'
  },
  {
    id: 'sup-biosense',
    name: 'Biosense Diagnostics Inc',
    resourcesSupplied: [
      'Blood Collection Tubes (EDTA / Gel)'
    ],
    averageDeliveryDays: 6.5,
    reliability: 71,
    currentShipmentStatus: 'Delayed',
    delayHistory: '3 delays in last 90 days (avg +4.8 days)',
    supplyRisk: 'ELEVATED',
    contactPerson: 'David K. Rhee (Director of Supply Assurance)',
    contactEmail: 'd.rhee@biosensediag.com',
    primaryLocation: 'Diagnostics Park, San Diego CA',
    activeShipmentRef: 'BSD-LTL-9034',
    notes: 'Upstream vacuum tube resin production lines operating under rationing quota until Q4.'
  }
];

// Re-calculate supplier risk dynamically against baseline resources
export const INITIAL_SUPPLIERS: Supplier[] = BASELINE_SUPPLIERS.map((s) => {
  const evalRisk = evaluateSupplierRisk(s, INITIAL_RESOURCES);
  return {
    ...s,
    supplyRisk: evalRisk.supplyRisk
  };
});

// Dynamic alerts generated directly from the live risk state
export const INITIAL_ALERTS: AlertItem[] = generateDynamicAlerts(INITIAL_RESOURCES, INITIAL_SUPPLIERS);

export const INITIAL_SUPPLY_ACTIVITY: SupplyActivity[] = [
  {
    id: 'act-1',
    type: 'DELAY_ALERT',
    title: 'Customs Hold on Cold-Chain Shipment GBL-CC-4011',
    description: 'Insulin Glargine shipment held at Port Elizabeth for secondary temperature logger verification. Estimated delay: +4 days.',
    timestamp: '25 min ago',
    status: 'warning',
    relatedResource: 'Insulin'
  },
  {
    id: 'act-2',
    type: 'EXPEDITED_ORDER',
    title: 'Emergency PO Placed: Paracetamol IV 1000mg',
    description: 'Procurement administrator initiated emergency PO #EM-882 for 1,200 vials via secondary regional supplier Apex.',
    timestamp: '1 hour ago',
    status: 'in-progress',
    relatedResource: 'Paracetamol'
  },
  {
    id: 'act-3',
    type: 'SHIPMENT_RECEIVED',
    title: 'Dock Inbound Received: IV Saline 0.9% (2,500 units)',
    description: 'Pallet shipment received from MedSupply Direct. Quality inspection passed, temperature logs verified compliant.',
    timestamp: '3 hours ago',
    status: 'completed',
    relatedResource: 'IV Saline Solution 0.9%'
  },
  {
    id: 'act-4',
    type: 'STOCK_AUDIT',
    title: 'Routine Ward Cycle Count: Emergency Crash Carts',
    description: 'All 18 Emergency Department crash carts audited. Epinephrine and atropine stocks verified compliant.',
    timestamp: '5 hours ago',
    status: 'completed',
    relatedResource: 'Epinephrine'
  },
  {
    id: 'act-5',
    type: 'SUPPLIER_STATUS',
    title: 'Supplier Risk Assessment: PharmaNexus downgraded to Elevated Risk',
    description: 'Automated reliability score adjusted following repeated antibiotic delivery lead-time extensions.',
    timestamp: 'Yesterday',
    status: 'warning',
    relatedResource: 'Amoxicillin Trihydrate'
  }
];

export const DEMAND_TREND_DATA = [
  { day: 'Day -6', actualDemand: 1620, baselineDemand: 1450, bufferFloor: 1200 },
  { day: 'Day -5', actualDemand: 1710, baselineDemand: 1460, bufferFloor: 1200 },
  { day: 'Day -4', actualDemand: 1680, baselineDemand: 1470, bufferFloor: 1200 },
  { day: 'Day -3', actualDemand: 1890, baselineDemand: 1470, bufferFloor: 1200 },
  { day: 'Day -2', actualDemand: 2040, baselineDemand: 1480, bufferFloor: 1200 },
  { day: 'Yesterday', actualDemand: 2210, baselineDemand: 1490, bufferFloor: 1200 },
  { day: 'Today (Est)', actualDemand: 2380, baselineDemand: 1500, bufferFloor: 1200 },
  { day: 'Tomorrow (AI Proj)', actualDemand: 2450, baselineDemand: 1510, bufferFloor: 1200, isProjected: true },
  { day: '+2 Days (AI Proj)', actualDemand: 2510, baselineDemand: 1520, bufferFloor: 1200, isProjected: true }
];
