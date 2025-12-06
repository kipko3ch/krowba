export enum TransactionStatus {
  DRAFT = 'DRAFT',
  ANALYZING = 'ANALYZING',
  READY = 'READY',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED'
}

export interface Transaction {
  id: string;
  title: string;
  role: 'buyer' | 'seller';
  amount: number;
  description: string;
  terms: string[];
  status: TransactionStatus;
  riskScore?: number;
  aiAnalysis?: string;
}

export interface NavItem {
  label: string;
  href: string;
  action?: () => void;
}