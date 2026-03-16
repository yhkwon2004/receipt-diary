// ==================== 타입 정의 ====================

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  note?: string;
  warning?: boolean;
  warningMessage?: string;
}

export interface Receipt {
  id: string;
  date: string;
  storeName: string;
  items: ReceiptItem[];
  totalAmount: number;
  imageUrl?: string;
  createdAt: string;
  projectId: string;
}

export interface BudgetRule {
  id: string;
  category: string;
  maxAmount: number;
  description?: string;
}

export interface TableColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'category';
  required?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  totalBudget: number;
  usedAmount: number;
  color: string;
  icon: string;
  createdAt: string;
  receipts: Receipt[];
  budgetRules: BudgetRule[];
  tableColumns: TableColumn[];
  showBudget: boolean;
}

export interface AppState {
  projects: Project[];
  activeProjectId: string | null;
  activeView: 'home' | 'project' | 'addReceipt' | 'newProject' | 'settings';
  isProcessing: boolean;
}
