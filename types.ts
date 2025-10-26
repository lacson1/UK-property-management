export type View = 'dashboard' | 'properties' | 'maintenance' | 'finance' | 'guidance' | 'tenants';

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
  Completed = 'Completed',
}

export enum MaintenanceUrgency {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Emergency = 'Emergency',
}

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  propertyAddress: string;
  issue: string;
  status: MaintenanceStatus;
  urgency: MaintenanceUrgency;
  suggestedTradesperson: string;
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

export interface Document {
  id: string;
  propertyId: string;
  fileName: string;
  fileType: string;
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

export interface AISuggestion {
    title: string;
    suggestion: string;
}