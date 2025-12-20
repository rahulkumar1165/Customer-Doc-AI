export enum ShipmentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum Incoterm {
  DAP = 'DAP',
  DDP = 'DDP',
  FOB = 'FOB',
  EXW = 'EXW',
  CIF = 'CIF'
}

export enum ExportReason {
  SALE = 'Sale',
  SAMPLE = 'Sample',
  GIFT = 'Gift',
  REPAIR = 'Repair',
  RETURN = 'Return'
}

export interface AIAnalysisResult {
  hsCode: string;
  dutyEstimate: string;
  riskLevel: RiskLevel;
  reasoning: string;
}

export interface Shipment {
  id: string;
  userId: string;
  
  // Product Details
  productDescription: string;
  material?: string;
  intendedUse?: string;
  quantity: number;
  unitPrice: number; 
  currency: string;
  
  // Logistics
  originCountry: string;
  destinationCountry: string;
  grossWeight: number; // kg
  netWeight: number; // kg
  packageCount: number;
  
  // Customs Meta
  incoterms: Incoterm;
  reasonForExport: ExportReason;
  hsCode?: string;
  
  // Consignee (Buyer)
  consigneeName: string;
  consigneeAddress: string;
  consigneeEmail?: string;
  consigneeTaxId?: string;

  status: ShipmentStatus;
  createdAt: string; // ISO String
  aiAnalysis?: AIAnalysisResult;
  docsGenerated: boolean;
  validationWarnings?: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  companyName: string;
  address?: string;
  taxId?: string; // VAT / EORI
  defaultOrigin: string;
  subscriptionTier: 'FREE' | 'PRO';
  shipmentsCount: number;
}

export interface ProductCatalogItem {
  id: string;
  description: string;
  hsCode: string;
  material: string;
  intendedUse: string;
}

export type ViewState = 'DASHBOARD' | 'NEW_SHIPMENT' | 'SHIPMENTS' | 'SETTINGS' | 'BULK_IMPORT' | 'SUPPORT';

// -- BULK IMPORT TYPES --
export type BulkImportStep = 'UPLOAD' | 'ENRICHING' | 'REVIEW' | 'GENERATING' | 'COMPLETE';
export type BulkRowStatus = 'OK' | 'WARNING' | 'ERROR';

export interface BulkRow {
  id: number;
  // Raw Data from CSV/JSON
  original: {
    orderId: string;
    buyerName: string;
    buyerAddress: string;
    description: string;
    quantity: number;
    unitPrice: number;
    origin: string;
    destination: string;
  };
  // AI Enriched Data
  enriched?: {
    hsCode: string;
    grossWeight: number;
    netWeight: number;
    incoterms: Incoterm;
    reasonForExport: ExportReason;
    material: string;
    intendedUse: string;
    riskLevel: RiskLevel;
  };
  // Process Meta
  status: BulkRowStatus;
  messages: string[]; // Error or warning messages
  pdfUrl?: string; // Populated after generation
  generatedShipmentId?: string;
  isUserConfirmed?: boolean;
}