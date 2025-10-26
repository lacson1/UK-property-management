// FIX: Replaced circular import with a complete definition of the View type
// to resolve the "Type alias 'View' circularly references itself" error.
export type View =
  | 'dashboard'
  | 'properties'
  | 'tenants'
  | 'maintenance'
  | 'tradespeople'
  | 'finance'
  | 'guidance'
  | 'documents'
  | 'reports';

export enum PropertyStatus {
  Occupied = 'Occupied',
  Vacant = 'Vacant',
  UnderOffer = 'Under Offer',
}

export enum RentStatus {
  Paid = 'Paid',
  Overdue = 'Overdue',
  PartiallyPaid = 'Partially Paid',
}

export enum PropertyType {
    LTD = 'LTD',
    Personal = 'Personal',
}

export interface Property {
  id: string;
  address: string;
  type: PropertyType;
  status: PropertyStatus;
  rentStatus: RentStatus;
  currentRent: number;
}

export enum MaintenanceStatus {
  New = 'New',
  InProgress = 'In Progress',
  AwaitingQuote = 'Awaiting Quote',
  QuoteApproved = 'Quote Approved',
  WorkComplete = 'Work Complete', // Work done, awaiting invoice/payment
  Completed = 'Completed', // Invoice paid, closed
}

export enum MaintenanceUrgency {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Emergency = 'Emergency',
}

export interface Quote {
  id: string;
  tradespersonId: string;
  tradespersonName: string;
  amount: number;
  details: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  propertyAddress: string;
  issue: string;
  status: MaintenanceStatus;
  urgency: MaintenanceUrgency;
  suggestedTradesperson: string; // AI suggestion
  assignedTradespersonId: string | null; // Assigned from user's list
  quotes: Quote[];
  finalInvoiceUrl: string | null;
  reportedDate: string;
  cost: number;
}

export enum TransactionType {
  Income = 'Income',
  Expense = 'Expense',
}

export interface Transaction {
  id: string;
  propertyId: string;
  propertyAddress: string;
  type: TransactionType;
  description: string;
  amount: number;
  date: string;
}

export enum DocumentType {
    GasSafety = 'Gas Safety Certificate',
    EICR = 'Electrical Installation Condition Report (EICR)',
    EPC = 'Energy Performance Certificate (EPC)',
    Other = 'Other',
}

export interface Document {
  id: string;
  propertyId: string;
  fileName: string;
  fileType: string;
  documentType: DocumentType | null | 'extracting...';
  fileDataUrl: string; // Data URL for viewing/linking
  expiryDate: string | null | 'extracting...' | 'extraction-failed';
}

export enum DepositScheme {
    TDS = 'Tenancy Deposit Scheme (TDS)',
    DPS = 'Deposit Protection Service (DPS)',
    MyDeposits = 'MyDeposits',
}

export interface Tenant {
    id: string;
    name: string;
    email: string;
    phone: string;
    propertyId: string;
    propertyAddress: string;
    leaseStartDate: string;
    leaseEndDate: string;
    depositAmount: number;
    depositScheme: DepositScheme;
}

export interface Tradesperson {
    id: string;
    name: string;
    trade: string;
    contact: string;
}